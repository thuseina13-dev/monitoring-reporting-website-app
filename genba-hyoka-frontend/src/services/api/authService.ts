import axiosClient from './axiosClient';
import { LoginFormInputs } from '../../utils/validations';

export const authService = {
  login: async (data: LoginFormInputs) => {
    const response = await axiosClient.post('/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await axiosClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },
};
