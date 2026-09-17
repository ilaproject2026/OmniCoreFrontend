import { apiClient } from './client';
import { Driver } from '../types';
import { MOCK_DRIVERS } from './mockData';

export const driversApi = {
  getDrivers: async (params?: { search?: string; status?: string }): Promise<Driver[]> => {
    try {
      const response = await apiClient.get<Driver[]>('/drivers/', { params });
      return response.data;
    } catch {
      let list = [...MOCK_DRIVERS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.firstName.toLowerCase().includes(q) ||
            d.lastName.toLowerCase().includes(q) ||
            d.licenseNumber.toLowerCase().includes(q) ||
            d.phone.includes(q)
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
      const response = await apiClient.get<Driver>(`/drivers/${id}/`);
      return response.data;
    } catch {
      const d = MOCK_DRIVERS.find((item) => item.id === id);
      if (!d) throw new Error('Driver not found');
      return d;
    }
  },

  createDriver: async (payload: Partial<Driver>): Promise<Driver> => {
    try {
      const response = await apiClient.post<Driver>('/drivers/', payload);
      return response.data;
    } catch {
      const newD: Driver = {
        id: 'drv_' + Math.random().toString(36).substring(2, 7),
        tenantId: 'tenant_apex',
        firstName: payload.firstName || 'John',
        lastName: payload.lastName || 'Doe',
        email: payload.email || 'driver@apexlogistics.com',
        phone: payload.phone || '+1 (555) 123-4567',
        address: payload.address || '',
        experienceYears: payload.experienceYears || 0,
        avatar: payload.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        licenseNumber: payload.licenseNumber || 'CDL-IL-' + Math.floor(10000000 + Math.random() * 90000000),
        licenseType: payload.licenseType || 'Class A CDL',
        licenseExpiryDate: payload.licenseExpiryDate || '2028-12-31',
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
    try {
      const response = await apiClient.patch<Driver>(`/drivers/${id}/`, payload);
      return response.data;
    } catch {
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
