import { Elysia, t } from 'elysia';
import { db } from '../../../db';
import { roleTasks, roles, taskDefinitions } from '../../../db/schema';
import { eq, and, asc, isNull, count, inArray } from 'drizzle-orm';
import { AppError } from '../../../utils/AppError';
import { sendSuccess, sendSuccessPagination, buildOffsetMeta, buildCursorMeta } from '../../../utils/response';
import { jwtGuard } from '../../../middlewares/jwtGuard';
import { createAuditLog } from '../../../utils/auditLogger';
import { rbac } from '../../../middlewares/rbacGuard';
import { PERMISSION_BIT } from '../../auth/constants/permissions';
import { buildRQBWhere } from '../../../utils/filter';

import {
  listRoleTasksDocs,
  listRoleTasksCursorDocs,
  assignRoleTaskDocs,
  unassignRoleTaskDocs,
  assignBulkRoleTaskDocs,
  replaceBulkRoleTaskDocs,
} from './docs';

export const roleTasksModule = new Elysia({ prefix: '/v1/role-tasks' })
  .use(jwtGuard)

  // ── GET /v1/role-tasks (Daftar Penugasan Role & Tugas - Offset-Based) ──────────────────
  .get(
    '/',
    async ({ query }: any) => {
      const page = Number(query.page ?? 1);
      const limit = Number(query.limit ?? 10);
      const offset = (page - 1) * limit;

      const customConditions: any[] = [];
      if (query.role_id) {
        customConditions.push(eq(roleTasks.roleId, query.role_id));
      }
      if (query.task_definition_id) {
        customConditions.push(eq(roleTasks.taskDefinitionId, query.task_definition_id));
      }

      const list = await db.query.roleTasks.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, {
          customConditions,
          excludeFields: ['role_id', 'task_definition_id']
        }),
        with: {
          role: true,
          taskDefinition: true,
        },
        orderBy: [asc(roleTasks.id)],
        limit,
        offset,
      });

      const formattedList = list.map((item: any) => ({
        id: item.id,
        roleId: item.roleId,
        taskDefinitionId: item.taskDefinitionId,
        createdAt: item.createdAt,
        task_name: item.taskDefinition?.name,
        role_name: item.role?.name,
        role_code: item.role?.code,
      }));

      const meta = await buildOffsetMeta(formattedList, limit, page, async () => {
        const [totalCount] = await db
          .select({ count: count() })
          .from(roleTasks)
          .where(customConditions.length > 0 ? and(...customConditions) : undefined);
        return Number(totalCount?.count ?? 0);
      });

      return sendSuccessPagination(formattedList, meta, 'Daftar penugasan berhasil diambil');
    },
    {
      ...listRoleTasksDocs,
      beforeHandle: rbac('RTS', PERMISSION_BIT.READ)
    }
  )

  // ── GET /v1/role-tasks/cursor (Daftar Penugasan Role & Tugas - Cursor-Based) ─────────────
  .get(
    '/cursor',
    async ({ query }: any) => {
      const limit = Number(query.limit ?? 10);

      const customConditions: any[] = [];
      if (query.role_id) {
        customConditions.push(eq(roleTasks.roleId, query.role_id));
      }
      if (query.task_definition_id) {
        customConditions.push(eq(roleTasks.taskDefinitionId, query.task_definition_id));
      }

      const list = await db.query.roleTasks.findMany({
        where: (fields, ops) => buildRQBWhere(fields, ops, query, {
          customConditions,
          excludeFields: ['role_id', 'task_definition_id']
        }),
        with: {
          role: true,
          taskDefinition: true,
        },
        orderBy: [asc(roleTasks.id)],
        limit,
      });

      const formattedList = list.map((item: any) => ({
        id: item.id,
        roleId: item.roleId,
        taskDefinitionId: item.taskDefinitionId,
        createdAt: item.createdAt,
        task_name: item.taskDefinition?.name,
        role_name: item.role?.name,
        role_code: item.role?.code,
      }));

      const meta = buildCursorMeta(formattedList, limit);
      return sendSuccessPagination(formattedList, meta, 'Daftar penugasan berhasil diambil via cursor');
    },
    {
      ...listRoleTasksCursorDocs,
      beforeHandle: rbac('RTS', PERMISSION_BIT.READ)
    }
  )

  // ── POST /v1/role-tasks (Tugaskan Template Tugas ke Role) ─────────────
  .post(
    '/',
    async ({ body, set, currentUser }: any) => {
      // 1. Validasi keberadaan role
      const roleExists = await db.query.roles.findFirst({
        where: eq(roles.id, body.roleId),
      });
      if (!roleExists) {
        throw new AppError(404, 'Role tidak ditemukan');
      }

      // 2. Validasi keberadaan task definition
      const taskExists = await db.query.taskDefinitions.findFirst({
        where: and(eq(taskDefinitions.id, body.taskDefinitionId), isNull(taskDefinitions.deletedAt)),
      });
      if (!taskExists) {
        throw new AppError(404, 'Template tugas tidak ditemukan');
      }

      try {
        const assigned = await db.transaction(async (tx) => {
          const [inserted] = await tx
            .insert(roleTasks)
            .values({
              roleId: body.roleId,
              taskDefinitionId: body.taskDefinitionId,
            })
            .returning();

          await createAuditLog({
            userId: currentUser.id!,
            type: 'POST',
            description: `Menugaskan template tugas (${taskExists.name}) ke role (${roleExists.name})`
          }, tx);

          return inserted;
        });

        set.status = 201;
        return sendSuccess(assigned, 'Tugas berhasil ditugaskan ke role');
      } catch (err: any) {
        const dbError = err.cause || err;
        if (dbError && dbError.code === '23505') {
          throw new AppError(409, 'Role ini sudah ditugaskan untuk task tersebut');
        }
        throw err;
      }
    },
    {
      ...assignRoleTaskDocs,
      beforeHandle: rbac('RTS', PERMISSION_BIT.CREATE)
    }
  )

  // ── DELETE /v1/role-tasks/:id (Unassign Template Tugas dari Role) ───────
  .delete(
    '/:id',
    async ({ params, currentUser }: any) => {
      const existing = await db.query.roleTasks.findFirst({
        where: eq(roleTasks.id, params.id),
        with: {
          role: true,
          taskDefinition: true,
        }
      });

      if (!existing) {
        throw new AppError(404, 'Penugasan tidak ditemukan');
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(roleTasks)
          .where(eq(roleTasks.id, params.id));

        await createAuditLog({
          userId: currentUser.id!,
          type: 'DELETE',
          description: `Membatalkan penugasan template tugas (${existing.taskDefinition?.name}) dari role (${existing.role?.name})`
        }, tx);
      });

      return sendSuccess(null, 'Penugasan berhasil dihapus');
    },
    {
      ...unassignRoleTaskDocs,
      beforeHandle: rbac('RTS', PERMISSION_BIT.DELETE)
    }
  )

  // ── POST /v1/role-tasks/bulk (Tugaskan Banyak Template Tugas ke Role) ─────────────
  .post(
    '/bulk',
    async ({ body, set, currentUser }: any) => {
      // 1. Validasi keberadaan role
      const roleExists = await db.query.roles.findFirst({
        where: eq(roles.id, body.roleId),
      });
      if (!roleExists) {
        throw new AppError(404, 'Role tidak ditemukan');
      }

      if (!body.taskDefinitionIds || body.taskDefinitionIds.length === 0) {
        return sendSuccess([], 'Tidak ada tugas yang ditambahkan');
      }

      // 2. Validasi keberadaan task definitions
      const tasks = await db.query.taskDefinitions.findMany({
        where: and(inArray(taskDefinitions.id, body.taskDefinitionIds), isNull(taskDefinitions.deletedAt)),
      });

      if (tasks.length !== body.taskDefinitionIds.length) {
        throw new AppError(400, 'Beberapa template tugas tidak ditemukan atau sudah dihapus');
      }

      const assigned = await db.transaction(async (tx) => {
        const values = body.taskDefinitionIds.map((taskId: string) => ({
          roleId: body.roleId,
          taskDefinitionId: taskId,
        }));

        const inserted = await tx
          .insert(roleTasks)
          .values(values)
          .onConflictDoNothing()
          .returning();

        if (inserted.length > 0) {
          await createAuditLog({
            userId: currentUser.id!,
            type: 'POST',
            description: `Bulk assign ${inserted.length} template tugas ke role (${roleExists.name})`
          }, tx);
        }

        return inserted;
      });

      set.status = 201;
      return sendSuccess(assigned, 'Tugas berhasil ditugaskan ke role secara massal');
    },
    {
      ...assignBulkRoleTaskDocs,
      beforeHandle: rbac('RTS', PERMISSION_BIT.CREATE)
    }
  )

  // ── PUT /v1/role-tasks/bulk (Perbarui Penugasan Tugas untuk Role) ─────────────
  .put(
    '/bulk',
    async ({ body, currentUser }: any) => {
      // 1. Validasi keberadaan role
      const roleExists = await db.query.roles.findFirst({
        where: eq(roles.id, body.roleId),
      });
      if (!roleExists) {
        throw new AppError(404, 'Role tidak ditemukan');
      }

      if (body.taskDefinitionIds && body.taskDefinitionIds.length > 0) {
        // 2. Validasi keberadaan task definitions
        const tasks = await db.query.taskDefinitions.findMany({
          where: and(inArray(taskDefinitions.id, body.taskDefinitionIds), isNull(taskDefinitions.deletedAt)),
        });

        if (tasks.length !== body.taskDefinitionIds.length) {
          throw new AppError(400, 'Beberapa template tugas tidak ditemukan atau sudah dihapus');
        }
      }

      const updated = await db.transaction(async (tx) => {
        // Hapus penugasan lama untuk role ini
        await tx.delete(roleTasks).where(eq(roleTasks.roleId, body.roleId));

        let inserted: any[] = [];
        if (body.taskDefinitionIds && body.taskDefinitionIds.length > 0) {
          const values = body.taskDefinitionIds.map((taskId: string) => ({
            roleId: body.roleId,
            taskDefinitionId: taskId,
          }));

          inserted = await tx
            .insert(roleTasks)
            .values(values)
            .returning();
        }

        await createAuditLog({
          userId: currentUser.id!,
          type: 'PUT',
          description: `Bulk update penugasan template tugas untuk role (${roleExists.name}): diset menjadi ${inserted.length} tugas`
        }, tx);

        return inserted;
      });

      return sendSuccess(updated, 'Penugasan tugas untuk role berhasil diperbarui');
    },
    {
      ...replaceBulkRoleTaskDocs,
      beforeHandle: rbac('RTS', PERMISSION_BIT.UPDATE)
    }
  );
