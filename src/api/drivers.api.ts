import { apiClient, tenantStorage } from './client';
import { Driver } from '../types';

// Django Backend Driver Status Translators
export const mapDriverStatusToBackend = (status?: string): 'AVAILABLE' | 'ON_TRIP' | 'ON_LEAVE' | 'RESTING' | 'SUSPENDED' | 'INACTIVE' => {
  if (!status) return 'AVAILABLE';
  const s = status.toUpperCase().replace(/[\s_-]/g, '');
  if (s === 'AVAILABLE' || s === 'ONDUTY') return 'AVAILABLE';
  if (s === 'ONTRIP') return 'ON_TRIP';
  if (s === 'ONLEAVE' || s === 'LEAVE') return 'ON_LEAVE';
  if (s === 'RESTING' || s === 'OFFDUTY') return 'RESTING';
  if (s === 'SUSPENDED') return 'SUSPENDED';
  if (s === 'INACTIVE') return 'INACTIVE';
  return 'AVAILABLE';
};

export const mapDriverStatusToFrontend = (status?: string): Driver['status'] => {
  const s = (status || '').toUpperCase().replace(/[\s_-]/g, '');
  if (s === 'AVAILABLE') return 'available';
  if (s === 'ONTRIP') return 'on_trip';
  if (s === 'ONLEAVE') return 'leave';
  if (s === 'RESTING') return 'on_duty';
  if (s === 'SUSPENDED') return 'suspended';
  if (s === 'INACTIVE') return 'suspended';
  return 'available';
};

export const toBackendDriverPayload = (payload: Partial<Driver>): Record<string, any> => {
  const fName = payload.first_name || payload.firstName || '';
  const lName = payload.last_name || payload.lastName || '';
  const licNum = payload.license_number || payload.licenseNumber || '';
  const licExpiry = payload.license_expiry || payload.licenseExpiryDate || '2028-12-31';
  const licType = payload.license_type || payload.licenseType || 'Class A CDL';
  const statusBackend = mapDriverStatusToBackend(payload.status);

  return {
    first_name: fName,
    last_name: lName,
    license_number: licNum,
    license_expiry: licExpiry,
    license_type: licType,
    status: statusBackend,
    phone: payload.phone || '',
    email: payload.email || '',
    address: payload.address || '',
    experience_years: payload.experienceYears ?? 0,
    safety_score: payload.safetyScore ?? 95,
  };
};

export const toBackendDriverPatchPayload = (payload: Partial<Driver>): Record<string, any> => {
  const patch: Record<string, any> = {};
  const has = (...keys: string[]) => keys.some((key) => Object.prototype.hasOwnProperty.call(payload, key));

  if (has('first_name', 'firstName')) patch.first_name = payload.first_name ?? payload.firstName;
  if (has('last_name', 'lastName')) patch.last_name = payload.last_name ?? payload.lastName;
  if (has('license_number', 'licenseNumber')) patch.license_number = payload.license_number ?? payload.licenseNumber;
  if (has('license_expiry', 'licenseExpiryDate')) patch.license_expiry = payload.license_expiry ?? payload.licenseExpiryDate;
  if (has('license_type', 'licenseType')) patch.license_type = payload.license_type ?? payload.licenseType;
  if (has('phone')) patch.phone = payload.phone;
  if (has('email')) patch.email = payload.email;
  if (has('address')) patch.address = payload.address;
  if (has('experienceYears', 'experience_years')) patch.experience_years = payload.experienceYears ?? (payload as any).experience_years;
  if (has('safetyScore', 'safety_score')) patch.safety_score = payload.safetyScore ?? (payload as any).safety_score;
  if (has('status')) patch.status = mapDriverStatusToBackend(payload.status);

  // Fleet assignment callers use assignedVehicleId; the API serializer stores the FK as current_vehicle.
  // Preserve explicit undefined as null so an existing vehicle binding can be cleared.
  if (has('assignedVehicleId', 'current_vehicle')) {
    patch.current_vehicle = payload.assignedVehicleId ?? (payload as any).current_vehicle ?? null;
  }

  return patch;
};

const formatDriverValidationError = (error: any): Error => {
  const body = error?.response?.data || error?.errors || {};
  const structured = body?.error || {};
  const fields = structured?.fields || body?.fields || (body?.success === false ? {} : body);
  const details = Object.entries(fields).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages.map((message) => `${field}: ${typeof message === 'string' ? message : JSON.stringify(message)}`);
  });
  const message = structured?.message || body?.message || error?.message || 'Driver registration failed.';
  const formatted = new Error(details.length ? `${message} (${details.join(' | ')})` : message);
  (formatted as any).driverCreated = error?.driverCreated;
  return formatted;
};

type DriverDocumentReplacement = { id: string; file: File; name: string; type: string };

