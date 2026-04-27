import { t } from 'elysia';
import { errorSchema, successResponse, successListResponse, paginatedResponse, errorResponses } from '../../../utils/schema';

const companyProfileNested = t.Object({
  name: t.String(),
  desc: t.Union([t.String(), t.Null()]),
  address: t.Union([t.String(), t.Null()]),
  logo: t.Union([t.String(), t.Null()]),
  phoneNo: t.Union([t.String(), t.Null()]),
  email: t.Union([t.String(), t.Null()]),
});

const roleNested = t.Object({
  code: t.String(),
  name: t.String(),
  type: t.Union([t.String(), t.Null()]),
  description: t.Union([t.String(), t.Null()]),
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
  companyProfile: t.Optional(t.Union([companyProfileNested, t.Null()])),
  roles: t.Optional(t.Array(roleNested)),
});

// ── GET /users ──────────────────────────────────────────────
export const listUsersDocs = {
  detail: {
    summary: 'Daftar Semua Pengguna',
    description: 'Mengambil daftar pengguna dengan paginasi. Gunakan query "include" untuk memuat relasi (roles, company). Membutuhkan izin USR (Read).',
    tags: ['Users'],
    security: [{ cookieAuth: [] }],
  },
  response: {
    200: paginatedResponse(userResponseSchema),
    ...errorResponses([401, 403, 500]),
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
    search: t.Optional(t.String({ description: 'Cari nama/email (Case-insensitive)' })),
    fullName: t.Optional(t.String({ description: 'Filter berdasarkan nama lengkap' })),
    email: t.Optional(t.String({ description: 'Filter berdasarkan email' })),
    isActive: t.Optional(t.String({ description: 'Filter status true/false' })),
    phoneNo: t.Optional(t.String({ description: 'Filter nomor telepon' })),
    gender: t.Optional(t.String({ description: 'Filter gender (male/female)' })),
    address: t.Optional(t.String({ description: 'Filter alamat (Partial match)' })),
    companyProfileId: t.Optional(t.String({ format: 'uuid' })),
    cursor: t.Optional(t.String({ description: 'ID terakhir untuk paginasi cursor.' })),
    include: t.Optional(t.String({ description: 'Relasi yang ingin dimuat (comma separated). Contoh: roles,company' })),
  }),
};

// ── GET /users/:id ──────────────────────────────────────────
export const getUserDocs = {
  detail: {
    summary: 'Detail Pengguna',
    description: 'Mengambil detail pengguna. Gunakan query "include" (roles, company) untuk memuat data relasi.',
    tags: ['Users'],
    security: [{ cookieAuth: [] }],
  },
  query: t.Object({
    include: t.Optional(t.String({ description: 'Relasi yang ingin dimuat (comma separated). Contoh: roles,company' })),
  }),
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
    security: [{ cookieAuth: [], csrfToken: [] }],
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
    security: [{ cookieAuth: [], csrfToken: [] }],
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
    security: [{ cookieAuth: [], csrfToken: [] }],
  },
  response: {
    200: successResponse(t.Null()),
    ...errorResponses([401, 403, 404, 500]),
  },
};
