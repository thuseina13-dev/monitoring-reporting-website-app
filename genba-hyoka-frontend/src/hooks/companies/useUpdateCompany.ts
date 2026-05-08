import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';
import { router } from 'expo-router';
import { useToastController } from '@tamagui/toast';

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const toast = useToastController();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => companyService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profiles'] });
      
      toast.show('Sukses', {
        message: 'Profil perusahaan berhasil diperbarui.',
        native: false,
      });

      router.back();
    },
    onError: (error: any) => {
      console.error('Failed to update company:', error);
      toast.show('Gagal', {
        message: 'Gagal memperbarui profil perusahaan.',
        type: 'error',
        native: false,
      });
    },
  });
};
