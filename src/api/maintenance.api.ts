import { apiClient, tenantStorage } from './client';
import { MaintenanceRecord } from '../types';

type BackendServiceType = 'PREVENTIVE' | 'OIL_CHANGE' | 'TIRE_ROTATION' | 'BRAKE_OVERHAUL' | 'ENGINE_REPAIR' | 'BODYWORK' | 'OTHER';

const toBackendServiceType = (type?: string): BackendServiceType => {
  switch ((type || '').toLowerCase()) {
    case 'preventive': return 'PREVENTIVE';
    case 'breakdown': return 'ENGINE_REPAIR';
    case 'accident_repair': return 'BODYWORK';
    case 'statutory_inspection': return 'OTHER';
    default: {
      const value = (type || '').toUpperCase();
      return (['PREVENTIVE', 'OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_OVERHAUL', 'ENGINE_REPAIR', 'BODYWORK', 'OTHER'] as string[])
        .includes(value) ? value as BackendServiceType : 'OTHER';
    }
  }
};

const fromBackendServiceType = (type?: string): MaintenanceRecord['type'] => {
  switch ((type || '').toUpperCase()) {
    case 'ENGINE_REPAIR': return 'breakdown';
    case 'BODYWORK': return 'accident_repair';
    case 'OTHER': return 'statutory_inspection';
    default: return 'preventive';
  }
};

const fromBackendRecord = (raw: any): MaintenanceRecord => ({
  ...raw,
  id: raw.id,
  recordCode: raw.record_code || `MR-${String(raw.id || '').slice(0, 8)}`,
  vehicleId: raw.vehicle_id || raw.vehicle,
  vehicleReg: raw.vehicle_reg || '',
  type: raw.type || fromBackendServiceType(raw.service_type),
  // The backend's MaintenanceRecord model is a service history and does not
  // currently persist a work-order status.
  status: raw.status || 'completed',
  reportedDate: raw.reported_date || raw.performed_date || raw.created_at,
  completedDate: raw.completed_date || raw.performed_date,
  odometerAtService: Number(raw.odometer_at_service ?? raw.odometer_reading ?? 0),
  workshopName: raw.workshop_name || raw.service_center || '',
  technicianName: raw.technician_name || '',
  issueDescription: raw.issue_description || raw.notes || '',
  actionTaken: raw.action_taken || raw.notes || '',
  partsConsumed: raw.parts_consumed || [],
  laborCost: Number(raw.labor_cost ?? 0),
  totalCost: Number(raw.total_cost ?? raw.cost ?? 0),
});

const toBackendRecord = (payload: Partial<MaintenanceRecord>): Record<string, unknown> => {
  if (!payload.vehicleId) {
    throw new Error('Select a fleet vehicle before creating a maintenance record.');
  }

  return {
    vehicle: payload.vehicleId,
    service_type: toBackendServiceType(payload.type),
    odometer_reading: payload.odometerAtService ?? 0,
    performed_date: payload.completedDate || payload.reportedDate || new Date().toISOString().slice(0, 10),
    service_center: payload.workshopName || '',
    cost: payload.totalCost ?? payload.laborCost ?? 0,
    notes: [payload.issueDescription, payload.actionTaken].filter(Boolean).join('\n\n'),
  };
};

export const maintenanceApi = {
  getRecords: async (params?: { vehicleId?: string; status?: string }): Promise<MaintenanceRecord[]> => {
    const activeTenantId = tenantStorage.getActiveTenantId();
    const queryParams: Record<string, string> = {};
    if (params?.vehicleId && params.vehicleId !== 'all') queryParams.vehicle = params.vehicleId;
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (activeTenantId && activeTenantId.length > 20) {
      queryParams.tenant = activeTenantId;
      queryParams.tenant_id = activeTenantId;
    }

    let response;
    try {
      response = await apiClient.get<any>('/maintenance/records/', { params: queryParams });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        response = await apiClient.get<any>('/maintenance/', { params: queryParams });
      } else {
        throw err;
      }
    }

    let raw: any[] = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);

    if (activeTenantId) {
      raw = raw.filter((item: any) => {
        const itemTenant = item.tenant_id || item.tenant_uuid || (typeof item.tenant === 'string' ? item.tenant : item.tenant?.id);
        return !itemTenant || itemTenant === activeTenantId;
      });
    }

    return raw.map(fromBackendRecord);
  },

  createRecord: async (payload: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    const backendPayload = toBackendRecord(payload);
    try {
      const response = await apiClient.post<any>('/maintenance/records/', backendPayload);
      return fromBackendRecord(response.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const response = await apiClient.post<any>('/maintenance/', backendPayload);
        return fromBackendRecord(response.data);
      }
      throw err;
    }
  },

  updateRecord: async (id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    const backendUpdates: Record<string, unknown> = {};
    if (updates.vehicleId !== undefined) backendUpdates.vehicle = updates.vehicleId;
    if (updates.type !== undefined) backendUpdates.service_type = toBackendServiceType(updates.type);
    if (updates.odometerAtService !== undefined) backendUpdates.odometer_reading = updates.odometerAtService;
    if (updates.completedDate !== undefined) backendUpdates.performed_date = updates.completedDate;
    if (updates.workshopName !== undefined) backendUpdates.service_center = updates.workshopName;
    if (updates.totalCost !== undefined) backendUpdates.cost = updates.totalCost;
    if (updates.issueDescription !== undefined || updates.actionTaken !== undefined) {
      backendUpdates.notes = [updates.issueDescription, updates.actionTaken].filter(Boolean).join('\n\n');
    }
    try {
      const response = await apiClient.patch<any>(`/maintenance/records/${id}/`, backendUpdates);
      return fromBackendRecord(response.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const response = await apiClient.patch<any>(`/maintenance/${id}/`, backendUpdates);
        return fromBackendRecord(response.data);
      }
      throw err;
    }
  },
};
