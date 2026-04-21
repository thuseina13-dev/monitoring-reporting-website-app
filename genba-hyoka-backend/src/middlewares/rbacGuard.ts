import { AppError } from '../utils/AppError';
import { PERMISSION_BIT, PermissionModule } from '../modules/auth/constants/permissions';

/**
 * RBAC Guard Logic
 * Digunakan sebagai beforeHandle di Elysia.
 */
export const rbac = (module: PermissionModule, requiredBit: number) => {
  return ({ currentUser }: any) => {
    if (!currentUser) {
      throw new AppError(401, 'Sesi tidak ditemukan');
    }

    const userPermissions = currentUser.prm || {};
    const userBitmask = userPermissions[module] ?? 0;

    if ((userBitmask & requiredBit) !== requiredBit) {
      throw new AppError(403, `Anda tidak memiliki izin akses ke modul ${module}`);
    }
  };
};
