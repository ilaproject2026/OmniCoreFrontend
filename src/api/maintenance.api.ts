import { apiClient } from './client';
import { MaintenanceRecord } from '../types';

export const maintenanceApi = {
  getRecords: async (): Promise<MaintenanceRecord[]> => {
    const response = await apiClient.get<any>('/maintenance/');
    const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    return raw;
  },

  createRecord: async (payload: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    const response = await apiClient.post<MaintenanceRecord>('/maintenance/', payload);
    return response.data;
  },

  updateRecord: async (id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    const response = await apiClient.patch<MaintenanceRecord>(`/maintenance/${id}/`, updates);
    return response.data;
  },
};
