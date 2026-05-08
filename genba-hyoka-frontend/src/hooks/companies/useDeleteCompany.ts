import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';
import { useToastController } from '@tamagui/toast';

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] });
      
      toast.show('Sukses', {
        message: 'Profil perusahaan berhasil dihapus.',
        native: false,
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete company:', error);
      toast.show('Gagal', {
        message: 'Gagal menghapus profil perusahaan.',
        type: 'error',
        native: false,
      });
    },
  });
};
