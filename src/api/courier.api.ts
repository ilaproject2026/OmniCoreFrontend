import { apiClient } from './client';
import {
  CourierShipment,
  CourierShipmentStatus,
  ProofOfDelivery,
  MultiPointPickup,
  DeliveryHub,
  SortingRecord,
  CourierAgent,
  AgentCommission,
  AgentPayout,
} from '../types';

export const courierApi = {
  getShipments: async (): Promise<CourierShipment[]> => {
    const response = await apiClient.get('/courier/shipments/');
    return response.data;
  },

  getShipmentByAwb: async (awbNumber: string): Promise<CourierShipment | null> => {
    const response = await apiClient.get(`/courier/shipments/${awbNumber}/`);
    return response.data;
  },

  createShipment: async (data: Partial<CourierShipment>): Promise<CourierShipment> => {
    const response = await apiClient.post('/courier/shipments/', data);
    return response.data;
  },

  updateShipmentStatus: async (
    id: string,
    status: CourierShipmentStatus,
    note?: string,
    location?: string
  ): Promise<CourierShipment> => {
    const response = await apiClient.patch(`/courier/shipments/${id}/status/`, { status, note, location });
    return response.data;
  },

  verifyProofOfDelivery: async (
    id: string,
    pod: ProofOfDelivery
  ): Promise<CourierShipment> => {
    const response = await apiClient.post(`/courier/shipments/${id}/pod/`, pod);
    return response.data;
  },

  recordDeliveryAttempt: async (
    id: string,
    reason: string,
    agentName: string
  ): Promise<CourierShipment> => {
    const response = await apiClient.post(`/courier/shipments/${id}/attempts/`, { reason, agentName });
    return response.data;
  },

  // Multi-point pickups
  getMultiPointPickups: async (): Promise<MultiPointPickup[]> => {
    const response = await apiClient.get('/courier/multi-point-pickups/');
    return response.data;
  },

  createMultiPointPickup: async (data: Partial<MultiPointPickup>): Promise<MultiPointPickup> => {
    const response = await apiClient.post('/courier/multi-point-pickups/', data);
    return response.data;
  },

  updatePickupStopStatus: async (
    pickupId: string,
    stopId: string,
    status: 'pending' | 'assigned' | 'picked_up' | 'failed' | 'completed'
  ): Promise<MultiPointPickup> => {
    const response = await apiClient.patch(`/courier/multi-point-pickups/${pickupId}/stops/${stopId}/`, { status });
    return response.data;
  },

  // Delivery Hubs
  getDeliveryHubs: async (): Promise<DeliveryHub[]> => {
    const response = await apiClient.get('/courier/hubs/');
    return response.data;
  },

  createDeliveryHub: async (data: Partial<DeliveryHub>): Promise<DeliveryHub> => {
    const response = await apiClient.post('/courier/hubs/', data);
    return response.data;
  },

  // Sorting
  getSortingRecords: async (): Promise<SortingRecord[]> => {
    const response = await apiClient.get('/courier/sorting/');
    return response.data;
  },

  scanAndSortShipment: async (
    awbNumber: string,
    sourceHub: string,
    destinationHub: string,
    sortingCategory: SortingRecord['sortingCategory'],
    scannedBy: string
  ): Promise<SortingRecord> => {
    const response = await apiClient.post('/courier/sorting/scan/', {
      awbNumber,
      sourceHub,
      destinationHub,
      sortingCategory,
      scannedBy,
    });
    return response.data;
  },

  // Courier Agents & Payouts
  getCourierAgents: async (): Promise<CourierAgent[]> => {
    const response = await apiClient.get('/courier/agents/');
    return response.data;
  },

  getAgentCommissions: async (agentId?: string): Promise<AgentCommission[]> => {
    const response = await apiClient.get('/courier/commissions/', { params: { agentId } });
    return response.data;
  },

  getAgentPayouts: async (): Promise<AgentPayout[]> => {
    const response = await apiClient.get('/courier/payouts/');
    return response.data;
  },

  requestPayout: async (data: Partial<AgentPayout>): Promise<AgentPayout> => {
    const response = await apiClient.post('/courier/payouts/', data);
    return response.data;
  },

  approvePayout: async (payoutId: string): Promise<AgentPayout> => {
    const response = await apiClient.patch(`/courier/payouts/${payoutId}/approve/`);
    return response.data;
  },
};
