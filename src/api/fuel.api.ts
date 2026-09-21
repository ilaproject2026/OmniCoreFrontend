import { apiClient } from './client';
import { FuelLogEntry } from '../types';

export const fuelApi = {
  getFuelLogs: async (params?: { vehicleId?: string; search?: string; abnormalOnly?: boolean }): Promise<FuelLogEntry[]> => {
    const response = await apiClient.get<any>('/fleet/fuel-logs/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  logFuelEntry: async (payload: Partial<FuelLogEntry>): Promise<FuelLogEntry> => {
    const response = await apiClient.post<FuelLogEntry>('/fleet/fuel-logs/', payload);
    return response.data;
  },
};
