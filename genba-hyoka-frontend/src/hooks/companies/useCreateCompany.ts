import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';
import { useToastController } from '@tamagui/toast';
import { parseBackendError } from '../../utils/errorParser';

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: (data: any) => companyService.createCompany(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] });
      
      toast.show('Sukses', {
        message: 'Profil perusahaan berhasil dibuat.',
        type: 'success',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to create company:', error);
      toast.show('Gagal', {
        message: parseBackendError(error),
        type: 'error',
        native: false,
      });
    },
  });
};
