import { Elysia } from 'elysia';
import { db } from '../../../db';
import { roles, userRoles, rolePermissions, permissions } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, count, inArray, and, isNull } from 'drizzle-orm';
import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../../utils/response';
import { jwtGuard, checkPermission, BIT } from '../../../middlewares/jwtGuard';
import {
  listRolesDocs,
  createRoleDocs,
  updateRoleDocs,
  deleteRoleDocs,
} from './docs';

export const rolesModule = new Elysia({ prefix: '/v1/roles' }) // Prefix v1 sesuai tiket
  .use(jwtGuard)

  // ── GET /roles (List with Permissions) ──────────────────────
  .get(
    '/',
    async ({ query, currentUser }) => {
      checkPermission(currentUser.prm, 'ROL', BIT.READ);

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = (page - 1) * limit;

      // 1. Ambil Data Role (Filter deletedAt IS NULL)
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

      if (roleList.length === 0) {
        return sendSuccessPagination([], { total: 0, current_page: page, last_page: 0, limit });
      }

      // 2. Join Permissions (Aggregate in JS)
      const roleIds = roleList.map(r => r.id);
      const allRolePermissions = await db
        .select({
          roleId: rolePermissions.roleId,
          permissionId: permissions.id,
          code: permissions.code,
          entity: permissions.entityName
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));

      // 3. Gabungkan Data
      const dataWithPermissions = roleList.map(role => ({
        ...role,
        permissions: allRolePermissions
          .filter(rp => rp.roleId === role.id)
          .map(rp => ({ id: rp.permissionId, code: rp.code, entity: rp.entity }))
      }));

      const total = Number(totalCount.count);
      return sendSuccessPagination(dataWithPermissions, {
        total,
        current_page: page,
        last_page: Math.ceil(total / limit),
        limit,
      });
    },
    listRolesDocs
  )

  // ── POST /roles (Create with Audit) ─────────────────────────
  .post(
    '/',
    async ({ body, currentUser, set }) => {
      checkPermission(currentUser.prm, 'ROL', BIT.CREATE);

      const { name, description, permissionIds } = body;

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

        if (permissionIds && permissionIds.length > 0) {
          await tx.insert(rolePermissions).values(
            permissionIds.map(pid => ({
              roleId: inserted.id,
              permissionId: pid,
              ...(currentUser.id && { createdBy: currentUser.id } as any)
            }))
          );
        }

        // Simpan Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Menambahkan role baru: ${name}`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess(newRole, 'Role berhasil dibuat bersama izinnya.');
    },
    createRoleDocs
  )

  // ── PUT /roles/:id (Update with Full Sync) ──────────────────
  .put(
    '/:id',
    async ({ params, body, currentUser }) => {
      checkPermission(currentUser.prm, 'ROL', BIT.UPDATE);

      const [existing] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);
      if (!existing) throw new AppError(404, 'Role tidak ditemukan.');

      const updated = await db.transaction(async (tx) => {
        const updateData: Record<string, any> = { updatedBy: currentUser.id };
        if (body.name) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;

        const [inserted] = await tx
          .update(roles)
          .set(updateData)
          .where(eq(roles.id, params.id))
          .returning();

        // FULL SYNC Relasi Izin
        if (body.permissionIds) {
          await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, params.id));
          if (body.permissionIds.length > 0) {
            await tx.insert(rolePermissions).values(
              body.permissionIds.map(pid => ({
                roleId: params.id,
                permissionId: pid,
                updatedBy: currentUser.id
              }))
            );
          }
        }

        // Simpan Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Memperbarui role: ${existing.name} -> ${body.name || existing.name}`
        }, tx);

        return inserted;
      });

      return sendSuccess(updated, 'Detail Role dan Izin telah disinkronkan.');
    },
    updateRoleDocs
  )

  // ── DELETE /roles/:id (Smart Delete) ───────────────────────
  .delete(
    '/:id',
    async ({ params, currentUser }) => {
      checkPermission(currentUser.prm, 'ROL', BIT.DELETE);

      await db.transaction(async (tx) => {
        const [role] = await tx.select().from(roles).where(eq(roles.id, params.id)).limit(1);
        if (!role) throw new AppError(404, 'Role tidak ditemukan.');

        // Proteksi Super Admin (by name for safety)
        if (role.name.toLowerCase() === 'super admin') {
          throw new AppError(403, 'Role Super Admin tidak dapat dihapus.');
        }

        // Cek apakah digunakan oleh user
        const [usageCount] = await tx
          .select({ count: count() })
          .from(userRoles)
          .where(eq(userRoles.roleId, params.id));

        if (Number(usageCount.count) > 0) {
          // Soft Delete
          await tx
            .update(roles)
            .set({ 
              deletedAt: new Date(), 
              deletedBy: currentUser.id 
            } as any)
            .where(eq(roles.id, params.id));
        } else {
          // Hard Delete
          await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, params.id));
          await tx.delete(roles).where(eq(roles.id, params.id));
        }

        // Simpan Audit Log
        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus role: ${role.name}`
        }, tx);
      });

      return sendSuccess(null, 'Role berhasil dihapus/dinonaktifkan.');
    },
    deleteRoleDocs
  );
