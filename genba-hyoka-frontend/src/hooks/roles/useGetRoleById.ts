import { useQuery } from '@tanstack/react-query';
import { roleService } from '../../services/api/roleService';

export const useGetRoleById = (id: string) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => roleService.getRoleById(id),
    enabled: !!id,
  });
};