const uploadDriverAttachments = async (
  driverId: string,
  imageFile?: File,
  documentFiles: Array<{ file: File; name: string }> = [],
  replacements: DriverDocumentReplacement[] = [],
): Promise<void> => {
  if (imageFile) {
    const imageData = new FormData();
    imageData.append('image', imageFile);
    await apiClient.patch(`/drivers/${driverId}/`, imageData);
  }
  for (const document of documentFiles) {
    const documentData = new FormData();
    documentData.append('driver', driverId);
    documentData.append('document_type', document.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
    documentData.append('document_name', document.name);
    documentData.append('document_number', document.file.name);
    documentData.append('file', document.file);
    await apiClient.post('/drivers/documents/', documentData);
  }
  for (const replacement of replacements) {
    const documentData = new FormData();
    documentData.append('file', replacement.file);
    documentData.append('document_name', replacement.name);
    documentData.append('document_type', replacement.type);
    documentData.append('document_number', replacement.file.name);
    await apiClient.patch(`/drivers/documents/${replacement.id}/`, documentData);
  }
};

export const normalizeDriverResponse = (data: any): Driver => {
  if (!data) return data;
  const fName = data.first_name || data.firstName || '';
  const lName = data.last_name || data.lastName || '';
  const licNum = data.license_number || data.licenseNumber || '';
  const licExpiry = data.license_expiry || data.license_expiry_date || data.licenseExpiryDate || '';
  const licType = data.license_type || data.licenseType || 'Class A CDL';

  return {
    ...data,
    id: data.id || `drv_${Math.random().toString(36).substring(2, 7)}`,
    first_name: fName,
    last_name: lName,
    firstName: fName,
    lastName: lName,
    licenseNumber: licNum,
    license_number: licNum,
    licenseExpiryDate: licExpiry,
    license_expiry: licExpiry,
    licenseType: licType,
    license_type: licType,
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    assignedVehicleId: data.current_vehicle || data.assignedVehicleId,
    assignedVehicleReg: data.current_vehicle_reg || data.assignedVehicleReg,
    experienceYears: data.experience_years ?? data.experienceYears ?? 0,
    status: mapDriverStatusToFrontend(data.status),
    safetyScore: data.safety_score ?? data.safetyScore ?? 95,
    totalTrips: data.total_trips ?? data.totalTrips ?? 0,
    onTimeDeliveryRate: data.on_time_delivery_rate ?? data.onTimeDeliveryRate ?? 100,
    joinedDate: data.joined_date || data.joinedDate || new Date().toISOString().split('T')[0],
    incidentCount: data.incident_count ?? data.incidentCount ?? 0,
    documents: (data.documents || []).map((document: any) => ({
      ...document,
      documentName: document.document_name || document.documentName || document.document_type || document.type || 'Document',
      type: document.document_type || document.type,
      documentNumber: document.document_number || document.documentNumber || '',
      fileUrl: document.file_url || document.file || document.file_path || '',
      issueDate: document.issue_date || document.issueDate || '',
      expiryDate: document.expiry_date || document.expiryDate || '',
    })),
    avatar: data.avatar || data.image || undefined,
  };
};

export const driversApi = {
  getDrivers: async (params?: { search?: string; status?: string }): Promise<Driver[]> => {
    // Only pass status to backend if it is an actual choice, never pass 'all'
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.status && params.status !== 'all') {
      queryParams.status = mapDriverStatusToBackend(params.status);
    }

    const activeTenantId = tenantStorage.getActiveTenantId();
    if (activeTenantId && activeTenantId.length > 20) {
      queryParams.tenant = activeTenantId;
      queryParams.tenant_id = activeTenantId;
    }

    const response = await apiClient.get<any>('/drivers/', { params: queryParams });
    let rawList: any[] = Array.isArray(response.data)
      ? response.data
      : (response.data?.results || response.data?.data || []);

    if (activeTenantId) {
      rawList = rawList.filter((item: any) => {
        const itemTenant = item.tenant_id || item.tenant_uuid || (typeof item.tenant === 'string' ? item.tenant : item.tenant?.id);
        return !itemTenant || itemTenant === activeTenantId;
      });
    }

    return rawList.map(normalizeDriverResponse);
  },

  getDriverById: async (id: string): Promise<Driver> => {
    const response = await apiClient.get<any>(`/drivers/${id}/`);
    return normalizeDriverResponse(response.data);
  },

  createDriver: async (payload: Partial<Driver> & { imageFile?: File; documentFiles?: Array<{ file: File; name: string }> }): Promise<Driver> => {
    const backendData = toBackendDriverPayload(payload);
    try {
      const response = await apiClient.post<any>('/drivers/', backendData);
      const createdDriver = normalizeDriverResponse(response.data);
      try {
        await uploadDriverAttachments(createdDriver.id, payload.imageFile, payload.documentFiles);
      } catch (attachmentError) {
        (attachmentError as any).driverCreated = createdDriver;
        throw attachmentError;
      }
      return payload.imageFile || payload.documentFiles?.length
        ? normalizeDriverResponse((await apiClient.get(`/drivers/${createdDriver.id}/`)).data)
        : createdDriver;
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        throw formatDriverValidationError(err);
      }
      throw err;
    }
  },

  updateDriver: async (id: string, payload: Partial<Driver> & { imageFile?: File; documentFiles?: Array<{ file: File; name: string }> }): Promise<Driver> => {
    const backendData = toBackendDriverPatchPayload(payload);
    try {
      const response = await apiClient.patch<any>(`/drivers/${id}/`, backendData);
      await uploadDriverAttachments(id, payload.imageFile, payload.documentFiles);
      if (payload.imageFile || payload.documentFiles?.length) {
        return normalizeDriverResponse((await apiClient.get(`/drivers/${id}/`)).data);
      }
      return normalizeDriverResponse(response.data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        throw formatDriverValidationError(err);
      }
      throw err;
    }
  },

  updateDriverAttachments: async (
    id: string,
    imageFile?: File,
    documentFiles: Array<{ file: File; name: string }> = [],
    replacements: DriverDocumentReplacement[] = [],
  ): Promise<Driver> => {
    try {
      await uploadDriverAttachments(id, imageFile, documentFiles, replacements);
      return normalizeDriverResponse((await apiClient.get<any>(`/drivers/${id}/`)).data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        throw formatDriverValidationError(err);
      }
      throw err;
    }
  },

  deleteDriver: async (id: string): Promise<void> => {
    await apiClient.delete(`/drivers/${id}/`);
  },
};
