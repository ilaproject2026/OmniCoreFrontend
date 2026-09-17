export type VerticalType =
  | 'taxi_cab'
  | 'tourist_bus'
  | 'freight_logistics'
  | 'packers_movers'
  | 'b2b_contract'
  | 'cold_chain'
  | 'last_mile'
  | 'heavy_machinery'
  | 'courier_express'
  | 'corporate_shuttle'
  | 'all_verticals';

export interface VerticalDefinition {
  id: VerticalType;
  name: string;
  description: string;
  icon: string;
  badgeColor: string;
  features: string[];
}

export type PackageTier = 'basic' | 'standard' | 'corporate' | 'enterprise';

export interface PackageDefinition {
  id: PackageTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  maxVehicles: number;
  maxUsers: number;
  coreFeatures: string[];
  recommendedFor: string;
}

export type AddonKey =
  | 'addon_warehouse'
  | 'addon_contracts'
  | 'addon_cold_chain'
  | 'addon_last_mile'
  | 'addon_maintenance_pro'
  | 'addon_partner_portal'
  | 'addon_telematics'
  | 'addon_analytics'
  | 'addon_integrations';

export interface AddonDefinition {
  key: AddonKey;
  name: string;
  description: string;
  monthlyPrice: number;
  requiredForVerticals?: VerticalType[];
  category: 'Operations' | 'Specialized' | 'Intelligence' | 'Connectivity';
}

export type TenantStatus =
  | 'draft'
  | 'provisioning'
  | 'active'
  | 'trial'
  | 'suspended'
  | 'reactivation'
  | 'cancelled';

export interface TenantSubscription {
  package: PackageTier;
  status: 'active' | 'trial' | 'past_due' | 'cancelled';
  billingCycle: 'monthly' | 'annually';
  startDate: string;
  renewalDate: string;
  mrr: number;
  currency: string;
  enabledAddons: AddonKey[];
  autoRenew: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: TenantStatus;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  country: string;
  city: string;
  address: string;
  verticals: VerticalType[];
  subscription: TenantSubscription;
  createdAt: string;
  updatedAt: string;
  vehicleCount: number;
  activeTripsCount: number;
  userCount: number;
  storageUsedGb: number;
}

export type PlatformRole =
  | 'super_admin'
  | 'sales_admin'
  | 'finance_admin'
  | 'support_admin'
  | 'platform_auditor';

export type TenantRole =
  | 'tenant_admin'
  | 'operations_manager'
  | 'fleet_manager'
  | 'finance_user'
  | 'hr_user'
  | 'warehouse_user'
  | 'sales_crm_user'
  | 'driver_field_user';

export type UserRole = PlatformRole | TenantRole;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  isPlatformUser: boolean;
  platformRole?: PlatformRole;
  tenantId?: string;
  tenantRole?: TenantRole;
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin?: string;
  status: 'active' | 'invited' | 'disabled';
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ----------------- Fleet & Telematics -----------------
export type VehicleStatus = 'available' | 'on_trip' | 'maintenance' | 'grounded' | 'reserved';
export type FuelType = 'diesel' | 'petrol' | 'cng' | 'ev' | 'hybrid';

export interface VehicleDocument {
  id: string;
  type: 'insurance' | 'registration' | 'fitness_cert' | 'road_tax' | 'permit' | 'pollution_cert';
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileUrl?: string;
  isExpiringSoon: boolean; // within 30 days
  isExpired: boolean;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

export type VehicleType =
  | 'sedan'
  | 'suv'
  | 'bus'
  | 'mini_truck'
  | 'heavy_truck'
  | 'reefer_cold'
  | 'flatbed'
  | 'container';

export interface Vehicle {
  id: string;
  tenantId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  vertical: VerticalType;
  status: VehicleStatus;
  vin: string;
  fuelType: FuelType;
  odometerKm: number;
  fuelLevelPercent: number;
  capacityKg?: number;
  capacityPersons?: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
    speedKmh: number;
    lastUpdated: string;
  };
  temperatureSensor?: {
    currentTempC: number;
    targetTempC: number;
    humidityPercent: number;
    status: 'normal' | 'warning' | 'critical';
  };
  documents: VehicleDocument[];
  totalTripsCount: number;
  lastServiceDate?: string;
  nextServiceKm?: number;
}

