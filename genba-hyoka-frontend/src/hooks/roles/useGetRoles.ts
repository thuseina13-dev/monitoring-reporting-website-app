import { useInfiniteQuery } from '@tanstack/react-query';
import { roleService } from '../../services/api/roleService';

export const useGetRoles = (params?: any) => {
  return useInfiniteQuery({
    queryKey: ['roles', params],
    queryFn: ({ pageParam }) => 
      roleService.getRoles({ 
        ...params, 
        cursor: pageParam 
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage.meta.next_cursor || undefined,
  });
};
