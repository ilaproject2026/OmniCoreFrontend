import { apiClient } from './client';
import { ShuttleRoute, ShuttleSchedule, ShuttlePassenger } from '../types';

export const shuttleApi = {
  getRoutes: async (): Promise<ShuttleRoute[]> => {
    const response = await apiClient.get('/shuttle/routes/');
    return response.data;
  },

  getRouteById: async (id: string): Promise<ShuttleRoute | null> => {
    const response = await apiClient.get(`/shuttle/routes/${id}/`);
    return response.data;
  },

  createRoute: async (data: Partial<ShuttleRoute>): Promise<ShuttleRoute> => {
    const response = await apiClient.post('/shuttle/routes/', data);
    return response.data;
  },

  getSchedules: async (): Promise<ShuttleSchedule[]> => {
    const response = await apiClient.get('/shuttle/schedules/');
    return response.data;
  },

  createSchedule: async (data: Partial<ShuttleSchedule>): Promise<ShuttleSchedule> => {
    const response = await apiClient.post('/shuttle/schedules/', data);
    return response.data;
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