// ----------------- Driver Management -----------------
export interface DriverDocument {
  id: string;
  type: 'commercial_license' | 'medical_cert' | 'police_clearance' | 'id_proof';
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export interface DriverPayroll {
  baseSalary: number;
  perTripAllowance: number;
  overtimeRate: number;
  bonuses: number;
  deductions: number;
  bankAccountNumber: string;
  bankName: string;
  taxId: string;
  lastPayoutDate: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  experienceYears?: number;
  avatar?: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiryDate: string;
  status: 'available' | 'on_duty' | 'on_trip' | 'leave' | 'suspended';
  assignedVehicleId?: string;
  assignedVehicleReg?: string;
  safetyScore: number; // 0 - 100
  totalTrips: number;
  onTimeDeliveryRate: number; // %
  joinedDate: string;
  documents: DriverDocument[];
  payroll?: DriverPayroll; // sensitive - permission gated!
  incidentCount: number;
}

// ----------------- Bookings, Trips & Dispatch -----------------
export type BookingStatus = 'pending' | 'confirmed' | 'dispatched' | 'cancelled';
export type TripStatus =
  | 'scheduled'
  | 'dispatched'
  | 'started'
  | 'in_transit'
  | 'loading'
  | 'unloading'
  | 'completed'
  | 'delayed'
  | 'cancelled';

export interface TripExpense {
  id: string;
  tripId: string;
  category: 'fuel' | 'toll' | 'driver_allowance' | 'loading_unloading' | 'parking' | 'maintenance' | 'miscellaneous';
  amount: number;
  currency: string;
  receiptUrl?: string;
  loggedAt: string;
  approved: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vertical: VerticalType;
  vehicleType?: VehicleType;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledPickupTime: string;
  cargoDescription?: string;
  estimatedWeightKg?: number;
  passengerCount?: number;
  estimatedAmount: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Trip {
  id: string;
  tripCode: string;
  tenantId: string;
  bookingId?: string;
  customerName: string;
  vertical: VerticalType;
  vehicleType?: VehicleType;
  vehicleId: string;
  vehicleReg: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  origin: string;
  destination: string;
  distanceKm: number;
  status: TripStatus;
  startTime?: string;
  endTime?: string;
  estimatedArrival: string;
  commercialRate: number;
  expensesTotal: number;
  expenses: TripExpense[];
  temperatureLogs?: { timestamp: string; tempC: number }[];
  timeline: {
    status: TripStatus;
    timestamp: string;
    note?: string;
    location?: string;
  }[];
}

// ----------------- Contracts & Tenders -----------------
export type TenderStatus = 'draft' | 'under_review' | 'submitted' | 'shortlisted' | 'won' | 'lost';
export type ContractStatus = 'active' | 'expiring_soon' | 'renewed' | 'terminated' | 'completed';

export interface Tender {
  id: string;
  tenderCode: string;
  title: string;
  clientName: string;
  industry: string;
  estimatedValue: number;
  submissionDeadline: string;
  status: TenderStatus;
  scopeSummary: string;
  estimatedVehicleRequired: number;
  proposalDraftUrl?: string;
  costBreakdown: {
    fleetCosts: number;
    fuelEstimates: number;
    crewPayroll: number;
    margins: number;
  };
}

export interface Contract {
  id: string;
  contractCode: string;
  title: string;
  clientName: string;
  vertical: VerticalType;
  startDate: string;
  endDate: string;
  totalContractValue: number;
  realizedRevenue: number;
  dedicatedVehiclesCount: number;
  status: ContractStatus;
  slaTargetPercent: number;
  slaActualPercent: number;
  paymentTerms: string;
  renewalAlertDays: number;
}

// ----------------- Maintenance & Workshop -----------------
export type WorkOrderStatus = 'scheduled' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
export type MaintenanceType = 'preventive' | 'breakdown' | 'accident_repair' | 'statutory_inspection';

export interface MaintenanceRecord {
  id: string;
  recordCode: string;
  vehicleId: string;
  vehicleReg: string;
  type: MaintenanceType;
  status: WorkOrderStatus;
  reportedDate: string;
  completedDate?: string;
  odometerAtService: number;
  workshopName: string;
  technicianName: string;
  issueDescription: string;
  actionTaken: string;
  partsConsumed: {
    partId: string;
    partName: string;
    partNumber: string;
    quantity: number;
    unitCost: number;
  }[];
  laborCost: number;
  totalCost: number;
}

// ----------------- Warehouse & Spare Parts -----------------
export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  capacityUnits: number;
  utilizedUnits: number;
  managerName: string;
}

export interface SparePart {
  id: string;
  sku: string;
  name: string;
  category: 'tyres' | 'filters' | 'brakes' | 'lubricants' | 'electrical' | 'body_parts' | 'cooling';
  warehouseId: string;
  warehouseName: string;
  availableQuantity: number;
  minQuantity: number;
  reorderLevel: number;
  unitCost: number;
  sellingPrice: number;
  locationBin: string;
  supplierName: string;
  isLowStock: boolean;
}

// ----------------- Finance & Invoicing -----------------
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  vertical: VerticalType;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

// ----------------- CRM & Customers -----------------
export type LeadStage = 'inquiry' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: LeadStage;
  verticalInterest: VerticalType;
  estimatedMonthlyValue: number;
  assignedRep: string;
  notes: string;
  lastContactDate: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  outstandingBalance: number;
  activeContractsCount: number;
  totalTripsCompleted: number;
}

