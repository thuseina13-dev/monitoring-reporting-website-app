import axiosClient from './axiosClient';

export const taskDefinitionService = {
  getTaskDefinitions: async (params?: any) => {
    const response = await axiosClient.get('/task-definitions', { params });
    return response.data;
  },

  getTaskDefinitionsCursor: async (params?: any) => {
    const response = await axiosClient.get('/task-definitions/cursor', { params });
    return response.data;
  },

  getTaskDefinitionById: async (id: string) => {
    const response = await axiosClient.get(`/task-definitions/${id}`);
    return response.data;
  },

  createTaskDefinition: async (data: any) => {
    const response = await axiosClient.post('/task-definitions', data);
    return response.data;
  },

  updateTaskDefinition: async (id: string, data: any) => {
    const response = await axiosClient.patch(`/task-definitions/${id}`, data);
    return response.data;
  },

  deleteTaskDefinition: async (id: string) => {
    const response = await axiosClient.delete(`/task-definitions/${id}`);
    return response.data;
  },
};
