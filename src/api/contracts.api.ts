import { apiClient } from './client';
import { Contract, Tender, ContractProfitability } from '../types';

export const contractsApi = {
  getContracts: async (): Promise<Contract[]> => {
    const response = await apiClient.get<any>('/contracts/');
    const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    return raw;
  },

  getContractById: async (id: string): Promise<Contract> => {
    const response = await apiClient.get<Contract>(`/contracts/${id}/`);
    return response.data;
  },

  createContract: async (payload: Partial<Contract>): Promise<Contract> => {
    const response = await apiClient.post<Contract>('/contracts/', payload);
    return response.data;
  },

  updateContract: async (id: string, updates: Partial<Contract>): Promise<Contract> => {
    const response = await apiClient.patch<Contract>(`/contracts/${id}/`, updates);
    return response.data;
  },

  getTenders: async (): Promise<Tender[]> => {
    const response = await apiClient.get<Tender[]>('/contracts/tenders/');
    return response.data;
  },

  createTender: async (payload: Partial<Tender>): Promise<Tender> => {
    const response = await apiClient.post<Tender>('/contracts/tenders/', payload);
    return response.data;
  },

  awardTenderToContract: async (tenderId: string): Promise<{ tender: Tender; contract: Contract }> => {
    const response = await apiClient.post<{ tender: Tender; contract: Contract }>(`/contracts/tenders/${tenderId}/award/`);
    return response.data;
  },

  getContractProfitability: async (contractId: string): Promise<ContractProfitability> => {
    const response = await apiClient.get<ContractProfitability>(`/contracts/${contractId}/profitability/`);
    return response.data;
  },
};
