import axiosClient from './axiosClient';

export const roleService = {
  getRoles: async (params?: any) => {
    const response = await axiosClient.get('/roles', { params });
    return response.data;
  },

  getRoleById: async (id: string) => {
    const response = await axiosClient.get(`/roles/${id}`);
    return response.data;
  },

  createRole: async (data: any) => {
    const response = await axiosClient.post('/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: any) => {
    const response = await axiosClient.put(`/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string) => {
    const response = await axiosClient.delete(`/roles/${id}`);
    return response.data;
  },
};
