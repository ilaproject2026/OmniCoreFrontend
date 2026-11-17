import { apiClient } from './client';

export type TenantRoleOption = { id: string; code: string; name: string; description: string; permissions: string[] };
export type TenantPermissionOption = { id: string; code: string; name: string; module: string; description: string };
export type TenantMember = {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  role: string | null;
  role_name: string | null;
  is_primary: boolean;
  is_active: boolean;
  permissions: string[];
  custom_permissions: string[];
  permissions_are_customized: boolean;
};
export type TenantMemberPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  custom_permissions: string[];
  permissions_are_customized: boolean;
  employee_code: string;
  department: string;
  designation: string;
  date_of_joining: string;
  status: string;
};

const rows = <T,>(data: any): T[] => Array.isArray(data) ? data : data?.results || data?.data || [];

export const tenantUsersApi = {
  getMembers: async (): Promise<TenantMember[]> => rows<TenantMember>((await apiClient.get('/tenants/users/')).data),
  getRoles: async (): Promise<TenantRoleOption[]> => rows<TenantRoleOption>((await apiClient.get('/tenants/roles/')).data),
  getPermissions: async (): Promise<TenantPermissionOption[]> => rows<TenantPermissionOption>((await apiClient.get('/tenants/permissions/')).data),
  create: async (payload: TenantMemberPayload): Promise<TenantMember> => (await apiClient.post('/tenants/users/', payload)).data,
  update: async (id: string, payload: Pick<TenantMember, 'role' | 'is_active'> & { custom_permissions: string[]; permissions_are_customized: boolean }): Promise<TenantMember> =>
    (await apiClient.patch(`/tenants/users/${id}/`, payload)).data,
};
