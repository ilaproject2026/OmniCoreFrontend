import { apiClient } from './client';
import { Contract, Tender, ContractProfitability } from '../types';

const rowsFrom = (data: any): any[] => Array.isArray(data) ? data : data?.results || data?.data || [];

async function getAllRows(path: string): Promise<any[]> {
  const rows: any[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await apiClient.get<any>(path, { params: { page, page_size: 100 } });
    rows.push(...rowsFrom(response.data));
    totalPages = Number(response.data?.total_pages || 1);
    page += 1;
  } while (page <= totalPages);
  return rows;
}

const errorMessage = (error: any): string => {
  const body = error?.response?.data || {};
  const fields = body?.error?.fields || body?.fields || body;
  const details = fields && typeof fields === 'object'
    ? Object.entries(fields).filter(([key]) => !['detail', 'message', 'code', 'success'].includes(key))
        .flatMap(([field, value]) => (Array.isArray(value) ? value : [value]).map((message) => `${field}: ${String(message)}`)).join(' · ')
    : '';
  return details || body?.detail || body?.message || error?.message || 'Contracts request failed.';
};

const normalizeContract = (raw: any): Contract => ({
  ...raw, contractCode: raw.contract_number || '', contractNumber: raw.contract_number || '',
  customerId: raw.customer || '', customerName: raw.customer_name || '', clientName: raw.customer_name || '',
  startDate: raw.start_date || '', endDate: raw.end_date || '',
  totalContractValue: Number(raw.total_contract_value || 0), realizedRevenue: 0,
  dedicatedVehiclesCount: (raw.allocations || []).reduce((sum: number, item: any) => sum + Number(item.committed_vehicles || 0), 0),
  minMonthlyTrips: 0, status: ({ DRAFT: 'draft', PENDING_APPROVAL: 'draft', ACTIVE: 'active', RENEWAL_DUE: 'expiring_soon', EXPIRED: 'completed', TERMINATED: 'terminated' } as Record<string, Contract['status']>)[raw.status] || 'draft',
  slaTargetPercent: 0, slaActualPercent: 0, paymentTerms: `Net ${raw.payment_terms_days ?? 30} Days`,
  paymentTermsDays: Number(raw.payment_terms_days ?? 30), renewalAlertDays: 0,
  billingCycle: undefined, routes: [],
});

const normalizeTender = (raw: any): Tender => {
  const scope = String(raw.scope_of_work || '');
  const industry = scope.match(/^Industry:\s*(.+)$/m)?.[1] || '';
  const vehicles = Number(scope.match(/Dedicated vehicles required:\s*(\d+)/i)?.[1] || 0);
  return {
    ...raw, tenderCode: raw.tender_number || '', title: raw.title || '', clientName: raw.issuing_authority || '',
    industry, estimatedValue: Number(raw.estimated_value || 0), submissionDeadline: raw.submission_deadline || '',
    status: ({ OPEN: 'open', BID_SUBMITTED: 'submitted', EVALUATION: 'under_review', AWARDED: 'awarded', LOST: 'lost' } as Record<string, Tender['status']>)[raw.status] || 'draft',
    scopeSummary: scope, estimatedVehicleRequired: vehicles, costBreakdown: { fleetCosts: 0, fuelEstimates: 0, crewPayroll: 0, margins: 0 },
  };
};

const backendContractPayload = (payload: Partial<Contract>): Record<string, unknown> => Object.fromEntries(
  Object.entries({
    contract_number: payload.contractNumber || payload.contractCode,
    title: payload.title, customer: payload.customerId, start_date: payload.startDate, end_date: payload.endDate,
    total_contract_value: payload.totalContractValue,
    minimum_monthly_commitment: (payload as any).minimumMonthlyCommitment,
    payment_terms_days: payload.paymentTermsDays,
    status: payload.status ? String(payload.status).toUpperCase() : undefined,
    terms_and_conditions: (payload as any).termsAndConditions,
  }).filter(([, value]) => value !== undefined)
);

export const contractsApi = {
  getContracts: async (): Promise<Contract[]> => {
    return (await getAllRows('/contracts/')).map(normalizeContract);
  },

  getContractById: async (id: string): Promise<Contract> => {
    const response = await apiClient.get<any>(`/contracts/${id}/`);
    return normalizeContract(response.data);
  },

  createContract: async (payload: Partial<Contract>): Promise<Contract> => {
    try {
      const response = await apiClient.post<any>('/contracts/', backendContractPayload(payload));
      return normalizeContract(response.data);
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  },

  updateContract: async (id: string, updates: Partial<Contract>): Promise<Contract> => {
    const response = await apiClient.patch<any>(`/contracts/${id}/`, backendContractPayload(updates));
    return normalizeContract(response.data);
  },

  getTenders: async (): Promise<Tender[]> => {
    return (await getAllRows('/contracts/tenders/')).map(normalizeTender);
  },

  createTender: async (payload: Partial<Tender>): Promise<Tender> => {
    const raw = payload as any;
    const scopeOfWork = [
      raw.industry ? `Industry: ${raw.industry}` : '',
      `Dedicated vehicles required: ${Number(raw.estimatedVehicleRequired || 0)}`,
      `Estimated fleet cost: ${Number(raw.costBreakdown?.fleetCosts || 0)}`,
      `Estimated fuel cost: ${Number(raw.costBreakdown?.fuelEstimates || 0)}`,
      `Estimated crew payroll: ${Number(raw.costBreakdown?.crewPayroll || 0)}`,
      `Target margin: ${Number(raw.costBreakdown?.margins || 0)}`,
    ].filter(Boolean).join('\n');
    try {
      const response = await apiClient.post<any>('/contracts/tenders/', {
        title: String(raw.title || '').trim(), issuing_authority: String(raw.issuingAuthority || raw.clientName || '').trim(),
        submission_deadline: raw.submissionDeadline, estimated_value: Number(raw.estimatedValue || 0),
        scope_of_work: scopeOfWork,
      });
      return normalizeTender(response.data);
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  },

  awardTenderToContract: async (tenderId: string): Promise<{ tender: Tender; contract: Contract }> => {
    const response = await apiClient.post<{ tender: Tender; contract: Contract }>(`/contracts/tenders/${tenderId}/award/`);
    return response.data;
  },

  getContractProfitability: async (contractId: string): Promise<ContractProfitability> => {
    const response = await apiClient.get<any>(`/contracts/${contractId}/profitability/`);
    return response.data;
  },
};
