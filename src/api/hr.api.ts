import { apiClient } from './client';
import { Employee } from '../types';

export const hrApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const response = await apiClient.get<any>('/hr/employees/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  createEmployee: async (payload: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/hr/employees/', payload);
    return response.data;
  },
};
