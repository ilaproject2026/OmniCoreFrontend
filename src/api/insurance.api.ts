import { apiClient } from './client';
import { InsuranceClaim, InsurancePolicy } from '../types';

export const insuranceApi = {
  // Policies
  getPolicies: async (): Promise<InsurancePolicy[]> => {
    const response = await apiClient.get<any>('/insurance/policies/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  getPolicyById: async (id: string): Promise<InsurancePolicy> => {
    const response = await apiClient.get<InsurancePolicy>(`/insurance/policies/${id}/`);
    return response.data;
  },

  createPolicy: async (payload: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const response = await apiClient.post<InsurancePolicy>('/insurance/policies/', payload);
    return response.data;
  },

  updatePolicy: async (id: string, payload: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const response = await apiClient.patch<InsurancePolicy>(`/insurance/policies/${id}/`, payload);
    return response.data;
  },

  // Claims
  getClaims: async (params?: { policyId?: string; status?: string }): Promise<InsuranceClaim[]> => {
    const response = await apiClient.get<any>('/insurance/claims/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  getClaimById: async (id: string): Promise<InsuranceClaim> => {
    const response = await apiClient.get<InsuranceClaim>(`/insurance/claims/${id}/`);
    return response.data;
  },

  createClaim: async (payload: Partial<InsuranceClaim>): Promise<InsuranceClaim> => {
    const response = await apiClient.post<InsuranceClaim>('/insurance/claims/', payload);
    return response.data;
  },

  updateClaimStatus: async (
    id: string,
    status: InsuranceClaim['status'],
    details?: { settledAmount?: number; notes?: string }
  ): Promise<InsuranceClaim> => {
    const response = await apiClient.patch<InsuranceClaim>(`/insurance/claims/${id}/`, {
      status,
      ...details,
    });
    return response.data;
  },
};
