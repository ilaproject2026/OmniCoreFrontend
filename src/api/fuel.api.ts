import { apiClient } from './client';
import { FuelLogEntry } from '../types';

export const fuelApi = {
  getFuelLogs: async (params?: { vehicleId?: string; search?: string; abnormalOnly?: boolean }): Promise<FuelLogEntry[]> => {
    const response = await apiClient.get<any>('/finance/fuel/', {
      params: params?.vehicleId ? { vehicle: params.vehicleId } : undefined,
    });
    const rows = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    return rows.map((row: any) => ({
      ...row,
      vehicleId: row.vehicle,
      vehicleReg: row.vehicle_reg || '',
      driverId: row.driver || undefined,
      driverName: row.driver_name || undefined,
      liters: Number(row.fuel_liters || 0),
      pricePerLiter: Number(row.rate_per_liter || 0),
      costPerLiter: Number(row.rate_per_liter || 0),
      totalCost: Number(row.total_cost || 0),
      odometerKm: Number(row.odometer_reading || 0),
      fuelStation: row.fuel_station || '',
      loggedAt: row.transaction_date,
      date: row.transaction_date,
      paymentMethod: 'fuel_card',
    }));
  },

  logFuelEntry: async (payload: Partial<FuelLogEntry>): Promise<FuelLogEntry> => {
    const liters = Number(payload.liters || 0);
    const rate = Number(payload.costPerLiter || payload.pricePerLiter || 0);
    const response = await apiClient.post<any>('/finance/fuel/', {
      vehicle: payload.vehicleId,
      driver: payload.driverId || null,
      transaction_date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
      fuel_station: payload.fuelStation || '',
      fuel_liters: liters,
      rate_per_liter: rate,
      total_cost: liters * rate,
      odometer_reading: payload.odometerKm,
    });
    const row = response.data;
    return {
      ...payload,
      id: row.id,
      vehicleId: row.vehicle,
      vehicleReg: row.vehicle_reg || payload.vehicleReg || '',
      driverId: row.driver || payload.driverId,
      driverName: row.driver_name || payload.driverName,
      liters: Number(row.fuel_liters || liters),
      pricePerLiter: Number(row.rate_per_liter || rate),
      costPerLiter: Number(row.rate_per_liter || rate),
      totalCost: Number(row.total_cost || liters * rate),
      odometerKm: Number(row.odometer_reading || payload.odometerKm || 0),
      fuelStation: row.fuel_station || payload.fuelStation || '',
      loggedAt: row.transaction_date || new Date().toISOString(),
      paymentMethod: payload.paymentMethod || 'fuel_card',
    } as FuelLogEntry;
  },
};
