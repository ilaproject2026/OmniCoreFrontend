import { apiClient } from './client';
import { ShuttleOrganization, ShuttleRoute, ShuttleSchedule, ShuttlePassenger } from '../types';

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

  updateScheduleStatus: async (
    id: string,
    status: ShuttleSchedule['status']
  ): Promise<ShuttleSchedule> => {
    const response = await apiClient.patch(`/shuttle/schedules/${id}/`, { status });
    return response.data;
  },

  getPassengers: async (routeId?: string): Promise<ShuttlePassenger[]> => {
    const response = await apiClient.get('/shuttle/passengers/', { params: { routeId } });
    return response.data;
  },

  markPassengerBoarded: async (
    passengerId: string,
    hasBoarded: boolean
  ): Promise<ShuttlePassenger> => {
    const response = await apiClient.post(`/shuttle/passengers/${passengerId}/board/`, { hasBoarded });
    return response.data;
  },
};
