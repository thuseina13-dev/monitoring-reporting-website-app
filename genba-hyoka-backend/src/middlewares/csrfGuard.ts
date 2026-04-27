import { Elysia } from 'elysia';
import { AppError } from '../utils/AppError';
import { jwt } from '@elysiajs/jwt';

export const csrfGuard = new Elysia()
  .use(
    jwt({
      name: 'jwtCsrf',
      secret: process.env.JWT_SECRET!,
    })
  )
  .onBeforeHandle(async ({ request, headers, cookie: { access_token }, jwtCsrf }) => {
    // 1. Lewati metode GET
    if (request.method === 'GET') return;

    const url = new URL(request.url);
    const path = url.pathname;

    // 2. Lewati endpoint login dan refresh
    if (path === '/v1/auth/login' || path === '/v1/auth/refresh-token') return;

    // 3. Ambil X-CSRF-TOKEN dari header
    const csrfTokenHeader = headers['x-csrf-token'];
    if (!csrfTokenHeader) {
      throw new AppError(403, 'CSRF Token tidak ditemukan di header');
    }

    // 4. Decode JWT access_token dari cookie
    if (!access_token?.value) {
      throw new AppError(401, 'Sesi tidak ditemukan, silakan login');
    }

    const payload = await jwtCsrf.verify(access_token.value as string);
    if (!payload || !payload.csrf_secret) {
      throw new AppError(403, 'Sesi tidak valid untuk validasi CSRF');
    }

    // 5. Bandingkan CSRF Token
    if (csrfTokenHeader !== payload.csrf_secret) {
      throw new AppError(403, 'CSRF Token tidak valid (Forbidden)');
    }
  });
