import { apiClient } from './client';
import { Customer, Lead } from '../types';

export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    const response = await apiClient.get<any>('/crm/leads/');
    const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    return raw;
  },

  createLead: async (payload: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.post<Lead>('/crm/leads/', payload);
    return response.data;
  },

  updateLeadStage: async (leadId: string, stage: Lead['stage']): Promise<Lead> => {
    const response = await apiClient.patch<Lead>(`/crm/leads/${leadId}/stage/`, { stage });
    return response.data;
  },

  convertLeadToCustomer: async (leadId: string): Promise<{ customer: Customer; lead: Lead }> => {
    const response = await apiClient.post<{ customer: Customer; lead: Lead }>(`/crm/leads/${leadId}/convert/`);
    return response.data;
  },

  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get<any>('/crm/customers/');
    const raw: any[] = Array.isArray(response.data)
      ? response.data
      : response.data?.results || response.data?.data || [];
    return raw.map((c: any) => ({
      id: c.id,
      name: c.company_name || c.name || 'Enterprise Client',
      companyName: c.company_name || c.name || 'Enterprise Client',
      code: c.code || `CST-${String(c.id).slice(0, 6).toUpperCase()}`,
      contactPerson: c.contact_person || c.contactPerson || 'Contact Person',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      taxNumber: c.tax_id || c.taxNumber || '',
      creditLimit: Number(c.credit_limit ?? c.creditLimit ?? 50000),
      outstandingBalance: Number(c.outstanding_balance ?? c.outstandingBalance ?? 0),
      activeContractsCount: Number(c.active_contracts_count ?? 0),
      totalTripsCompleted: Number(c.total_trips_completed ?? 0),
    }));
  },

  createCustomer: async (payload: Partial<Customer>): Promise<Customer> => {
    const backendPayload = {
      company_name: (payload as any).companyName || payload.name || '',
      name: payload.name || (payload as any).companyName || '',
      contact_person: (payload as any).contactPerson || (payload as any).contact_person || '',
      email: payload.email || '',
      phone: payload.phone || '',
      address: (payload as any).billingAddress || payload.address || '',
      tax_id: (payload as any).taxId || payload.taxNumber || '',
      credit_limit: payload.creditLimit || 0,
    };

    const response = await apiClient.post<any>('/crm/customers/', backendPayload);
    const c = response.data?.data || response.data;
    return {
      id: c.id,
      name: c.company_name || c.name || backendPayload.name,
      companyName: c.company_name || c.name || backendPayload.name,
      code: c.code || `CST-${String(c.id).slice(0, 6).toUpperCase()}`,
      contactPerson: c.contact_person || backendPayload.contact_person,
      email: c.email || backendPayload.email,
      phone: c.phone || backendPayload.phone,
      address: c.address || backendPayload.address,
      taxNumber: c.tax_id || backendPayload.tax_id,
      creditLimit: Number(c.credit_limit ?? backendPayload.credit_limit),
      outstandingBalance: 0,
      activeContractsCount: 0,
      totalTripsCompleted: 0,
    };
  },
};
