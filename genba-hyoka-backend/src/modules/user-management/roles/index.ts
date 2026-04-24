import { Elysia } from 'elysia';
import { db } from '../../../db';
import { roles, userRoles, users } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, and, count, gt, asc, inArray, or, ilike } from 'drizzle-orm';

import { buildRQBWhere } from '../../../utils/filter';

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

  // ── GET /roles (Smart RQB) ──────────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      if (query.page && query.cursor) {
        throw new AppError(400, 'Paginasi page dan cursor tidak dapat digunakan secara bersamaan.');
      }

      const includes = query.include ? query.include.split(',') : [];
      const includeUsers = includes.includes('users');

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = query.cursor ? undefined : (page - 1) * limit;

      // ── Filter Options ────────────────────────────────────
      const filterOptions = {
        searchFields: ['name', 'code'],
        exactFields: ['type', 'code']
      };

      const roleList = await db.query.roles.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
        orderBy: [asc(roles.id)],
        limit: limit,
        offset: offset,
        with: {
          ...(includeUsers && {
            userRoles: {
              with: {
                user: {
                  columns: {
                    id: false,
                    fullName: true,
                    email: true,
                    phoneNo: true,
                    address: true,
                    gender: true,
                    isActive: true,
                  }
                }
              }
            }
          })
        }
      });

      const finalData = roleList.map(role => {
        const { userRoles, ...roleData } = role as any;
        return {
          ...roleData,
          ...(includeUsers && {
            users: userRoles.map((ur: any) => ur.user)
          })
        };
      });

      const [totalCount] = await db
        .select({ count: count() })
        .from(roles)
        .where(buildRQBWhere(roles, { and, or, eq, ilike, gt }, query, filterOptions));

      const total = Number(totalCount.count);
      const meta: any = { 
        limit,
        ...(query.cursor ? { 
          next_cursor: roleList.length === limit ? roleList[roleList.length - 1].id : null,
          has_more: roleList.length === limit
        } : {
          total,
          current_page: page,
          last_page: Math.ceil(total / limit),
          has_more: page < Math.ceil(total / limit)
        })
      };

      return sendSuccessPagination(finalData, meta, 'Data berhasil diambil');
    },
    {
      ...listRolesDocs,
      beforeHandle: rbac('ROL', PERMISSION_BIT.READ)
    }
  )

  // ── GET /roles/:id (Pure RQB) ──────────────────────────────
  .get(
    '/:id',
    async ({ params, query }) => {
      const includes = query.include ? query.include.split(',') : [];
      const includeUsers = includes.includes('users');

      const role = await db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.id, params.id),
        with: {
          ...(includeUsers && {
            userRoles: {
              with: {
                user: {
                  columns: {
                    id: false,
                    fullName: true,
                    email: true,
                    phoneNo: true,
                    address: true,
                    gender: true,
                    isActive: true,
                  }
                }
              }
            }
          })
        }
      });

      if (!role) throw new AppError(404, 'Role tidak ditemukan');

      const { userRoles, ...roleData } = role as any;
      const finalData = {
        ...roleData,
        ...(includeUsers && {
          users: userRoles.map((ur: any) => ur.user)
        })
      };

      return sendSuccess(finalData, 'Data berhasil diambil');
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
