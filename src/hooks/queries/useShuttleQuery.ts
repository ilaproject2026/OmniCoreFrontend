import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { shuttleApi } from '../../api/shuttle.api';
import { ShuttleOrganization, ShuttleRoute, ShuttleSchedule } from '../../types';

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
      passengerId,
      status,
    }: {
      scheduleId?: string;
      passengerId: string;
      status: 'boarded' | 'missed' | 'excused' | 'dropped_off';
      stopId?: string;
    }) => shuttleApi.markPassengerBoarded(passengerId, status === 'boarded'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.schedules() });
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.passengers() });
    },
  });
}

export function useMarkPassengerBoardedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      passengerId,
      hasBoarded,
    }: {
      passengerId: string;
      hasBoarded: boolean;
    }) => shuttleApi.markPassengerBoarded(passengerId, hasBoarded),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shuttle.passengers() });
    },
  });
}
