import { t } from 'elysia';
import { errorSchema, successResponse, paginatedResponse, errorResponses } from '../../../utils/schema';

// Detail nested schema untuk output response
export const proceduresSchema = t.Object({
  generation: t.Optional(
    t.Object({
      strategy: t.String(),
      active_days: t.Optional(t.Array(t.Number())),
    })
  ),
  execution_policy: t.Optional(
    t.Object({
      instructions: t.Optional(t.String()),
      start_at: t.Optional(t.String()),
      duration_hours: t.Optional(t.Number()),
      start_time_ref: t.Optional(t.String()),
      is_mandatory: t.Optional(t.Boolean()),
    })
  ),
  workflow: t.Optional(
    t.Object({
      requires_review: t.Optional(t.Boolean()),
      approval_role: t.Optional(t.Array(t.String())),
    })
  ),
});

export const formSchemaObject = t.Record(t.String(), t.Any());

export const taskDefinitionResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Union([t.String(), t.Null()]),
  procedures: t.Union([proceduresSchema, t.Null()]),
  formSchema: formSchemaObject,
  isActive: t.Boolean(),
  isMandatory: t.Boolean(),
  createdAt: t.Any(),
  createdBy: t.Union([t.String(), t.Null()]),
  updatedAt: t.Union([t.Any(), t.Null()]),
  updatedBy: t.Union([t.String(), t.Null()]),
  deletedAt: t.Union([t.Any(), t.Null()]),
  deletedBy: t.Union([t.String(), t.Null()]),
});

// GET /v1/task-definitions
export const listTaskDefinitionsDocs = {
  detail: {
    summary: 'Daftar Semua Template Tugas',
    description: 'Mengambil daftar template tugas dengan paginasi dan filter status keaktifan. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Task Definitions'],
    security: [{ cookieAuth: [] }],
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    isActive: t.Optional(t.String({ description: 'Filter status aktif (true/false)' })),
    isMandatory: t.Optional(t.String({ description: 'Filter status wajib (true/false)' })),
    search: t.Optional(t.String({ description: 'Cari berdasarkan nama template' })),
  }),
  response: {
    200: paginatedResponse(taskDefinitionResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
};

// GET /v1/task-definitions/cursor
export const listTaskDefinitionsCursorDocs = {
  detail: {
    summary: 'Daftar Semua Template Tugas via Cursor',
    description: 'Mengambil daftar template tugas dengan paginasi berbasis cursor (Infinite Scroll). Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Task Definitions'],
    security: [{ cookieAuth: [] }],
  },
  query: t.Object({
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    isActive: t.Optional(t.String({ description: 'Filter status aktif (true/false)' })),
    isMandatory: t.Optional(t.String({ description: 'Filter status wajib (true/false)' })),
    search: t.Optional(t.String({ description: 'Cari berdasarkan nama template' })),
    cursor: t.Optional(t.String({ description: 'ID cursor terakhir untuk paginasi' })),
  }),
  response: {
    200: paginatedResponse(taskDefinitionResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
};

// GET /v1/task-definitions/:id
export const getTaskDefinitionDocs = {
  detail: {
    summary: 'Detail Template Tugas',
    description: 'Mengambil satu detail template tugas berdasarkan ID UUID. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Task Definitions'],
    security: [{ cookieAuth: [] }],
  },
  response: {
    200: successResponse(taskDefinitionResponseSchema),
    ...errorResponses([401, 403, 404, 500]),
  },
};

// POST /v1/task-definitions
export const createTaskDefinitionDocs = {
  detail: {
    summary: 'Buat Template Tugas Baru',
    description: 'Membuat template tugas baru dengan prosedur dan skema formulir digital. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Task Definitions'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  body: t.Object({
    name: t.String({ minLength: 3, error: 'Nama template tugas minimal 3 karakter.' }),
    description: t.Optional(t.String()),
    procedures: t.Optional(proceduresSchema),
    formSchema: formSchemaObject,
    isActive: t.Optional(t.Boolean()),
    isMandatory: t.Optional(t.Boolean()),
  }),
  response: {
    201: successResponse(t.Object({
      id: t.String(),
      name: t.String(),
      isActive: t.Boolean(),
      createdAt: t.String(),
    })),
    ...errorResponses([400, 401, 403, 500]),
  },
};

// PATCH /v1/task-definitions/:id
export const updateTaskDefinitionDocs = {
  detail: {
    summary: 'Perbarui Template Tugas',
    description: 'Memperbarui data template tugas secara parsial berdasarkan ID UUID. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Task Definitions'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  body: t.Object({
    name: t.Optional(t.String({ minLength: 3 })),
    description: t.Optional(t.String()),
    procedures: t.Optional(proceduresSchema),
    formSchema: t.Optional(formSchemaObject),
    isActive: t.Optional(t.Boolean()),
    isMandatory: t.Optional(t.Boolean()),
  }),
  response: {
    200: successResponse(taskDefinitionResponseSchema),
    ...errorResponses([400, 401, 403, 404, 500]),
  },
};

// DELETE /v1/task-definitions/:id
export const deleteTaskDefinitionDocs = {
  detail: {
    summary: 'Hapus Template Tugas',
    description: 'Melakukan soft-delete pada template tugas berdasarkan ID UUID. Hanya dapat diakses oleh Super Admin atau Admin.',
    tags: ['Task Definitions'],
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  response: {
    200: successResponse(t.Null()),
    ...errorResponses([401, 403, 404, 500]),
  },
};
