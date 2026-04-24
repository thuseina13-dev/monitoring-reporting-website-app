import { Elysia } from 'elysia';
import { db } from '../../../db';
import { users, sessions, roles, userRoles, companyProfiles } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, and, count, inArray, gt, asc, or, ilike } from 'drizzle-orm';

import { buildRQBWhere } from '../../../utils/filter';

import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';

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
  companyProfileId: users.companyProfileId,
};

export const usersModule = new Elysia({ prefix: '/v1/users' })
  .use(jwtGuard)

  // ── GET /users (Smart RQB) ──────────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      if (query.page && query.cursor) {
        throw new AppError(400, 'Paginasi page dan cursor tidak dapat digunakan secara bersamaan.');
      }

      const includes = query.include ? query.include.split(',') : [];
      const includeRoles = includes.includes('roles');
      const includeCompany = includes.includes('company');

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = query.cursor ? undefined : (page - 1) * limit;

      // ── Filter Logic with buildRQBWhere ───────────────────
      const filterOptions = {
        searchFields: ['fullName', 'email', 'phoneNo', 'address'],
        exactFields: ['isActive', 'gender', 'companyProfileId']
      };

      // ── RQB Query ──────────────────────────────────────────
      const userList = await db.query.users.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
        orderBy: [asc(users.id)],
        limit: limit,
        offset: offset,
        with: {
          ...(includeCompany && {
            companyProfile: {
              columns: {
                id: false,
                name: true,
                desc: true,
                address: true,
                logo: true,
                phoneNo: true,
                email: true,
              }
            }
          }),
          ...(includeRoles && {
            userRoles: {
              with: {
                role: {
                  columns: {
                    id: false,
                    code: true,
                    name: true,
                    type: true,
                    description: true,
                  }
                }
              }
            }
          })
        }
      });

      // Transform many-to-many result from userRoles to flat roles array
      const finalData = userList.map(u => {
        const { userRoles, ...userData } = u as any;
        return {
          ...userData,
          ...(includeRoles && {
            roles: userRoles.map((ur: any) => ur.role)
          })
        };
      });

      // ── Total Count for Meta ───────────────────────────────
      const [totalCount] = await db
        .select({ count: count() })
        .from(users)
        .where(buildRQBWhere(users, { and, or, eq, ilike, gt }, query, filterOptions));

      const total = Number(totalCount.count);
      const meta: any = { 
        limit,
        ...(query.cursor ? { 
          next_cursor: userList.length === limit ? userList[userList.length - 1].id : null,
          has_more: userList.length === limit
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
      ...listUsersDocs,
      beforeHandle: rbac('USR', PERMISSION_BIT.READ)
    }
  )

  // ── GET /users/:id ──────────────────────────────────────────
  .get(
    '/:id',
    async ({ params, query }) => {
      const includes = query.include ? query.include.split(',') : [];
      const includeRoles = includes.includes('roles');
      const includeCompany = includes.includes('company');

      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, params.id),
        with: {
          ...(includeCompany && {
            companyProfile: {
              columns: {
                id: false,
                name: true,
                desc: true,
                address: true,
                logo: true,
                phoneNo: true,
                email: true,
              }
            }
          }),
          ...(includeRoles && {
            userRoles: {
              with: {
                role: {
                  columns: {
                    id: false,
                    code: true,
                    name: true,
                    type: true,
                    description: true,
                  }
                }
              }
            }
          })
        }
      });

      if (!user) throw new AppError(404, 'Pengguna tidak ditemukan.');

      const { userRoles: ur, ...userData } = user as any;
      const finalData = {
        ...userData,
        ...(includeRoles && {
          roles: ur.map((item: any) => item.role)
        })
      };

      return sendSuccess(finalData, 'Data pengguna berhasil diambil.');
    },
    {
      ...getUserDocs,
      beforeHandle: rbac('USR', PERMISSION_BIT.READ)
    }
  )

  // ── POST /users ─────────────────────────────────────────────
  .post(
    '/',
    async ({ body, set, currentUser }) => {
      const { fullName, email, password, roleIds, companyProfileId } = body;

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing) throw new AppError(400, 'Email sudah terdaftar.');

      const hashedPassword = await Bun.password.hash(password);

      const newUser = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(users)
          .values({
            fullName, email, password: hashedPassword, isActive: true,
            companyProfileId: companyProfileId || null,
            ...(currentUser.id && { createdBy: currentUser.id } as any),
          } as any)
          .returning(userPublicFields);

        if (roleIds && roleIds.length > 0) {
          const roleMapping = roleIds.map(rid => ({
            userId: inserted.id,
            roleId: rid,
            ...(currentUser.id && { createdBy: currentUser.id } as any)
          }));
          await tx.insert(userRoles).values(roleMapping);
        }

        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Mendaftarkan user baru: ${fullName}`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess(newUser, 'Pengguna berhasil didaftarkan.');
    },
    {
      ...registerUserDocs,
      beforeHandle: rbac('USR', PERMISSION_BIT.CREATE)
    }
  )

  // ── PUT /users/:id ──────────────────────────────────────────
  .put(
    '/:id',
    async ({ params, body, currentUser }) => {
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, params.id)).limit(1);
      if (!existing) throw new AppError(404, 'Pengguna tidak ditemukan.');

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
        const updateData: Record<string, any> = { updatedBy: currentUser.id };
        if (body.fullName) updateData.fullName = body.fullName;
        if (body.phoneNo !== undefined) updateData.phoneNo = body.phoneNo;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.gender !== undefined) updateData.gender = body.gender;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.companyProfileId !== undefined) updateData.companyProfileId = body.companyProfileId;
        if (body.password) updateData.password = await Bun.password.hash(body.password);
        
        if (body.email) {
          const [conflict] = await tx.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
          if (conflict && conflict.id !== params.id) throw new AppError(400, 'Email sudah digunakan.');
          updateData.email = body.email;
        }

        const [inserted] = await tx
          .update(users).set(updateData).where(eq(users.id, params.id)).returning(userPublicFields);

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

        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Memperbarui user: ${inserted.fullName}`
        }, tx);

        return inserted;
      });

      return sendSuccess(updated, 'Profil berhasil diperbarui.');
    },
    {
      ...updateUserDocs,
      beforeHandle: rbac('USR', PERMISSION_BIT.UPDATE)
    }
  )

  // ── DELETE /users/:id ───────────────────────────────────────
  .delete(
    '/:id',
    async ({ params, currentUser }) => {
      await db.transaction(async (tx) => {
        const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, params.id)).limit(1);
        if (!user) throw new AppError(404, 'Pengguna tidak ditemukan.');

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

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus/Menonaktifkan user ID: ${params.id}`
        }, tx);
      });

      return sendSuccess(null, 'Proses hapus/nonaktifkan berhasil.');
    },
    {
      ...deleteUserDocs,
      beforeHandle: rbac('USR', PERMISSION_BIT.DELETE)
    }
  );
