import { apiClient } from './client';
import { Branch } from '../types';

export const branchesApi = {
  getBranches: async (): Promise<Branch[]> => {
    const response = await apiClient.get<any>('/branches/');
    const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    return raw;
  },

  createBranch: async (payload: Partial<Branch>): Promise<Branch> => {
    const response = await apiClient.post<Branch>('/branches/', payload);
    return response.data;
  },
};
