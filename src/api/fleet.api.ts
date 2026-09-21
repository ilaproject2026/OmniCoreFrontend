import { apiClient } from './client';
import { Vehicle, VehicleStatus, VehicleDocument } from '../types';

// Django Backend TextChoices Enums & Translators
export const mapStatusToBackend = (status?: string): 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE' => {
  if (!status) return 'AVAILABLE';
  const s = status.toUpperCase();
  if (s === 'AVAILABLE') return 'AVAILABLE';
  if (s === 'ON_TRIP') return 'ON_TRIP';
  if (s === 'MAINTENANCE' || s === 'BREAKDOWN' || s === 'ACCIDENT') return 'MAINTENANCE';
  if (s === 'INACTIVE' || s === 'GROUNDED' || s === 'SOLD' || s === 'RETIRED' || s === 'RESERVED') return 'INACTIVE';
  return 'AVAILABLE';
};

export const mapAvailabilityToBackend = (
  status?: string,
  availability?: string
): 'AVAILABLE' | 'ASSIGNED' | 'UNDER_INSPECTION' | 'OUT_OF_SERVICE' => {
  if (availability) {
    const a = availability.toUpperCase();
    if (a === 'AVAILABLE' || a === 'ASSIGNED' || a === 'UNDER_INSPECTION' || a === 'OUT_OF_SERVICE') {
      return a;
    }
  }
  const s = (status || '').toUpperCase();
  if (s === 'ON_TRIP') return 'ASSIGNED';
  if (s === 'MAINTENANCE' || s === 'BREAKDOWN' || s === 'ACCIDENT') return 'UNDER_INSPECTION';
  if (s === 'GROUNDED' || s === 'INACTIVE' || s === 'SOLD' || s === 'RETIRED') return 'OUT_OF_SERVICE';
  return 'AVAILABLE';
};

export const mapOwnershipToBackend = (ownership?: string): 'OWNED' | 'LEASED' | 'RENTED' | 'ATTACHED' => {
  if (!ownership) return 'OWNED';
  const o = ownership.toUpperCase();
  if (o === 'OWNED') return 'OWNED';
  if (o === 'LEASED' || o === 'FINANCED') return 'LEASED';
  if (o === 'RENTED') return 'RENTED';
  if (o === 'ATTACHED') return 'ATTACHED';
  return 'OWNED';
};

export const mapStatusToFrontend = (backendStatus?: string, backendAvailability?: string): VehicleStatus => {
  const s = (backendStatus || '').toUpperCase();
  if (s === 'AVAILABLE') return 'available';
  if (s === 'ON_TRIP') return 'on_trip';
  if (s === 'MAINTENANCE') return 'maintenance';
  if (s === 'INACTIVE') return 'inactive';

  const a = (backendAvailability || '').toUpperCase();
  if (a === 'AVAILABLE') return 'available';
  if (a === 'ASSIGNED') return 'on_trip';
  if (a === 'UNDER_INSPECTION') return 'maintenance';
  if (a === 'OUT_OF_SERVICE') return 'grounded';

  return 'available';
};

export const mapOwnershipToFrontend = (backendOwnership?: string): 'owned' | 'financed' | 'leased' => {
  const o = (backendOwnership || '').toUpperCase();
  if (o === 'OWNED') return 'owned';
  if (o === 'LEASED') return 'leased';
  if (o === 'RENTED' || o === 'ATTACHED') return 'leased';
  return 'owned';
};

export const mapDocumentTypeToFrontend = (type?: string): VehicleDocument['type'] => {
  const t = (type || '').toUpperCase();
  if (t === 'REGISTRATION') return 'registration';
  if (t === 'INSURANCE') return 'insurance';
  if (t === 'FITNESS') return 'fitness_cert';
  if (t === 'ROAD_TAX') return 'road_tax';
  if (t === 'PERMIT') return 'permit';
  if (t === 'POLLUTION') return 'pollution_cert';
  return 'insurance';
};

export const toBackendVehiclePayload = (payload: Partial<Vehicle>): Record<string, any> => {
  const regNumber = payload.registrationNumber || (payload as any).registration_number || '';
  const vinVal = payload.vin || (payload as any).vin_number || (payload as any).vin || '';
  const odoVal = payload.odometerKm !== undefined ? payload.odometerKm : ((payload as any).odometer ?? 0);
  const capVal = payload.capacityKg !== undefined ? payload.capacityKg : ((payload as any).payload_capacity_kg ?? 24000);
  const fuelVal = payload.fuelType || (payload as any).fuel_type || 'diesel';

  const statusBackend = mapStatusToBackend(payload.status || (payload as any).status);
  const availBackend = mapAvailabilityToBackend(payload.status, (payload as any).availability);
  const ownerBackend = mapOwnershipToBackend(payload.financingStatus || (payload as any).ownership);

  return {
    ...payload,
    // DRF Serializer snake_case compatibility fields using backend TextChoices
    registration_number: regNumber,
    vin_number: vinVal,
    vin: vinVal,
    odometer: odoVal,
    odometer_km: odoVal,
    payload_capacity_kg: capVal,
    capacity_kg: capVal,
    fuel_type: fuelVal,
    status: statusBackend,
    availability: availBackend,
    ownership: ownerBackend,
    financing_status: ownerBackend.toLowerCase(),

    // Frontend camelCase compatibility fields
    registrationNumber: regNumber,
    odometerKm: odoVal,
    capacityKg: capVal,
    fuelType: fuelVal,
    financingStatus: mapOwnershipToFrontend(ownerBackend),
  };
};

