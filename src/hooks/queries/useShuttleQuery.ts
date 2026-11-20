import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { shuttleApi } from '../../api/shuttle.api';
import { ShuttleAttendanceStatus, ShuttleOrganization, ShuttleRoute, ShuttleSchedule } from '../../types';

// ==================== QUERIES ====================

export function useShuttleOrganizations() {
  return useQuery({ queryKey: queryKeys.shuttle.organizations, queryFn: () => shuttleApi.getOrganizations() });
}

export function useShuttleRoutes() {
  return useQuery({
    queryKey: queryKeys.shuttle.routes(),
    queryFn: () => shuttleApi.getRoutes(),
  });
}

export function useShuttleSchedules(routeId?: string) {
  return useQuery({
    queryKey: queryKeys.shuttle.schedules(routeId),
    queryFn: async () => {
      const all = await shuttleApi.getSchedules();
      if (routeId) {
        return all.filter((s) => s.routeId === routeId);
      }
      return all;
    },
  });
}

export function useShuttlePassengers(routeId?: string) {
  return useQuery({
    queryKey: queryKeys.shuttle.passengers({ routeId }),
    queryFn: () => shuttleApi.getPassengers(routeId),
  });
}

export function useShuttleTrips(date?: string) {
  return useQuery({ queryKey: queryKeys.shuttle.trips(date), queryFn: () => shuttleApi.getTrips() });
}

// ==================== MUTATIONS ====================

export function useCreateShuttleRouteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { organizationId: string; routeCode: string; name: string; startLocation: string; endLocation: string; direction: string }) => shuttleApi.createRoute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.routes() });
    },
  });
}

export function useCreateShuttleOrganizationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ShuttleOrganization, 'id' | 'isActive'>) => shuttleApi.createOrganization(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.organizations }),
  });
}

export function useCreateShuttleScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ShuttleSchedule>) => shuttleApi.createSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.schedules() });
    },
  });
}

export function useCreatePassengerEnrollmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof shuttleApi.createPassengerEnrollment>[0]) => shuttleApi.createPassengerEnrollment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shuttle', 'passengers'] }),
  });
}

export function useGenerateShuttleTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, tripDate }: { scheduleId: string; tripDate: string }) => shuttleApi.generateTripForSchedule(scheduleId, tripDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.trips() }),
  });
}

export function useUpdateScheduleStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShuttleSchedule['status'] }) =>
      shuttleApi.updateScheduleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.schedules() });
    },
  });
}

export function useRecordAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      passengerId,
      status,
      stopId,
    }: {
      scheduleId?: string;
      tripId: string;
      passengerId: string;
      status: 'boarded' | 'missed' | 'excused' | 'dropped_off';
      stopId?: string;
    }) => shuttleApi.recordTripAttendance(tripId, passengerId, ({ boarded: 'BOARDED', missed: 'ABSENT', excused: 'EXCUSED', dropped_off: 'ALIGHTED' } as const)[status], stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.schedules() });
      queryClient.invalidateQueries({ queryKey: ['shuttle', 'passengers'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.trips() });
    },
  });
}

export function useMarkPassengerBoardedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      passengerId,
      status,
      stopId,
    }: {
      tripId: string;
      passengerId: string;
      status: ShuttleAttendanceStatus;
      stopId?: string;
    }) => shuttleApi.recordTripAttendance(tripId, passengerId, status, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.trips() });
      queryClient.invalidateQueries({ queryKey: ['shuttle', 'passengers'] });
    },
  });
}
