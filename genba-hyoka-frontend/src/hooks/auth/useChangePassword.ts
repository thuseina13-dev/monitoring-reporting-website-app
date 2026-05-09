import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/api/authService';
import { useToastController } from '@tamagui/toast';

export const useChangePassword = () => {
  const toast = useToastController();

  return useMutation({
    mutationFn: ({ newPassword, userId }: { newPassword: string, userId?: string }) => 
      authService.changePassword(newPassword, userId),
    onSuccess: (data) => {
      toast.show('Sukses', {
        message: data.message || 'Password berhasil diperbarui.',
        native: false,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Gagal memperbarui password.';
      toast.show('Gagal', {
        message,
        type: 'error',
        native: false,
      });
    },
  });
};
