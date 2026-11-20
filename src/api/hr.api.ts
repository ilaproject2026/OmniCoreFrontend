import { apiClient } from './client';
import { Employee } from '../types';

const normalizeEmployee = (row: any): Employee => ({
  id: String(row.id),
  employeeCode: row.employee_code || row.employeeCode || '',
  firstName: row.first_name || row.firstName || '',
  lastName: row.last_name || row.lastName || '',
  email: row.email || '',
  phone: row.phone || '',
  department: String(row.department || 'OPERATIONS').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
  designation: row.designation || '',
  role: row.role || 'Unassigned',
  roleId: row.role_id || null,
  joiningDate: row.date_of_joining || row.joiningDate || '',
  status: String(row.status || 'ACTIVE').toLowerCase() as Employee['status'],
  accountStatus: String(row.account_status || 'not_invited').toLowerCase() as Employee['accountStatus'],
});

export type EmployeeInvitePayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  date_of_joining: string;
  role: string;
};

export type EmployeeInvitationDetails = {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  role_name: string;
  requires_password: boolean;
};

export const hrApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const response = await apiClient.get<any>('/hr/employees/');
    const rows = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    return rows.map(normalizeEmployee);
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/hr/employees/${id}/`);
    return normalizeEmployee(response.data);
  },

  createEmployee: async (payload: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/hr/employees/', payload);
    return normalizeEmployee(response.data);
  },

  inviteEmployee: async (payload: EmployeeInvitePayload): Promise<{ employee: Employee; message: string; invitation_url?: string }> => {
    const response = await apiClient.post<any>('/hr/employees/invite/', payload);
    return { ...response.data, employee: normalizeEmployee(response.data.employee) };
  },

  resendEmployeeInvitation: async (id: string): Promise<{ employee: Employee; message: string; invitation_url?: string }> => {
    const response = await apiClient.post<any>(`/hr/employees/${id}/resend-invitation/`);
    return { ...response.data, employee: normalizeEmployee(response.data.employee) };
  },

  updateEmployeeAccess: async (id: string, payload: { role?: string; is_active?: boolean }): Promise<{ employee: Employee; message: string; invitation_url?: string }> => {
    const response = await apiClient.patch<any>(`/hr/employees/${id}/access/`, payload);
    return { ...response.data, employee: normalizeEmployee(response.data.employee) };
  },

  getInvitation: async (token: string): Promise<EmployeeInvitationDetails> => {
    const response = await apiClient.get<EmployeeInvitationDetails>('/hr/invitations/accept/', { params: { token } });
    return response.data;
  },

  acceptInvitation: async (token: string, newPassword?: string): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post<{ message: string; email: string }>('/hr/invitations/accept/', {
      token,
      ...(newPassword ? { new_password: newPassword } : {}),
    });
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
