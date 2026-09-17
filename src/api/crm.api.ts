import { apiClient } from './client';
import { Customer, Lead } from '../types';
import { MOCK_CUSTOMERS, MOCK_LEADS } from './mockData';

let leadsState: Lead[] = [...MOCK_LEADS];
let customersState: Customer[] = [...MOCK_CUSTOMERS];

export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    try {
      const response = await apiClient.get<any>('/crm/leads/');
      const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
      return raw;
    } catch {
      return leadsState;
    }
  },

  createLead: async (payload: Partial<Lead>): Promise<Lead> => {
    try {
      const response = await apiClient.post<Lead>('/crm/leads/', payload);
      return response.data;
    } catch {
      const newLead: Lead = {
        id: `lead_${Date.now()}`,
        companyName: payload.companyName || 'New Prospect Corp',
        contactPerson: payload.contactPerson || 'Lead Contact',
        email: payload.email || 'contact@prospect.com',
        phone: payload.phone || '+1 (555) 012-9988',
        stage: payload.stage || 'inquiry',
        verticalInterest: payload.verticalInterest || 'freight_logistics',
        estimatedMonthlyValue: payload.estimatedMonthlyValue || 15000,
        assignedRep: payload.assignedRep || 'Marcus Sterling',
        notes: payload.notes || 'Inbound interest through digital promotions',
        lastContactDate: new Date().toISOString().split('T')[0],
      };
      leadsState.unshift(newLead);
      return newLead;
    }
  },

  updateLeadStage: async (leadId: string, stage: Lead['stage']): Promise<Lead> => {
    try {
      const response = await apiClient.patch<Lead>(`/crm/leads/${leadId}/stage/`, { stage });
      return response.data;
    } catch {
      const lead = leadsState.find((l) => l.id === leadId);
      if (!lead) throw new Error('Lead not found');
      lead.stage = stage;
      return { ...lead };
    }
  },

  convertLeadToCustomer: async (leadId: string): Promise<{ customer: Customer; lead: Lead }> => {
    try {
      const response = await apiClient.post<{ customer: Customer; lead: Lead }>(`/crm/leads/${leadId}/convert/`);
      return response.data;
    } catch {
      const leadIndex = leadsState.findIndex((l) => l.id === leadId);
      if (leadIndex === -1) throw new Error('Lead not found');
      const lead = leadsState[leadIndex];

      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: lead.companyName,
        code: `CST-${Math.floor(100 + Math.random() * 900)}`,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        address: 'Corporate Headquarters',
        taxNumber: `TAX-US-${Math.floor(1000000 + Math.random() * 9000000)}`,
        creditLimit: Math.round((lead.estimatedMonthlyValue || 10000) * 1.5),
        outstandingBalance: 0,
        activeContractsCount: 1,
        totalTripsCompleted: 0,
      };

      customersState.unshift(newCustomer);
      lead.stage = 'won';

      return { customer: newCustomer, lead };
    }
  },

  getCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get<Customer[]>('/crm/customers/');
      return response.data;
    } catch {
      return customersState;
    }
  },

  createCustomer: async (payload: Partial<Customer>): Promise<Customer> => {
    try {
      const response = await apiClient.post<Customer>('/crm/customers/', payload);
      return response.data;
    } catch {
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: payload.name || 'New Enterprise Client',
        code: payload.code || `CST-${Math.floor(100 + Math.random() * 900)}`,
        contactPerson: payload.contactPerson || 'Primary Contact',
        email: payload.email || 'client@enterprise.com',
        phone: payload.phone || '+1 (555) 012-3344',
        address: payload.address || 'Commercial Blvd',
        taxNumber: payload.taxNumber || `TAX-${Math.floor(100000 + Math.random() * 900000)}`,
        creditLimit: payload.creditLimit || 50000,
        outstandingBalance: 0,
        activeContractsCount: 0,
        totalTripsCompleted: 0,
      };
      customersState.unshift(newCustomer);
      return newCustomer;
    }
  },
};
