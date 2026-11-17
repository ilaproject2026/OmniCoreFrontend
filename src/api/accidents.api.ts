import { apiClient } from './client';
import { AccidentReport } from '../types';

// Django Backend IncidentSeverity Translators
export const mapIncidentSeverityToBackend = (severity?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (!severity) return 'LOW';
  const s = severity.toUpperCase();
  if (s === 'LOW' || s === 'MINOR') return 'LOW';
  if (s === 'MEDIUM' || s === 'MODERATE') return 'MEDIUM';
  if (s === 'HIGH' || s === 'SEVERE') return 'HIGH';
  if (s === 'CRITICAL' || s === 'TOTAL_LOSS') return 'CRITICAL';
  return 'MEDIUM';
};

export const mapIncidentSeverityToFrontend = (severity?: string): AccidentReport['damageSeverity'] => {
  const s = (severity || '').toUpperCase();
  if (s === 'LOW') return 'minor';
  if (s === 'MEDIUM') return 'moderate';
  if (s === 'HIGH') return 'severe';
  if (s === 'CRITICAL') return 'total_loss';
  return 'moderate';
};

export const toBackendAccidentPayload = (payload: Partial<AccidentReport>): Record<string, any> => {
  return {
    vehicle: payload.vehicleId,
    driver: payload.driverId || null,
    accident_date: payload.incidentDate || payload.dateTime || new Date().toISOString(),
    location: payload.location,
    description: payload.damageDescription || payload.description || '',
    estimated_damage_cost: payload.estimatedRepairCost ?? (payload as any).estimatedDamageCost ?? 0,
    insurance_claim_number: payload.policeReportNumber || '',
  };
};

export const normalizeAccidentResponse = (data: any): AccidentReport => {
  if (!data) return data;
  return {
    ...data,
    id: data.id || `acc_${Math.random().toString(36).substring(2, 7)}`,
    accidentCode: data.accident_code || data.accidentCode || `ACC-${data.id || '2026'}`,
    vehicleId: data.vehicle_id || data.vehicleId || (typeof data.vehicle === 'string' ? data.vehicle : data.vehicle?.id),
    vehicleReg: data.vehicle_reg || data.vehicleReg || data.vehicle?.registration_number || '',
    driverId: data.driver_id || data.driverId || (typeof data.driver === 'string' ? data.driver : data.driver?.id),
    driverName: data.driver_name || data.driverName || (data.driver ? `${data.driver.first_name || ''} ${data.driver.last_name || ''}`.trim() : ''),
    tripId: data.trip_id || data.tripId || (typeof data.trip === 'string' ? data.trip : data.trip?.id),
    incidentDate: data.accident_date || data.incident_date || data.incidentDate || '',
    dateTime: data.accident_date || data.dateTime,
    damageSeverity: mapIncidentSeverityToFrontend(data.damage_severity || data.severity || data.damageSeverity),
    damageDescription: data.damage_description || data.damageDescription || data.description || '',
    thirdPartyInvolved: data.third_party_involved ?? data.thirdPartyInvolved ?? false,
    thirdPartyDetails: data.third_party_details || data.thirdPartyDetails,
    policeReportNumber: data.police_report_number || data.policeReportNumber,
    estimatedRepairCost: Number(data.estimated_damage_cost ?? data.estimated_repair_cost ?? data.estimatedRepairCost ?? 0),
    actualRepairCost: data.actual_repair_cost !== undefined ? Number(data.actual_repair_cost) : data.actualRepairCost,
    insuranceClaimId: data.insurance_claim_id || data.insuranceClaimId,
    insuranceClaimStatus: data.insurance_claim_status || data.insuranceClaimStatus || 'filed',
    vehicleDowntimeDays: Number(data.vehicle_downtime_days ?? data.vehicleDowntimeDays ?? 0),
    status: data.status || 'under_repair',
    preventable: data.preventable ?? false,
    location: data.location || '',
    notes: data.notes,
  };
};

export const accidentsApi = {
  getAccidents: async (params?: { vehicleId?: string; search?: string }): Promise<AccidentReport[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.vehicleId && params.vehicleId !== 'all') {
      queryParams.vehicle = params.vehicleId;
      queryParams.vehicle_id = params.vehicleId;
    }

    const response = await apiClient.get<any>('/maintenance/accidents/', { params: queryParams });
    const rawList = Array.isArray(response.data)
      ? response.data
      : (response.data?.results || response.data?.data || []);
    return rawList.map(normalizeAccidentResponse);
  },

  reportAccident: async (payload: Partial<AccidentReport>): Promise<AccidentReport> => {
    const backendData = toBackendAccidentPayload(payload);
    try {
      const response = await apiClient.post<any>('/maintenance/accidents/', backendData);
      return normalizeAccidentResponse(response.data);
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
