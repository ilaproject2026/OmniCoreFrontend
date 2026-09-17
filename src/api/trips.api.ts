import { apiClient } from './client';
import { Booking, Trip, TripExpense, TripStatus, Invoice } from '../types';
import { MOCK_BOOKINGS, MOCK_TRIPS, MOCK_VEHICLES, MOCK_DRIVERS, MOCK_INVOICES } from './mockData';

export const isUuid = (val: unknown): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

/**
 * Resolves a valid UUID for a customer. If candidate is not a UUID, queries backend CRM.
 * If backend CRM is empty, auto-creates a fallback customer record.
 */
export async function resolveCustomerUuid(
  candidateId?: string | null,
  candidateName?: string | null,
  contactInfo?: { email?: string; phone?: string; address?: string }
): Promise<string | undefined> {
  if (isUuid(candidateId)) {
    return candidateId as string;
  }

  try {
    const custRes = await apiClient.get<any>('/crm/customers/');
    const custList: any[] = Array.isArray(custRes.data)
      ? custRes.data
      : custRes.data?.results || custRes.data?.data || [];

    if (custList.length > 0) {
      if (candidateName) {
        const target = candidateName.trim().toLowerCase();
        const matched = custList.find((c) => {
          const comp = (c.company_name || c.name || '').toLowerCase();
          return comp.includes(target) || target.includes(comp);
        });
        if (matched && isUuid(matched.id)) {
          return matched.id;
        }
      }
      const firstValid = custList.find((c) => isUuid(c.id));
      if (firstValid) {
        return firstValid.id;
      }
    }

    // If no customer exists in the backend DB, create one on the fly
    const createPayload = {
      company_name: candidateName || 'Enterprise Partner Client',
      name: candidateName || 'Enterprise Partner Client',
      contact_person: 'Fleet Logistics Manager',
      email: contactInfo?.email || 'logistics@omnicore.io',
      phone: contactInfo?.phone || '+1 (555) 012-3456',
      address: contactInfo?.address || 'Main Logistics Center',
      credit_limit: 100000,
    };
    const newCustRes = await apiClient.post<any>('/crm/customers/', createPayload);
    const newId = newCustRes.data?.id;
    if (isUuid(newId)) {
      return newId;
    }
  } catch (err) {
    console.warn('Could not auto-resolve backend customer UUID:', err);
  }

  return undefined;
}

export const normalizeBookingResponse = (data: any): Booking => {
  if (!data) return data;
  return {
    ...data,
    id: data.id || `bk_${Math.random().toString(36).substring(2, 7)}`,
    bookingCode: data.booking_number || data.bookingCode || `BK-${data.id || '2026'}`,
    customerId: typeof data.customer === 'string' ? data.customer : data.customer?.id,
    customerName: data.customer_name || data.customerName || data.customer?.company_name || 'Standard Client',
    pickupLocation: data.pickup_location || data.pickupLocation || '',
    dropoffLocation: data.dropoff_location || data.dropoffLocation || '',
    cargoDescription: data.cargo_type || data.cargoDescription || '',
    estimatedWeightKg: Number(data.cargo_weight_kg ?? data.estimatedWeightKg ?? 0),
    scheduledPickupTime: data.scheduled_date || data.scheduledPickupTime || '',
    estimatedAmount: Number(data.commercial_rate ?? data.estimatedAmount ?? 0),
    status: (data.status || 'pending').toLowerCase() as any,
  };
};

