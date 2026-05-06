import { useInfiniteQuery } from '@tanstack/react-query';
import { companyService } from '../../services/api/companyService';

export const useGetCompanies = (params?: any) => {
  return useInfiniteQuery({
    queryKey: ['company-profiles', params],
    queryFn: ({ pageParam }) => 
      companyService.getCompaniesCursor({ 
        ...params, 
        cursor: pageParam ?? ''
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.meta.next_cursor || undefined,
  });
};
