import { apiClient } from './client';
import { SparePart, WarehouseLocation, CrossDockRecord, ShipmentConsolidationGroup, PurchaseOrder } from '../types';

export const warehouseApi = {
  getWarehouses: async (): Promise<WarehouseLocation[]> => {
    const response = await apiClient.get<WarehouseLocation[]>('/warehouse/locations/');
    return response.data;
  },

  getSpareParts: async (params?: { warehouseId?: string; search?: string; lowStockOnly?: boolean }): Promise<SparePart[]> => {
    const response = await apiClient.get<SparePart[]>('/warehouse/parts/', { params });
    return response.data;
  },

  createSparePart: async (payload: Partial<SparePart>): Promise<SparePart> => {
    const response = await apiClient.post<SparePart>('/warehouse/parts/', payload);
    return response.data;
  },

  adjustStock: async (partId: string, delta: number): Promise<SparePart> => {
    const response = await apiClient.post<SparePart>(`/warehouse/parts/${partId}/adjust/`, { delta });
    return response.data;
  },

  issuePartsToWorkOrder: async (
    workOrderId: string,
    partId: string,
    quantity: number
  ): Promise<{ part: SparePart; quantityIssued: number }> => {
    const response = await apiClient.post<{ part: SparePart; quantityIssued: number }>(
      `/warehouse/parts/${partId}/issue/`,
      { workOrderId, quantity }
    );
    return response.data;
  },

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>('/warehouse/purchase-orders/');
    return response.data;
  },

  createPurchaseOrder: async (payload: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>('/warehouse/purchase-orders/', payload);
    return response.data;
  },

  // Cross-Docking Workspace
  getCrossDockRecords: async (): Promise<CrossDockRecord[]> => {
    const response = await apiClient.get<CrossDockRecord[]>('/warehouse/cross-dock/');
    return response.data;
  },

  updateCrossDockStatus: async (
    id: string,
    sortingStatus?: CrossDockRecord['sortingStatus'],
    dispatchStatus?: CrossDockRecord['dispatchStatus'],
    consolidationGroupRef?: string
  ): Promise<CrossDockRecord> => {
    const response = await apiClient.patch<CrossDockRecord>(`/warehouse/cross-dock/${id}/`, {
      sortingStatus,
      dispatchStatus,
      consolidationGroupRef,
    });
    return response.data;
  },

  // Multi-day Shipment Consolidation
  getConsolidationGroups: async (): Promise<ShipmentConsolidationGroup[]> => {
    const response = await apiClient.get<ShipmentConsolidationGroup[]>('/warehouse/consolidation/');
    return response.data;
  },

  createConsolidationGroup: async (
    payload: Partial<ShipmentConsolidationGroup>
  ): Promise<ShipmentConsolidationGroup> => {
    const response = await apiClient.post<ShipmentConsolidationGroup>('/warehouse/consolidation/', payload);
    return response.data;
  },

  sealConsolidationGroup: async (
    id: string,
    sealNumber: string,
    vehicleReg?: string
  ): Promise<ShipmentConsolidationGroup> => {
    const response = await apiClient.post<ShipmentConsolidationGroup>(`/warehouse/consolidation/${id}/seal/`, {
      sealNumber,
      vehicleReg,
    });
    return response.data;
  },
};
