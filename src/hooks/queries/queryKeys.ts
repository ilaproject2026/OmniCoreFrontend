/**
 * OmniCore Centralized TanStack Query Keys
 * Provides deterministic, hierarchical cache invalidation and query keys.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    current: ['tenants', 'current'] as const,
    metadata: ['tenants', 'metadata'] as const,
    users: (tenantId?: string) => ['tenants', tenantId || 'current', 'users'] as const,
    roles: ['tenants', 'roles'] as const,
  },
  fleet: {
    all: ['fleet'] as const,
    vehicles: (filters?: Record<string, unknown>) => ['fleet', 'vehicles', filters] as const,
    vehicleDetail: (id: string) => ['fleet', 'vehicle', id] as const,
    categories: ['fleet', 'categories'] as const,
    telematics: ['fleet', 'telematics'] as const,
    maintenance: ['fleet', 'maintenance'] as const,
  },
  drivers: {
    all: ['drivers'] as const,
    list: (filters?: Record<string, unknown>) => ['drivers', 'list', filters] as const,
    detail: (id: string) => ['drivers', 'detail', id] as const,
    attendance: (date?: string) => ['drivers', 'attendance', date] as const,
    incidents: ['drivers', 'incidents'] as const,
  },
  trips: {
    all: ['trips'] as const,
    list: (filters?: Record<string, unknown>) => ['trips', 'list', filters] as const,
    detail: (id: string) => ['trips', 'detail', id] as const,
    bookings: (filters?: Record<string, unknown>) => ['trips', 'bookings', filters] as const,
  },
  courier: {
    all: ['courier'] as const,
    shipments: (filters?: Record<string, unknown>) => ['courier', 'shipments', filters] as const,
    shipmentDetail: (id: string) => ['courier', 'shipment', id] as const,
    tracking: (awb: string) => ['courier', 'tracking', awb] as const,
    pickups: ['courier', 'pickups'] as const,
    pickupDetail: (id: string) => ['courier', 'pickup', id] as const,
    hubs: ['courier', 'hubs'] as const,
    sortingRecords: ['courier', 'sortingRecords'] as const,
    agents: ['courier', 'agents'] as const,
    commissions: (agentId?: string) => ['courier', 'commissions', agentId] as const,
    payouts: ['courier', 'payouts'] as const,
    expenses: ['courier', 'expenses'] as const,
    convoys: ['courier', 'convoys'] as const,
  },
  shuttle: {
    all: ['shuttle'] as const,
    organizations: ['shuttle', 'organizations'] as const,
    routes: (orgId?: string) => ['shuttle', 'routes', orgId] as const,
    routeDetail: (id: string) => ['shuttle', 'route', id] as const,
    schedules: (routeId?: string) => ['shuttle', 'schedules', routeId] as const,
    passengers: (filters?: Record<string, unknown>) => ['shuttle', 'passengers', filters] as const,
    trips: (date?: string) => ['shuttle', 'trips', date] as const,
    attendance: (tripId: string) => ['shuttle', 'attendance', tripId] as const,
  },
  warehouse: {
    all: ['warehouse'] as const,
    facilities: ['warehouse', 'facilities'] as const,
    inventory: (filters?: Record<string, unknown>) => ['warehouse', 'inventory', filters] as const,
    crossDock: (filters?: Record<string, unknown>) => ['warehouse', 'crossDock', filters] as const,
    consolidation: (filters?: Record<string, unknown>) => ['warehouse', 'consolidation', filters] as const,
  },
  finance: {
    all: ['finance'] as const,
    invoices: (filters?: Record<string, unknown>) => ['finance', 'invoices', filters] as const,
    pnl: (period?: string) => ['finance', 'pnl', period] as const,
    fuel: ['finance', 'fuel'] as const,
  },
  crm: {
    all: ['crm'] as const,
    customers: (filters?: Record<string, unknown>) => ['crm', 'customers', filters] as const,
    leads: ['crm', 'leads'] as const,
    quotations: ['crm', 'quotations'] as const,
  },
  marketing: {
    all: ['marketing'] as const,
    campaigns: ['marketing', 'campaigns'] as const,
    socialPosts: ['marketing', 'socialPosts'] as const,
  },
  platform: {
    all: ['platform'] as const,
    tenants: (filters?: Record<string, unknown>) => ['platform', 'tenants', filters] as const,
    tenantDetail: (id: string) => ['platform', 'tenant', id] as const,
    features: (tenantId: string) => ['platform', 'features', tenantId] as const,
    dashboard: ['platform', 'dashboard'] as const,
  },
  publicPortal: {
    site: (slug: string) => ['public', 'site', slug] as const,
    tracking: (slug: string, awb: string) => ['public', 'tracking', slug, awb] as const,
  },
  dashboard: {
    metrics: (timeframe?: string) => ['dashboard', 'metrics', timeframe] as const,
  },
};
