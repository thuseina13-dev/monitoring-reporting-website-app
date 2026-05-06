import axiosClient from './axiosClient';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  include?: string;
}

export const userService = {
  getUsers: async (params: GetUsersParams = {}) => {
    const response = await axiosClient.get('/users', { params });
    return response.data;
  },
};
