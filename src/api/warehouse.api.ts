import { apiClient } from './client';
import { SparePart, WarehouseLocation, CrossDockRecord, ShipmentConsolidationGroup, PurchaseOrder } from '../types';
import {
  MOCK_SPARE_PARTS,
  MOCK_WAREHOUSES,
  MOCK_CROSS_DOCK_RECORDS,
  MOCK_CONSOLIDATION_GROUPS,
  MOCK_PURCHASE_ORDERS,
} from './mockData';

let crossDockState: CrossDockRecord[] = [...MOCK_CROSS_DOCK_RECORDS];
let consolidationState: ShipmentConsolidationGroup[] = [...MOCK_CONSOLIDATION_GROUPS];
let purchaseOrdersState: PurchaseOrder[] = [...MOCK_PURCHASE_ORDERS];

export const warehouseApi = {
  getWarehouses: async (): Promise<WarehouseLocation[]> => {
    try {
      const response = await apiClient.get<WarehouseLocation[]>('/warehouse/locations/');
      return response.data;
    } catch {
      return MOCK_WAREHOUSES;
    }
  },

  getSpareParts: async (params?: { warehouseId?: string; search?: string; lowStockOnly?: boolean }): Promise<SparePart[]> => {
    try {
      const response = await apiClient.get<SparePart[]>('/warehouse/parts/', { params });
      return response.data;
    } catch {
      let list = [...MOCK_SPARE_PARTS];
      if (params?.warehouseId && params.warehouseId !== 'all') {
        list = list.filter((p) => p.warehouseId === params.warehouseId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
      }
      if (params?.lowStockOnly) {
        list = list.filter((p) => p.isLowStock);
      }
      return list;
    }
  },

  createSparePart: async (payload: Partial<SparePart>): Promise<SparePart> => {
    try {
      const response = await apiClient.post<SparePart>('/warehouse/parts/', payload);
      return response.data;
    } catch {
      const newPart: SparePart = {
        id: 'prt_' + Math.random().toString(36).substring(2, 7),
        sku: payload.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        name: payload.name || 'OEM Replacement Part',
        category: payload.category || 'tyres',
        warehouseId: payload.warehouseId || 'wh_01',
        warehouseName: 'Apex Central Distribution Hub',
        availableQuantity: payload.availableQuantity ?? 10,
        minQuantity: payload.minQuantity ?? 5,
        reorderLevel: payload.reorderLevel ?? 8,
        unitCost: payload.unitCost ?? 120,
        sellingPrice: payload.sellingPrice ?? 160,
        locationBin: payload.locationBin || 'BIN-A1',
        supplierName: payload.supplierName || 'Fleet Supply Direct',
        isLowStock: (payload.availableQuantity ?? 10) <= (payload.reorderLevel ?? 8),
      };
      MOCK_SPARE_PARTS.unshift(newPart);
      return newPart;
    }
  },

  adjustStock: async (partId: string, delta: number): Promise<SparePart> => {
    try {
      const response = await apiClient.post<SparePart>(`/warehouse/parts/${partId}/adjust/`, { delta });
      return response.data;
    } catch {
      const part = MOCK_SPARE_PARTS.find((p) => p.id === partId);
      if (!part) throw new Error('Part not found');
      if (delta < 0 && part.availableQuantity + delta < 0) {
        throw new Error(`Insufficient Stock: Cannot deduct ${Math.abs(delta)} units. Available: ${part.availableQuantity}`);
      }
      part.availableQuantity = Math.max(0, part.availableQuantity + delta);
      part.isLowStock = part.availableQuantity <= part.reorderLevel;
      return { ...part };
    }
  },

  issuePartsToWorkOrder: async (
    workOrderId: string,
    partId: string,
    quantity: number
  ): Promise<{ part: SparePart; quantityIssued: number }> => {
    try {
      const response = await apiClient.post<{ part: SparePart; quantityIssued: number }>(
        `/warehouse/parts/${partId}/issue/`,
        { workOrderId, quantity }
      );
      return response.data;
    } catch {
      const part = MOCK_SPARE_PARTS.find((p) => p.id === partId);
      if (!part) throw new Error('Part not found in inventory');
      if (part.availableQuantity < quantity) {
        throw new Error(`Stock Shortage: Requested ${quantity} units of ${part.name}, but only ${part.availableQuantity} available.`);
      }
      part.availableQuantity -= quantity;
      part.isLowStock = part.availableQuantity <= part.reorderLevel;
      return { part, quantityIssued: quantity };
    }
  },

  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const response = await apiClient.get<PurchaseOrder[]>('/warehouse/purchase-orders/');
      return response.data;
    } catch {
      return purchaseOrdersState;
    }
  },

  createPurchaseOrder: async (payload: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    try {
      const response = await apiClient.post<PurchaseOrder>('/warehouse/purchase-orders/', payload);
      return response.data;
    } catch {
      const newPO: PurchaseOrder = {
        id: `po_${Date.now()}`,
        poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        warehouseId: payload.warehouseId || 'wh_01',
        supplierName: payload.supplierName || 'Commercial Fleet Direct',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: payload.expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        items: payload.items || [],
        totalAmount: payload.totalAmount || 0,
        status: 'ordered',
      };
      purchaseOrdersState.unshift(newPO);
      return newPO;
    }
  },

  // Cross-Docking Workspace
  getCrossDockRecords: async (): Promise<CrossDockRecord[]> => {
    try {
      const response = await apiClient.get<CrossDockRecord[]>('/warehouse/cross-dock/');
      return response.data;
    } catch {
      return crossDockState;
    }
  },

  updateCrossDockStatus: async (
    id: string,
    sortingStatus?: CrossDockRecord['sortingStatus'],
    dispatchStatus?: CrossDockRecord['dispatchStatus'],
    consolidationGroupRef?: string
  ): Promise<CrossDockRecord> => {
    try {
      const response = await apiClient.patch<CrossDockRecord>(`/warehouse/cross-dock/${id}/`, {
        sortingStatus,
        dispatchStatus,
        consolidationGroupRef,
      });
      return response.data;
    } catch {
      const index = crossDockState.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('Cross dock record not found');
      const updated: CrossDockRecord = {
        ...crossDockState[index],
        sortingStatus: sortingStatus || crossDockState[index].sortingStatus,
        dispatchStatus: dispatchStatus || crossDockState[index].dispatchStatus,
        consolidationGroupRef: consolidationGroupRef || crossDockState[index].consolidationGroupRef,
      };
      crossDockState[index] = updated;
      return updated;
    }
  },

  // Multi-day Shipment Consolidation
  getConsolidationGroups: async (): Promise<ShipmentConsolidationGroup[]> => {
    try {
      const response = await apiClient.get<ShipmentConsolidationGroup[]>('/warehouse/consolidation/');
      return response.data;
    } catch {
      return consolidationState;
    }
  },

  createConsolidationGroup: async (
    payload: Partial<ShipmentConsolidationGroup>
  ): Promise<ShipmentConsolidationGroup> => {
    try {
      const response = await apiClient.post<ShipmentConsolidationGroup>('/warehouse/consolidation/', payload);
      return response.data;
    } catch {
      const newGroup: ShipmentConsolidationGroup = {
        id: `cgrp_${Date.now()}`,
        groupCode: `GRP-${Math.floor(100 + Math.random() * 900)}-CONSOL`,
        destinationHub: payload.destinationHub || 'Regional Distribution Hub',
        totalShipments: payload.shipmentIds?.length || 1,
        totalWeightKg: payload.totalWeightKg || 1200,
        status: 'open',
        shipmentIds: payload.shipmentIds || [],
        ...payload,
      };
      consolidationState = [newGroup, ...consolidationState];
      return newGroup;
    }
  },

  sealConsolidationGroup: async (
    id: string,
    sealNumber: string,
    vehicleReg?: string
  ): Promise<ShipmentConsolidationGroup> => {
    try {
      const response = await apiClient.post<ShipmentConsolidationGroup>(`/warehouse/consolidation/${id}/seal/`, {
        sealNumber,
        vehicleReg,
      });
      return response.data;
    } catch {
      const index = consolidationState.findIndex((g) => g.id === id);
      if (index === -1) throw new Error('Consolidation group not found');
      const updated: ShipmentConsolidationGroup = {
        ...consolidationState[index],
        status: 'sealed',
        masterSealNumber: sealNumber,
        assignedVehicleReg: vehicleReg || consolidationState[index].assignedVehicleReg,
      };
      consolidationState[index] = updated;
      return updated;
    }
  },
};

