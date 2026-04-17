import { Elysia } from 'elysia';
import { AppError } from '../utils/AppError';

/**
 * Global Error Handler Plugin
 * Memetakan ralat teknis ke format respons JSON yang konsisten.
 */
export const errorHandler = (app: Elysia) => 
  app.onError(({ code, error, set }) => {
    // 1. Handle custom AppError (Gunakan nama class jika instanceof gagal krn bundling/test)
    if (error instanceof AppError || (error as any).statusCode) {
      const statusCode = (error as any).statusCode || 500;
      set.status = statusCode;
      return {
        success: false,
        message: (error as any).message,
      };
    }

    // 2. Handle Elysia internal error codes (cast to string to avoid union narrowing issues)
    switch (code as string) {
      case 'VALIDATION':
        set.status = 422;
        return {
          success: false,
          message: 'Format data laporan salah',
          errors: (error as any).all,
        };
      case 'NOT_FOUND':
        set.status = 404;
        return {
          success: false,
          message: 'Data tidak ditemukan',
        };
      case 'UNAUTHORIZED':
      case 'NOT_AUTHENTICATED':
        set.status = 401;
        return {
          success: false,
          message: 'Sesi tidak ditemukan, silakan login',
        };
      case 'FORBIDDEN':
      case 'ACCESS_DENIED':
        set.status = 403;
        return {
          success: false,
          message: 'Anda tidak memiliki izin',
        };
      case 'PARSE':
      case 'INVALID_COOKIE_SIGNATURE':
        set.status = 400;
        return {
          success: false,
          message: 'Input tidak valid',
        };
      default:
        // 3. Fallback to 500
        set.status = 500;
        console.error('Unhandled Error:', error);

        return {
          success: false,
          message: 'Terjadi kesalahan internal server',
        };
    }
  });
