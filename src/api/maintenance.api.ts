import { apiClient } from './client';
import { MaintenanceRecord } from '../types';
import { MOCK_MAINTENANCE, MOCK_VEHICLES, MOCK_SPARE_PARTS } from './mockData';

export const maintenanceApi = {
  getRecords: async (): Promise<MaintenanceRecord[]> => {
    try {
      const response = await apiClient.get<any>('/maintenance/');
      const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
      return raw;
    } catch {
      return MOCK_MAINTENANCE;
    }
  },

  createRecord: async (payload: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    try {
      const response = await apiClient.post<MaintenanceRecord>('/maintenance/', payload);
      return response.data;
    } catch {
      const targetVehId = payload.vehicleId || 'veh_01';
      const veh = MOCK_VEHICLES.find((v) => v.id === targetVehId || v.registrationNumber === payload.vehicleReg);

      // Reactive Business Logic: Ground the vehicle when work order is created
      if (veh) {
        veh.status = 'maintenance';
      }

      // Deduct consumed parts from warehouse inventory
      if (payload.partsConsumed && payload.partsConsumed.length > 0) {
        payload.partsConsumed.forEach((p) => {
          const part = MOCK_SPARE_PARTS.find((sp) => sp.id === p.partId || sp.sku === p.partNumber || sp.name === p.partName);
          if (part) {
            part.availableQuantity = Math.max(0, part.availableQuantity - (p.quantity || 1));
            part.isLowStock = part.availableQuantity <= part.reorderLevel;
          }
        });
      }

      const laborCost = payload.laborCost ?? 150;
      const partsTotal = (payload.partsConsumed || []).reduce((acc, p) => acc + (p.quantity * p.unitCost), 0);
      const totalCost = payload.totalCost || (laborCost + partsTotal);

      const newM: MaintenanceRecord = {
        id: 'maint_' + Math.random().toString(36).substring(2, 7),
        recordCode: 'WO-2026-' + Math.floor(500 + Math.random() * 500),
        vehicleId: targetVehId,
        vehicleReg: payload.vehicleReg || veh?.registrationNumber || 'IL-9428-TX',
        type: payload.type || 'preventive',
        status: payload.status || 'scheduled',
        reportedDate: new Date().toISOString().split('T')[0],
        odometerAtService: payload.odometerAtService || veh?.odometerKm || 85000,
        workshopName: payload.workshopName || 'Apex Central Heavy Depot & Workshop',
        technicianName: payload.technicianName || 'Marcus Sterling (Certified Specialist)',
        issueDescription: payload.issueDescription || 'Scheduled preventative service inspection',
        actionTaken: payload.actionTaken || 'Diagnostic scan completed and bay assigned',
        partsConsumed: payload.partsConsumed || [],
        laborCost,
        totalCost,
      };

      MOCK_MAINTENANCE.unshift(newM);
      return newM;
    }
  },

  updateRecord: async (id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    try {
      const response = await apiClient.patch<MaintenanceRecord>(`/maintenance/${id}/`, updates);
      return response.data;
    } catch {
      const idx = MOCK_MAINTENANCE.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const currentRecord = MOCK_MAINTENANCE[idx];
        MOCK_MAINTENANCE[idx] = { ...currentRecord, ...updates };

        // Reactive Business Logic: If status transitioned to completed, return vehicle to service
        if (updates.status === 'completed') {
          const veh = MOCK_VEHICLES.find((v) => v.id === currentRecord.vehicleId);
          if (veh) {
            // Check if vehicle has any other active work orders
            const otherActive = MOCK_MAINTENANCE.find((m) => m.id !== id && m.vehicleId === veh.id && (m.status === 'in_progress' || m.status === 'scheduled'));
            if (!otherActive) {
              veh.status = 'available';
            }
            veh.lastServiceDate = new Date().toISOString().split('T')[0];
            if (currentRecord.odometerAtService) {
              veh.nextServiceKm = currentRecord.odometerAtService + 15000;
            }
          }
        }

        return MOCK_MAINTENANCE[idx];
      }
      throw new Error('Record not found');
    }
  },
};
