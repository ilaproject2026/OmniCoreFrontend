import { apiClient, tenantStorage } from './client';
import { Booking, Trip, TripExpense, TripStatus } from '../types';

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

    // If customer name is provided, register them to CRM
    if (candidateName) {
      const createPayload = {
        company_name: candidateName,
        name: candidateName,
        contact_person: '',
        email: contactInfo?.email || '',
        phone: contactInfo?.phone || '',
        address: contactInfo?.address || '',
        credit_limit: 0,
      };
      const newCustRes = await apiClient.post<any>('/crm/customers/', createPayload);
      const newId = newCustRes.data?.id;
      if (isUuid(newId)) {
        return newId;
      }
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
    customerName: data.customer_name || data.customerName || data.customer?.company_name || 'Client',
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
  const custName = data.customer_name || data.customerName || data.customer?.company_name || 'Commercial Shipper';
  const vehId = typeof data.vehicle === 'string' ? data.vehicle : data.vehicle?.id;
  const vehReg = data.vehicle_reg || data.vehicleReg || data.vehicle?.registration_number || '';
  const drvId = typeof data.driver === 'string' ? data.driver : data.driver?.id;
  const drvName = data.driver_name || data.driverName || (data.driver ? `${data.driver.first_name || ''} ${data.driver.last_name || ''}`.trim() : 'Assigned Driver');

  return {
    ...data,
    id: data.id || `trip_${Math.random().toString(36).substring(2, 7)}`,
    tripCode: data.trip_number || data.tripCode || `TRP-${data.id || '2026'}`,
    tenantId: data.tenant_id || data.tenantId || '',
    bookingId: typeof data.booking === 'string' ? data.booking : data.booking?.id,
    customerId: custId,
    customerName: custName,
    vehicleId: vehId,
    vehicleReg: vehReg,
    driverId: drvId,
    driverName: drvName,
    driverPhone: data.driver_phone || data.driverPhone || '',
    origin: data.origin || '',
    destination: data.destination || '',
    distanceKm: Number(data.distance_km ?? data.distanceKm ?? 0),
    status: (data.status || 'dispatched').toLowerCase() as TripStatus,
    startTime: data.actual_start || data.scheduled_start || data.startTime || new Date().toISOString(),
    estimatedArrival: data.scheduled_end || data.estimatedArrival || '',
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

    const activeTenantId = tenantStorage.getActiveTenantId();
    if (activeTenantId && activeTenantId.length > 20) {
      queryParams.tenant = activeTenantId;
      queryParams.tenant_id = activeTenantId;
    }

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
    let raw: any[] = Array.isArray(response.data) ? response.data : (response.data?.results || response.data?.data || []);
    if (activeTenantId) {
      raw = raw.filter((item: any) => {
        const itemTenant = item.tenant_id || item.tenant_uuid || (typeof item.tenant === 'string' ? item.tenant : item.tenant?.id);
        return !itemTenant || itemTenant === activeTenantId;
      });
    }
    return raw.map(normalizeBookingResponse);
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

    let response;
    try {
      response = await apiClient.post<any>('/bookings/', backendData);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        response = await apiClient.post<any>('/trips/bookings/', backendData);
      } else {
        if (err?.status === 400 || err?.response?.status === 400 || err?.errors || err?.code === 'VALIDATION_ERROR') {
          const backendMessage =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            'Booking creation failed on backend validation.';
          throw new Error(backendMessage);
        }
        throw err;
      }
    }
    return normalizeBookingResponse(response.data);
  },

  getTrips: async (params?: { status?: string; vehicleId?: string; search?: string }): Promise<Trip[]> => {
    const activeTenantId = tenantStorage.getActiveTenantId();
    const queryParams: Record<string, any> = {
      status: params?.status && params.status !== 'all' ? params.status.toUpperCase() : undefined,
      vehicle: isUuid(params?.vehicleId) ? params?.vehicleId : undefined,
      search: params?.search || undefined,
    };
    if (activeTenantId && activeTenantId.length > 20) {
      queryParams.tenant = activeTenantId;
      queryParams.tenant_id = activeTenantId;
    }

    const response = await apiClient.get<any>('/trips/', {
      params: queryParams,
    });
    let rawList: any[] = Array.isArray(response.data)
      ? response.data
      : (response.data?.results || response.data?.data || []);

    if (activeTenantId) {
      rawList = rawList.filter((item: any) => {
        const itemTenant = item.tenant_id || item.tenant_uuid || (typeof item.tenant === 'string' ? item.tenant : item.tenant?.id);
        return !itemTenant || itemTenant === activeTenantId;
      });
    }

    return rawList.map(normalizeTripResponse);
  },

  getTripById: async (id: string): Promise<Trip> => {
    const response = await apiClient.get<any>(`/trips/${id}/`);
    return normalizeTripResponse(response.data);
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
    // 1. Resolve booking details from backend if available
    let bk: Booking | null = null;
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
      // Continue
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
    if (isUuid(driverId)) {
      tripPayload.driver = driverId;
    }

    try {
      // Create trip record via standard POST /api/v1/trips/ as SCHEDULED
      const response = await apiClient.post<any>('/trips/', tripPayload);
      const createdTrip = normalizeTripResponse(response.data);

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
      throw err;
    }
  },

  updateTripStatus: async (
    tripId: string,
    status: TripStatus,
    note?: string,
    extraData?: { start_odometer?: number; end_odometer?: number; reason?: string }
  ): Promise<Trip> => {
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
      throw err;
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
  },
};
