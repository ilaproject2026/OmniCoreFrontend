import { apiClient } from './client';
import { Branch } from '../types';
import { MOCK_BRANCHES } from './mockData';

let branchesState: Branch[] = [...MOCK_BRANCHES];

export const branchesApi = {
  getBranches: async (): Promise<Branch[]> => {
    try {
      const response = await apiClient.get<Branch[]>('/branches/');
      return response.data;
    } catch {
      return branchesState;
    }
  },

  createBranch: async (payload: Partial<Branch>): Promise<Branch> => {
    try {
      const response = await apiClient.post<Branch>('/branches/', payload);
      return response.data;
    } catch {
      const newBranch: Branch = {
        id: `branch_${Date.now()}`,
        tenantId: 'tenant_apex',
        code: payload.code || `BR-LOC-${Math.floor(10 + Math.random() * 90)}`,
        name: payload.name || 'New Regional Branch',
        city: payload.city || 'Chicago',
        state: payload.state || 'IL',
        address: payload.address || 'Regional Way',
        phone: payload.phone || '+1 (555) 019-2831',
        managerName: payload.managerName || 'Branch Manager',
        managerEmail: payload.managerEmail || 'manager@branch.com',
        vehiclesCount: 0,
        driversCount: 0,
        activeTripsCount: 0,
        status: 'active',
      };
      branchesState.push(newBranch);
      return newBranch;
    }
  },
};
