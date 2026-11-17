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
    const response = await apiClient.get<any>('/courier/shipments/', { params: { search: awbNumber } });
    const rows = Array.isArray(response.data) ? response.data : response.data?.results || [];
    const shipment = rows.find((row: any) => row.awb_number === awbNumber || row.awbNumber === awbNumber);
    return shipment || null;
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
    const response = await apiClient.post(`/courier/shipments/${id}/transition/`, {
      status: status.toUpperCase(),
      description: note || '',
      location: location || '',
    });
    return response.data;
  },

  verifyProofOfDelivery: async (
    id: string,
    pod: ProofOfDelivery
  ): Promise<CourierShipment> => {
    const shipmentResponse = await apiClient.get<any>(`/courier/shipments/${id}/`);
    const deliveryId = shipmentResponse.data?.delivery_task?.id;
    if (!deliveryId) throw new Error('This shipment does not have a delivery task yet.');
    const response = await apiClient.post(`/courier/deliveries/${deliveryId}/verify-pod/`, {
      otp: pod.otpCode || '',
      recipient_name: pod.recipientName || '',
      signature_file: pod.signatureDataUrl || '',
      notes: pod.notes || '',
    });
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
    const response = await apiClient.get('/courier/pickups/');
    return response.data;
  },

  createMultiPointPickup: async (data: Partial<MultiPointPickup>): Promise<MultiPointPickup> => {
    const response = await apiClient.post('/courier/pickups/', data);
    return response.data;
  },

  updatePickupStopStatus: async (
    pickupId: string,
    _stopId: string,
    status: 'pending' | 'assigned' | 'picked_up' | 'failed' | 'completed'
  ): Promise<MultiPointPickup> => {
    const actionByStatus: Partial<Record<typeof status, string>> = {
      assigned: 'assign',
      picked_up: 'start',
      completed: 'complete',
      failed: 'fail',
    };
    const action = actionByStatus[status];
    if (!action) throw new Error(`Pickup status "${status}" cannot be set through the backend workflow.`);
    const response = await apiClient.post(`/courier/pickups/${pickupId}/${action}/`, {});
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
    const shipmentResponse = await apiClient.get<any>('/courier/shipments/', { params: { search: awbNumber } });
    const shipments = Array.isArray(shipmentResponse.data) ? shipmentResponse.data : shipmentResponse.data?.results || [];
    const shipment = shipments.find((item: any) => item.awb_number === awbNumber || item.awbNumber === awbNumber) || shipments[0];
    if (!shipment?.id) throw new Error(`Shipment ${awbNumber} was not found.`);
    const response = await apiClient.post('/courier/sorting/process/', {
      shipment_id: shipment.id,
      source_hub_id: sourceHub,
      destination_hub_id: destinationHub,
      sorting_category: sortingCategory.toUpperCase(),
      notes: `Scanned by ${scannedBy}`,
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
    const response = await apiClient.post(`/courier/payouts/${payoutId}/approve/`);
    return response.data;
  },
};
