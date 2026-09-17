import { apiClient } from './client';
import { FuelLogEntry } from '../types';
import { MOCK_FUEL_LOGS, MOCK_VEHICLES } from './mockData';

let fuelLogsState: FuelLogEntry[] = [...MOCK_FUEL_LOGS];

export const fuelApi = {
  getFuelLogs: async (params?: { vehicleId?: string; search?: string; abnormalOnly?: boolean }): Promise<FuelLogEntry[]> => {
    try {
      const response = await apiClient.get<FuelLogEntry[]>('/fleet/fuel-logs/', { params });
      return response.data;
    } catch {
      let list = [...fuelLogsState];
      if (params?.vehicleId && params.vehicleId !== 'all') {
        list = list.filter((f) => f.vehicleId === params.vehicleId);
      }
      if (params?.abnormalOnly) {
        list = list.filter((f) => f.isAbnormal);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (f) =>
            f.vehicleReg.toLowerCase().includes(q) ||
            (f.driverName?.toLowerCase() || '').includes(q) ||
            f.fuelStation.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  logFuelEntry: async (payload: Partial<FuelLogEntry>): Promise<FuelLogEntry> => {
    try {
      const response = await apiClient.post<FuelLogEntry>('/fleet/fuel-logs/', payload);
      return response.data;
    } catch {
      const veh = MOCK_VEHICLES.find((v) => v.id === payload.vehicleId || v.registrationNumber === payload.vehicleReg);
      const prevOdo = payload.previousOdometerKm || veh?.odometerKm || 0;
      const currentOdo = payload.odometerKm || prevOdo + 450;
      const liters = payload.liters || 150;
      const kmDelta = Math.max(0, currentOdo - prevOdo);
      const kmPerLiter = liters > 0 ? Number((kmDelta / liters).toFixed(2)) : 0;

      // Detect abnormal fuel usage (e.g. < 2.0 km/L on heavy truck or < 6 km/L on van)
      const isAbnormal = kmPerLiter > 0 && kmPerLiter < 2.0;

      const newEntry: FuelLogEntry = {
        id: `fuel_${Date.now()}`,
        vehicleId: payload.vehicleId || veh?.id || 'veh_01',
        vehicleReg: payload.vehicleReg || veh?.registrationNumber || 'IL-9428-TX',
        driverId: payload.driverId || veh?.assignedDriverId || 'drv_01',
        driverName: payload.driverName || veh?.assignedDriverName || 'Assigned Driver',
        tripId: payload.tripId,
        fuelStation: payload.fuelStation || 'Regional Fuel Depot',
        liters,
        pricePerLiter: payload.pricePerLiter || 1.15,
        totalCost: payload.totalCost || Number((liters * (payload.pricePerLiter || 1.15)).toFixed(2)),
        odometerKm: currentOdo,
        previousOdometerKm: prevOdo,
        calculatedKmPerLiter: kmPerLiter,
        isAbnormal,
        abnormalReason: isAbnormal ? `Unusually low mileage (${kmPerLiter} km/L) compared to standard baseline. Investigation advised.` : undefined,
        paymentMethod: payload.paymentMethod || 'fuel_card',
        receiptUrl: payload.receiptUrl,
        loggedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      fuelLogsState.unshift(newEntry);

      // Update vehicle odometer
      if (veh && currentOdo > veh.odometerKm) {
        veh.odometerKm = currentOdo;
      }

      return newEntry;
    }
  },
};
