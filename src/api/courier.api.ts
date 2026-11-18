import { apiClient } from './client';
import {
  CourierShipment,
  CourierShipmentStatus,
  ProofOfDelivery,
  MultiPointPickup,
  DeliveryHub,
  SortingRecord,
  CourierAgent,
  AgentCommission,
  AgentPayout,
  CourierExpenseRecord,
  HubConvoy,
} from '../types';

const rowsFrom = (data: any): any[] => Array.isArray(data) ? data : data?.results || data?.data || [];

async function fetchAllRows(path: string, params: Record<string, any> = {}): Promise<any[]> {
  const rows: any[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await apiClient.get<any>(path, { params: { ...params, page, page_size: 100 } });
    rows.push(...rowsFrom(response.data));
    totalPages = Number(response.data?.total_pages || 1);
    page += 1;
  } while (page <= totalPages);
  return rows;
}

const toUiStatus = (value?: string): CourierShipmentStatus => {
  const status = (value || '').toLowerCase();
  const map: Record<string, CourierShipmentStatus> = {
    booked: 'pickup_pending', pickup_assigned: 'pickup_assigned', pickup_in_progress: 'pickup_assigned',
    picked_up: 'picked_up', at_hub: 'at_origin_hub', sorting_pending: 'sorting_pending', sorting: 'sorting_pending',
    sorted: 'sorted', in_transit: 'in_transit', destination_hub: 'at_destination_hub',
    out_for_delivery: 'out_for_delivery', delivery_attempted: 'delivery_failed', delivered: 'delivered',
    delivery_failed: 'delivery_failed', returned: 'returned', cancelled: 'returned',
  };
  return map[status] || 'pickup_pending';
};

const toServiceType = (value?: string): CourierShipment['serviceType'] => {
  const map: Record<string, CourierShipment['serviceType']> = {
    same_day: 'same_day', express: 'next_day_express', overnight: 'next_day_express', standard: 'standard_ground', economy: 'economy',
  };
  return map[(value || '').toLowerCase()] || 'standard_ground';
};

const normalizeShipment = (raw: any): CourierShipment => {
  if (raw?.sender && raw?.receiver && raw?.parcel) return raw;
  const parcel = raw?.parcels?.[0];
  const dimensions = String(raw?.dimensions || parcel?.dimensions || '').split(/[x×]/i).map(Number);
  const events = raw?.tracking_events || raw?.timeline || [];
  const delivery = raw?.delivery_task || {};
  return {
    ...raw,
    id: raw?.id,
    awbNumber: raw?.awb_number || raw?.awbNumber || '',
    trackingNumber: raw?.awb_number || raw?.trackingNumber || '',
    tenantId: raw?.tenant || raw?.tenant_id || '',
    sender: {
      name: raw?.sender_name || '', phone: raw?.sender_phone || '', email: raw?.sender_email || '',
      address: raw?.sender_address || '', city: raw?.sender_city || '', postalCode: raw?.sender_postal_code || '',
    },
    receiver: {
      name: raw?.receiver_name || '', phone: raw?.receiver_phone || '', email: raw?.receiver_email || '',
      address: raw?.delivery_address || '', city: raw?.delivery_city || '', postalCode: raw?.delivery_postal_code || '',
    },
    parcel: {
      weightKg: Number(raw?.weight_kg ?? parcel?.weight_kg ?? 0),
      lengthCm: dimensions[0] || 0, widthCm: dimensions[1] || 0, heightCm: dimensions[2] || 0,
      declaredValue: Number(raw?.declared_value ?? 0), description: parcel?.description || String(raw?.notes || '').replace(/\s*\|\s*FRAGILE/i, '') || 'Parcel',
      isFragile: /\bFRAGILE\b/i.test(raw?.notes || ''),
    },
    serviceType: toServiceType(raw?.service_type || raw?.serviceType),
    currentHubId: raw?.current_hub,
    destinationHubId: raw?.destination_hub,
    assignedAgentId: raw?.assigned_agent,
    assignedAgentName: raw?.assigned_agent_name || '',
    currentStatus: toUiStatus(raw?.status || raw?.currentStatus),
    expectedDeliveryDate: raw?.expected_delivery || raw?.expectedDeliveryDate || '',
    invoiceReference: raw?.invoice,
    timeline: events.map((event: any) => ({
      timestamp: event.timestamp || '', location: event.location || '',
      status: toUiStatus(event.status), description: event.description || event.event_type || '',
      actor: event.actor_name || event.actor || '',
    })),
    pod: delivery?.pod ? {
      confirmationMethod: String(delivery.pod.verification_method || 'OTP').toLowerCase() as any,
      status: delivery.pod.otp_verified ? 'pod_verified' : 'pod_pending',
      recipientName: delivery.pod.recipient_name || '',
      deliveryTimestamp: delivery.pod.delivery_timestamp || '', notes: delivery.pod.notes || '',
      signatureDataUrl: delivery.pod.digital_signature_file || undefined,
    } : undefined,
    deliveryAttempts: (delivery?.attempts || []).map((attempt: any) => ({
      attemptNumber: attempt.attempt_number, timestamp: attempt.timestamp, reason: attempt.reason, agentName: '',
    })),
    createdAt: raw?.created_at || '', updatedAt: raw?.updated_at || '',
  } as CourierShipment;
};

