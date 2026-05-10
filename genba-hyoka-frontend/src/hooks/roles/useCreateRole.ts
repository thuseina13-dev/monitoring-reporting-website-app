import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../../services/api/roleService';
import { router } from 'expo-router';
import { useToastController } from '@tamagui/toast';

import { parseBackendError } from '../../utils/errorParser';

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: (data: any) => roleService.createRole(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      toast.show('Sukses', {
        message: 'Role berhasil dibuat.',
        native: false,
      });

      // Go back to list
      router.back();
    },
    onError: (error: any) => {
      console.error('Failed to create role:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
