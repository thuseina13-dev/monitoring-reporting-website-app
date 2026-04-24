import { t } from 'elysia';
import { errorSchema, successResponse, errorResponses } from '../../utils/schema';



// ── GET /v1/auth/me ──────────────────────────────────────────
export const meDocs = {
  detail: {
    summary: 'Cek Profil (Token Verify)',
    description: 'Memverifikasi Access Token dan mengembalikan payload user. (Lokal, No DB Query)',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
  },
  response: {
    200: successResponse(t.Object({
      sub: t.String(),
      name: t.String(),
      email: t.String(),
      prm: t.Record(t.String(), t.Number()),
      roles: t.Array(t.Object({
        code: t.String(),
        type: t.String(),
        name: t.String(),
      })),
      iat: t.Number(),
      exp: t.Number(),
    })),
    ...errorResponses([401, 500]),
  },
};



// ── POST /v1/auth/login ──────────────────────────────────────
export const loginDocs = {
  detail: {
    summary: 'User Login',
    description: 'Autentikasi menggunakan email dan password. Menghasilkan Access Token dan Refresh Token.',
    tags: ['Auth'],
  },
  body: t.Object({
    email: t.String({ format: 'email', error: 'Format email tidak valid.' }),
    password: t.String({ minLength: 6, error: 'Password minimal 6 karakter.' }),
  }),
  response: {
    200: successResponse(t.Object({
      accessToken: t.String(),
      refreshToken: t.String(),
      user: t.Object({
        id: t.String(),
        fullName: t.String(),
        email: t.String(),
        roles: t.Array(t.Object({
          code: t.String(),
          type: t.String(),
          name: t.String(),
        })),
        prm: t.Record(t.String(), t.Number()),
      }),
    })),
    ...errorResponses([400, 401, 500]),
  },
};



// ── POST /v1/auth/logout ─────────────────────────────────────
export const logoutDocs = {
  detail: {
    summary: 'User Logout',
    description: 'Menonaktifkan sesi (is_active = false) berdasarkan refreshToken.',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
  },
  body: t.Object({
    refreshToken: t.String({ error: 'Refresh Token wajib dikirim.' }),
  }),
  response: {
    200: successResponse(t.Object({})),
    ...errorResponses([400, 401, 500]),
  },
};



// ── POST /v1/auth/refresh-token ──────────────────────────────
export const refreshTokenDocs = {
  detail: {
    summary: 'Pembaruan Token',
    description: 'Menerbitkan pasangan token baru menggunakan Refresh Token yang masih aktif.',
    tags: ['Auth'],
  },
  body: t.Object({
    refreshToken: t.String({ error: 'Refresh Token wajib dikirim.' }),
  }),
  response: {
    200: successResponse(t.Object({
      accessToken: t.String(),
      refreshToken: t.String(),
    })),
    ...errorResponses([400, 401, 500]),
  },
};


