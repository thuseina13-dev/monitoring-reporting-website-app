import { Elysia } from 'elysia';
import { db } from '../../../db';
import { roles, userRoles, users } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, and, count, gt, asc, inArray } from 'drizzle-orm';
import { buildFilters } from '../../../utils/filter';

import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';

import {
  listRolesDocs,
  getRoleDocs,
  createRoleDocs,
  updateRoleDocs,
  deleteRoleDocs,
} from './docs';

export const rolesModule = new Elysia({ prefix: '/v1/roles' })
  .use(jwtGuard)

  // ── GET /roles (List with Users) ────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      if (query.page && query.cursor) {
        throw new AppError(400, 'Paginasi page dan cursor tidak dapat digunakan secara bersamaan.');
      }

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = query.cursor ? undefined : (page - 1) * limit;

      const filters = buildFilters(roles, query, [
        'code',
        'name',
        'type'
      ]);

      if (query.cursor) {
        filters.push(gt(roles.id, query.cursor));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const roleList = await db
        .select()
        .from(roles)
        .where(whereClause)
        .orderBy(asc(roles.id))
        .limit(limit)
        .offset(offset as any);

      const [totalCount] = await db
        .select({ count: count() })
        .from(roles)
        .where(whereClause);

      if (roleList.length === 0) {
        return sendSuccessPagination([], { total: 0, current_page: page, last_page: 0, limit });
      }

      // Fetch users for these roles
      const roleIds = roleList.map(r => r.id);
      const rolesWithUsers = await db
        .select({
          roleId: userRoles.roleId,
          userId: users.id,
          fullName: users.fullName,
          email: users.email
        })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(inArray(userRoles.roleId, roleIds));

      const dataWithUsers = roleList.map(role => ({
        ...role,
        users: rolesWithUsers
          .filter(ru => ru.roleId === role.id)
          .map(ru => ({ id: ru.userId, fullName: ru.fullName, email: ru.email }))
      }));

      const total = Number(totalCount.count);
      const meta: any = { limit };

      if (query.cursor) {
        meta.next_cursor = roleList.length === limit ? roleList[roleList.length - 1].id : null;
        meta.has_more = !!meta.next_cursor;
      } else {
        meta.total = total;
        meta.current_page = page;
        meta.last_page = Math.ceil(total / limit);
        meta.has_more = page < meta.last_page;
      }

      return sendSuccessPagination(dataWithUsers, meta, 'Data berhasil diambil');
    },
    {
      ...listRolesDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.READ)
    }
  )

  // ── GET /roles/:id (Detail with Users) ──────────────────────
  .get(
    '/:id',
    async ({ params }) => {
      const [role] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);
      if (!role) throw new AppError(404, 'Role tidak ditemukan');

      const roleUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email
        })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(eq(userRoles.roleId, params.id));

      return sendSuccess({ ...role, users: roleUsers }, 'Data berhasil diambil');
    },
    {
      ...getRoleDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.READ)
    }
  )

  // ── POST /roles ─────────────────────────────────────────────
  .post(
    '/',
    async ({ body, currentUser, set }) => {
      const { code, name, type, description } = body;

      const [existing] = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, code)).limit(1);
      if (existing) throw new AppError(400, 'Kode role sudah terdaftar.');

      const newRole = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(roles)
          .values({
            code, name, type, description,
            ...(currentUser.id && { createdBy: currentUser.id } as any)
          } as any)
          .returning();

        // Simpan Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Membuat role baru: ${name} (${code})`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess(newRole, 'Role berhasil dibuat');
    },
    {
      ...createRoleDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.CREATE)
    }
  )

  // ── PUT /roles/:id ──────────────────────────────────────────
  .put(
    '/:id',
    async ({ params, body, currentUser }) => {
      const [existing] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);
      if (!existing) throw new AppError(404, 'Role tidak ditemukan');

      // Proteksi super_admin
      if (existing.type === 'super_admin') {
        throw new AppError(403, 'Peran Sistem Induk bersifat Read-Only');
      }

      const updatedRole = await db.transaction(async (tx) => {
        const updateData: Record<string, any> = { updatedBy: currentUser.id };
        if (body.code) updateData.code = body.code;
        if (body.name) updateData.name = body.name;
        if (body.type) updateData.type = body.type;
        if (body.description !== undefined) updateData.description = body.description;

        const [updated] = await tx
          .update(roles)
          .set(updateData)
          .where(eq(roles.id, params.id))
          .returning();

        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Memperbarui role ID: ${params.id}`
        }, tx);

        return updated;
      });

      return sendSuccess(updatedRole, 'Role berhasil diperbarui');
    },
    {
      ...updateRoleDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.UPDATE)
    }
  )

  // ── DELETE /roles/:id ───────────────────────────────────────
  .delete(
    '/:id',
    async ({ params, currentUser }) => {
      const [existing] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);
      if (!existing) throw new AppError(404, 'Role tidak ditemukan');

      if (existing.type === 'super_admin') {
        throw new AppError(403, 'Peran Sistem Induk bersifat Read-Only');
      }

      // Cek jika masih ada user yang pakai role ini
      const [usage] = await db.select({ count: count() }).from(userRoles).where(eq(userRoles.roleId, params.id));
      if (Number(usage.count) > 0) {
        throw new AppError(400, 'Role masih digunakan oleh beberapa pengguna.');
      }

      await db.transaction(async (tx) => {
        await tx.delete(roles).where(eq(roles.id, params.id));

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus role: ${existing.name}`
        }, tx);
      });

      return sendSuccess(null, 'Role berhasil dihapus');
    },
    {
      ...deleteRoleDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.DELETE)
    }
  );
