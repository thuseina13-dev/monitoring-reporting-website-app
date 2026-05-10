import { useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../../services/api/roleService';
import { useToastController } from '@tamagui/toast';

import { parseBackendError } from '../../utils/errorParser';

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      toast.show('Sukses', {
        message: 'Role berhasil dihapus.',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete role:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
