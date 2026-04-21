import { Elysia } from 'elysia';
import { db } from '../../../db';
import { users, sessions, roles, userRoles } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, and, count, inArray, or, ilike, SQL, gt, asc } from 'drizzle-orm';

import { buildFilters } from '../../../utils/filter';


import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../../utils/response';
import { jwtGuard, checkPermission, BIT } from '../../../middlewares/jwtGuard';
import {
  listUsersDocs,
  getUserDocs,
  registerUserDocs,
  updateUserDocs,
  deleteUserDocs,
} from './docs';

const userPublicFields = {
  id: users.id,
  fullName: users.fullName,
  email: users.email,
  phoneNo: users.phoneNo,
  address: users.address,
  gender: users.gender,
  isActive: users.isActive,
};

export const usersModule = new Elysia({ prefix: '/v1/users' }) // Mengikuti standar v1 dari issue
  .use(jwtGuard)

  // ── GET /users (List with Roles) ────────────────────────────
  .get(
    '/',
    async ({ query, currentUser }) => {
      checkPermission(currentUser.prm, 'USR', BIT.READ);

      // Validasi: Tidak boleh menggunakan page dan cursor secara bersamaan
      if (query.page && query.cursor) {
        throw new AppError(400, 'Paginasi page dan cursor tidak dapat digunakan secara bersamaan.');
      }

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = query.cursor ? undefined : (page - 1) * limit;




      // 1. Build Dynamic Filters using Helper
      const filters = buildFilters(users, query, [
        'fullName', 
        'email', 
        'isActive', 
        'gender', 
        'address', 
        'phoneNo'
      ]);

      // 2. Tambahkan Filter Cursor jika ada
      if (query.cursor) {
        filters.push(gt(users.id, query.cursor));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      // 3. Ambil Data User (Paginasi)
      const userList = await db
        .select(userPublicFields)
        .from(users)
        .where(whereClause)
        .orderBy(asc(users.id)) // Wajib order by kolom cursor
        .limit(limit)
        .offset(offset as any);

      const [totalCount] = await db
        .select({ count: count() })
        .from(users)
        .where(whereClause);

      if (userList.length === 0) {
        return sendSuccessPagination([], { total: 0, current_page: page, last_page: 0, limit });
      }


      // 2. Ambil Roles untuk user-user tersebut
      const userIds = userList.map(u => u.id);
      const allUserRoles = await db
        .select({
          userId: userRoles.userId,
          roleId: roles.id,
          roleName: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(inArray(userRoles.userId, userIds));

      // 3. Gabungkan Data (Mapping)
      const dataWithRoles = userList.map(user => ({
        ...user,
        roles: allUserRoles
          .filter(ur => ur.userId === user.id)
          .map(ur => ({ id: ur.roleId, name: ur.roleName }))
      }));

      const total = Number(totalCount.count);
      const nextCursor = userList.length === limit ? userList[userList.length - 1].id : null;

      // Kustomisasi Output Meta berdasarkan mode paginasi
      const meta: any = { limit };

      if (query.cursor) {
        // Mode Cursor
        meta.next_cursor = nextCursor;
        meta.has_more = !!nextCursor;
      } else {
        // Mode Offset (Traditional)
        meta.total = total;
        meta.current_page = page;
        meta.last_page = Math.ceil(total / limit);
        meta.has_more = page < meta.last_page;
      }

      return sendSuccessPagination(dataWithRoles, meta, 'Data retrieved successfully');


    },
    listUsersDocs
  )

  // ── GET /users/:id (Detail with Roles) ──────────────────────
  .get(
    '/:id',
    async ({ params, currentUser }) => {
      checkPermission(currentUser.prm, 'USR', BIT.READ);

      const [user] = await db.select(userPublicFields).from(users).where(eq(users.id, params.id)).limit(1);
      if (!user) throw new AppError(404, 'Pengguna tidak ditemukan.');

      const userRolesData = await db
        .select({ id: roles.id, name: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, user.id));

      return sendSuccess({ ...user, roles: userRolesData }, 'Data pengguna berhasil diambil.');
    },
    getUserDocs
  )

  // ── POST /users (Create with Roles) ─────────────────────────
  .post(
    '/',
    async ({ body, set, currentUser }) => {
      checkPermission(currentUser.prm, 'USR', BIT.CREATE);

      const { fullName, email, password, roleIds } = body;

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing) throw new AppError(400, 'Email sudah terdaftar.');

      const hashedPassword = await Bun.password.hash(password);

      const newUser = await db.transaction(async (tx) => {
        // 1. Insert User
        const [inserted] = await tx
          .insert(users)
          .values({
            fullName, email, password: hashedPassword, isActive: true,
            ...(currentUser.id && { createdBy: currentUser.id } as any),
          } as any)
          .returning(userPublicFields);

        // 2. Insert Roles
        if (roleIds && roleIds.length > 0) {
          const roleMapping = roleIds.map(rid => ({
            userId: inserted.id,
            roleId: rid,
            ...(currentUser.id && { createdBy: currentUser.id } as any)
          }));
          await tx.insert(userRoles).values(roleMapping);
        }

        // 3. Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Mendaftarkan user baru: ${fullName}`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess(newUser, 'Pengguna berhasil didaftarkan dengan role.');
    },
    registerUserDocs
  )

  // ── PUT /users/:id (Update with Role Sync) ──────────────────
  .put(
    '/:id',
    async ({ params, body, currentUser }) => {
      checkPermission(currentUser.prm, 'USR', BIT.UPDATE);

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, params.id)).limit(1);
      if (!existing) throw new AppError(404, 'Pengguna tidak ditemukan.');

      // Proteksi Master Account: User terhubung ke role super_admin tidak dapat diubah (Issue #17)
      const [superAdminLink] = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(userRoles.userId, params.id), eq(roles.type, 'super_admin')))
        .limit(1);
      if (superAdminLink) {
        throw new AppError(403, 'Akun Master Sistem tidak dapat dimodifikasi atau dihapus');
      }

      const updated = await db.transaction(async (tx) => {
        // 1. Update Profile
        const updateData: Record<string, any> = { updatedBy: currentUser.id };
        if (body.fullName) updateData.fullName = body.fullName;
        if (body.phoneNo !== undefined) updateData.phoneNo = body.phoneNo;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.gender !== undefined) updateData.gender = body.gender;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.password) updateData.password = await Bun.password.hash(body.password);
        
        if (body.email) {
          const [conflict] = await tx.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
          if (conflict && conflict.id !== params.id) throw new AppError(400, 'Email sudah digunakan.');
          updateData.email = body.email;
        }

        const [inserted] = await tx
          .update(users).set(updateData).where(eq(users.id, params.id)).returning(userPublicFields);

        // 2. Sync Roles (Full Sync)
        if (body.roleIds) {
          await tx.delete(userRoles).where(eq(userRoles.userId, params.id));
          if (body.roleIds.length > 0) {
            const roleMapping = body.roleIds.map(rid => ({
              userId: params.id,
              roleId: rid,
              updatedBy: currentUser.id
            }));
            await tx.insert(userRoles).values(roleMapping);
          }
        }

        // 3. Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Memperbarui user: ${inserted.fullName}`
        }, tx);

        return inserted;
      });

      return sendSuccess(updated, 'Profil dan Role berhasil diperbarui.');
    },
    updateUserDocs
  )

  // ── DELETE /users/:id ───────────────────────────────────────
  .delete(
    '/:id',
    async ({ params, currentUser }) => {
      checkPermission(currentUser.prm, 'USR', BIT.DELETE);

      await db.transaction(async (tx) => {
        const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, params.id)).limit(1);
        if (!user) throw new AppError(404, 'Pengguna tidak ditemukan.');

        // Proteksi Master Account: User terhubung ke role super_admin tidak dapat dihapus (Issue #17)
        const [superAdminLink] = await tx
          .select({ roleId: userRoles.roleId })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(and(eq(userRoles.userId, params.id), eq(roles.type, 'super_admin')))
          .limit(1);
        if (superAdminLink) {
          throw new AppError(403, 'Akun Master Sistem tidak dapat dimodifikasi atau dihapus');
        }

        const [sessionCount] = await tx.select({ count: count() }).from(sessions).where(eq(sessions.userId, params.id));

        if (Number(sessionCount.count) > 0) {
          await tx.update(users)
            .set({ isActive: false, ...({ deletedAt: new Date(), deletedBy: currentUser.id } as any) } as any)
            .where(eq(users.id, params.id));
        } else {
          await tx.delete(userRoles).where(eq(userRoles.userId, params.id));
          await tx.delete(users).where(eq(users.id, params.id));
        }

        // 3. Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus/Menonaktifkan user ID: ${params.id}`
        }, tx);
      });

      return sendSuccess(null, 'Proses hapus/nonaktifkan berhasil.');
    },
    deleteUserDocs
  );
