import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/api/userService';
import { useToastController } from '@tamagui/toast';
import { parseBackendError } from '../../utils/errorParser';

export const useRegisterUser = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: (data: any) => userService.registerUser(data),
    onSuccess: () => {
      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      toast.show('Berhasil', {
        message: 'Pengguna baru berhasil ditambahkan.',
        type: 'success',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to register user:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
