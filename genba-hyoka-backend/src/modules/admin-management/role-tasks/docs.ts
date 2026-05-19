import { t } from 'elysia';
import { errorSchema, successResponse, successListResponse, errorResponses, paginatedResponse } from '../../../utils/schema';

export const roleTaskResponseSchema = t.Object({
  id: t.String(),
  roleId: t.String(),
  taskDefinitionId: t.String(),
  createdAt: t.Any(),
  task_name: t.Optional(t.String()),
  role_name: t.Optional(t.String()),
  role_code: t.Optional(t.String()),
});

// GET /v1/role-tasks (Offset-Based)
export const listRoleTasksDocs = {
  detail: {
    summary: 'Daftar Semua Penugasan Role dan Tugas (Offset-Based)',
    description: 'Mengambil daftar penugasan antara role dengan template tugas (task_definitions) menggunakan paginasi offset. Opsional memfilter berdasarkan role_id atau task_definition_id. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Role Tasks'],
    security: [{ cookieAuth: [] }],
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    role_id: t.Optional(t.String({ description: 'Filter berdasarkan ID role' })),
    task_definition_id: t.Optional(t.String({ description: 'Filter berdasarkan ID template tugas' })),
  }),
  response: {
    200: paginatedResponse(roleTaskResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
};

// GET /v1/role-tasks/cursor
export const listRoleTasksCursorDocs = {
  detail: {
    summary: 'Daftar Semua Penugasan Role dan Tugas via Cursor',
    description: 'Mengambil daftar penugasan antara role dengan template tugas (task_definitions) menggunakan paginasi cursor (Infinite Scroll). Opsional memfilter berdasarkan role_id atau task_definition_id. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Role Tasks'],
    security: [{ cookieAuth: [] }],
  },
  query: t.Object({
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    cursor: t.Optional(t.String({ description: 'ID cursor terakhir untuk paginasi' })),
    role_id: t.Optional(t.String({ description: 'Filter berdasarkan ID role' })),
    task_definition_id: t.Optional(t.String({ description: 'Filter berdasarkan ID template tugas' })),
  }),
  response: {
    200: paginatedResponse(roleTaskResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
};

// POST /v1/role-tasks
export const assignRoleTaskDocs = {
  detail: {
    summary: 'Tugaskan Template Tugas ke Role',
    description: 'Mendaftarkan penugasan template tugas ke suatu role. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Role Tasks'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  body: t.Object({
    role_id: t.String(),
    task_definition_id: t.String(),
  }),
  response: {
    201: successResponse(t.Object({
      id: t.String(),
      roleId: t.String(),
      taskDefinitionId: t.String(),
      createdAt: t.Any(),
    })),
    ...errorResponses([400, 401, 403, 500]),
  },
};

// DELETE /v1/role-tasks/:id
export const unassignRoleTaskDocs = {
  detail: {
    summary: 'Hapus Penugasan Role dan Tugas',
    description: 'Menghapus penugasan (unassign) berdasarkan ID UUID penugasan. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Role Tasks'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  response: {
    200: successResponse(t.Null()),
    ...errorResponses([401, 403, 404, 500]),
  },
};

// POST /v1/role-tasks/bulk
export const assignBulkRoleTaskDocs = {
  detail: {
    summary: 'Tugaskan Banyak Template Tugas ke Role (Bulk Add)',
    description: 'Mendaftarkan beberapa penugasan template tugas ke suatu role sekaligus. Akan mengabaikan tugas yang sudah ditugaskan sebelumnya (on conflict do nothing). Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Role Tasks'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  body: t.Object({
    role_id: t.String(),
    task_definition_ids: t.Array(t.String()),
  }),
  response: {
    201: successResponse(t.Array(t.Object({
      id: t.String(),
      roleId: t.String(),
      taskDefinitionId: t.String(),
      createdAt: t.Any(),
    }))),
    ...errorResponses([400, 401, 403, 500]),
  },
};

// PUT /v1/role-tasks/bulk
export const replaceBulkRoleTaskDocs = {
  detail: {
    summary: 'Perbarui Penugasan Tugas untuk Role (Bulk Update)',
    description: 'Menghapus penugasan lama dan menggantinya dengan array penugasan baru untuk role tersebut. Jika array kosong, semua penugasan untuk role tersebut akan dihapus. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Role Tasks'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  body: t.Object({
    role_id: t.String(),
    task_definition_ids: t.Array(t.String()),
  }),
  response: {
    200: successResponse(t.Array(t.Object({
      id: t.String(),
      roleId: t.String(),
      taskDefinitionId: t.String(),
      createdAt: t.Any(),
    }))),
    ...errorResponses([400, 401, 403, 500]),
  },
};
