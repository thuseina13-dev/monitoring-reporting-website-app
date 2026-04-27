import { Elysia } from 'elysia';
import { db } from '../../db';
import { users, sessions, roles, userRoles } from '../../db/schema';
import { createAuditLog } from '../../utils/auditLogger';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { loginDocs, meDocs, logoutDocs, refreshTokenDocs } from './docs';
import { jwt } from '@elysiajs/jwt';
import { ROLE_PERMISSIONS, RoleCode } from './constants/permissions';

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

  // ── HELPER: Build Bitmask from Static Constants ───────────────
  .derive(async ({ }) => ({
    getAuthData: async (userId: string) => {
      // 1. Ambil semua role yang dimiliki user
      const userSelectedRoles = await db
        .select({ 
          code: roles.code,
          type: roles.type,
          name: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

      const prm: Record<string, number> = {};
      const userRolesData: { code: string; type: string; name: string }[] = [];

      userSelectedRoles.forEach((row) => {
        const code = row.code as string;
        const type = row.type as string;
        const name = row.name as string;
        userRolesData.push({ code, type, name });

        // 2. Gabungkan permissions dari konstanta statis menggunakan OR
        const permissions = ROLE_PERMISSIONS[code as RoleCode];
        if (permissions) {
          Object.entries(permissions).forEach(([module, bitmask]) => {
            prm[module] = (prm[module] || 0) | (bitmask as number);
          });
        }
      });

      return { prm, roles: userRolesData };
    }
  }))


  // ── POST /login ─────────────────────────────────────────────
  .post(
    '/login',
    async ({ body, jwtAccess, jwtRefresh, getAuthData, cookie: { access_token, refresh_token } }) => {
      const { email, password } = body;

      const [user] = await db.select().from(users).where(and(eq(users.email, email), isNull(users.deletedAt), eq(users.isActive, true))).limit(1);
      if (!user) throw new AppError(401, 'Email atau password salah.');

      const isPasswordValid = await Bun.password.verify(password, user.password);
      if (!isPasswordValid) throw new AppError(401, 'Email atau password salah.');

      const { prm, roles: userRolesData } = await getAuthData(user.id);

      const csrf_token = crypto.randomUUID();

      const accessToken = await jwtAccess.sign({ 
        sub: user.id, 
        name: user.fullName, 
        email: user.email,
        prm,
        roles: userRolesData,
        csrf_secret: csrf_token
      });
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

      access_token.set({
        value: accessToken,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

      refresh_token.set({
        value: refreshToken,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

      return sendSuccess({
        user: { 
          id: user.id, 
          fullName: user.fullName, 
          email: user.email,
          roles: userRolesData,
          prm
        },
        csrf_token
      }, 'Login berhasil.');
    },
    loginDocs
  )

  // ── POST /logout ────────────────────────────────────────────
  .post(
    '/logout',
    async ({ cookie: { access_token, refresh_token }, jwtAccess }) => {
      if (!access_token.value) throw new AppError(401, 'Sesi tidak ditemukan');
      
      const payload = await jwtAccess.verify(access_token.value as string);
      if (!payload) throw new AppError(401, 'Sesi tidak valid');

      const currentRefreshToken = refresh_token.value;

      if (currentRefreshToken) {
        // Soft Update is_active = false
        await db.update(sessions)
          .set({ isActive: false })
          .where(eq(sessions.token, currentRefreshToken as string));
      }

      // Audit Log
      await createAuditLog({
        userId: payload.sub as string,
        type: 'POST',
        description: 'User logout berhasil'
      });

      // Hapus cookie
      access_token.remove();
      refresh_token.remove();

      return sendSuccess(null, 'Logout berhasil.');
    },
    logoutDocs
  )

  // ── POST /refresh-token ──────────────────────────────────────
  .post(
    '/refresh-token',
    async ({ cookie: { access_token, refresh_token }, jwtAccess, jwtRefresh, getAuthData }) => {
      const currentRefreshToken = refresh_token.value;
      if (!currentRefreshToken) throw new AppError(401, 'Refresh Token tidak ditemukan.');

      const payload = await jwtRefresh.verify(currentRefreshToken as string);
      if (!payload) throw new AppError(401, 'Refresh Token tidak valid atau kadaluwarsa.');

      const [session] = await db.select()
        .from(sessions)
        .where(and(eq(sessions.token, currentRefreshToken as string), eq(sessions.isActive, true)))
        .limit(1);

      if (!session) throw new AppError(401, 'Sesi tidak ditemukan atau sudah logout.');

      const [user] = await db.select().from(users).where(and(eq(users.id, payload.sub as string), isNull(users.deletedAt), eq(users.isActive, true))).limit(1);
      if (!user) throw new AppError(404, 'User tidak ditemukan.');

      const { prm, roles: userRolesData } = await getAuthData(user.id);
      
      const csrf_token = crypto.randomUUID();

      const newAccessToken = await jwtAccess.sign({ 
        sub: user.id, 
        name: user.fullName, 
        email: user.email,
        prm,
        roles: userRolesData,
        csrf_secret: csrf_token
      });
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

      access_token.set({
        value: newAccessToken,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

      refresh_token.set({
        value: newRefreshToken,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });

      return sendSuccess({ csrf_token }, 'Token berhasil diperbarui.');
    },
    refreshTokenDocs
  )

  // ── GET /me ─────────────────────────────────────────────────
  .get(
    '/me',
    async ({ cookie: { access_token }, jwtAccess }) => {
      if (!access_token.value) throw new AppError(401, 'Sesi tidak ditemukan.');

      const payload = await jwtAccess.verify(access_token.value as string);
      if (!payload) throw new AppError(401, 'Sesi tidak valid.');

      // Pengecekan ke database untuk memastikan user masih ada dan aktif
      const [user] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, payload.sub as string), isNull(users.deletedAt), eq(users.isActive, true))).limit(1);
      if (!user) throw new AppError(401, 'Sesi tidak valid atau pengguna sudah dinonaktifkan.');

      // Pengecekan manual exp
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTime > (payload.exp as number)) {
        throw new AppError(401, 'Sesi telah berakhir, silakan login');
      }

      return sendSuccess(payload, 'Token valid.');
    },
    meDocs
  );