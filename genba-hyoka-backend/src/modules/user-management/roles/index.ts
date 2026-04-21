import { Elysia } from 'elysia';
import { db } from '../../../db';
import { roles, userRoles } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, count, and, isNull } from 'drizzle-orm';
import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';
import {
  listRolesDocs,
  createRoleDocs,
  updateRoleDocs,
  deleteRoleDocs,
} from './docs';

export const rolesModule = new Elysia({ prefix: '/v1/roles' })
  .use(jwtGuard)

  // ── GET /roles ──────────────────────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = (page - 1) * limit;

      // 1. Ambil Data Role
      const roleList = await db
        .select()
        .from(roles)
        .where(isNull(roles.deletedAt))
        .limit(limit)
        .offset(offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(roles)
        .where(isNull(roles.deletedAt));

      const total = Number(totalCount.count);
      return sendSuccessPagination(roleList, {
        total,
        current_page: page,
        last_page: Math.ceil(total / limit),
        limit,
      });
    },
    {
      ...listRolesDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.READ)
    }
  )

  // ── POST /roles ─────────────────────────────────────────────
  .post(
    '/',
    async ({ body, currentUser, set }) => {
      const { name, description } = body;

      const [existing] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);
      if (existing) throw new AppError(400, 'Nama role sudah terdaftar.');

      const newRole = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(roles)
          .values({
            name, description,
            ...(currentUser.id && { createdBy: currentUser.id } as any)
          } as any)
          .returning();

        // Simpan Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Menambahkan role baru: ${name}`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess(newRole, 'Role berhasil dibuat.');
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
      if (!existing) throw new AppError(404, 'Role tidak ditemukan.');

      if (existing.type === 'super_admin') {
        throw new AppError(403, 'Peran Sistem Induk bersifat Read-Only');
      }

      const updated = await db.transaction(async (tx) => {
        const updateData: Record<string, any> = { updatedBy: currentUser.id };
        if (body.name) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;

        const [inserted] = await tx
          .update(roles)
          .set(updateData)
          .where(eq(roles.id, params.id))
          .returning();

        // Simpan Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Memperbarui role: ${existing.name} -> ${body.name || existing.name}`
        }, tx);

        return inserted;
      });

      return sendSuccess(updated, 'Detail Role berhasil diperbarui.');
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
      await db.transaction(async (tx) => {
        const [role] = await tx.select().from(roles).where(eq(roles.id, params.id)).limit(1);
        if (!role) throw new AppError(404, 'Role tidak ditemukan.');

        if (role.type === 'super_admin') {
          throw new AppError(403, 'Peran Sistem Induk bersifat Read-Only');
        }

        const [usageCount] = await tx
          .select({ count: count() })
          .from(userRoles)
          .where(eq(userRoles.roleId, params.id));

        if (Number(usageCount.count) > 0) {
          await tx
            .update(roles)
            .set({ 
              deletedAt: new Date(), 
              deletedBy: currentUser.id 
            } as any)
            .where(eq(roles.id, params.id));
        } else {
          await tx.delete(roles).where(eq(roles.id, params.id));
        }

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus role: ${role.name}`
        }, tx);
      });

      return sendSuccess(null, 'Role berhasil dihapus/dinonaktifkan.');
    },
    {
      ...deleteRoleDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.DELETE)
    }
  );

