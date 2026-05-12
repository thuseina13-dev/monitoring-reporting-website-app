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

  getUsersCursor: async (params: GetUsersParams = {}) => {
    const response = await axiosClient.get('/users/cursor', { params });
    return response.data;
  },
  registerUser: async (data: any) => {
    const response = await axiosClient.post('/users/register', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await axiosClient.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  },
};
