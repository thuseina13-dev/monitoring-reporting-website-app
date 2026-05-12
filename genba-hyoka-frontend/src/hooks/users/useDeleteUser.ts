import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/api/userService';
import { useToastController } from '@tamagui/toast';
import { parseBackendError } from '../../utils/errorParser';

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.show('Sukses', {
        message: 'User berhasil dihapus.',
        type: 'success',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        native: false,
        type: 'error',
      });
    },
  });
};
