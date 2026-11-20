import { apiClient } from './client';
import { ShuttleOrganization, ShuttleRoute, ShuttleSchedule, ShuttlePassenger, ShuttleTrip, ShuttleAttendanceStatus } from '../types';

const rowsFrom = (data: any): any[] => Array.isArray(data) ? data : data?.results || data?.data || [];
const errorMessage = (error: any): string => {
  const body = error?.response?.data || {};
  const fields = body?.error?.fields || body?.fields || body;
  const details = fields && typeof fields === 'object'
    ? Object.entries(fields).filter(([key]) => !['detail', 'message', 'code', 'success'].includes(key))
        .flatMap(([field, value]) => (Array.isArray(value) ? value : [value]).map((message) => `${field}: ${String(message)}`)).join(' · ')
    : '';
  return details || body?.detail || body?.message || error?.message || 'Shuttle request failed.';
};

async function getAllRows(path: string): Promise<any[]> {
  const rows: any[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await apiClient.get<any>(path, { params: { page, page_size: 100 } });
    rows.push(...rowsFrom(response.data));
    totalPages = Number(response.data?.total_pages || 1);
    page += 1;
  } while (page <= totalPages);
  return rows;
}

const normalizeOrganization = (raw: any): ShuttleOrganization => ({
  id: raw.id, name: raw.name || '', code: raw.code || '', orgType: raw.org_type || 'CORPORATE',
  contactPerson: raw.contact_person || '', contactEmail: raw.contact_email || '',
  contactPhone: raw.contact_phone || '', address: raw.address || '', isActive: Boolean(raw.is_active),
});

const normalizeRoute = (raw: any): ShuttleRoute => ({
  id: raw.id, organizationId: raw.organization || '', organizationName: raw.organization_name || '',
  routeCode: raw.route_code || '', name: raw.route_name || '',
  organizationType: String(raw.organization_type || '').toUpperCase() === 'SCHOOL' ? 'school' : 'corporate_it',
  startLocation: raw.start_location || '', endLocation: raw.end_location || '',
  destinationCampus: raw.end_location || '', direction: String(raw.direction || 'INBOUND').toLowerCase() as any,
  stops: (raw.stops || []).map((stop: any) => ({
    id: stop.id, name: stop.stop_name || '', sequence: Number(stop.sequence || 0),
    scheduledTime: stop.scheduled_offset_minutes ? `${stop.scheduled_offset_minutes} min` : '',
    address: stop.landmark || '', passengersAssignedCount: 0,
  })),
  totalDistanceKm: Number(raw.total_distance_km || 0), estimatedDurationMins: Number(raw.estimated_duration_mins || 0),
  status: raw.is_active ? 'active' : 'cancelled',
});

const normalizeSchedule = (raw: any): ShuttleSchedule => ({
  id: raw.id, routeId: raw.shuttle_route || '', routeName: raw.route_name || raw.route_code || 'Shuttle route',
  shift: String(raw.day_of_week || 'WEEKDAYS').toLowerCase(), dayOfWeek: raw.day_of_week || 'WEEKDAYS',
  departureTime: raw.departure_time || '', arrivalTime: raw.estimated_arrival_time || '',
  busReg: raw.vehicle_registration || 'Unassigned', driverName: raw.driver_name || 'Unassigned',
  driverPhone: raw.driver_phone || '', occupancyCount: Number(raw.occupancy_count || 0),
  capacityTotal: Number(raw.capacity_total || 0), status: raw.is_active ? 'scheduled' : 'cancelled',
});

const normalizePassenger = (raw: any, assignment: any, routes: ShuttleRoute[]): ShuttlePassenger => {
  const pickupStopId = raw.pickup_stop || undefined;
  const route = routes.find((candidate) => candidate.id === assignment?.shuttle_route);
  const stop = route?.stops.find((candidate) => candidate.id === pickupStopId);
  return {
    id: raw.id, name: [raw.first_name, raw.last_name].filter(Boolean).join(' '),
    employeeOrStudentId: raw.id_number || '', type: String(raw.passenger_type || 'EMPLOYEE').toUpperCase() === 'STUDENT' ? 'student' : 'employee',
    organizationId: raw.organization || '', organizationName: raw.organization_name || '',
    assignedRouteId: assignment?.shuttle_route || '', assignedRouteName: route?.name || assignment?.route_code || '',
    pickupStopId, assignedStopName: stop?.name || '', contactPhone: raw.phone || '',
    emergencyContact: [raw.emergency_contact_name, raw.emergency_contact_phone].filter(Boolean).join(' · '),
    hasBoardedToday: false, seatNumber: assignment?.seat_number || '',
  };
};

const normalizeTrip = (raw: any): ShuttleTrip => ({
  id: raw.id, tripNumber: raw.trip_number || '', routeId: raw.shuttle_route || '', routeCode: raw.route_code || '',
  tripDate: raw.trip_date || '', status: String(raw.status || 'SCHEDULED').toLowerCase() as ShuttleTrip['status'],
  attendanceRecords: (raw.attendance_records || []).map((item: any) => ({
    id: item.id, passengerId: item.passenger, status: item.status,
    timestamp: item.timestamp || '', stopId: item.shuttle_stop || undefined,
  })),
});

