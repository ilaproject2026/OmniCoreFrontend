import { apiClient } from './client';
import { Booking, Trip, TripExpense, TripStatus } from '../types';
import { MOCK_BOOKINGS, MOCK_TRIPS } from './mockData';

export const tripsApi = {
  getBookings: async (params?: { status?: string }): Promise<Booking[]> => {
    try {
      const response = await apiClient.get<any>('/trips/bookings/', { params });
      const raw = response.data?.data || response.data?.results || response.data;
      if (Array.isArray(raw) && raw.length > 0) {
        return raw;
      }
      if (params?.status && params.status !== 'all') {
        return MOCK_BOOKINGS.filter((b) => b.status === params.status);
      }
      return MOCK_BOOKINGS;
    } catch {
      if (params?.status && params.status !== 'all') {
        return MOCK_BOOKINGS.filter((b) => b.status === params.status);
      }
      return MOCK_BOOKINGS;
    }
  },

  createBooking: async (payload: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await apiClient.post<any>('/trips/bookings/', payload);
      const raw = response.data?.data || response.data;
      return raw || payload;
    } catch {
      const newB: Booking = {
        id: 'bk_' + Math.random().toString(36).substring(2, 7),
        bookingCode: 'BK-2026-' + Math.floor(100 + Math.random() * 900),
        tenantId: 'tenant_apex',
        customerName: payload.customerName || 'Standard Client',
        customerPhone: payload.customerPhone || '+1 (555) 012-3456',
        customerEmail: payload.customerEmail,
        vertical: payload.vertical || 'freight_logistics',
        pickupLocation: payload.pickupLocation || 'Chicago Facility Hub',
        dropoffLocation: payload.dropoffLocation || 'Detroit Assembly Terminal',
        scheduledPickupTime: payload.scheduledPickupTime || 'Tomorrow 08:00',
        cargoDescription: payload.cargoDescription || 'Industrial standard pallet load',
        estimatedWeightKg: payload.estimatedWeightKg || 12000,
        estimatedAmount: payload.estimatedAmount || 2800,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      MOCK_BOOKINGS.unshift(newB);
      return newB;
    }
  },

  getTrips: async (params?: { status?: string; search?: string }): Promise<Trip[]> => {
    try {
      const response = await apiClient.get<any>('/trips/', { params });
      const raw = response.data?.data || response.data?.results || response.data;
      if (Array.isArray(raw) && raw.length > 0) {
        return raw;
      }
      let list = [...MOCK_TRIPS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.tripCode.toLowerCase().includes(q) ||
            t.customerName.toLowerCase().includes(q) ||
            t.vehicleReg.toLowerCase().includes(q) ||
            t.driverName.toLowerCase().includes(q) ||
            t.origin.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q)
        );
      }
      if (params?.status && params.status !== 'all') {
        list = list.filter((t) => t.status === params.status);
      }
      return list;
    } catch {
      let list = [...MOCK_TRIPS];
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.tripCode.toLowerCase().includes(q) ||
            t.customerName.toLowerCase().includes(q) ||
            t.vehicleReg.toLowerCase().includes(q) ||
            t.driverName.toLowerCase().includes(q) ||
            t.origin.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q)
        );
      }
      if (params?.status && params.status !== 'all') {
        list = list.filter((t) => t.status === params.status);
      }
      return list;
    }
  },

  getTripById: async (id: string): Promise<Trip> => {
    try {
      const response = await apiClient.get<Trip>(`/trips/${id}/`);
      return response.data;
    } catch {
      const t = MOCK_TRIPS.find((item) => item.id === id);
      if (!t) throw new Error('Trip not found');
      return t;
    }
  },

  dispatchBooking: async (bookingId: string, vehicleId: string, driverId: string): Promise<Trip> => {
    try {
      const response = await apiClient.post<Trip>('/trips/dispatch/', {
        bookingId,
        vehicleId,
        driverId,
      });
      return response.data;
    } catch {
      const bk = MOCK_BOOKINGS.find((b) => b.id === bookingId);
      if (bk) bk.status = 'dispatched';

      const newTrip: Trip = {
        id: 'trip_' + Math.random().toString(36).substring(2, 7),
        tripCode: 'TRP-2026-' + Math.floor(8900 + Math.random() * 1000),
        tenantId: 'tenant_apex',
        bookingId: bookingId,
        customerName: bk ? bk.customerName : 'Dispatched Customer',
        vertical: bk ? bk.vertical : 'freight_logistics',
        vehicleId: vehicleId,
        vehicleReg: 'IL-6102-FR',
        driverId: driverId,
        driverName: 'Darius Jackson',
        driverPhone: '+1 (312) 555-0834',
        origin: bk ? bk.pickupLocation : 'Chicago Terminal',
        destination: bk ? bk.dropoffLocation : 'Regional DC',
        distanceKm: 450,
        status: 'dispatched',
        startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
        estimatedArrival: 'Today 18:00',
        commercialRate: bk ? bk.estimatedAmount : 3200,
        expensesTotal: 0,
        expenses: [],
        timeline: [
          { status: 'scheduled', timestamp: 'Just now', note: 'Booking accepted' },
          { status: 'dispatched', timestamp: 'Just now', note: 'Assigned to IL-6102-FR (Darius Jackson)' },
        ],
      };
      MOCK_TRIPS.unshift(newTrip);
      return newTrip;
    }
  },

  updateTripStatus: async (tripId: string, status: TripStatus, note?: string): Promise<Trip> => {
    try {
      const response = await apiClient.patch<Trip>(`/trips/${tripId}/status/`, { status, note });
      return response.data;
    } catch {
      const trip = MOCK_TRIPS.find((t) => t.id === tripId);
      if (!trip) throw new Error('Trip not found');
      trip.status = status;
      trip.timeline.push({
        status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: note || `Status transitioned to ${status.replace('_', ' ')}`,
      });
      return { ...trip };
    }
  },

  addTripExpense: async (tripId: string, expense: Omit<TripExpense, 'id' | 'tripId' | 'loggedAt' | 'approved'>): Promise<TripExpense> => {
    try {
      const response = await apiClient.post<TripExpense>(`/trips/${tripId}/expenses/`, expense);
      return response.data;
    } catch {
      const trip = MOCK_TRIPS.find((t) => t.id === tripId);
      const newExp: TripExpense = {
        id: 'exp_' + Math.random().toString(36).substring(2, 6),
        tripId,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency || 'USD',
        receiptUrl: expense.receiptUrl,
        loggedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        approved: true,
      };
      if (trip) {
        trip.expenses.push(newExp);
        trip.expensesTotal += expense.amount;
      }
      return newExp;
    }
  },
};
