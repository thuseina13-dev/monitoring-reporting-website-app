import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api/userService';

export const useGetUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getUser(id, { include: 'roles,company_partner' }),
    enabled: !!id,
  });
};
