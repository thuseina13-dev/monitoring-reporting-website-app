import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/api/authService';
import { useToastController } from '@tamagui/toast';

import { parseBackendError } from '../../utils/errorParser';

export const useChangePassword = () => {
  const toast = useToastController();

  return useMutation({
    mutationFn: ({ newPassword, userId }: { newPassword: string, userId?: string }) => 
      authService.changePassword(newPassword, userId),
    onSuccess: (data) => {
      toast.show('Sukses', {
        message: data.message || 'Password berhasil diperbarui.',
        type: 'success',
        native: false,
      });
    },
    onError: (error: any) => {
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
