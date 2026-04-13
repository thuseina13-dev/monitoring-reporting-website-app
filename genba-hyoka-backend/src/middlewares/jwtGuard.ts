import { Elysia } from 'elysia';
import { AppError } from '../utils/AppError';
import { jwt } from '@elysiajs/jwt';

/**
 * Guard JWT - Memverifikasi token dan mengekstraksi payload.
 * Throws 401 jika token tidak ada, tidak valid, atau sudah expired.
 */
export const jwtGuard = (app: Elysia) =>
  app
    .use(
      jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!,
      })
    )
    .derive({ as: 'scoped' }, async ({ headers, jwt }) => {
      const authHeader = headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Sesi tidak ditemukan, silakan login');
      }

      const token = authHeader.split(' ')[1];
      const payload = await jwt.verify(token);

      if (!payload) {
        throw new AppError(401, 'Sesi tidak valid atau telah berakhir');
      }

      // Pengecekan manual exp (sesuai spesifikasi issue #14)
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTime > (payload.exp as number)) {
        throw new AppError(401, 'Sesi telah berakhir, silakan login');
      }

      return {
        currentUser: {
          id: payload.sub as string,
          email: payload.email as string,
          prm: (payload.prm ?? {}) as Record<string, number>,
        },
      };
    });

/**
 * Memeriksa apakah user memiliki bitmask yang dibutuhkan.
 * Gunakan di dalam handler setelah jwtGuard dipasang.
 */
export const checkPermission = (
  userPermissions: Record<string, number>,
  requiredCode: string,
  requiredBit: number
) => {
  const userBitmask = userPermissions[requiredCode] ?? 0;
  if ((userBitmask & requiredBit) !== requiredBit) {
    throw new AppError(403, 'Anda tidak memiliki izin');
  }
};

// Bitmask constants
export const BIT = {
  READ: 1,
  CREATE: 2,
  UPDATE: 4,
  DELETE: 8,
};
