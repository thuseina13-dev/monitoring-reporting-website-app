import { Elysia } from 'elysia';
import { db } from '../../../db';
import { taskDefinitions } from '../../../db/schema';
import { eq, and, count, asc, ilike, isNull, or, ne, gt } from 'drizzle-orm';
import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination, buildOffsetMeta, buildCursorMeta } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { createAuditLog } from '../../../utils/auditLogger';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';
import { buildRQBWhere } from '../../../utils/filter';

import {
  listTaskDefinitionsDocs,
  listTaskDefinitionsCursorDocs,
  getTaskDefinitionDocs,
  createTaskDefinitionDocs,
  updateTaskDefinitionDocs,
  deleteTaskDefinitionDocs,
} from './docs';

export const taskDefinitionsModule = new Elysia({ prefix: '/v1/task-definitions' })
  .use(jwtGuard)

  // ── GET /v1/task-definitions (Offset-Based Pagination) ──────────────────
  .get(
    '/',
    async ({ query }: any) => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 10);
      const offset = (page - 1) * limit;

      const filterOptions = {
        searchFields: ['name'],
        exactFields: ['isActive', 'isMandatory'],
        customConditions: [isNull(taskDefinitions.deletedAt)]
      };

      const list = await db.query.taskDefinitions.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
        orderBy: [asc(taskDefinitions.id)],
        limit: limit,
        offset: offset,
      });

      const meta = await buildOffsetMeta(list, limit, page, async () => {
        const [totalCount] = await db
          .select({ count: count() })
          .from(taskDefinitions)
          .where(buildRQBWhere(taskDefinitions, { and, or, eq, ne, ilike, gt, isNull } as any, query, filterOptions));
        return Number(totalCount.count);
      });

      return sendSuccessPagination(list, meta, 'Daftar template tugas berhasil diambil');
    },
    {
      ...listTaskDefinitionsDocs,
      beforeHandle: rbac('TDF', PERMISSION_BIT.READ)
    }
  )

  // ── GET /v1/task-definitions/cursor (Cursor-Based Pagination) ─────────────
  .get(
    '/cursor',
    async ({ query }: any) => {
      const limit = Number(query.limit ?? 10);
      const offset = undefined;

      const filterOptions = {
        searchFields: ['name'],
        exactFields: ['isActive', 'isMandatory'],
        customConditions: [isNull(taskDefinitions.deletedAt)]
      };

      const list = await db.query.taskDefinitions.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, filterOptions),
        orderBy: [asc(taskDefinitions.id)],
        limit: limit,
        offset: offset,
      });

      const meta = buildCursorMeta(list, limit);
      return sendSuccessPagination(list, meta, 'Daftar template tugas berhasil diambil');
    },
    {
      ...listTaskDefinitionsCursorDocs,
      beforeHandle: rbac('TDF', PERMISSION_BIT.READ)
    }
  )

  // ── GET /v1/task-definitions/:id (Detail Template Tugas) ─────────────
  .get(
    '/:id',
    async ({ params }: any) => {
      const task = await db.query.taskDefinitions.findFirst({
        where: and(eq(taskDefinitions.id, params.id), isNull(taskDefinitions.deletedAt)),
      });

      if (!task) {
        throw new AppError(404, 'Template tugas tidak ditemukan');
      }

      return sendSuccess(task, 'Detail template tugas berhasil diambil');
    },
    {
      ...getTaskDefinitionDocs,
      beforeHandle: rbac('TDF', PERMISSION_BIT.READ)
    }
  )

  // ── POST /v1/task-definitions (Buat Template Tugas Baru) ─────────────
  .post(
    '/',
    async ({ body, set, currentUser }: any) => {
      const newTask = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(taskDefinitions)
          .values({
            name: body.name,
            description: body.description || null,
            procedures: body.procedures || null,
            formSchema: body.form_schema,
            isActive: body.is_active !== undefined ? body.is_active : true,
            isMandatory: body.is_mandatory !== undefined ? body.is_mandatory : false,
            createdBy: currentUser.id,
          })
          .returning();

        await createAuditLog({
          userId: currentUser.id!,
          type: 'POST',
          description: `Membuat template tugas baru: ${body.name}`
        }, tx);

        return inserted;
      });

      set.status = 201;
      return sendSuccess({
        id: newTask.id,
        name: newTask.name,
        is_active: newTask.isActive,
        created_at: newTask.createdAt.toISOString(),
      }, 'Template tugas berhasil dibuat');
    },
    {
      ...createTaskDefinitionDocs,
      beforeHandle: rbac('TDF', PERMISSION_BIT.CREATE)
    }
  )

  // ── PATCH /v1/task-definitions/:id (Perbarui Template Tugas) ───────────
  .patch(
    '/:id',
    async ({ params, body, currentUser }: any) => {
      const [existing] = await db
        .select({ id: taskDefinitions.id })
        .from(taskDefinitions)
        .where(and(eq(taskDefinitions.id, params.id), isNull(taskDefinitions.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new AppError(404, 'Template tugas tidak ditemukan');
      }

      const updated = await db.transaction(async (tx) => {
        const updateData: Record<string, any> = {
          updatedBy: currentUser.id,
          updatedAt: new Date(),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.procedures !== undefined) updateData.procedures = body.procedures;
        if (body.form_schema !== undefined) updateData.formSchema = body.form_schema;
        if (body.is_active !== undefined) updateData.isActive = body.is_active;
        if (body.is_mandatory !== undefined) updateData.isMandatory = body.is_mandatory;

        const [res] = await tx
          .update(taskDefinitions)
          .set(updateData)
          .where(eq(taskDefinitions.id, params.id))
          .returning();

        await createAuditLog({
          userId: currentUser.id!,
          type: 'PATCH',
          description: `Memperbarui template tugas: ${res.name}`
        }, tx);

        return res;
      });

      return sendSuccess(updated, 'Template tugas berhasil diperbarui');
    },
    {
      ...updateTaskDefinitionDocs,
      beforeHandle: rbac('TDF', PERMISSION_BIT.UPDATE)
    }
  )

  // ── DELETE /v1/task-definitions/:id (Hapus/Soft-delete Template Tugas) ───
  .delete(
    '/:id',
    async ({ params, currentUser }: any) => {
      const [existing] = await db
        .select({ id: taskDefinitions.id })
        .from(taskDefinitions)
        .where(and(eq(taskDefinitions.id, params.id), isNull(taskDefinitions.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new AppError(404, 'Template tugas tidak ditemukan');
      }

      await db.transaction(async (tx) => {
        await tx
          .update(taskDefinitions)
          .set({
            isActive: false,
            deletedAt: new Date(),
            deletedBy: currentUser.id,
          } as any)
          .where(eq(taskDefinitions.id, params.id));

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Menghapus template tugas ID: ${params.id}`
        }, tx);
      });

      return sendSuccess(null, 'Template tugas berhasil dihapus');
    },
    {
      ...deleteTaskDefinitionDocs,
      beforeHandle: rbac('TDF', PERMISSION_BIT.DELETE)
    }
  );