const normalizeHub = (raw: any): DeliveryHub => ({
  ...raw, postalCode: raw?.postal_code || '', capacityParcels: Number(raw?.capacity_parcels ?? 0),
  capacitySqft: Number(raw?.capacity_sqft ?? 0),
  currentParcelsCount: Number(raw?.current_parcels_count ?? 0), incomingShipmentsCount: Number(raw?.incoming_shipments_count ?? 0),
  pendingSortingCount: Number(raw?.pending_sorting_count ?? 0), sortedShipmentsCount: Number(raw?.sorted_shipments_count ?? 0),
  outgoingShipmentsCount: Number(raw?.outgoing_shipments_count ?? 0), managerName: raw?.manager_name || '',
  status: String(raw?.status || 'ACTIVE').toLowerCase() === 'active' ? 'operational' : 'maintenance',
});

const normalizeConvoy = (raw: any): HubConvoy => ({
  id: raw.id, convoyNumber: raw.convoy_number || '', originHubId: raw.origin_hub || '',
  originHubName: raw.origin_hub_name || '', destinationHubId: raw.destination_hub || '',
  destinationHubName: raw.destination_hub_name || '', vehicleId: raw.vehicle || undefined,
  vehicleRegistration: raw.vehicle_registration || '', driverId: raw.driver || undefined,
  driverName: raw.driver_name || '', shipmentIds: raw.shipments || [], shipmentAwbs: raw.shipment_awbs || [],
  status: String(raw.status || 'PLANNED').toLowerCase() as HubConvoy['status'],
  scheduledDeparture: raw.scheduled_departure || undefined, departedAt: raw.departed_at || undefined,
  arrivedAt: raw.arrived_at || undefined, notes: raw.notes || '',
});

const normalizeSortingRecord = (raw: any): SortingRecord => ({
  ...raw, awbNumber: raw?.shipment_awb || raw?.shipment?.awb_number || '',
  sourceHub: raw?.source_hub_name || '', destinationHub: raw?.destination_hub_name || '',
  sortingCategory: raw?.sorting_category || 'Air Express', status: String(raw?.status || 'RECEIVED').toLowerCase() as any,
  scannedAt: raw?.timestamp || '', scannedBy: raw?.operator_name || '',
});

const normalizePayout = (raw: any): AgentPayout => ({
  ...raw, payoutReference: raw?.payout_number || '', agentId: raw?.agent || '', agentName: raw?.agent_name || '',
  periodStart: raw?.period_start || '', periodEnd: raw?.period_end || '', grossEarnings: Number(raw?.gross_amount || 0),
  commission: Number(raw?.commission_amount || 0), expenses: Number(raw?.total_deductions || 0), adjustments: 0,
  netPayable: Number(raw?.net_payable || 0), status: String(raw?.status || 'PENDING').toLowerCase() as any,
  requestedAt: raw?.created_at || '', processedAt: raw?.paid_at || undefined,
});

