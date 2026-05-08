import { useQuery } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';

export const useGetCompanyById = (id: string) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getCompanyById(id),
    enabled: !!id,
  });
};
