import { apiClient } from './client';
import { Booking, Trip, TripExpense, TripStatus, Invoice } from '../types';
import { MOCK_BOOKINGS, MOCK_TRIPS, MOCK_VEHICLES, MOCK_DRIVERS, MOCK_INVOICES } from './mockData';

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
        customerId: payload.customerId,
        contractId: payload.contractId,
        customerName: payload.customerName || 'Standard Client',
        customerPhone: payload.customerPhone || '+1 (555) 012-3456',
        customerEmail: payload.customerEmail,
        vertical: payload.vertical || 'freight_logistics',
        vehicleType: payload.vehicleType || 'heavy_truck',
        pickupLocation: payload.pickupLocation || 'Chicago Facility Hub',
        dropoffLocation: payload.dropoffLocation || 'Detroit Assembly Terminal',
        scheduledPickupTime: payload.scheduledPickupTime || 'Tomorrow 08:00',
        cargoDescription: payload.cargoDescription || 'Industrial standard load',
        estimatedWeightKg: payload.estimatedWeightKg || 12000,
        passengerCount: payload.passengerCount,
        estimatedAmount: payload.estimatedAmount || 2800,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      MOCK_BOOKINGS.unshift(newB);
      return newB;
    }
  },

  getTrips: async (params?: { status?: string; search?: string; contractId?: string }): Promise<Trip[]> => {
    try {
      const response = await apiClient.get<any>('/trips/', { params });
      const raw = response.data?.data || response.data?.results || response.data;
      if (Array.isArray(raw) && raw.length > 0) {
        return raw;
      }
      let list = [...MOCK_TRIPS];
      if (params?.contractId) {
        list = list.filter((t) => t.contractId === params.contractId);
      }
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
      if (params?.contractId) {
        list = list.filter((t) => t.contractId === params.contractId);
      }
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

  dispatchBooking: async (bookingId: string, vehicleId: string, driverId?: string): Promise<Trip> => {
    try {
      const response = await apiClient.post<Trip>('/trips/dispatch/', {
        bookingId,
        vehicleId,
        driverId,
      });
      return response.data;
    } catch {
      const bk = MOCK_BOOKINGS.find((b) => b.id === bookingId);
      const veh = MOCK_VEHICLES.find((v) => v.id === vehicleId);

      // Business Rule Validation 1: Vehicle Operational Status
      if (veh && veh.status !== 'available') {
        throw new Error(`Cannot dispatch: Vehicle ${veh.registrationNumber} is currently in ${veh.status.replace('_', ' ')} status.`);
      }

      // Business Rule Validation 2: Vehicle Compliance Documents Expiry
      const expiredDoc = veh?.documents?.find((d) => d.isExpired || (d.expiryDate && new Date(d.expiryDate) < new Date()));
      if (expiredDoc) {
        throw new Error(`Compliance Restriction: Vehicle ${veh?.registrationNumber} has an expired ${expiredDoc.type.replace('_', ' ')} document. Operation prohibited until renewed.`);
      }

      const resolvedDriverId = driverId || veh?.assignedDriverId;
      const drv = MOCK_DRIVERS.find((d) => d.id === resolvedDriverId);

      // Business Rule Validation 3: Driver Active Trip Conflict
      if (drv && drv.status === 'on_trip') {
        throw new Error(`Scheduling Conflict: Driver ${drv.firstName} ${drv.lastName} is currently on an active trip.`);
      }

      // Business Rule Validation 4: Driver Leave / Suspension Status
      if (drv && (drv.leaveStatus === 'on_leave' || drv.leaveStatus === 'sick_leave' || drv.status === 'leave')) {
        throw new Error(`HR Restriction: Driver ${drv.firstName} ${drv.lastName} is currently on approved leave.`);
      }

      // Business Rule Validation 5: Driver CDL License Validity
      if (drv && drv.licenseExpiryDate && new Date(drv.licenseExpiryDate) < new Date()) {
        throw new Error(`Safety Violation: Driver ${drv.firstName} ${drv.lastName} has an expired commercial driving license.`);
      }

      if (bk) bk.status = 'dispatched';
      if (veh) veh.status = 'on_trip';
      if (drv) drv.status = 'on_trip';

      const assignedDriverName = drv
        ? `${drv.firstName} ${drv.lastName}`
        : veh?.assignedDriverName || 'Assigned Driver';
      const assignedDriverPhone = drv?.phone || '+1 (312) 555-0834';
      const assignedVehicleReg = veh?.registrationNumber || 'IL-DISP-01';

      const newTrip: Trip = {
        id: 'trip_' + Math.random().toString(36).substring(2, 7),
        tripCode: 'TRP-2026-' + Math.floor(8900 + Math.random() * 1000),
        tenantId: bk?.tenantId || veh?.tenantId || 'tenant_apex',
        bookingId: bookingId,
        customerId: bk?.customerId,
        contractId: bk?.contractId,
        customerName: bk ? bk.customerName : 'Dispatched Customer',
        vertical: bk ? bk.vertical : (veh?.vertical || 'freight_logistics'),
        vehicleType: bk?.vehicleType || veh?.type,
        vehicleId: vehicleId,
        vehicleReg: assignedVehicleReg,
        driverId: resolvedDriverId || 'drv_default',
        driverName: assignedDriverName,
        driverPhone: assignedDriverPhone,
        origin: bk ? bk.pickupLocation : 'Origin Facility',
        destination: bk ? bk.dropoffLocation : 'Destination Terminal',
        distanceKm: Math.floor(220 + Math.random() * 320),
        status: 'dispatched',
        startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
        estimatedArrival: 'Tomorrow 18:00',
        commercialRate: bk ? bk.estimatedAmount : 3200,
        expensesTotal: 0,
        expenses: [],
        timeline: [
          { status: 'scheduled', timestamp: 'Just now', note: `Booking accepted for ${bk?.customerName || 'Customer'}` },
          {
            status: 'dispatched',
            timestamp: 'Just now',
            note: `Vehicle ${assignedVehicleReg} (${veh?.make || ''} ${veh?.model || ''}) dispatched with Driver ${assignedDriverName}`,
          },
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

      // Reactive Business Logic: If trip completed, restore vehicle and driver availability and generate billing
      if (status === 'completed') {
        const veh = MOCK_VEHICLES.find((v) => v.id === trip.vehicleId);
        if (veh) {
          veh.status = 'available';
          veh.totalTripsCount = (veh.totalTripsCount || 0) + 1;
          veh.odometerKm = (veh.odometerKm || 0) + (trip.distanceKm || 0);
        }

        const drv = MOCK_DRIVERS.find((d) => d.id === trip.driverId);
        if (drv) {
          drv.status = 'available';
          drv.totalTrips = (drv.totalTrips || 0) + 1;
        }

        trip.netMargin = (trip.commercialRate || 0) - (trip.expensesTotal || 0);

        // Auto-generate Billable Invoice in Accounts Receivable
        if (!trip.invoiceId) {
          const invId = `inv_auto_${Date.now()}`;
          const amount = trip.commercialRate;
          const tax = Math.round(amount * 0.08);
          const newInv: Invoice = {
            id: invId,
            invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: trip.customerId,
            clientName: trip.customerName,
            tripId: trip.id,
            contractId: trip.contractId,
            issueDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            amount,
            taxAmount: tax,
            totalAmount: amount + tax,
            balanceDue: amount + tax,
            status: 'issued',
            vertical: trip.vertical,
            items: [
              {
                description: `Linehaul haulage billing for trip ${trip.tripCode} (${trip.origin} ➔ ${trip.destination})`,
                quantity: 1,
                unitPrice: amount,
                total: amount,
              },
            ],
          };
          MOCK_INVOICES.unshift(newInv);
          trip.invoiceId = invId;
        }
      }

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
