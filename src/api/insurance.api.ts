import { apiClient } from './client';
import { InsuranceClaim, InsurancePolicy } from '../types';

export const insuranceApi = {
  getPolicies: async (): Promise<InsurancePolicy[]> => {
    const response = await apiClient.get<any>('/insurance/policies/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  getClaims: async (): Promise<InsuranceClaim[]> => {
    const response = await apiClient.get<any>('/insurance/claims/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },
};
