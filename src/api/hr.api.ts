import { apiClient } from './client';
import { Employee } from '../types';

export const hrApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const response = await apiClient.get<any>('/hr/employees/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/hr/employees/${id}/`);
    return response.data;
  },

  createEmployee: async (payload: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/hr/employees/', payload);
    return response.data;
  },

  updateEmployee: async (id: string, payload: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/hr/employees/${id}/`, payload);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/hr/employees/${id}/`);
  },

  // Attendance
  getAttendance: async (params?: { date?: string; employeeId?: string }): Promise<any[]> => {
    const response = await apiClient.get<any>('/hr/attendance/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  recordAttendance: async (payload: {
    employeeId: string;
    status: 'present' | 'absent' | 'late' | 'half_day';
    date: string;
    notes?: string;
  }): Promise<any> => {
    const response = await apiClient.post<any>('/hr/attendance/', payload);
    return response.data;
  },

  // Leave Management
  getLeaveRequests: async (): Promise<any[]> => {
    const response = await apiClient.get<any>('/hr/leaves/');
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  applyLeave: async (payload: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<any> => {
    const response = await apiClient.post<any>('/hr/leaves/', payload);
    return response.data;
  },

  updateLeaveStatus: async (leaveId: string, status: 'approved' | 'rejected'): Promise<any> => {
    const response = await apiClient.patch<any>(`/hr/leaves/${leaveId}/`, { status });
    return response.data;
  },

  // Payroll Operations
  getPayrollRecords: async (params?: { month?: string; year?: number }): Promise<any[]> => {
    const response = await apiClient.get<any>('/hr/payroll/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
  },

  generatePayroll: async (payload: { month: string; year: number; employeeIds?: string[] }): Promise<any> => {
    const response = await apiClient.post<any>('/hr/payroll/generate/', payload);
    return response.data;
  },
};
