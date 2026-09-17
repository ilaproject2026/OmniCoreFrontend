import { apiClient } from './client';
import { AccidentReport } from '../types';
import { MOCK_ACCIDENTS, MOCK_VEHICLES, MOCK_DRIVERS, MOCK_MAINTENANCE, MOCK_CLAIMS } from './mockData';

let accidentsState: AccidentReport[] = [...MOCK_ACCIDENTS];

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
  const sev = mapIncidentSeverityToBackend(payload.damageSeverity || (payload as any).severity);
  return {
    ...payload,
    vehicle: payload.vehicleId,
    vehicle_id: payload.vehicleId,
    driver: payload.driverId,
    driver_id: payload.driverId,
    trip: payload.tripId,
    trip_id: payload.tripId,
    incident_date: payload.incidentDate,
    damage_severity: sev,
    severity: sev,
    damage_description: payload.damageDescription,
    description: payload.damageDescription,
    third_party_involved: payload.thirdPartyInvolved,
    third_party_details: payload.thirdPartyDetails,
    police_report_number: payload.policeReportNumber,
    estimated_repair_cost: payload.estimatedRepairCost,
    actual_repair_cost: payload.actualRepairCost,
    location: payload.location,
    preventable: payload.preventable,
    notes: payload.notes,
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
    incidentDate: data.incident_date || data.incidentDate || '',
    damageSeverity: mapIncidentSeverityToFrontend(data.damage_severity || data.severity || data.damageSeverity),
    damageDescription: data.damage_description || data.damageDescription || data.description || '',
    thirdPartyInvolved: data.third_party_involved ?? data.thirdPartyInvolved ?? false,
    thirdPartyDetails: data.third_party_details || data.thirdPartyDetails,
    policeReportNumber: data.police_report_number || data.policeReportNumber,
    estimatedRepairCost: Number(data.estimated_repair_cost ?? data.estimatedRepairCost ?? 0),
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

    try {
      const response = await apiClient.get<any>('/fleet/accidents/', { params: queryParams });
      const rawList = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || response.data?.data || []);
      return rawList.map(normalizeAccidentResponse);
    } catch {
      let list = [...accidentsState];
      if (params?.vehicleId && params.vehicleId !== 'all') {
        list = list.filter((a) => a.vehicleId === params.vehicleId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.accidentCode.toLowerCase().includes(q) ||
            a.vehicleReg.toLowerCase().includes(q) ||
            a.driverName.toLowerCase().includes(q) ||
            a.location.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  reportAccident: async (payload: Partial<AccidentReport>): Promise<AccidentReport> => {
    const backendData = toBackendAccidentPayload(payload);
    try {
      const response = await apiClient.post<any>('/fleet/accidents/', backendData);
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
      const veh = MOCK_VEHICLES.find((v) => v.id === payload.vehicleId || v.registrationNumber === payload.vehicleReg);
      const drv = MOCK_DRIVERS.find((d) => d.id === payload.driverId || `${d.firstName} ${d.lastName}` === payload.driverName);

      // Auto-ground vehicle
      if (veh) {
        veh.status = 'accident';
      }

      // Increment driver incident count
      if (drv) {
        drv.incidentCount += 1;
        drv.safetyScore = Math.max(50, drv.safetyScore - 8);
      }

      const newClaimId = `clm_${Date.now()}`;
      const newAccident: AccidentReport = {
        id: `acc_${Date.now()}`,
        accidentCode: `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        vehicleId: payload.vehicleId || veh?.id || 'veh_01',
        vehicleReg: payload.vehicleReg || veh?.registrationNumber || 'IL-9428-TX',
        driverId: payload.driverId || drv?.id || 'drv_01',
        driverName: payload.driverName || (drv ? `${drv.firstName} ${drv.lastName}` : 'Assigned Driver'),
        tripId: payload.tripId,
        incidentDate: payload.incidentDate || new Date().toISOString().replace('T', ' ').slice(0, 16),
        location: payload.location || 'Highway In-Transit',
        damageSeverity: payload.damageSeverity || 'moderate',
        damageDescription: payload.damageDescription || 'Collision impact requiring bay appraisal',
        thirdPartyInvolved: payload.thirdPartyInvolved ?? true,
        thirdPartyDetails: payload.thirdPartyDetails,
        policeReportNumber: payload.policeReportNumber || `POL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        estimatedRepairCost: payload.estimatedRepairCost || 5000,
        actualRepairCost: payload.actualRepairCost,
        insuranceClaimId: newClaimId,
        insuranceClaimStatus: 'filed',
        vehicleDowntimeDays: payload.vehicleDowntimeDays || 5,
        status: 'under_repair',
        preventable: payload.preventable ?? false,
        notes: payload.notes,
      };

      accidentsState.unshift(newAccident);

      // Automatically generate insurance claim record
      MOCK_CLAIMS.unshift({
        id: newClaimId,
        claimNumber: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        policyNumber: 'POL-COMM-99201',
        vehicleReg: newAccident.vehicleReg,
        incidentDate: newAccident.incidentDate.slice(0, 10),
        claimAmount: newAccident.estimatedRepairCost,
        status: 'filed',
        description: `Accident claim for incident ${newAccident.accidentCode}: ${newAccident.damageDescription}`,
      });

      // Automatically schedule repair work order
      MOCK_MAINTENANCE.unshift({
        id: `maint_acc_${Date.now()}`,
        recordCode: `WO-ACC-${Math.floor(100 + Math.random() * 900)}`,
        vehicleId: newAccident.vehicleId,
        vehicleReg: newAccident.vehicleReg,
        type: 'accident_repair',
        status: 'in_progress',
        reportedDate: newAccident.incidentDate.slice(0, 10),
        odometerAtService: veh?.odometerKm || 85000,
        workshopName: 'Apex Central Heavy Depot & Workshop',
        technicianName: 'Marcus Sterling',
        issueDescription: `Post-Accident Repair for ${newAccident.accidentCode}: ${newAccident.damageDescription}`,
        actionTaken: 'Structural integrity check, chassis laser measurement, and replacement parts requisitioned.',
        partsConsumed: [],
        laborCost: 1200,
        totalCost: newAccident.estimatedRepairCost,
      });

      return newAccident;
    }
  },
};
