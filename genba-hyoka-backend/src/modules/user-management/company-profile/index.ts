import { Elysia } from 'elysia';
import { db } from '../../../db';
import { companyProfiles, users } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, ne, and, count, gt, asc, isNull, or, ilike } from 'drizzle-orm';

import { buildRQBWhere } from '../../../utils/filter';

import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination, buildOffsetMeta, buildCursorMeta } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';

import {
  listCompanyProfilesDocs,
  listCompanyProfilesCursorDocs,
  getCompanyProfileDocs,
  createCompanyProfileDocs,
  updateCompanyProfileDocs,
  deleteCompanyProfileDocs,
} from './docs';

export const companyProfileModule = new Elysia({ prefix: '/v1/company-profiles' })
  .use(jwtGuard)

  // ── GET /company-profiles (Smart RQB) ──────────────────────
  .get(
    '/',
    async ({ query }) => {
      const includes = query.include ? query.include.split(',') : [];
      const includeUsers = includes.includes('users');

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = (page - 1) * limit;

      // ── Filter Options ────────────────────────────────────
      const filterOptions = {
        searchFields: ['name', 'email', 'phoneNo', 'address'],
        customConditions: [isNull(companyProfiles.deletedAt)]
      };

      const profileList = await db.query.companyProfiles.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
        orderBy: [asc(companyProfiles.id)],
        limit: limit,
        offset: offset,
        with: {
          ...(includeUsers && {
            users: {
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
          })
        }
      });

      const meta = await buildOffsetMeta(profileList, limit, page, async () => {
        const [totalCount] = await db
          .select({ count: count() })
          .from(companyProfiles)
          .where(buildRQBWhere(companyProfiles, { and, or, eq, ne, ilike, gt }, query, filterOptions));
        return Number(totalCount.count);
      });

      return sendSuccessPagination(profileList, meta, 'Data berhasil diambil');
    },
    {
      ...listCompanyProfilesDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.READ)
    }
  )

  // ── GET /company-profiles/cursor (Infinite Scroll) ──────────
  .get(
    '/cursor',
    async ({ query }) => {
      const includes = query.include ? query.include.split(',') : [];
      const includeUsers = includes.includes('users');

      const limit = query.limit ?? 10;
      const offset = undefined; // Selalu undefined untuk kursor

      const filterOptions = {
        searchFields: ['name', 'email', 'phoneNo', 'address'],
        customConditions: [isNull(companyProfiles.deletedAt)]
      };

      const profileList = await db.query.companyProfiles.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
        orderBy: [asc(companyProfiles.id)],
        limit: limit,
        offset: offset,
        with: {
          ...(includeUsers && {
            users: {
              columns: { id: true, fullName: true, email: true, isActive: true }
            }
          })
        }
      });

      const meta = buildCursorMeta(profileList, limit);
      return sendSuccessPagination(profileList, meta, 'Data berhasil diambil');
    },
    {
      ...listCompanyProfilesCursorDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.READ)
    }
  )

  // ── GET /company-profiles/:id (Pure RQB) ──────────────────
  .get(
    '/:id',
    async ({ params, query }) => {
      const includes = query.include ? query.include.split(',') : [];
      const includeUsers = includes.includes('users');

      const profile = await db.query.companyProfiles.findFirst({
        where: (cp, { eq, and, isNull }) => and(eq(cp.id, params.id), isNull(cp.deletedAt)),
        with: {
          ...(includeUsers && {
            users: {
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
          })
        }
      });

      if (!profile) throw new AppError(404, 'Profil perusahaan tidak ditemukan');

      return sendSuccess(profile, 'Data berhasil diambil');
    },
    {
      ...getCompanyProfileDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.READ)
    }
  )

  // ── POST /company-profiles ─────────────────────────
  .post(
    '/',
    async ({ body, set, currentUser }) => {
      const newProfile = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(companyProfiles)
          .values({
            name: body.name,
            desc: body.desc,
            address: body.address,
            logo: body.logo,
            phoneNo: body.phoneNo,
            email: body.email,
            ...(currentUser.id && { createdBy: currentUser.id } as any),
          } as any)
          .returning();

        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Mendaftarkan profil perusahaan: ${body.name}`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess(newProfile, 'Profil perusahaan berhasil dibuat');
    },
    {
      ...createCompanyProfileDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.CREATE)
    }
  )

  // ── PUT /company-profiles/:id ──────────────────
  .put(
    '/:id',
    async ({ params, body, currentUser }) => {
      const [existing] = await db.select({ id: companyProfiles.id }).from(companyProfiles).where(and(eq(companyProfiles.id, params.id), isNull(companyProfiles.deletedAt))).limit(1);
      if (!existing) throw new AppError(404, 'Profil perusahaan tidak ditemukan');

      const updated = await db.transaction(async (tx) => {
        const updateData: Record<string, any> = { updatedBy: currentUser.id };
        if (body.name !== undefined) updateData.name = body.name;
        if (body.desc !== undefined) updateData.desc = body.desc;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.logo !== undefined) updateData.logo = body.logo;
        if (body.phoneNo !== undefined) updateData.phoneNo = body.phoneNo;
        if (body.email !== undefined) updateData.email = body.email;

        const [updatedProfile] = await tx
          .update(companyProfiles).set(updateData).where(eq(companyProfiles.id, params.id)).returning();

        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Memperbarui profil perusahaan ID: ${params.id}`
        }, tx);

        return updatedProfile;
      });

      return sendSuccess(updated, 'Profil perusahaan berhasil diperbarui');
    },
    {
      ...updateCompanyProfileDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.UPDATE)
    }
  )

  // ── DELETE /company-profiles/:id ───────────────────────
  .delete(
    '/:id',
    async ({ params, currentUser }) => {
      const [existing] = await db.select({ id: companyProfiles.id }).from(companyProfiles).where(and(eq(companyProfiles.id, params.id), isNull(companyProfiles.deletedAt))).limit(1);
      if (!existing) throw new AppError(404, 'Profil perusahaan tidak ditemukan');

      // Cek apakah ada user yang masih menggunakan profil perusahaan ini
      const [userCount] = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          eq(users.companyProfileId, params.id),
          isNull(users.deletedAt)
        ));

      const isUsed = Number(userCount.count) > 0;

      await db.transaction(async (tx) => {
        if (isUsed) {
          // Soft delete jika masih digunakan
          await tx.update(companyProfiles)
            .set({ deletedAt: new Date(), deletedBy: currentUser.id } as any)
            .where(eq(companyProfiles.id, params.id));
        } else {
          // Hard delete jika tidak digunakan
          await tx.delete(companyProfiles)
            .where(eq(companyProfiles.id, params.id));
        }

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `${isUsed ? 'Soft delete' : 'Hard delete'} profil perusahaan ID: ${params.id}`
        }, tx);
      });

      return sendSuccess(null, `Profil perusahaan berhasil dihapus (${isUsed ? 'soft' : 'hard'})`);
    },
    {
      ...deleteCompanyProfileDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.DELETE)
    }
  );
