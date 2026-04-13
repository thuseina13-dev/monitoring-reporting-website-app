import { Elysia } from 'elysia';
import { db } from '../../db';
import { users, sessions, roles, permissions, userRoles, rolePermissions } from '../../db/schema';
import { createAuditLog } from '../../utils/auditLogger';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { loginDocs, meDocs, logoutDocs, refreshTokenDocs } from './docs';
import { jwt } from '@elysiajs/jwt';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '9h';

export const authModule = new Elysia({ prefix: '/v1/auth' })
  .use(
    jwt({
      name: 'jwtAccess',
      secret: process.env.JWT_SECRET!,
      exp: JWT_EXPIRES_IN,
    })
  )
  .use(
    jwt({
      name: 'jwtRefresh',
      secret: process.env.JWT_REFRESH_SECRET!,
      exp: JWT_REFRESH_EXPIRES_IN,
    })
  )

  // ── HELPER: Flaten Bitmask ──────────────────────────────────
  .derive(async ({ }) => ({
    flattenPermissions: async (userId: string) => {
      const perms = await db
        .select({ code: permissions.code, bitValue: permissions.bitValue })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(userRoles.userId, userId));

      const prm: Record<string, number> = {};
      perms.forEach((p) => {
        const modulePrefix = p.code.substring(0, 3).toUpperCase();
        prm[modulePrefix] = (prm[modulePrefix] || 0) | p.bitValue;
      });
      return prm;
    }
  }))

  // ── POST /login ─────────────────────────────────────────────
  .post(
    '/login',
    async ({ body, jwtAccess, jwtRefresh, flattenPermissions }) => {
      const { email, password } = body;

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) throw new AppError(401, 'Email atau password salah.');

      const isPasswordValid = await Bun.password.verify(password, user.password);
      if (!isPasswordValid) throw new AppError(401, 'Email atau password salah.');

      const prm = await flattenPermissions(user.id);

      const accessToken = await jwtAccess.sign({ sub: user.id, name: user.fullName, prm });
      const refreshToken = await jwtRefresh.sign({ sub: user.id });

      // Session Management (Upsert)
      const [existingSession] = await db.select().from(sessions).where(eq(sessions.userId, user.id)).limit(1);
      
      const refreshHours = parseInt(JWT_REFRESH_EXPIRES_IN.split('h')[0]);
      const expiredAt = new Date(Date.now() + refreshHours * 3600 * 1000);

      if (existingSession) {
        await db.update(sessions)
          .set({ token: refreshToken, isActive: true, expiredAt })
          .where(eq(sessions.id, existingSession.id));
      } else {
        await db.insert(sessions).values({ userId: user.id, token: refreshToken, expiredAt });
      }

      // Audit Log
      await createAuditLog({
        userId: user.id,
        type: 'POST', // Sesuai contoh dokumen Anda
        description: 'User login berhasil'
      });

      return sendSuccess({
        accessToken,
        refreshToken,
        user: { id: user.id, fullName: user.fullName, email: user.email },
      }, 'Login berhasil.');
    },
    loginDocs
  )

  // ── POST /logout ────────────────────────────────────────────
  .post(
    '/logout',
    async ({ body, headers, jwtAccess }) => {
      const authHeader = headers['authorization'];
      if (!authHeader) throw new AppError(401, 'Auth header missing');
      
      const payload = await jwtAccess.verify(authHeader.split(' ')[1]);
      if (!payload) throw new AppError(401, 'Sesi tidak valid');

      // Soft Update is_active = false
      await db.update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.token, body.refreshToken));

      // Audit Log
      await createAuditLog({
        userId: payload.sub as string,
        type: 'POST',
        description: 'User logout berhasil'
      });

      return sendSuccess(null, 'Logout berhasil.');
    },
    logoutDocs
  )

  // ── POST /refresh-token ──────────────────────────────────────
  .post(
    '/refresh-token',
    async ({ body, jwtAccess, jwtRefresh, flattenPermissions }) => {
      const payload = await jwtRefresh.verify(body.refreshToken);
      if (!payload) throw new AppError(401, 'Refresh Token tidak valid atau kadaluwarsa.');

      const [session] = await db.select()
        .from(sessions)
        .where(and(eq(sessions.token, body.refreshToken), eq(sessions.isActive, true)))
        .limit(1);

      if (!session) throw new AppError(401, 'Sesi tidak ditemukan atau sudah logout.');

      const [user] = await db.select().from(users).where(eq(users.id, payload.sub as string)).limit(1);
      if (!user) throw new AppError(404, 'User tidak ditemukan.');

      const prm = await flattenPermissions(user.id);
      
      const newAccessToken = await jwtAccess.sign({ sub: user.id, name: user.fullName, prm });
      const newRefreshToken = await jwtRefresh.sign({ sub: user.id });

      // Update kolom token di baris sesi yang sama (Issue #12 Req)
      const refreshHours = parseInt(JWT_REFRESH_EXPIRES_IN.split('h')[0]);
      await db.update(sessions)
        .set({ token: newRefreshToken, expiredAt: new Date(Date.now() + refreshHours * 3600 * 1000) })
        .where(eq(sessions.id, session.id));

      // Audit Log
      await createAuditLog({
        userId: user.id,
        type: 'POST',
        description: 'Pembaruan token (Refresh Token) berhasil'
      });

      return sendSuccess({ accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token berhasil diperbarui.');
    },
    refreshTokenDocs
  )

  // ── GET /me ─────────────────────────────────────────────────
  .get(
    '/me',
    async ({ headers, jwtAccess }) => {
      const authHeader = headers['authorization'];
      if (!authHeader?.startsWith('Bearer ')) throw new AppError(401, 'Sesi tidak ditemukan.');

      const token = authHeader.split(' ')[1];
      const payload = await jwtAccess.verify(token);

      if (!payload) throw new AppError(401, 'Sesi tidak valid.');

      // Pengecekan manual exp
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTime > (payload.exp as number)) {
        throw new AppError(401, 'Sesi telah berakhir, silakan login');
      }

      return sendSuccess(payload, 'Token valid.');
    },
    meDocs
  );