const normalizeExpense = (raw: any): CourierExpenseRecord => ({
  id: raw.id, agentId: raw.agent || '', agentName: raw.agent_name || '',
  expenseType: raw.expense_type || '', amount: Number(raw.amount || 0),
  date: raw.date || '', notes: raw.notes || '', isApproved: Boolean(raw.is_approved),
});

export const courierApi = {
  getShipments: async (): Promise<CourierShipment[]> => {
    return (await fetchAllRows('/courier/shipments/')).map(normalizeShipment);
  },

  getShipmentByAwb: async (awbNumber: string): Promise<CourierShipment | null> => {
    const rows = await fetchAllRows('/courier/shipments/', { search: awbNumber });
    const shipment = rows.find((row: any) => row.awb_number === awbNumber || row.awbNumber === awbNumber);
    return shipment ? normalizeShipment(shipment) : null;
  },

  createShipment: async (data: Partial<CourierShipment>): Promise<CourierShipment> => {
    const raw = data as any;
    const serviceMap: Record<string, string> = {
      same_day: 'SAME_DAY', next_day_express: 'EXPRESS', standard_ground: 'STANDARD', economy: 'STANDARD',
    };
    const description = raw.parcel?.description || '';
    const notes = [description, raw.parcel?.isFragile ? 'FRAGILE' : ''].filter(Boolean).join(' | ');
    const payload = {
      sender_name: raw.sender?.name || '', sender_phone: raw.sender?.phone || '', sender_email: raw.sender?.email || '',
      sender_address: raw.sender?.address || '', sender_city: raw.sender?.city || '', sender_postal_code: raw.sender?.postalCode || '',
      receiver_name: raw.receiver?.name || '', receiver_phone: raw.receiver?.phone || '', receiver_email: raw.receiver?.email || '',
      delivery_address: raw.receiver?.address || '', delivery_city: raw.receiver?.city || '', delivery_postal_code: raw.receiver?.postalCode || '',
      service_type: serviceMap[raw.serviceType || 'standard_ground'] || 'STANDARD',
      weight_kg: Number(raw.parcel?.weightKg || 0),
      dimensions: [raw.parcel?.lengthCm, raw.parcel?.widthCm, raw.parcel?.heightCm].filter((x: any) => Number(x) > 0).join('x'),
      parcel_count: 1, declared_value: Number(raw.parcel?.declaredValue || 0), shipping_cost: 0,
      notes,
    };
    try {
      const response = await apiClient.post<any>('/courier/shipments/', payload);
      return normalizeShipment(response.data);
    } catch (error: any) {
      const body = error?.response?.data;
      const fields = body?.error?.fields || body?.fields || body;
      const details = fields && typeof fields === 'object'
        ? Object.entries(fields).filter(([key]) => key !== 'detail' && key !== 'message' && key !== 'code')
            .flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map((message) => `${key}: ${String(message)}`)).join(' | ')
        : '';
      throw new Error(details || body?.detail || body?.message || error?.message || 'Shipment creation failed.');
    }
  },

  assignShipmentAgent: async (id: string, agentId: string): Promise<CourierShipment> => {
    const response = await apiClient.post<any>(`/courier/shipments/${id}/assign-agent/`, { agent_id: agentId });
    return normalizeShipment(response.data);
  },

  updateShipmentStatus: async (
    id: string,
    status: CourierShipmentStatus,
    location?: string,
    note?: string
  ): Promise<CourierShipment> => {
    const response = await apiClient.post(`/courier/shipments/${id}/transition/`, {
      status: ({ pickup_pending: 'BOOKED', at_origin_hub: 'AT_HUB', at_destination_hub: 'DESTINATION_HUB' } as Record<string, string>)[status] || status.toUpperCase(),
      description: note || '',
      location: location || '',
    });
    const updated = await apiClient.get<any>(`/courier/shipments/${id}/`);
    return normalizeShipment(updated.data);
  },

  verifyProofOfDelivery: async (
    id: string,
    pod: ProofOfDelivery
  ): Promise<CourierShipment> => {
    const shipmentResponse = await apiClient.get<any>(`/courier/shipments/${id}/`);
    const deliveryId = shipmentResponse.data?.delivery_task?.id;
    if (!deliveryId) throw new Error('This shipment does not have a delivery task yet.');
    await apiClient.post(`/courier/deliveries/${deliveryId}/verify-pod/`, {
      otp: pod.otpCode || '',
      verification_method: pod.confirmationMethod === 'otp' ? 'OTP' : 'DIGITAL_SIGNATURE',
      recipient_name: pod.recipientName || '',
      signature_file: pod.signatureDataUrl || '',
      notes: pod.notes || '',
    });
    const updated = await apiClient.get<any>(`/courier/shipments/${id}/`);
    return normalizeShipment(updated.data);
  },

  recordDeliveryAttempt: async (
    id: string,
    reason: string,
    agentName: string
  ): Promise<CourierShipment> => {
    await apiClient.post(`/courier/shipments/${id}/attempts/`, { reason, agent_name: agentName });
    const response = await apiClient.get<any>(`/courier/shipments/${id}/`);
    return normalizeShipment(response.data);
  },

  // Multi-point pickups
  getMultiPointPickups: async (): Promise<MultiPointPickup[]> => {
    const response = { data: await fetchAllRows('/courier/pickups/') };
    const grouped = new Map<string, any[]>();
    rowsFrom(response.data).forEach((raw: any) => {
      const key = raw.shipment || raw.id;
      grouped.set(key, [...(grouped.get(key) || []), raw]);
    });
    return [...grouped.entries()].map(([shipmentId, rows]) => {
      const first = rows[0];
      const stops = rows.sort((a, b) => a.sequence - b.sequence).map((raw: any) => ({
        id: raw.id, sequenceNumber: raw.sequence || 1, locationName: raw.location_name || raw.contact_name || 'Pickup Stop',
        address: raw.address || '', contactPerson: raw.contact_name || '', contactPhone: raw.contact_phone || '',
        timeWindow: raw.scheduled_time || '', parcelCount: Number(raw.parcel_count || 1),
        status: String(raw.status || 'PENDING').toLowerCase() === 'completed' ? 'picked_up' : String(raw.status || 'PENDING').toLowerCase() as any,
        notes: raw.notes || '',
      }));
      const states = rows.map((r: any) => String(r.status || 'PENDING').toLowerCase());
      return {
        id: shipmentId, shipmentId, shipmentAwb: first.shipment_awb || '',
        pickupCode: `PU-${String(first.shipment_awb || shipmentId).slice(-8).toUpperCase()}`,
        tenantId: first.tenant || '', assignedAgentId: first.assigned_agent || undefined,
        assignedAgentName: first.agent_name || '', stops, destinationHubName: first.destination_hub_name || 'Destination not assigned',
        totalParcels: stops.reduce((sum, stop) => sum + stop.parcelCount, 0),
        overallStatus: states.every((s: string) => s === 'completed') ? 'completed' : states.some((s: string) => s === 'in_progress') ? 'in_progress' : states.some((s: string) => s === 'assigned') ? 'assigned' : 'pending',
        createdAt: first.created_at || '',
      } as MultiPointPickup;
    });
  },

  createMultiPointPickup: async (data: Partial<MultiPointPickup>): Promise<MultiPointPickup> => {
    const response = await apiClient.post<any>('/courier/pickups/batch/', {
      shipment_id: data.shipmentId,
      assigned_agent_id: data.assignedAgentId || null,
      stops: (data.stops || []).map((stop) => ({
        location_name: stop.locationName, address: stop.address, contact_name: stop.contactPerson,
        contact_phone: stop.contactPhone, scheduled_time: new Date(stop.timeWindow).toISOString(),
        parcel_count: stop.parcelCount, notes: stop.notes || '',
      })),
    });
    const createdRows = rowsFrom(response.data);
    return (await courierApi.getMultiPointPickups()).find((batch) => batch.shipmentId === data.shipmentId)
      || { id: data.shipmentId || '', pickupCode: createdRows[0]?.shipment_awb || '', tenantId: '', stops: [], destinationHubName: '', totalParcels: 0, overallStatus: 'pending', createdAt: '' };
  },

  updatePickupStopStatus: async (
    pickupId: string,
    stopId: string,
    status: 'pending' | 'assigned' | 'in_progress' | 'picked_up' | 'failed' | 'completed'
  ): Promise<MultiPointPickup> => {
    const actionByStatus: Partial<Record<typeof status, string>> = {
      assigned: 'assign',
      in_progress: 'start',
      picked_up: 'complete',
      completed: 'complete',
      failed: 'fail',
    };
    const action = actionByStatus[status];
    if (!action) throw new Error(`Pickup status "${status}" cannot be set through the backend workflow.`);
    await apiClient.post(`/courier/pickups/${stopId}/${action}/`, {});
    const pickups = await courierApi.getMultiPointPickups();
    return pickups.find((pickup) => pickup.id === pickupId) as MultiPointPickup;
  },

  // Delivery Hubs
  getDeliveryHubs: async (): Promise<DeliveryHub[]> => {
    return (await fetchAllRows('/courier/hubs/')).map(normalizeHub);
  },

  createDeliveryHub: async (data: Partial<DeliveryHub>): Promise<DeliveryHub> => {
    const raw = data as any;
    const response = await apiClient.post<any>('/courier/hubs/', {
      name: raw.name, code: raw.code, address: raw.address || '', city: raw.city || '', state: raw.state || '',
      postal_code: raw.postalCode || '', contact_phone: raw.contactPhone || '', contact_email: raw.contactEmail || '',
      capacity_sqft: raw.capacitySqft || 0, status: String(raw.status || 'ACTIVE').toUpperCase(),
    });
    return normalizeHub(response.data);
  },

  // Sorting
  getSortingRecords: async (): Promise<SortingRecord[]> => {
    return (await fetchAllRows('/courier/sorting/')).map(normalizeSortingRecord);
  },

  scanAndSortShipment: async (
    awbNumber: string,
    sourceHub: string,
    destinationHub: string,
    sortingCategory: SortingRecord['sortingCategory'],
    scannedBy: string
  ): Promise<SortingRecord> => {
    const shipments = await fetchAllRows('/courier/shipments/', { search: awbNumber });
    const shipment = shipments.find((item: any) => item.awb_number === awbNumber || item.awbNumber === awbNumber) || shipments[0];
    if (!shipment?.id) throw new Error(`Shipment ${awbNumber} was not found.`);
    const response = await apiClient.post('/courier/sorting/process/', {
      shipment_id: shipment.id,
      source_hub_id: sourceHub,
      destination_hub_id: destinationHub,
      sorting_category: sortingCategory.toUpperCase(),
      notes: `Scanned by ${scannedBy}`,
    });
    return normalizeSortingRecord(response.data);
  },

  // Courier Agents & Payouts
  getCourierAgents: async (): Promise<CourierAgent[]> => {
    return (await fetchAllRows('/courier/agents/')).map((raw: any) => ({
      ...raw, name: raw.display_name || raw.agent_code || 'Courier Agent', phone: raw.driver_phone || '', email: raw.driver_email || '',
      assignedZone: raw.service_area || '', status: String(raw.status || 'ACTIVE').toLowerCase() === 'active' ? 'available' : 'offline',
      assignedDeliveriesCount: Number(raw.assigned_deliveries_count || 0), completedDeliveriesCount: Number(raw.completed_deliveries_count || 0), failedDeliveriesCount: 0,
      commissionEarnedTotal: Number(raw.commission_earned_total || 0), expensesTotal: Number(raw.expenses_total || 0),
      pendingPayoutAmount: Number(raw.pending_payout_amount || 0), paidAmountTotal: Number(raw.paid_amount_total || 0),
      vehicleType: raw.vehicle_type || 'motorcycle', driverId: raw.driver, vehicleId: raw.vehicle,
      vehicleRegistration: raw.vehicle_registration || '', commissionRate: Number(raw.commission_rate_per_delivery || 0), currentHubId: raw.current_hub,
    }));
  },

  createCourierAgent: async (data: { agentCode: string; driverId: string; vehicleId?: string; serviceArea: string; commissionRate: number; currentHubId?: string }): Promise<CourierAgent> => {
    await apiClient.post<any>('/courier/agents/', {
      agent_code: data.agentCode, driver: data.driverId, vehicle: data.vehicleId || null,
      service_area: data.serviceArea, commission_rate_per_delivery: data.commissionRate,
      current_hub: data.currentHubId || null, status: 'ACTIVE',
    });
    const agents = await courierApi.getCourierAgents();
    return agents.find((agent) => agent.driverId === data.driverId) as CourierAgent;
  },

  updateAgentStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'): Promise<void> => {
    await apiClient.patch(`/courier/agents/${id}/`, { status });
  },

  getAgentCommissions: async (agentId?: string): Promise<AgentCommission[]> => {
    return (await fetchAllRows('/courier/commissions/', { agent: agentId })).map((raw: any) => ({
      id: raw.id, agentId: raw.agent, agentName: raw.agent_name || '', awbNumber: raw.shipment_awb || '',
      deliveryDate: raw.date || '', basePay: 0, commission: Number(raw.commission_amount || 0), bonus: 0,
      totalPayable: Number(raw.commission_amount || 0),
    }));
  },

  getAgentPayouts: async (): Promise<AgentPayout[]> => {
    return (await fetchAllRows('/courier/payouts/')).map(normalizePayout);
  },

  requestPayout: async (data: Partial<AgentPayout>): Promise<AgentPayout> => {
    const raw = data as any;
    const response = await apiClient.post<any>('/courier/payouts/process/', {
      agent_id: raw.agentId || raw.agent, period_start: raw.periodStart || raw.period_start,
      period_end: raw.periodEnd || raw.period_end, idempotency_key: raw.idempotencyKey || crypto.randomUUID(),
    });
    return normalizePayout(response.data);
  },

  approvePayout: async (payoutId: string): Promise<AgentPayout> => {
    const response = await apiClient.post<any>(`/courier/payouts/${payoutId}/approve/`);
    return normalizePayout(response.data);
  },

  payPayout: async (payoutId: string): Promise<AgentPayout> => {
    const response = await apiClient.post<any>(`/courier/payouts/${payoutId}/pay/`);
    return normalizePayout(response.data);
  },

  getHubConvoys: async (): Promise<HubConvoy[]> => {
    return (await fetchAllRows('/courier/convoys/')).map(normalizeConvoy);
  },

  createHubConvoy: async (data: Partial<HubConvoy>): Promise<HubConvoy> => {
    const response = await apiClient.post<any>('/courier/convoys/', {
      origin_hub: data.originHubId, destination_hub: data.destinationHubId,
      vehicle: data.vehicleId, driver: data.driverId, shipments: data.shipmentIds || [],
      scheduled_departure: data.scheduledDeparture || null, notes: data.notes || '',
    });
    return normalizeConvoy(response.data);
  },

  dispatchHubConvoy: async (id: string): Promise<HubConvoy> => {
    const response = await apiClient.post<any>(`/courier/convoys/${id}/dispatch/`);
    return normalizeConvoy(response.data);
  },

  arriveHubConvoy: async (id: string): Promise<HubConvoy> => {
    const response = await apiClient.post<any>(`/courier/convoys/${id}/arrive/`);
    return normalizeConvoy(response.data);
  },

  getAgentExpenses: async (): Promise<CourierExpenseRecord[]> => {
    return (await fetchAllRows('/courier/expenses/')).map(normalizeExpense);
  },

  createAgentExpense: async (data: { agentId: string; expenseType: string; amount: number; notes?: string }): Promise<CourierExpenseRecord> => {
    const response = await apiClient.post<any>('/courier/expenses/', {
      agent: data.agentId, expense_type: data.expenseType.toUpperCase(), amount: data.amount, notes: data.notes || '',
    });
    return normalizeExpense(response.data);
  },

  approveAgentExpense: async (id: string): Promise<CourierExpenseRecord> => {
    const response = await apiClient.patch<any>(`/courier/expenses/${id}/`, { is_approved: true });
    return normalizeExpense(response.data);
  },
};
