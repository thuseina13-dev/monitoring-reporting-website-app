import axiosClient from './axiosClient';
import { LoginFormInputs } from '../../utils/validations';

export const authService = {
  login: async (data: LoginFormInputs) => {
    const response = await axiosClient.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  refresh: async () => {
    const response = await axiosClient.post('/auth/refresh-token');
    return response.data;
  }
};