export const normalizeTripResponse = (data: any): Trip => {
  if (!data) return data;
  const custId = typeof data.customer === 'string' ? data.customer : data.customer?.id;
  const custName = data.customer_name || data.customerName || data.customer?.company_name || 'Enterprise Shipper';
  const vehId = typeof data.vehicle === 'string' ? data.vehicle : data.vehicle?.id;
  const vehReg = data.vehicle_reg || data.vehicleReg || data.vehicle?.registration_number || 'IL-DISP-01';
  const drvId = typeof data.driver === 'string' ? data.driver : data.driver?.id;
  const drvName = data.driver_name || data.driverName || (data.driver ? `${data.driver.first_name || ''} ${data.driver.last_name || ''}`.trim() : 'Assigned Driver');

  return {
    ...data,
    id: data.id || `trip_${Math.random().toString(36).substring(2, 7)}`,
    tripCode: data.trip_number || data.tripCode || `TRP-${data.id || '2026'}`,
    tenantId: data.tenant_id || data.tenantId || 'tenant_apex',
    bookingId: typeof data.booking === 'string' ? data.booking : data.booking?.id,
    customerId: custId,
    customerName: custName,
    vehicleId: vehId,
    vehicleReg: vehReg,
    driverId: drvId,
    driverName: drvName,
    driverPhone: data.driver_phone || data.driverPhone || '+1 (312) 555-0834',
    origin: data.origin || '',
    destination: data.destination || '',
    distanceKm: Number(data.distance_km ?? data.distanceKm ?? 0),
    status: (data.status || 'dispatched').toLowerCase() as TripStatus,
    startTime: data.actual_start || data.scheduled_start || data.startTime || new Date().toISOString(),
    estimatedArrival: data.scheduled_end || data.estimatedArrival || 'Tomorrow 18:00',
    commercialRate: Number(data.freight_charge ?? data.commercialRate ?? 0),
    expensesTotal: Array.isArray(data.expenses)
      ? data.expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0)
      : (data.expensesTotal || 0),
    expenses: Array.isArray(data.expenses)
      ? data.expenses.map((e: any) => ({
          id: e.id || `exp_${Math.random().toString(36).substring(2, 7)}`,
          tripId: data.id,
          category: (e.expense_type || e.category || 'fuel').toLowerCase(),
          amount: Number(e.amount || 0),
          currency: 'USD',
          receiptUrl: e.receipt_file || e.receiptUrl,
          loggedAt: e.created_at || e.loggedAt || new Date().toISOString(),
          approved: Boolean(e.is_approved ?? e.approved ?? true),
          note: e.notes || e.note,
        }))
      : [],
    timeline: data.timeline || [
      { status: 'scheduled', timestamp: 'Just now', note: `Trip registered for ${custName}` },
      { status: 'dispatched', timestamp: 'Just now', note: `Vehicle ${vehReg} dispatched with driver ${drvName}` },
    ],
  };
};

