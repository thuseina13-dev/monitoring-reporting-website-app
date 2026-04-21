import { t } from 'elysia';
import { errorSchema, successResponse, successListResponse, paginatedResponse, errorResponses } from '../../../utils/schema';



// ── GET /roles ──────────────────────────────────────────────
export const listRolesDocs = {
  detail: {
    summary: 'Daftar Semua Role',
    description: 'Mengambil daftar role dengan paginasi dan detail izin (permissions). Membutuhkan izin ROL (Read).',
    tags: ['Roles'],
  },
  response: {
    200: paginatedResponse(t.Any()),
    ...errorResponses([401, 403, 500]),
  },
  query: t.Object({


    page: t.Optional(t.Numeric({ default: 1 })),
    limit: t.Optional(t.Numeric({ default: 10 })),
  }),
};

// ── POST /roles ─────────────────────────────────────────────
export const createRoleDocs = {
  detail: {
    summary: 'Tambah Role Baru',
    description: 'Membuat role baru dalam sistem. Membutuhkan izin ROL (Create).',
    tags: ['Roles'],
  },
  response: {
    201: successResponse(t.Optional(t.Any())),
    ...errorResponses([400, 401, 403, 500]),
  },
  body: t.Object({
    name: t.String({ minLength: 3, error: 'Nama role minimal 3 karakter.' }),
    description: t.Optional(t.String()),
  }),
};

// ── PUT /roles/:id ──────────────────────────────────────────
export const updateRoleDocs = {
  detail: {
    summary: 'Update Detail Role',
    description: 'Memperbarui data dasar role. Membutuhkan izin ROL (Update).',
    tags: ['Roles'],
  },
  response: {
    200: successResponse(t.Optional(t.Any())),
    ...errorResponses([400, 401, 403, 404, 500]),
  },
  body: t.Object({
    name: t.Optional(t.String({ minLength: 3 })),
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


