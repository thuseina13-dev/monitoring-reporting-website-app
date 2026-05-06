import axiosClient from './axiosClient';

export const companyService = {
  getCompanies: async (params?: any) => {
    const response = await axiosClient.get('/company-profiles', { params });
    return response.data;
  },

  getCompaniesCursor: async (params?: any) => {
    const response = await axiosClient.get('/company-profiles/cursor', { params });
    return response.data;
  },

  getCompanyById: async (id: string) => {
    const response = await axiosClient.get(`/company-profiles/${id}`);
    return response.data;
  },

  createCompany: async (data: any) => {
    const response = await axiosClient.post('/company-profiles', data);
    return response.data;
  },

  updateCompany: async (id: string, data: any) => {
    const response = await axiosClient.put(`/company-profiles/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id: string) => {
    const response = await axiosClient.delete(`/company-profiles/${id}`);
    return response.data;
  },
};
