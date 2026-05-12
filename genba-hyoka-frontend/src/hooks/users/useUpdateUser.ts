import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/api/userService';
import { useToastController } from '@tamagui/toast';
import { parseBackendError } from '../../utils/errorParser';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.show('Sukses', {
        message: 'Data user berhasil diperbarui.',
        type: 'success',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to update user:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
