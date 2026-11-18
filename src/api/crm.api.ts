import { apiClient } from './client';
import { Customer, Lead, LeadStage } from '../types';

type BackendLeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';

const toBackendLeadStatus = (stage?: LeadStage): BackendLeadStatus => {
  switch (stage) {
    case 'qualification': return 'QUALIFIED';
    case 'proposal': return 'PROPOSAL_SENT';
    case 'negotiation': return 'NEGOTIATION';
    case 'won': return 'WON';
    case 'lost': return 'LOST';
    case 'inquiry':
    default: return 'NEW';
  }
};

const fromBackendLeadStatus = (status?: string): LeadStage => {
  switch ((status || '').toUpperCase()) {
    case 'CONTACTED':
    case 'NEW': return 'inquiry';
    case 'QUALIFIED': return 'qualification';
    case 'PROPOSAL_SENT': return 'proposal';
    case 'NEGOTIATION': return 'negotiation';
    case 'WON': return 'won';
    case 'LOST': return 'lost';
    default: return 'inquiry';
  }
};

const normalizeLead = (raw: any): Lead => ({
  ...raw,
  id: raw.id,
  companyName: raw.company_name || raw.companyName || raw.name || '',
  contactPerson: raw.contact_person || raw.contactPerson || raw.name || '',
  email: raw.email || '',
  phone: raw.phone || '',
  stage: raw.stage || fromBackendLeadStatus(raw.status),
  convertedCustomerId: raw.converted_customer || raw.convertedCustomerId || undefined,
  // Vertical interest is not currently a field in the backend Lead model.
  verticalInterest: raw.vertical_interest || raw.verticalInterest || 'freight_logistics',
  estimatedMonthlyValue: Number(raw.estimated_monthly_value ?? raw.estimated_value ?? raw.estimatedMonthlyValue ?? 0),
  assignedRep: raw.assigned_rep || raw.assignedRep || '',
  notes: raw.notes || '',
  lastContactDate: raw.last_contact_date || raw.lastContactDate || raw.created_at || '',
});

const normalizeCustomer = (raw: any): Customer => ({
  ...raw,
  id: raw.id,
  name: raw.company_name || raw.companyName || raw.name || 'Customer',
  companyName: raw.company_name || raw.companyName || raw.name || 'Customer',
  code: raw.code || `CST-${String(raw.id || '').slice(0, 6).toUpperCase()}`,
  contactPerson: raw.contact_person || raw.contactPerson || '',
  email: raw.email || '',
  phone: raw.phone || '',
  address: raw.address || '',
  billingAddress: raw.billing_address || raw.billingAddress || raw.address || '',
  taxNumber: raw.tax_id || raw.taxNumber || '',
  taxId: raw.tax_id || raw.taxId || '',
  creditLimit: Number(raw.credit_limit ?? raw.creditLimit ?? 0),
  outstandingBalance: Number(raw.outstanding_balance ?? raw.outstandingBalance ?? 0),
  activeContractsCount: Number(raw.active_contracts_count ?? raw.activeContractsCount ?? 0),
  totalTripsCompleted: Number(raw.total_trips_completed ?? raw.totalTripsCompleted ?? 0),
  status: raw.status || (raw.is_active === false ? 'inactive' : 'active'),
  paymentTerms: raw.payment_terms || raw.paymentTerms || `net_${raw.payment_terms_days ?? 30}`,
});

const extractList = (data: any): any[] =>
  Array.isArray(data) ? data : (data?.results || data?.data || []);

export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    const response = await apiClient.get<any>('/crm/leads/');
    return extractList(response.data).map(normalizeLead);
  },

  createLead: async (payload: Partial<Lead>): Promise<Lead> => {
    const backendPayload = {
      // The backend's required LeadSerializer field is `name`; the UI captures
      // this as the primary contact person.
      name: payload.contactPerson || payload.companyName || '',
      company_name: payload.companyName || '',
      email: payload.email || '',
      phone: payload.phone || '',
      vertical_interest: payload.verticalInterest || 'freight_logistics',
      lead_source: 'CRM',
      status: toBackendLeadStatus(payload.stage),
      estimated_value: payload.estimatedMonthlyValue ?? 0,
      notes: payload.notes || '',
    };
    const response = await apiClient.post<any>('/crm/leads/', backendPayload);
    return normalizeLead(response.data);
  },

  updateLeadStage: async (leadId: string, stage: LeadStage): Promise<Lead> => {
    // The backend exposes standard detail PATCH, not a /stage/ action route.
    const response = await apiClient.patch<any>(`/crm/leads/${leadId}/`, {
      status: toBackendLeadStatus(stage),
    });
    return normalizeLead(response.data);
  },

  convertLeadToCustomer: async (leadId: string): Promise<{ message: string; customerId: string }> => {
    const response = await apiClient.post<any>(`/crm/leads/${leadId}/convert/`);
    return {
      message: response.data?.message || 'Lead converted to customer.',
      customerId: response.data?.customer_id || response.data?.customerId || '',
    };
  },

  getCustomers: async (): Promise<Customer[]> => {
    const response = await apiClient.get<any>('/crm/customers/');
    return extractList(response.data).map(normalizeCustomer);
  },

  createCustomer: async (payload: Partial<Customer>): Promise<Customer> => {
    const paymentTerms = (payload as any).paymentTerms || 'net_30';
    const paymentTermsDays = Number(paymentTerms.match?.(/\d+/)?.[0] || 30);
    const backendPayload = {
      company_name: payload.companyName || payload.name || '',
      contact_person: payload.contactPerson || '',
      email: payload.email || '',
      phone: payload.phone || '',
      address: (payload as any).billingAddress || payload.address || '',
      tax_id: (payload as any).taxId || payload.taxNumber || '',
      credit_limit: payload.creditLimit ?? 0,
      payment_terms_days: paymentTermsDays,
    };

    const response = await apiClient.post<any>('/crm/customers/', backendPayload);
    return normalizeCustomer(response.data);
  },
};
