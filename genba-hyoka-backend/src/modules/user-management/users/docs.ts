import { t } from 'elysia';
import { errorSchema, successResponse, successListResponse, paginatedResponse, errorResponses } from '../../../utils/schema';

const companyProfileSimple = t.Object({
  id: t.String(),
  name: t.String(),
});

const userResponseSchema = t.Object({
  id: t.String(),
  fullName: t.String(),
  email: t.String(),
  phoneNo: t.Union([t.String(), t.Null()]),
  address: t.Union([t.String(), t.Null()]),
  gender: t.Union([t.String(), t.Null()]),
  isActive: t.Boolean(),
  companyProfileId: t.Union([t.String(), t.Null()]),
  companyProfile: t.Optional(t.Union([companyProfileSimple, t.Null()])),
  roles: t.Array(t.Object({
    id: t.String(),
    name: t.String(),
  })),
});

// ── GET /users ──────────────────────────────────────────────
export const listUsersDocs = {
  detail: {
    summary: 'Daftar Semua Pengguna',
    description: 'Mengambil daftar pengguna dengan paginasi, data role, dan profil perusahaan. Membutuhkan izin USR (Read).',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: paginatedResponse(userResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    search: t.Optional(t.String({ description: 'Cari nama/email (Case-insensitive)' })),
    isActive: t.Optional(t.String({ description: 'Filter status true/false' })),
    phoneNo: t.Optional(t.String({ description: 'Filter nomor telepon' })),
    gender: t.Optional(t.String({ description: 'Filter gender (male/female)' })),
    address: t.Optional(t.String({ description: 'Filter alamat (Partial match)' })),
    companyProfileId: t.Optional(t.String({ format: 'uuid' })),
    cursor: t.Optional(t.String({ description: 'ID terakhir untuk paginasi cursor. Data diurutkan via ID ASC.' })),
  }),
};

// ── GET /users/:id ──────────────────────────────────────────
export const getUserDocs = {
  detail: {
    summary: 'Detail Pengguna',
    description: 'Mengambil detail pengguna termasuk daftar role dan profil perusahaan.',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(userResponseSchema),
    ...errorResponses([401, 403, 404, 500]),
  },
};

// ── POST /users ─────────────────────────────────────────────
export const registerUserDocs = {
  detail: {
    summary: 'Tambah Pengguna Baru',
    description: 'Menambahkan pengguna baru beserta penugasan role dan profil perusahaan. Membutuhkan izin USR (Create).',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    201: successResponse(userResponseSchema),
    ...errorResponses([400, 401, 403, 500]),
  },
  body: t.Object({
    fullName: t.String({ minLength: 3, error: 'Nama lengkap minimal 3 karakter.' }),
    email: t.String({ format: 'email', error: 'Format email tidak valid.' }),
    password: t.String({ minLength: 8, error: 'Password minimal 8 karakter.' }),
    companyProfileId: t.Optional(t.String({ format: 'uuid' })),
    roleIds: t.Array(t.String({ format: 'uuid' }), { error: 'Role IDs harus berupa array UUID.' }),
  }),
};

// ── PUT /users/:id ──────────────────────────────────────────
export const updateUserDocs = {
  detail: {
    summary: 'Update Profil Pengguna',
    description: 'Memperbarui data profil dan menyinkronkan daftar role serta perusahaan. Membutuhkan izin USR (Update).',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(userResponseSchema),
    ...errorResponses([400, 401, 403, 404, 500]),
  },
  body: t.Object({
    fullName: t.Optional(t.String({ minLength: 3 })),
    email: t.Optional(t.String({ format: 'email' })),
    password: t.Optional(t.String({ minLength: 8 })),
    phoneNo: t.Optional(t.String()),
    address: t.Optional(t.String()),
    gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female')])),
    isActive: t.Optional(t.Boolean()),
    companyProfileId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
    roleIds: t.Optional(t.Array(t.String({ format: 'uuid' }))),
  }),
};

// ── DELETE /users/:id ───────────────────────────────────────
export const deleteUserDocs = {
  detail: {
    summary: 'Hapus / Nonaktifkan Pengguna (Smart Delete)',
    description: 'Logic: Soft-delete jika pernah login (ada session), Hard-delete jika belum pernah login.',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(t.Null()),
    ...errorResponses([401, 403, 404, 500]),
  },
};