// ----------------- HR & Employees -----------------
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: 'Operations' | 'Fleet' | 'Finance' | 'HR' | 'Warehouse' | 'Field' | 'Admin';
  role: TenantRole;
  joiningDate: string;
  status: 'active' | 'on_leave' | 'resigned';
  salary?: {
    monthlyBasic: number;
    allowances: number;
    deductions: number;
    netPay: number;
  };
}

// ----------------- Insurance & Compliance -----------------
export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  provider: string;
  type: 'fleet_comprehensive' | 'goods_in_transit' | 'third_party_liability' | 'cold_spoilage_cover';
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
  coveredVehiclesCount: number;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  vehicleReg: string;
  incidentDate: string;
  claimAmount: number;
  settledAmount?: number;
  status: 'filed' | 'investigating' | 'approved' | 'settled' | 'rejected';
  description: string;
}

// ----------------- Marketing -----------------
export interface MarketingCampaign {
  id: string;
  name: string;
  channel: 'Google Ads' | 'LinkedIn B2B' | 'Industry Expo' | 'Cold Outreach' | 'Referral';
  verticalTarget: VerticalType;
  budget: number;
  spend: number;
  leadsGenerated: number;
  conversions: number;
  cac: number;
  roi: number;
  status: 'active' | 'paused' | 'completed';
}

// ----------------- Notifications -----------------
export type NotificationType =
  | 'vehicle_document_expiry'
  | 'driver_license_expiry'
  | 'insurance_renewal'
  | 'maintenance_due'
  | 'contract_expiry'
  | 'low_inventory'
  | 'payment_due'
  | 'trip_delayed'
  | 'cold_chain_temp_alert';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
  linkUrl?: string;
  actionRequired?: boolean;
}

// ----------------- Platform Audit & System Logs -----------------
export interface AuditLog {
  id: string;
  timestamp: string;
  tenantId?: string;
  tenantName?: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: 'auth' | 'provisioning' | 'fleet' | 'financial' | 'security' | 'contract';
  details: string;
  ipAddress: string;
}

// ============================================================
// COURIER & EXPRESS DELIVERY SERVICES MODELS
// ============================================================
export type CourierShipmentStatus =
  | 'pickup_pending'
  | 'pickup_assigned'
  | 'picked_up'
  | 'at_origin_hub'
  | 'sorting_pending'
  | 'sorted'
  | 'in_transit'
  | 'at_destination_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'returned';

export type ServiceType = 'same_day' | 'next_day_express' | 'standard_ground' | 'economy';

export interface ShipmentEvent {
  timestamp: string;
  location: string;
  status: CourierShipmentStatus;
  description: string;
  actor?: string;
}

export interface ProofOfDelivery {
  confirmationMethod: 'otp' | 'digital_signature' | 'recipient_photo';
  status: 'pod_pending' | 'pod_verified' | 'pod_failed';
  recipientName?: string;
  recipientPhone?: string;
  signatureDataUrl?: string;
  otpCode?: string;
  deliveryTimestamp?: string;
  agentId?: string;
  agentName?: string;
  notes?: string;
  photoUrl?: string;
}

