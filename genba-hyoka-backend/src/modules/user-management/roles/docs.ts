import { t } from 'elysia';

// ── GET /roles ──────────────────────────────────────────────
export const listRolesDocs = {
  detail: {
    summary: 'Daftar Semua Role',
    description: 'Mengambil daftar role dengan paginasi dan detail izin (permissions). Membutuhkan izin ROL (Read).',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Daftar role berhasil diambil' },
    }
  },
  query: t.Object({
    page: t.Optional(t.Numeric({ default: 1 })),
    limit: t.Optional(t.Numeric({ default: 10 })),
  }),
};

// ── POST /roles ─────────────────────────────────────────────
export const createRoleDocs = {
  detail: {
    summary: 'Tambah Role & Izin',
    description: 'Membuat role baru beserta penugasan daftar izin. Membutuhkan izin ROL (Create).',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
    responses: {
      201: { description: 'Role berhasil dibuat' },
      400: { description: 'Nama role sudah terdaftar' },
    }
  },
  body: t.Object({
    name: t.String({ minLength: 3, error: 'Nama role minimal 3 karakter.' }),
    description: t.Optional(t.String()),
    permissionIds: t.Array(t.String({ format: 'uuid' }), { error: 'Permission IDs harus berupa array UUID.' }),
  }),
};

// ── PUT /roles/:id ──────────────────────────────────────────
export const updateRoleDocs = {
  detail: {
    summary: 'Update Role & Sinkronisasi Izin',
    description: 'Memperbarui data role dan melakukan Full Sync pada daftar izinnya. Membutuhkan izin ROL (Update).',
    tags: ['Roles'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Role berhasil diperbarui' },
      404: { description: 'Role tidak ditemukan' },
    }
  },
  body: t.Object({
    name: t.Optional(t.String({ minLength: 3 })),
    description: t.Optional(t.String()),
    permissionIds: t.Optional(t.Array(t.String({ format: 'uuid' }))),
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
};
