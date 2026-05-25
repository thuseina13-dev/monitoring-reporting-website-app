import axiosClient from './axiosClient';

export const roleTaskService = {
  getRoleTasks: async (params?: any) => {
    const response = await axiosClient.get('/role-tasks', { params });
    return response.data;
  },

  getRoleTasksCursor: async (params?: any) => {
    const response = await axiosClient.get('/role-tasks/cursor', { params });
    return response.data;
  },

  assignRoleTask: async (data: { roleId: string; taskDefinitionId: string }) => {
    const response = await axiosClient.post('/role-tasks', data);
    return response.data;
  },

  unassignRoleTask: async (id: string) => {
    const response = await axiosClient.delete(`/role-tasks/${id}`);
    return response.data;
  },

  assignBulkRoleTasks: async (data: { roleId: string; taskDefinitionIds: string[] }) => {
    const response = await axiosClient.post('/role-tasks/bulk', data);
    return response.data;
  },

  replaceBulkRoleTasks: async (data: { roleId: string; taskDefinitionIds: string[] }) => {
    const response = await axiosClient.put('/role-tasks/bulk', data);
    return response.data;
  },
};