export interface CourierShipment {
  id: string;
  awbNumber: string; // Backend-generated authoritative tracking number
  trackingNumber: string;
  tenantId: string;
  sender: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    postalCode: string;
  };
  receiver: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    postalCode: string;
  };
  parcel: {
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    declaredValue: number;
    description: string;
    isFragile: boolean;
  };
  serviceType: ServiceType;
  currentHubId?: string;
  currentHubName?: string;
  destinationHubId?: string;
  destinationHubName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  currentStatus: CourierShipmentStatus;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  invoiceReference?: string;
  codAmount?: number;
  codCollected?: boolean;
  timeline: ShipmentEvent[];
  pod?: ProofOfDelivery;
  deliveryAttempts: {
    attemptNumber: number;
    timestamp: string;
    reason?: string;
    agentName: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface MultiPointStop {
  id: string;
  sequenceNumber: number;
  locationName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  timeWindow: string;
  parcelCount: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'failed' | 'rescheduled' | 'completed';
  notes?: string;
}

export interface MultiPointPickup {
  id: string;
  pickupCode: string;
  tenantId: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  stops: MultiPointStop[];
  destinationHubName: string;
  totalParcels: number;
  overallStatus: 'pending' | 'assigned' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface DeliveryHub {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  capacityParcels: number;
  currentParcelsCount: number;
  incomingShipmentsCount: number;
  pendingSortingCount: number;
  sortedShipmentsCount: number;
  outgoingShipmentsCount: number;
  managerName: string;
  status: 'operational' | 'high_volume' | 'maintenance';
}

export interface SortingRecord {
  id: string;
  awbNumber: string;
  sourceHub: string;
  destinationHub: string;
  sortingCategory: 'Air Express' | 'Surface North' | 'Surface South' | 'Local Delivery' | 'Exception';
  status: 'received' | 'sorting_pending' | 'sorting' | 'sorted' | 'exception' | 'dispatched';
  scannedAt: string;
  scannedBy: string;
}

export interface CourierAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  assignedZone: string;
  status: 'available' | 'out_for_delivery' | 'offline';
  assignedDeliveriesCount: number;
  completedDeliveriesCount: number;
  failedDeliveriesCount: number;
  commissionEarnedTotal: number;
  expensesTotal: number;
  pendingPayoutAmount: number;
  paidAmountTotal: number;
  vehicleType: 'motorcycle' | 'van' | 'e_bike';
}

export interface AgentCommission {
  id: string;
  agentId: string;
  agentName: string;
  awbNumber: string;
  deliveryDate: string;
  basePay: number;
  commission: number;
  bonus: number;
  totalPayable: number;
}

export type PayoutStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';

export interface AgentPayout {
  id: string;
  payoutReference: string;
  agentId: string;
  agentName: string;
  periodStart: string;
  periodEnd: string;
  grossEarnings: number;
  commission: number;
  expenses: number;
  adjustments: number;
  netPayable: number;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
}

// ============================================================
// SCHOOL & CORPORATE EMPLOYEE SHUTTLE MODELS
// ============================================================
export interface ShuttleStop {
  id: string;
  name: string;
  sequence: number;
  scheduledTime: string;
  address: string;
  passengersAssignedCount: number;
}

export interface ShuttleRoute {
  id: string;
  routeCode: string;
  name: string;
  organizationType: 'school' | 'corporate_it' | 'healthcare' | 'university';
  stops: ShuttleStop[];
  destinationCampus: string;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  assignedBusNumber?: string;
  assignedDriverName?: string;
  status: 'active' | 'in_transit' | 'scheduled' | 'cancelled';
}

export interface ShuttleSchedule {
  id: string;
  routeId: string;
  routeName: string;
  shift: 'morning_inbound' | 'evening_outbound' | 'night_shift';
  departureTime: string;
  arrivalTime: string;
  busReg: string;
  driverName: string;
  driverPhone: string;
  occupancyCount: number;
  capacityTotal: number;
  status: 'scheduled' | 'in_transit' | 'arrived' | 'delayed';
}

export interface ShuttlePassenger {
  id: string;
  name: string;
  employeeOrStudentId: string;
  type: 'employee' | 'student';
  assignedRouteId: string;
  assignedStopName: string;
  contactPhone: string;
  emergencyContact: string;
  hasBoardedToday: boolean;
  boardingTimestamp?: string;
}

// ============================================================
// WAREHOUSE EXTENSIONS: CROSS-DOCKING & CONSOLIDATION
// ============================================================
export interface CrossDockRecord {
  id: string;
  inboundShipmentRef: string;
  origin: string;
  destination: string;
  receivedAt: string;
  sortingStatus: 'pending' | 'sorted' | 'repackaged';
  consolidationGroupRef?: string;
  outboundDispatchRef?: string;
  dispatchStatus: 'waiting_consolidation' | 'consolidated' | 'dispatched';
}

export interface ShipmentConsolidationGroup {
  id: string;
  groupCode: string;
  destinationHub: string;
  totalShipments: number;
  totalWeightKg: number;
  masterSealNumber?: string;
  assignedVehicleReg?: string;
  status: 'open' | 'sealed' | 'dispatched';
  shipmentIds: string[];
}

// ============================================================
// SOCIAL MEDIA & DIGITAL PROMOTIONS MODELS
// ============================================================
export interface SocialPost {
  id: string;
  channel: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Google';
  campaignName: string;
  caption: string;
  imageUrl?: string;
  scheduledTime: string;
  reach: number;
  engagements: number;
  leadsGenerated: number;
  conversions: number;
  spend: number;
  status: 'published' | 'scheduled' | 'draft';
}

// ============================================================
// TENANT PUBLIC MINI-WEBSITE & PUBLIC PORTAL MODELS
// ============================================================
export interface TenantPublicCms {
  tenantSlug: string;
  companyName: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  heroHeadline: string;
  heroSubtitle: string;
  enabledServices: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }[];
  promotions: {
    code: string;
    discountText: string;
    validity: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

// ============================================================
// SUPER ADMIN CUSTOM FEATURE OVERRIDES & UPGRADES
// ============================================================
export interface TenantCustomFeatureOverride {
  featureKey: string;
  name: string;
  description: string;
  source: 'package' | 'addon' | 'custom_provision' | 'vertical' | 'enterprise_override';
  isEnabled: boolean;
  enabledBy?: string;
  enabledAt?: string;
}

