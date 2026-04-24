import { t } from 'elysia';
import { errorResponses, paginatedResponse, successResponse } from '../../../utils/schema';

const roleResponseObj = t.Object({
  id: t.String(),
  code: t.String(),
  name: t.String(),
  type: t.Optional(t.Union([t.String(), t.Null()])),
  description: t.Optional(t.Union([t.String(), t.Null()])),
});

// ── GET /roles ──────────────────────────────────────────────
export const listRolesDocs = {
  detail: {
    summary: 'Daftar Semua Role',
    description: 'Mengambil daftar role dengan paginasi dan filter. Membutuhkan izin ROL (Read).',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: paginatedResponse(roleResponseObj),
    ...errorResponses([401, 403, 500]),
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    search: t.Optional(t.String({ description: 'Cari nama/kode (Case-insensitive)' })),
    code: t.Optional(t.String()),
    name: t.Optional(t.String()),
    type: t.Optional(t.String()),
    cursor: t.Optional(t.String({ description: 'ID terakhir untuk paginasi cursor. Data diurutkan via ID ASC.' })),
  }),
};

// ── POST /roles ─────────────────────────────────────────────
export const createRoleDocs = {
  detail: {
    summary: 'Tambah Role Baru',
    description: 'Membuat role baru dalam sistem. Membutuhkan izin ROL (Create).',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    201: successResponse(roleResponseObj),
    ...errorResponses([400, 401, 403, 500]),
  },
  body: t.Object({
    code: t.String({ maxLength: 5, error: 'Kode role maksimal 5 karakter.' }),
    name: t.String({ minLength: 3, error: 'Nama role minimal 3 karakter.' }),
    type: t.Optional(t.String()),
    description: t.Optional(t.String()),
  }),
};

// ── PUT /roles/:id ──────────────────────────────────────────
export const updateRoleDocs = {
  detail: {
    summary: 'Update Detail Role',
    description: 'Memperbarui data dasar role. Membutuhkan izin ROL (Update).',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(roleResponseObj),
    ...errorResponses([400, 401, 403, 404, 500]),
  },
  body: t.Object({
    code: t.Optional(t.String({ maxLength: 5 })),
    name: t.Optional(t.String({ minLength: 3 })),
    type: t.Optional(t.String()),
    description: t.Optional(t.String()),
  }),
};


// ── DELETE /roles/:id ───────────────────────────────────────
export const deleteRoleDocs = {
  detail: {
    summary: 'Hapus Role (Smart Delete)',
    description: 'Logic: Mencegah penghapusan Super Admin atau role yang sedang digunakan oleh user.',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(t.Null()),
    ...errorResponses([401, 403, 404, 500]),
  },
};
