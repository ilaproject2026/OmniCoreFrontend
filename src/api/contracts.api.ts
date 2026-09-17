import { apiClient } from './client';
import { Contract, Tender, ContractProfitability } from '../types';
import { MOCK_CONTRACTS, MOCK_TENDERS, MOCK_TRIPS, MOCK_CUSTOMERS } from './mockData';

let contractsState: Contract[] = [...MOCK_CONTRACTS];
let tendersState: Tender[] = [...MOCK_TENDERS];

export const contractsApi = {
  getContracts: async (): Promise<Contract[]> => {
    try {
      const response = await apiClient.get<any>('/contracts/');
      const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
      return raw;
    } catch {
      return contractsState;
    }
  },

  getContractById: async (id: string): Promise<Contract> => {
    try {
      const response = await apiClient.get<Contract>(`/contracts/${id}/`);
      return response.data;
    } catch {
      const c = contractsState.find((item) => item.id === id);
      if (!c) throw new Error('Contract not found');
      return c;
    }
  },

  createContract: async (payload: Partial<Contract>): Promise<Contract> => {
    try {
      const response = await apiClient.post<Contract>('/contracts/', payload);
      return response.data;
    } catch {
      const matchingCust = MOCK_CUSTOMERS.find((c) => c.id === payload.customerId || c.name === payload.clientName);

      const newContract: Contract = {
        id: `cnt_${Date.now()}`,
        contractCode: `CNT-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: payload.title || 'Enterprise Transport Agreement',
        customerId: payload.customerId || matchingCust?.id || 'cust_01',
        clientName: payload.clientName || matchingCust?.name || 'Enterprise Client',
        vertical: payload.vertical || 'freight_logistics',
        contractType: payload.contractType || 'dedicated_fleet',
        pricingModel: payload.pricingModel || 'monthly_fixed',
        startDate: payload.startDate || new Date().toISOString().split('T')[0],
        endDate: payload.endDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        totalContractValue: payload.totalContractValue || 500000,
        realizedRevenue: 0,
        dedicatedVehiclesCount: payload.dedicatedVehiclesCount || 4,
        dedicatedVehicleIds: payload.dedicatedVehicleIds || ['veh_01', 'veh_02'],
        status: 'active',
        slaTargetPercent: payload.slaTargetPercent || 98.5,
        slaActualPercent: 100,
        paymentTerms: payload.paymentTerms || 'Net 30 Days',
        billingCycle: payload.billingCycle || 'monthly',
        penalties: payload.penalties || '1.5% deduction per 2-hour delay threshold breach',
        securityDeposit: payload.securityDeposit || 25000,
        renewalAlertDays: payload.renewalAlertDays || 60,
        routes: payload.routes || [
          { origin: 'Chicago Hub', destination: 'Detroit Terminal', agreedRate: 2800, expectedTrips: 50, distanceKm: 460 },
        ],
        profitability: {
          totalRevenue: 0,
          fuelExpenses: 0,
          driverWages: 0,
          maintenanceCost: 0,
          tollExpenses: 0,
          otherExpenses: 0,
          netProfit: 0,
          marginPercent: 0,
          completedTripsCount: 0,
          totalAgreedTrips: 50,
        },
      };

      contractsState.unshift(newContract);
      return newContract;
    }
  },

  updateContract: async (id: string, updates: Partial<Contract>): Promise<Contract> => {
    try {
      const response = await apiClient.patch<Contract>(`/contracts/${id}/`, updates);
      return response.data;
    } catch {
      const index = contractsState.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('Contract not found');
      contractsState[index] = { ...contractsState[index], ...updates };
      return contractsState[index];
    }
  },

  getTenders: async (): Promise<Tender[]> => {
    try {
      const response = await apiClient.get<Tender[]>('/contracts/tenders/');
      return response.data;
    } catch {
      return tendersState;
    }
  },

  createTender: async (payload: Partial<Tender>): Promise<Tender> => {
    try {
      const response = await apiClient.post<Tender>('/contracts/tenders/', payload);
      return response.data;
    } catch {
      const newT: Tender = {
        id: 'tnd_' + Math.random().toString(36).substring(2, 7),
        tenderCode: 'TND-2026-' + Math.floor(1000 + Math.random() * 9000),
        title: payload.title || 'New Tender Proposal',
        customerId: payload.customerId,
        clientName: payload.clientName || 'Target Enterprise Client',
        industry: payload.industry || 'Logistics',
        estimatedValue: payload.estimatedValue || 500000,
        submissionDeadline: payload.submissionDeadline || '2026-11-30',
        status: 'draft',
        scopeSummary: payload.scopeSummary || 'Proposal scope details',
        estimatedVehicleRequired: payload.estimatedVehicleRequired || 5,
        costBreakdown: payload.costBreakdown || {
          fleetCosts: 200000,
          fuelEstimates: 120000,
          crewPayroll: 100000,
          margins: 80000,
        },
      };
      tendersState.unshift(newT);
      return newT;
    }
  },

  awardTenderToContract: async (tenderId: string): Promise<{ tender: Tender; contract: Contract }> => {
    try {
      const response = await apiClient.post<{ tender: Tender; contract: Contract }>(`/contracts/tenders/${tenderId}/award/`);
      return response.data;
    } catch {
      const tenderIdx = tendersState.findIndex((t) => t.id === tenderId);
      if (tenderIdx === -1) throw new Error('Tender not found');
      const tender = tendersState[tenderIdx];

      const newContractId = `cnt_${Date.now()}`;
      const contract: Contract = {
        id: newContractId,
        contractCode: `CNT-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: tender.title,
        clientName: tender.clientName,
        customerId: tender.customerId || 'cust_01',
        vertical: 'freight_logistics',
        contractType: 'government_tender',
        pricingModel: 'milestone_slab',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        totalContractValue: tender.estimatedValue,
        realizedRevenue: 0,
        dedicatedVehiclesCount: tender.estimatedVehicleRequired,
        status: 'active',
        slaTargetPercent: 99.0,
        slaActualPercent: 100,
        paymentTerms: 'Net 30 Days',
        billingCycle: 'monthly',
        renewalAlertDays: 90,
      };

      tender.status = 'won';
      tender.wonContractId = newContractId;
      contractsState.unshift(contract);

      return { tender, contract };
    }
  },

  getContractProfitability: async (contractId: string): Promise<ContractProfitability> => {
    try {
      const response = await apiClient.get<ContractProfitability>(`/contracts/${contractId}/profitability/`);
      return response.data;
    } catch {
      const contract = contractsState.find((c) => c.id === contractId);
      const linkedTrips = MOCK_TRIPS.filter((t) => t.contractId === contractId);

      let totalRevenue = linkedTrips.reduce((acc, t) => acc + (t.commercialRate || 0), 0);
      if (totalRevenue === 0 && contract) {
        totalRevenue = contract.realizedRevenue || 180000;
      }

      let fuelExpenses = 0;
      let tollExpenses = 0;
      let otherExpenses = 0;

      linkedTrips.forEach((t) => {
        (t.expenses || []).forEach((e) => {
          if (e.category === 'fuel') fuelExpenses += e.amount;
          else if (e.category === 'toll') tollExpenses += e.amount;
          else otherExpenses += e.amount;
        });
      });

      // Default baseline costs if trips have no detailed sub-expenses
      if (fuelExpenses === 0 && totalRevenue > 0) fuelExpenses = Math.round(totalRevenue * 0.28);
      if (tollExpenses === 0 && totalRevenue > 0) tollExpenses = Math.round(totalRevenue * 0.04);
      const driverWages = Math.round(totalRevenue * 0.24);
      const maintenanceCost = Math.round(totalRevenue * 0.08);

      const totalCosts = fuelExpenses + tollExpenses + otherExpenses + driverWages + maintenanceCost;
      const netProfit = totalRevenue - totalCosts;
      const marginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

      return {
        totalRevenue,
        fuelExpenses,
        driverWages,
        maintenanceCost,
        tollExpenses,
        otherExpenses,
        netProfit,
        marginPercent,
        completedTripsCount: linkedTrips.length || 18,
        totalAgreedTrips: contract?.routes?.[0]?.expectedTrips || 50,
      };
    }
  },
};
