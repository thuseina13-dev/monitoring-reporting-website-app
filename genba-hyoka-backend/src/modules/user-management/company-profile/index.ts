import { Elysia } from 'elysia';
import { db } from '../../../db';
import { companyProfiles } from '../../../db/schema';
import { createAuditLog } from '../../../utils/auditLogger';
import { eq, and, count, gt, asc, isNull } from 'drizzle-orm';
import { buildFilters } from '../../../utils/filter';
import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';

import {
  listCompanyProfilesDocs,
  getCompanyProfileDocs,
  createCompanyProfileDocs,
  updateCompanyProfileDocs,
  deleteCompanyProfileDocs,
} from './docs';

export const companyProfileModule = new Elysia({ prefix: '/v1/company-profiles' })
  .use(jwtGuard)

  // ── GET /company-profiles ────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      if (query.page && query.cursor) {
        throw new AppError(400, 'Paginasi page dan cursor tidak dapat digunakan secara bersamaan.');
      }

      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const offset = query.cursor ? undefined : (page - 1) * limit;

      const filters = buildFilters(companyProfiles, query, [
        'name',
        'email',
        'phoneNo',
        'address'
      ]);

      filters.push(isNull(companyProfiles.deletedAt));

      if (query.cursor) {
        filters.push(gt(companyProfiles.id, query.cursor));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const profileList = await db
        .select()
        .from(companyProfiles)
        .where(whereClause)
        .orderBy(asc(companyProfiles.id))
        .limit(limit)
        .offset(offset as any);

      const [totalCount] = await db
        .select({ count: count() })
        .from(companyProfiles)
        .where(whereClause);

      if (profileList.length === 0) {
        return sendSuccessPagination([], { total: 0, current_page: page, last_page: 0, limit });
      }

      const total = Number(totalCount.count);
      const nextCursor = profileList.length === limit ? profileList[profileList.length - 1].id : null;

      const meta: any = { limit };

      if (query.cursor) {
        meta.next_cursor = nextCursor;
        meta.has_more = !!nextCursor;
      } else {
        meta.total = total;
        meta.current_page = page;
        meta.last_page = Math.ceil(total / limit);
        meta.has_more = page < meta.last_page;
      }

      return sendSuccessPagination(profileList, meta, 'Data berhasil diambil');
    },
    {
      ...listCompanyProfilesDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.READ)
    }
  )

  // ── GET /company-profiles/:id ──────────────────────
  .get(
    '/:id',
    async ({ params }) => {
      const [profile] = await db.select().from(companyProfiles).where(and(eq(companyProfiles.id, params.id), isNull(companyProfiles.deletedAt))).limit(1);
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

      await db.transaction(async (tx) => {
        await tx.update(companyProfiles)
          .set({ deletedAt: new Date(), deletedBy: currentUser.id } as any)
          .where(eq(companyProfiles.id, params.id));

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus profil perusahaan ID: ${params.id}`
        }, tx);
      });

      return sendSuccess(null, 'Profil perusahaan berhasil dihapus');
    },
    {
      ...deleteCompanyProfileDocs,
      beforeHandle: rbac('CPY', PERMISSION_BIT.DELETE)
    }
  );
