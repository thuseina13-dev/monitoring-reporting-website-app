import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';
import { useToastController } from '@tamagui/toast';
import { parseBackendError } from '../../utils/errorParser';

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => companyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] });
      
      toast.show('Sukses', {
        message: 'Profil perusahaan berhasil diperbarui.',
        type: 'success',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to update company:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
