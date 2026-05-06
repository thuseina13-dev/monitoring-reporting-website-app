import { useQuery } from '@tanstack/react-query';
import { userService, GetUsersParams } from '../../services/api/userService';

export const useGetUsers = (params: GetUsersParams = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getUsers(params),
  });
};