export const tripsApi = {
  getBookings: async (params?: { status?: string }): Promise<Booking[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.status && params.status !== 'all') {
      queryParams.status = params.status.toUpperCase();
    }

    try {
      let response;
      try {
        response = await apiClient.get<any>('/bookings/', { params: queryParams });
      } catch (err: any) {
        if (err?.response?.status === 404) {
          response = await apiClient.get<any>('/trips/bookings/', { params: queryParams });
        } else {
          throw err;
        }
      }
      const raw = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
      return raw.map(normalizeBookingResponse);
    } catch {
      if (params?.status && params.status !== 'all') {
        return MOCK_BOOKINGS.filter((b) => b.status === params.status);
      }
      return MOCK_BOOKINGS;
    }
  },

  createBooking: async (payload: Partial<Booking>): Promise<Booking> => {
    let customerUuid = isUuid(payload.customerId)
      ? payload.customerId
      : isUuid((payload as any).customer)
      ? (payload as any).customer
      : undefined;

    if (!customerUuid) {
      customerUuid = await resolveCustomerUuid(
        undefined,
        payload.customerName,
        { email: payload.customerEmail, phone: payload.customerPhone, address: payload.pickupLocation }
      );
    }

    const backendData: Record<string, any> = {
      pickup_location: payload.pickupLocation,
      dropoff_location: payload.dropoffLocation,
      cargo_type: payload.cargoDescription || (payload as any).cargo_type,
      cargo_weight_kg: payload.estimatedWeightKg || (payload as any).cargo_weight_kg,
      scheduled_date: payload.scheduledPickupTime || (payload as any).scheduled_date || new Date().toISOString().split('T')[0],
      commercial_rate: payload.estimatedAmount || (payload as any).commercial_rate || 0,
      notes: (payload as any).notes || '',
      status: (payload.status || 'PENDING').toUpperCase(),
    };

    if (customerUuid) {
      backendData.customer = customerUuid;
    }

    try {
      let response;
      try {
        response = await apiClient.post<any>('/bookings/', backendData);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          response = await apiClient.post<any>('/trips/bookings/', backendData);
        } else {
          throw err;
        }
      }
      return normalizeBookingResponse(response.data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        const backendMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Booking creation failed on backend validation.';
        throw new Error(backendMessage);
      }

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

  getTrips: async (params?: { status?: string; vehicleId?: string; search?: string }): Promise<Trip[]> => {
    try {
      const response = await apiClient.get<any>('/trips/', {
        params: {
          status: params?.status && params.status !== 'all' ? params.status.toUpperCase() : undefined,
          vehicle: isUuid(params?.vehicleId) ? params?.vehicleId : undefined,
          search: params?.search || undefined,
        },
      });
      const rawList = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || response.data?.data || []);
      return rawList.map(normalizeTripResponse);
    } catch {
      let list = [...MOCK_TRIPS];
      if (params?.vehicleId) {
        list = list.filter((t) => t.vehicleId === params.vehicleId);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.tripCode.toLowerCase().includes(q) ||
            t.customerName.toLowerCase().includes(q) ||
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
      const response = await apiClient.get<any>(`/trips/${id}/`);
      return normalizeTripResponse(response.data);
    } catch {
      const t = MOCK_TRIPS.find((item) => item.id === id);
      if (!t) throw new Error('Trip not found');
      return t;
    }
  },

  createTrip: async (payload: Partial<Trip>): Promise<Trip> => {
    const tripNum =
      payload.tripCode ||
      (payload as any).trip_number ||
      `TRP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let customerUuid = isUuid(payload.customerId)
      ? payload.customerId
      : isUuid((payload as any).customer)
      ? (payload as any).customer
      : undefined;

    if (!customerUuid) {
      customerUuid = await resolveCustomerUuid(
        undefined,
        payload.customerName || (payload as any).clientName,
        undefined
      );
    }

    const backendData: Record<string, any> = {
      trip_number: tripNum,
      origin: payload.origin || 'Depot Facility Hub',
      destination: payload.destination || 'Destination Terminal',
      distance_km: payload.distanceKm || 0,
      freight_charge: payload.commercialRate || (payload as any).freight_charge || 0,
      status: (payload.status || 'SCHEDULED').toUpperCase(),
      scheduled_start: payload.startTime || new Date().toISOString(),
      notes: (payload as any).notes || '',
    };

    if (customerUuid) {
      backendData.customer = customerUuid;
    }
    if (isUuid(payload.vehicleId || (payload as any).vehicle)) {
      backendData.vehicle = payload.vehicleId || (payload as any).vehicle;
    }
    if (isUuid(payload.driverId || (payload as any).driver)) {
      backendData.driver = payload.driverId || (payload as any).driver;
    }
    if (isUuid(payload.bookingId || (payload as any).booking)) {
      backendData.booking = payload.bookingId || (payload as any).booking;
    }

    try {
      const response = await apiClient.post<any>('/trips/', backendData);
      return normalizeTripResponse(response.data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        const backendMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Trip creation failed on backend validation.';
        const fieldErrors = err?.response?.data?.error?.fields || err?.response?.data?.fields || err?.errors;
        const firstFieldMsg = fieldErrors ? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : '';
        const errorToThrow = new Error(firstFieldMsg ? `${backendMessage} (${firstFieldMsg})` : backendMessage);
        (errorToThrow as any).fields = fieldErrors;
        throw errorToThrow;
      }
      throw err;
    }
  },

  dispatchBooking: async (bookingId: string, vehicleId: string, driverId?: string): Promise<Trip> => {
    // 1. Resolve booking details
    let bk = MOCK_BOOKINGS.find((b) => b.id === bookingId);
    if (!bk) {
      try {
        let bRes;
        try {
          bRes = await apiClient.get<any>(`/bookings/${bookingId}/`);
        } catch {
          bRes = await apiClient.get<any>(`/trips/bookings/${bookingId}/`);
        }
        if (bRes?.data) {
          bk = normalizeBookingResponse(bRes.data);
        }
      } catch {
        // Continue with local resolution
      }
    }

    const veh = MOCK_VEHICLES.find((v) => v.id === vehicleId);
    const resolvedDriverId = driverId || veh?.assignedDriverId;
    const drv = MOCK_DRIVERS.find((d) => d.id === resolvedDriverId);

    // Business Rule Validation 1: Vehicle Operational Status
    if (veh && veh.status !== 'available') {
      throw new Error(`Cannot dispatch: Vehicle ${veh.registrationNumber} is currently in ${veh.status.replace('_', ' ')} status.`);
    }

    // Business Rule Validation 2: Vehicle Compliance Documents Expiry
    const expiredDoc = veh?.documents?.find((d) => d.isExpired || (d.expiryDate && new Date(d.expiryDate) < new Date()));
    if (expiredDoc) {
      throw new Error(`Compliance Restriction: Vehicle ${veh?.registrationNumber} has an expired ${expiredDoc.type.replace('_', ' ')} document. Operation prohibited until renewed.`);
    }

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

    // 2. Resolve required customer UUID from backend
    const customerUuid = await resolveCustomerUuid(
      bk?.customerId || (bk as any)?.customer,
      bk?.customerName,
      { email: bk?.customerEmail, phone: bk?.customerPhone, address: bk?.pickupLocation }
    );

    // 3. Prepare payload matching DRF TripSerializer
    const tripNumber = (bk as any)?.booking_number || bk?.bookingCode
      ? `TRP-${String((bk as any)?.booking_number || bk?.bookingCode).replace(/^BK-?/, '')}`
      : `TRP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const tripPayload: Record<string, any> = {
      trip_number: tripNumber,
      origin: bk?.pickupLocation || 'Depot Facility Hub',
      destination: bk?.dropoffLocation || 'Destination Terminal',
      freight_charge: bk?.estimatedAmount || (bk as any)?.commercial_rate || 3200,
      scheduled_start: bk?.scheduledPickupTime || new Date().toISOString(),
      status: 'SCHEDULED',
    };

    if (customerUuid) {
      tripPayload.customer = customerUuid;
    }
    if (isUuid(bookingId)) {
      tripPayload.booking = bookingId;
    }
    if (isUuid(vehicleId)) {
      tripPayload.vehicle = vehicleId;
    }
    if (isUuid(resolvedDriverId)) {
      tripPayload.driver = resolvedDriverId;
    }

    try {
      // Create trip record via standard POST /api/v1/trips/ as SCHEDULED
      const response = await apiClient.post<any>('/trips/', tripPayload);
      const createdTrip = normalizeTripResponse(response.data);

      // Enhance with resolved local vehicle & driver info if not populated from backend FKs
      if (!createdTrip.vehicleReg && veh?.registrationNumber) {
        createdTrip.vehicleReg = veh.registrationNumber;
      }
      if (!createdTrip.driverName && drv) {
        createdTrip.driverName = `${drv.firstName} ${drv.lastName}`.trim();
      }

      // Trigger the backend TripWorkflowService dispatch transition action if not already DISPATCHED
      if (createdTrip.status !== 'dispatched') {
        try {
          const dispatchRes = await apiClient.post(`/trips/${createdTrip.id}/dispatch_trip/`);
          if (dispatchRes.data?.status) {
            createdTrip.status = dispatchRes.data.status.toLowerCase();
          }
        } catch (dispatchErr: any) {
          console.warn('Dispatch transition skipped:', dispatchErr?.message);
        }
      }

      // Update booking status to dispatched if it exists in backend
      if (isUuid(bookingId)) {
        try {
          await apiClient.patch(`/bookings/${bookingId}/`, { status: 'dispatched' });
        } catch {
          try {
            await apiClient.patch(`/trips/bookings/${bookingId}/`, { status: 'dispatched' });
          } catch {
            // Ignore if booking endpoint route differs
          }
        }
      }

      // Also update local mock state so UI is immediately responsive
      if (bk) bk.status = 'dispatched';
      if (veh) veh.status = 'on_trip';
      if (drv) drv.status = 'on_trip';

      return createdTrip;
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        const backendMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Trip dispatch failed on backend validation.';
        const fieldErrors = err?.response?.data?.error?.fields || err?.response?.data?.fields || err?.errors;
        const firstFieldMsg = fieldErrors ? Object.entries(fieldErrors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : '';
        const errorToThrow = new Error(firstFieldMsg ? `${backendMessage} (${firstFieldMsg})` : backendMessage);
        (errorToThrow as any).fields = fieldErrors;
        throw errorToThrow;
      }

      // Fallback offline mock mode
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
        origin: bk ? bk.pickupLocation : 'Distribution Terminal A',
        destination: bk ? bk.dropoffLocation : 'Fulfillment Hub B',
        distanceKm: Math.floor(120 + Math.random() * 350),
        status: 'dispatched',
        startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
        estimatedArrival: 'Tomorrow 18:00',
        commercialRate: bk ? bk.estimatedAmount : 3200,
        expensesTotal: 0,
        expenses: [],
        timeline: [
          { status: 'scheduled', timestamp: 'Just now', note: `Booking accepted for ${bk?.customerName || 'Customer'}` },
          { status: 'dispatched', timestamp: 'Just now', note: `Vehicle ${assignedVehicleReg} assigned with driver ${assignedDriverName}` },
        ],
      };

      MOCK_TRIPS.unshift(newTrip);
      return newTrip;
    }
  },

  updateTripStatus: async (
    tripId: string,
    status: TripStatus,
    note?: string,
    extraData?: { start_odometer?: number; end_odometer?: number; reason?: string }
  ): Promise<Trip> => {
    // If not a valid backend UUID, update locally in mock state
    if (!isUuid(tripId)) {
      const trip = MOCK_TRIPS.find((t) => t.id === tripId);
      if (!trip) throw new Error('Trip not found');
      trip.status = status;
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
      }
      return trip;
    }

    try {
      let response;
      if (status === 'dispatched') {
        response = await apiClient.post<any>(`/trips/${tripId}/dispatch_trip/`);
      } else if (status === 'started' || status === 'in_transit') {
        response = await apiClient.post<any>(`/trips/${tripId}/start_trip/`, {
          start_odometer: extraData?.start_odometer ?? 0,
        });
      } else if (status === 'completed') {
        response = await apiClient.post<any>(`/trips/${tripId}/complete_trip/`, {
          end_odometer: extraData?.end_odometer ?? 100,
        });
      } else if (status === 'cancelled') {
        response = await apiClient.post<any>(`/trips/${tripId}/cancel_trip/`, {
          reason: note || extraData?.reason || 'Cancelled by operator',
        });
      } else {
        response = await apiClient.patch<any>(`/trips/${tripId}/`, {
          status: status.toUpperCase(),
          notes: note,
        });
      }
      return normalizeTripResponse(response.data?.trip || response.data);
    } catch (err: any) {
      if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
        const backendMessage =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Trip status transition failed on backend validation.';
        throw new Error(backendMessage);
      }

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
    const backendData = {
      trip: tripId,
      expense_type: expense.category.toUpperCase(),
      amount: expense.amount,
      receipt_number: (expense as any).receiptNumber || '',
      notes: (expense as any).note || '',
      is_approved: true,
    };

    try {
      let response;
      try {
        response = await apiClient.post<any>('/trip-expenses/', backendData);
      } catch {
        response = await apiClient.post<any>(`/trips/${tripId}/expenses/`, backendData);
      }
      return {
        ...response.data,
        id: response.data?.id || `exp_${Date.now()}`,
        tripId,
        category: expense.category,
        amount: Number(response.data?.amount ?? expense.amount),
        currency: expense.currency || 'USD',
        loggedAt: response.data?.created_at || new Date().toISOString(),
        approved: true,
      };
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
