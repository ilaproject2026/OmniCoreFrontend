import { apiClient } from './client';
import { InsuranceClaim, InsurancePolicy } from '../types';

const extractList = (data: any): any[] =>
  Array.isArray(data) ? data : (data?.results || data?.data || []);

const toBackendPolicyType = (type?: InsurancePolicy['type']): string => {
  switch (type) {
    case 'goods_in_transit':
    case 'cold_spoilage_cover': return 'CARGO';
    case 'third_party_liability': return 'THIRD_PARTY';
    case 'fleet_comprehensive':
    default: return 'COMPREHENSIVE';
  }
};

const fromBackendPolicyType = (type?: string): InsurancePolicy['type'] => {
  switch ((type || '').toUpperCase()) {
    case 'CARGO': return 'goods_in_transit';
    case 'THIRD_PARTY': return 'third_party_liability';
    case 'HEALTH': return 'cold_spoilage_cover';
    default: return 'fleet_comprehensive';
  }
};

const normalizePolicy = (raw: any): InsurancePolicy => {
  const expiryDate = raw.end_date || raw.expiry_date || raw.expiryDate || '';
  const expired = expiryDate ? new Date(expiryDate).getTime() < Date.now() : false;
  const expiringSoon = expiryDate
    ? !expired && new Date(expiryDate).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000
    : false;

  return {
    ...raw,
    id: raw.id,
    policyNumber: raw.policy_number || raw.policyNumber || '',
    provider: raw.provider_name || raw.provider || '',
    type: raw.type || fromBackendPolicyType(raw.policy_type),
    coverageAmount: Number(raw.coverage_amount ?? raw.coverageAmount ?? 0),
    premiumAmount: Number(raw.premium_amount ?? raw.premiumAmount ?? 0),
    startDate: raw.start_date || raw.startDate || '',
    expiryDate,
    status: expired ? 'expired' : expiringSoon ? 'expiring_soon' : 'active',
    coveredVehiclesCount: Number(raw.covered_vehicles_count ?? raw.coveredVehiclesCount ?? (raw.vehicle ? 1 : 0)),
  };
};

const toBackendPolicy = (payload: Partial<InsurancePolicy>): Record<string, unknown> => ({
  ...(payload.policyNumber !== undefined ? { policy_number: payload.policyNumber } : {}),
  ...(payload.provider !== undefined ? { provider_name: payload.provider } : {}),
  ...(payload.type !== undefined ? { policy_type: toBackendPolicyType(payload.type) } : {}),
  ...(payload.startDate !== undefined ? { start_date: payload.startDate } : {}),
  ...(payload.expiryDate !== undefined ? { end_date: payload.expiryDate } : {}),
  ...(payload.premiumAmount !== undefined ? { premium_amount: payload.premiumAmount } : {}),
  ...(payload.coverageAmount !== undefined ? { coverage_amount: payload.coverageAmount } : {}),
});

const toBackendClaimStatus = (status: InsuranceClaim['status']): string => {
  switch (status) {
    case 'investigating': return 'UNDER_SURVEY';
    case 'approved': return 'APPROVED';
    case 'settled': return 'SETTLED';
    case 'rejected': return 'REJECTED';
    case 'filed':
    default: return 'SUBMITTED';
  }
};

const fromBackendClaimStatus = (status?: string): InsuranceClaim['status'] => {
  switch ((status || '').toUpperCase()) {
    case 'UNDER_SURVEY': return 'investigating';
    case 'INVESTIGATING': return 'investigating';
    case 'APPROVED': return 'approved';
    case 'SETTLED': return 'settled';
    case 'REJECTED': return 'rejected';
    case 'SUBMITTED':
    case 'FILED':
    default: return 'filed';
  }
};

const normalizeClaim = (raw: any): InsuranceClaim => ({
  ...raw,
  id: raw.id,
  claimNumber: raw.claim_number || raw.claimNumber || '',
  policyId: raw.policy_id || raw.policy,
  policyNumber: raw.policy_number || raw.policyNumber || '',
  vehicleReg: raw.vehicle_reg || raw.vehicleReg || '',
  incidentDate: raw.incident_date || raw.incidentDate || '',
  claimAmount: Number(raw.claim_amount ?? raw.claimAmount ?? 0),
  settledAmount: Number(raw.approved_amount ?? raw.settled_amount ?? raw.settledAmount ?? 0) || undefined,
  status: fromBackendClaimStatus(raw.status),
  description: raw.description || raw.notes || '',
});

const generateClaimNumber = (): string =>
  `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const insuranceApi = {
  getPolicies: async (): Promise<InsurancePolicy[]> => {
    const response = await apiClient.get<any>('/insurance/policies/');
    return extractList(response.data).map(normalizePolicy);
  },

  getPolicyById: async (id: string): Promise<InsurancePolicy> => {
    const response = await apiClient.get<any>(`/insurance/policies/${id}/`);
    return normalizePolicy(response.data);
  },

  createPolicy: async (payload: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const response = await apiClient.post<any>('/insurance/policies/', toBackendPolicy(payload));
    return normalizePolicy(response.data);
  },

  updatePolicy: async (id: string, payload: Partial<InsurancePolicy>): Promise<InsurancePolicy> => {
    const response = await apiClient.patch<any>(`/insurance/policies/${id}/`, toBackendPolicy(payload));
    return normalizePolicy(response.data);
  },

  getClaims: async (params?: { policyId?: string; status?: string }): Promise<InsuranceClaim[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.policyId) queryParams.policy = params.policyId;
    if (params?.status) queryParams.status = toBackendClaimStatus(params.status as InsuranceClaim['status']);
    const response = await apiClient.get<any>('/insurance/claims/', { params: queryParams });
    return extractList(response.data).map(normalizeClaim);
  },

  getClaimById: async (id: string): Promise<InsuranceClaim> => {
    const response = await apiClient.get<any>(`/insurance/claims/${id}/`);
    return normalizeClaim(response.data);
  },

  createClaim: async (payload: Partial<InsuranceClaim>): Promise<InsuranceClaim> => {
    if (!payload.policyId) throw new Error('Select an insurance policy for this claim.');
    const response = await apiClient.post<any>('/insurance/claims/', {
      claim_number: payload.claimNumber || generateClaimNumber(),
      policy: payload.policyId,
      incident_date: payload.incidentDate || new Date().toISOString().slice(0, 10),
      claim_amount: payload.claimAmount ?? 0,
      status: toBackendClaimStatus(payload.status || 'filed'),
      notes: payload.description || '',
    });
    return normalizeClaim(response.data);
  },

  updateClaimStatus: async (
    id: string,
    status: InsuranceClaim['status'],
    details?: { settledAmount?: number; notes?: string }
  ): Promise<InsuranceClaim> => {
    const response = await apiClient.patch<any>(`/insurance/claims/${id}/`, {
      status: toBackendClaimStatus(status),
      ...(details?.settledAmount !== undefined ? { approved_amount: details.settledAmount } : {}),
      ...(details?.notes !== undefined ? { notes: details.notes } : {}),
    });
    return normalizeClaim(response.data);
  },
};
