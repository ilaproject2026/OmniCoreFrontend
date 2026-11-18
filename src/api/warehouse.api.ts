import { apiClient } from './client';
import { SparePart, WarehouseLocation, CrossDockRecord, ShipmentConsolidationGroup, PurchaseOrder } from '../types';

const normalizeSparePart = (raw: any): SparePart => ({
  ...raw,
  id: raw.id,
  sku: raw.sku || raw.part_number || '',
  name: raw.name || '',
  category: (raw.category || 'tyres').toLowerCase() as SparePart['category'],
  warehouseId: raw.warehouse_id || raw.warehouseId || '',
  warehouseName: raw.warehouse_name || raw.warehouseName || '',
  availableQuantity: Number(raw.available_quantity ?? raw.current_stock ?? 0),
  minQuantity: Number(raw.min_quantity ?? raw.minimum_stock ?? 0),
  reorderLevel: Number(raw.reorder_level ?? 0),
  unitCost: Number(raw.unit_cost ?? raw.unitCost ?? 0),
  sellingPrice: Number(raw.selling_price ?? raw.sellingPrice ?? 0),
  locationBin: raw.location_bin || raw.locationBin || '',
  supplierName: raw.supplier_name || raw.supplierName || '',
  isLowStock: Boolean(raw.is_low_stock ?? raw.isLowStock),
});

const toBackendSparePart = (payload: Partial<SparePart>) => {
  const partNumber = payload.sku?.trim();
  if (!partNumber) throw new Error('Enter a SKU code / part number before creating the part.');
  if (!payload.name?.trim()) throw new Error('Enter a part name before creating the part.');

  return {
    part_number: partNumber,
    name: payload.name.trim(),
    category: payload.category?.toUpperCase() || 'GENERAL',
    unit: 'PCS',
    unit_cost: payload.unitCost ?? 0,
    minimum_stock: payload.minQuantity ?? 0,
    reorder_level: payload.reorderLevel ?? 0,
  };
};

export const warehouseApi = {
  getWarehouses: async (): Promise<WarehouseLocation[]> => {
    const response = await apiClient.get<WarehouseLocation[]>('/warehouse/locations/');
    return response.data;
  },

  getSpareParts: async (params?: { warehouseId?: string; search?: string; lowStockOnly?: boolean }): Promise<SparePart[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    const response = await apiClient.get<any>('/warehouse/parts/', { params: queryParams });
    const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    const parts = raw.map(normalizeSparePart);
    return params?.lowStockOnly ? parts.filter((part: SparePart) => part.isLowStock) : parts;
  },

  createSparePart: async (payload: Partial<SparePart>): Promise<SparePart> => {
    const response = await apiClient.post<any>('/warehouse/parts/', toBackendSparePart(payload));
    return normalizeSparePart(response.data);
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