export const normalizeVehicleResponse = (data: any): Vehicle => {
  if (!data) return data;
  return {
    ...data,
    id: data.id || `veh_${Math.random().toString(36).substring(2, 7)}`,
    registrationNumber: data.registration_number || data.registrationNumber || '',
    vin: data.vin || data.vin_number || data.vinNumber || '',
    odometerKm: Number(data.odometer_km ?? data.odometer ?? data.odometerKm ?? 0),
    capacityKg: Number(data.capacity_kg ?? data.payload_capacity_kg ?? data.capacityKg ?? 0),
    fuelType: (data.fuel_type || data.fuelType || 'diesel').toLowerCase() as any,
    financingStatus: mapOwnershipToFrontend(data.ownership || data.financing_status || data.financingStatus),
    branchId: data.branch_id || data.branchId || (typeof data.branch === 'string' ? data.branch : data.branch?.id),
    branchName: data.branch_name || data.branchName || data.branch?.name,
    assignedDriverId: data.assigned_driver_id || data.assignedDriverId || (typeof data.assigned_driver === 'string' ? data.assigned_driver : data.assigned_driver?.id),
    assignedDriverName: data.assigned_driver_name || data.assignedDriverName || (data.assigned_driver ? `${data.assigned_driver.first_name || ''} ${data.assigned_driver.last_name || ''}`.trim() : undefined),
    status: mapStatusToFrontend(data.status, data.availability),
    documents: Array.isArray(data.documents)
      ? data.documents.map((doc: any) => ({
          ...doc,
          id: doc.id || `doc_${Math.random().toString(36).substring(2, 7)}`,
          type: mapDocumentTypeToFrontend(doc.type || doc.document_type),
          documentNumber: doc.document_number || doc.documentNumber || '',
          issueDate: doc.issue_date || doc.issueDate || '',
          expiryDate: doc.expiry_date || doc.expiryDate || '',
          isExpired: doc.status === 'EXPIRED' || (doc.expiry_date ? new Date(doc.expiry_date) < new Date() : false),
          isExpiringSoon: doc.status === 'EXPIRING_SOON' || doc.status === 'PENDING_RENEWAL',
          verificationStatus: doc.verification_status || 'verified',
        }))
      : [],
    totalTripsCount: data.total_trips_count ?? data.totalTripsCount ?? 0,
  };
};

export const fleetApi = {
  getVehicles: async (params?: { search?: string; status?: string; vertical?: string; branchId?: string }): Promise<Vehicle[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status && params.status !== 'all') {
      queryParams.status = mapStatusToBackend(params.status);
    }
    if (params?.vertical && params.vertical !== 'all') {
      queryParams.vertical = params.vertical;
    }
    if (params?.branchId && params.branchId !== 'all') {
      queryParams.branch = params.branchId;
      queryParams.branch_id = params.branchId;
    }

    const response = await apiClient.get<any>('/fleet/vehicles/', { params: queryParams });
    const rawList = Array.isArray(response.data)
      ? response.data
      : (response.data?.results || response.data?.data || []);
    return rawList.map(normalizeVehicleResponse);
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<any>(`/fleet/vehicles/${id}/`);
    return normalizeVehicleResponse(response.data);
  },

  createVehicle: async (payload: Partial<Vehicle>): Promise<Vehicle> => {
    const backendData = toBackendVehiclePayload(payload);
    try {
      const response = await apiClient.post<any>('/fleet/vehicles/', backendData);
      return normalizeVehicleResponse(response.data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        const backendMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Validation failed for one or more fields.';
        const fieldErrors = err?.response?.data?.error?.fields || err?.response?.data?.fields || err?.errors;
        const firstFieldMsg = fieldErrors ? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : '';
        const errorToThrow = new Error(firstFieldMsg ? `${backendMessage} (${firstFieldMsg})` : backendMessage);
        (errorToThrow as any).fields = fieldErrors;
        throw errorToThrow;
      }
      throw err;
    }
  },

  updateVehicle: async (id: string, payload: Partial<Vehicle>): Promise<Vehicle> => {
    const backendData = toBackendVehiclePayload(payload);
    try {
      const response = await apiClient.patch<any>(`/fleet/vehicles/${id}/`, backendData);
      return normalizeVehicleResponse(response.data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        const backendMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Validation failed for one or more fields.';
        const fieldErrors = err?.response?.data?.error?.fields || err?.response?.data?.fields || err?.errors;
        const firstFieldMsg = fieldErrors ? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : '';
        const errorToThrow = new Error(firstFieldMsg ? `${backendMessage} (${firstFieldMsg})` : backendMessage);
        (errorToThrow as any).fields = fieldErrors;
        throw errorToThrow;
      }
      throw err;
    }
  },
};
