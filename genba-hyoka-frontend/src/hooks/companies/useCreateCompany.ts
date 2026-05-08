import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';
import { router } from 'expo-router';
import { useToastController } from '@tamagui/toast';

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
        native: false,
      });

      // Go back or to list
      router.back();
    },
    onError: (error: any) => {
      console.error('Failed to create company:', error);
      toast.show('Gagal', {
        message: 'Gagal membuat profil perusahaan.',
        type: 'error',
        native: false,
      });
    },
  });
};
