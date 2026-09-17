import { apiClient } from './client';
import { Driver } from '../types';
import { MOCK_DRIVERS } from './mockData';

// Django Backend Driver Status Translators
export const mapDriverStatusToBackend = (status?: string): 'AVAILABLE' | 'ONTRIP' | 'ONLEAVE' | 'RESTING' | 'SUSPENDED' | 'INACTIVE' => {
  if (!status) return 'AVAILABLE';
  const s = status.toUpperCase().replace(/[\s_-]/g, '');
  if (s === 'AVAILABLE' || s === 'ONDUTY') return 'AVAILABLE';
  if (s === 'ONTRIP') return 'ONTRIP';
  if (s === 'ONLEAVE' || s === 'LEAVE') return 'ONLEAVE';
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
    ...payload,
    // DRF Serializer snake_case compatibility fields
    first_name: fName,
    last_name: lName,
    license_number: licNum,
    license_expiry: licExpiry,
    license_expiry_date: licExpiry,
    license_type: licType,
    status: statusBackend,
    phone: payload.phone || '',
    email: payload.email || '',
    address: payload.address || '',
    experience_years: payload.experienceYears ?? (payload as any).experience_years ?? 0,

    // Frontend camelCase compatibility fields
    firstName: fName,
    lastName: lName,
    licenseNumber: licNum,
    licenseExpiryDate: licExpiry,
    licenseType: licType,
  };
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
    experienceYears: data.experience_years ?? data.experienceYears ?? 0,
    status: mapDriverStatusToFrontend(data.status),
    safetyScore: data.safety_score ?? data.safetyScore ?? 95,
    totalTrips: data.total_trips ?? data.totalTrips ?? 0,
    onTimeDeliveryRate: data.on_time_delivery_rate ?? data.onTimeDeliveryRate ?? 100,
    joinedDate: data.joined_date || data.joinedDate || new Date().toISOString().split('T')[0],
    incidentCount: data.incident_count ?? data.incidentCount ?? 0,
    documents: data.documents || [],
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

    try {
      const response = await apiClient.get<any>('/drivers/', { params: queryParams });
      const rawList = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || response.data?.data || []);
      return rawList.map(normalizeDriverResponse);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400) {
        throw err;
      }
      let list = [...MOCK_DRIVERS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            (d.firstName && d.firstName.toLowerCase().includes(q)) ||
            (d.first_name && d.first_name.toLowerCase().includes(q)) ||
            (d.lastName && d.lastName.toLowerCase().includes(q)) ||
            (d.last_name && d.last_name.toLowerCase().includes(q)) ||
            (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q)) ||
            (d.phone && d.phone.includes(q))
        );
      }
      if (params?.status && params.status !== 'all') {
        list = list.filter((d) => d.status === params.status);
      }
      return list;
    }
  },

  getDriverById: async (id: string): Promise<Driver> => {
    try {
      const response = await apiClient.get<any>(`/drivers/${id}/`);
      return normalizeDriverResponse(response.data);
    } catch {
      const d = MOCK_DRIVERS.find((item) => item.id === id);
      if (!d) throw new Error('Driver not found');
      return d;
    }
  },

  createDriver: async (payload: Partial<Driver>): Promise<Driver> => {
    const backendData = toBackendDriverPayload(payload);
    try {
      const response = await apiClient.post<any>('/drivers/', backendData);
      return normalizeDriverResponse(response.data);
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

      const newD: Driver = {
        id: 'drv_' + Math.random().toString(36).substring(2, 7),
        tenantId: 'tenant_apex',
        firstName: payload.firstName || payload.first_name || 'John',
        lastName: payload.lastName || payload.last_name || 'Doe',
        first_name: payload.first_name || payload.firstName || 'John',
        last_name: payload.last_name || payload.lastName || 'Doe',
        email: payload.email || 'driver@apexlogistics.com',
        phone: payload.phone || '+1 (555) 123-4567',
        address: payload.address || '',
        experienceYears: payload.experienceYears || 0,
        avatar: payload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        licenseNumber: payload.licenseNumber || payload.license_number || 'CDL-IL-' + Math.floor(10000000 + Math.random() * 90000000),
        licenseType: payload.licenseType || payload.license_type || 'Class A CDL',
        licenseExpiryDate: payload.licenseExpiryDate || payload.license_expiry || '2028-12-31',
        status: payload.status || 'available',
        safetyScore: payload.safetyScore || 98,
        totalTrips: 0,
        onTimeDeliveryRate: 100,
        joinedDate: new Date().toISOString().split('T')[0],
        incidentCount: 0,
        documents: [],
        payroll: {
          baseSalary: 5500,
          perTripAllowance: 300,
          overtimeRate: 40,
          bonuses: 0,
          deductions: 300,
          bankAccountNumber: '•••• 1234',
          bankName: 'Fleet Payroll Bank',
          taxId: 'SSN •••-••-0000',
          lastPayoutDate: new Date().toISOString().split('T')[0],
        },
      };
      MOCK_DRIVERS.unshift(newD);
      return newD;
    }
  },

  updateDriver: async (id: string, payload: Partial<Driver>): Promise<Driver> => {
    const backendData = toBackendDriverPayload(payload);
    try {
      const response = await apiClient.patch<any>(`/drivers/${id}/`, backendData);
      return normalizeDriverResponse(response.data);
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

      const index = MOCK_DRIVERS.findIndex((d) => d.id === id);
      if (index === -1) throw new Error('Driver not found');

      // Enforce unique vehicle binding: if a driver is bound to a vehicle, unbind any other driver from it
      if (payload.assignedVehicleId) {
        MOCK_DRIVERS.forEach((d) => {
          if (d.id !== id && d.assignedVehicleId === payload.assignedVehicleId) {
            d.assignedVehicleId = undefined;
            d.assignedVehicleReg = undefined;
          }
        });
      }

      MOCK_DRIVERS[index] = { ...MOCK_DRIVERS[index], ...payload };
      return MOCK_DRIVERS[index];
    }
  },
};
