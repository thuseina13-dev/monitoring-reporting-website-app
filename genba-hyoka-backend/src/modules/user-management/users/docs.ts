import { t } from 'elysia';

// ── GET /users ──────────────────────────────────────────────
export const listUsersDocs = {
  detail: {
    summary: 'Daftar Semua Pengguna',
    description: 'Mengambil daftar pengguna dengan paginasi dan data role. Membutuhkan izin USR (Read).',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Daftar pengguna berhasil diambil' },
      401: { description: 'Token tidak valid' },
      403: { description: 'Tidak memiliki izin USR' },
    }
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  }),
};

// ── GET /users/:id ──────────────────────────────────────────
export const getUserDocs = {
  detail: {
    summary: 'Detail Pengguna',
    description: 'Mengambil detail pengguna termasuk daftar role-nya.',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Detail pengguna' },
      404: { description: 'User tidak ditemukan' },
    }
  },
};

// ── POST /users ─────────────────────────────────────────────
export const registerUserDocs = {
  detail: {
    summary: 'Tambah Pengguna Baru',
    description: 'Menambahkan pengguna baru beserta penugasan role. Membutuhkan izin USR (Create).',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    responses: {
      201: { description: 'Pengguna berhasil didaftarkan' },
      400: { description: 'Email sudah terdaftar' },
    }
  },
  body: t.Object({
    fullName: t.String({ minLength: 3, error: 'Nama lengkap minimal 3 karakter.' }),
    email: t.String({ format: 'email', error: 'Format email tidak valid.' }),
    password: t.String({ minLength: 8, error: 'Password minimal 8 karakter.' }),
    roleIds: t.Array(t.String({ format: 'uuid' }), { error: 'Role IDs harus berupa array UUID.' }),
  }),
};

// ── PUT /users/:id ──────────────────────────────────────────
export const updateUserDocs = {
  detail: {
    summary: 'Update Profil Pengguna',
    description: 'Memperbarui data profil dan menyinkronkan (Full Sync) daftar role. Membutuhkan izin USR (Update).',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Profil berhasil diperbarui' },
      404: { description: 'User tidak ditemukan' },
    }
  },
  body: t.Object({
    fullName: t.Optional(t.String({ minLength: 3 })),
    email: t.Optional(t.String({ format: 'email' })),
    password: t.Optional(t.String({ minLength: 8 })),
    phoneNo: t.Optional(t.String()),
    address: t.Optional(t.String()),
    gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female')])),
    isActive: t.Optional(t.Boolean()),
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
};