export const shuttleApi = {
  getOrganizations: async (): Promise<ShuttleOrganization[]> =>
    (await getAllRows('/shuttle/organizations/')).map(normalizeOrganization),

  createOrganization: async (data: Omit<ShuttleOrganization, 'id' | 'isActive'>): Promise<ShuttleOrganization> => {
    const response = await apiClient.post<any>('/shuttle/organizations/', {
      org_type: data.orgType, name: data.name, code: data.code,
      contact_person: data.contactPerson, contact_email: data.contactEmail,
      contact_phone: data.contactPhone, address: data.address, is_active: true,
    });
    return normalizeOrganization(response.data);
  },

  getRoutes: async (): Promise<ShuttleRoute[]> => {
    return (await getAllRows('/shuttle/routes/')).map(normalizeRoute);
  },

  getRouteById: async (id: string): Promise<ShuttleRoute | null> => {
    const response = await apiClient.get<any>(`/shuttle/routes/${id}/`);
    return normalizeRoute(response.data);
  },

  createRoute: async (data: { organizationId: string; routeCode: string; name: string; startLocation: string; endLocation: string; direction: string }): Promise<ShuttleRoute> => {
    const response = await apiClient.post<any>('/shuttle/routes/', {
      organization: data.organizationId, route_code: data.routeCode.trim(), route_name: data.name.trim(),
      start_location: data.startLocation.trim(), end_location: data.endLocation.trim(), direction: data.direction,
      is_active: true,
    });
    return normalizeRoute(response.data);
  },

  getSchedules: async (): Promise<ShuttleSchedule[]> => {
    return (await getAllRows('/shuttle/schedules/')).map(normalizeSchedule);
  },

  createSchedule: async (data: Partial<ShuttleSchedule>): Promise<ShuttleSchedule> => {
    try {
      const response = await apiClient.post<any>('/shuttle/schedules/', {
        shuttle_route: data.routeId,
        day_of_week: data.dayOfWeek || 'WEEKDAYS',
        departure_time: data.departureTime,
        estimated_arrival_time: data.arrivalTime,
      });
      return normalizeSchedule(response.data);
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  },

  generateTripForSchedule: async (scheduleId: string, tripDate: string): Promise<ShuttleTrip> => {
    const response = await apiClient.post<any>(`/shuttle/schedules/${scheduleId}/generate-trip/`, { trip_date: tripDate });
    return normalizeTrip(response.data);
  },

  getTrips: async (): Promise<ShuttleTrip[]> =>
    (await getAllRows('/shuttle/trips/')).map(normalizeTrip),

  createPassengerEnrollment: async (data: {
    organizationId: string; routeId: string; passengerType: 'EMPLOYEE' | 'STUDENT';
    firstName: string; lastName: string; idNumber: string; email?: string; phone: string;
    emergencyContactName?: string; emergencyContactPhone?: string; pickupStopId?: string;
    effectiveFrom: string; seatNumber?: string;
  }): Promise<ShuttlePassenger> => {
    try {
      const response = await apiClient.post<any>('/shuttle/passengers/enroll/', {
        organization: data.organizationId, shuttle_route: data.routeId, passenger_type: data.passengerType,
        first_name: data.firstName.trim(), last_name: data.lastName.trim(), id_number: data.idNumber.trim(),
        email: data.email || '', phone: data.phone.trim(), emergency_contact_name: data.emergencyContactName || '',
        emergency_contact_phone: data.emergencyContactPhone || '', pickup_stop: data.pickupStopId || null,
        effective_from: data.effectiveFrom, seat_number: data.seatNumber || '',
      });
      return normalizePassenger(response.data.passenger, response.data.assignment, await shuttleApi.getRoutes());
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  },

  recordTripAttendance: async (tripId: string, passengerId: string, attendanceStatus: ShuttleAttendanceStatus, stopId?: string): Promise<void> => {
    try {
      await apiClient.post(`/shuttle/trips/${tripId}/attendance/`, {
        passenger_id: passengerId, status: attendanceStatus, ...(stopId ? { stop_id: stopId } : {}),
      });
    } catch (error) {
      throw new Error(errorMessage(error));
    }
  },

  updateScheduleStatus: async (
    id: string,
    status: ShuttleSchedule['status']
  ): Promise<ShuttleSchedule> => {
    const response = await apiClient.patch(`/shuttle/schedules/${id}/`, { status });
    return response.data;
  },

  getPassengers: async (routeId?: string): Promise<ShuttlePassenger[]> => {
    const [rawPassengers, assignments, routes] = await Promise.all([
      getAllRows('/shuttle/passengers/'), getAllRows('/shuttle/assignments/'), shuttleApi.getRoutes(),
    ]);
    return rawPassengers.map((raw: any) => {
      const assignment = assignments.find((item: any) => item.passenger === raw.id && item.is_active);
      return normalizePassenger(raw, assignment, routes);
    }).filter((passenger) => !routeId || passenger.assignedRouteId === routeId);
  },
};
