import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../api/maintenance.api';
import { fleetApi } from '../../api/fleet.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Tabs } from '../../components/common/Tabs';
import { MaintenanceRecord, MaintenanceType, WorkOrderStatus, Vehicle } from '../../types';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  DollarSign,
  Truck,
  User,
  Building2,
  Filter,
  Eye,
  Layers,
  Droplets,
  Disc,
  Package,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  Phone,
  MapPin,
  Flame,
  Award,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

// Workshop facilities directory data
const WORKSHOP_FACILITIES = [
  {
    id: 'ws_01',
    name: 'Apex Central Heavy Depot & Workshop',
    location: 'Chicago, IL',
    address: '9200 W Bryn Mawr Ave, Rosemont, IL',
    phone: '+1 (312) 555-8920',
    operatingHours: '24/7 Fleet Coverage',
    totalBays: 6,
    specialization: 'Heavy Duty Diesel & Powertrain Overhauls',
    activeVehicles: ['IL-6102-FR', 'IL-5531-BS'],
    leadTechnician: 'Marcus Sterling',
  },
  {
    id: 'ws_02',
    name: 'Thermo King & Carrier Certified Hub',
    location: 'Chicago, IL',
    address: '4450 S Pulaski Rd, Chicago, IL',
    phone: '+1 (312) 555-9114',
    operatingHours: '06:00 - 22:00 Mon-Sat',
    totalBays: 4,
    specialization: 'Cold Chain Refrigeration Units & Pharma Calibrations',
    activeVehicles: ['IL-9428-TX', 'IL-7890-CL'],
    leadTechnician: 'Arthur Dent',
  },
  {
    id: 'ws_03',
    name: 'Apex Great Lakes Heavy Bay',
    location: 'Milwaukee, WI',
    address: '2201 S 43rd St, Milwaukee, WI',
    phone: '+1 (414) 555-4011',
    operatingHours: '07:00 - 23:00 Mon-Fri',
    totalBays: 4,
    specialization: 'Turbochargers, Transmissions & Severe-Duty Repairs',
    activeVehicles: ['WI-3211-BT'],
    leadTechnician: 'Travis Becker',
  },
  {
    id: 'ws_04',
    name: 'Michelin & Goodyear Commercial Tyre Center',
    location: 'Joliet, IL',
    address: '3100 Channahon Rd, Joliet, IL',
    phone: '+1 (815) 555-7300',
    operatingHours: '07:00 - 20:00 Mon-Sat',
    totalBays: 4,
    specialization: 'Drive & Steer Tandem Balancing, Tyre Truing & Laser Alignment',
    activeVehicles: ['IL-6102-FR'],
    leadTechnician: 'Dave Miller',
  },
  {
    id: 'ws_05',
    name: 'Tesla Commercial EV Service Hub',
    location: 'Schaumburg, IL',
    address: '1300 E Woodfield Rd, Schaumburg, IL',
    phone: '+1 (847) 555-2200',
    operatingHours: '08:00 - 18:00 Mon-Fri',
    totalBays: 2,
    specialization: 'Megawatt High-Voltage Battery Packs & Inverter Diagnostics',
    activeVehicles: ['IL-2244-EV'],
    leadTechnician: 'Elena Rostova',
  },
  {
    id: 'ws_06',
    name: 'Midwest Heavy Truck Specialist',
    location: 'Gary, IN',
    address: '2400 E 5th Ave, Gary, IN',
    phone: '+1 (219) 555-6621',
    operatingHours: '06:00 - 21:00 Mon-Sat',
    totalBays: 5,
    specialization: 'Cummins X15 Engine Diagnostics & Meritor Air Disc Brakes',
    activeVehicles: ['IL-3399-FL'],
    leadTechnician: 'Robbie Chen',
  },
];

// Certified Technicians and Mechanics
const TECHNICIANS_ROSTER = [
  {
    id: 'tech_01',
    name: 'Marcus Sterling',
    title: 'Master Heavy Diesel Specialist',
    workshopId: 'ws_01',
    workshopName: 'Apex Central Heavy Depot, Chicago',
    certifications: ['ASE Master Medium/Heavy Truck', 'Detroit DD15 Specialist', 'Allison Certified'],
    experience: '16 Years',
    status: 'on_shift',
    phone: '+1 (312) 555-0142',
    activeJobs: 2,
  },
  {
    id: 'tech_02',
    name: 'Arthur Dent',
    title: 'Master Refrigeration & Pharma Telematics Specialist',
    workshopId: 'ws_02',
    workshopName: 'Thermo King & Carrier Certified Hub, Chicago',
    certifications: ['EPA 608 Universal Certification', 'Carrier Transicold Master Tech', 'Thermo King Certified'],
    experience: '14 Years',
    status: 'on_shift',
    phone: '+1 (312) 555-0188',
    activeJobs: 1,
  },
  {
    id: 'tech_03',
    name: 'Travis Becker',
    title: 'Senior Master Heavy Powertrain Mechanic',
    workshopId: 'ws_03',
    workshopName: 'Apex Great Lakes Heavy Bay, Milwaukee',
    certifications: ['PACCAR MX Engine Master', 'Garrett Turbo Systems Specialist', 'Meritor Drivetrain'],
    experience: '18 Years',
    status: 'in_bay',
    phone: '+1 (414) 555-0199',
    activeJobs: 1,
  },
  {
    id: 'tech_04',
    name: 'Dave Miller',
    title: 'Chassis, Suspension & Tyre Systems Lead',
    workshopId: 'ws_04',
    workshopName: 'Michelin & Goodyear Commercial Tyre Center, Joliet',
    certifications: ['TIA Certified Commercial Tire Master', 'Hunter Laser Alignment Tech', 'Bendix Brake Expert'],
    experience: '11 Years',
    status: 'on_shift',
    phone: '+1 (815) 555-0177',
    activeJobs: 1,
  },
  {
    id: 'tech_05',
    name: 'Elena Rostova',
    title: 'Lead EV Commercial Powertrain Engineer',
    workshopId: 'ws_05',
    workshopName: 'Tesla Commercial EV Service Hub, Schaumburg',
    certifications: ['High Voltage Safety Level 4', 'Tesla Commercial Fleet Powertrain', 'Bendix Pneumatic Systems'],
    experience: '9 Years',
    status: 'on_shift',
    phone: '+1 (847) 555-0155',
    activeJobs: 1,
  },
  {
    id: 'tech_06',
    name: 'Robbie Chen',
    title: 'Senior Cummins & Heavy Commercial Tech',
    workshopId: 'ws_06',
    workshopName: 'Midwest Heavy Truck Specialist, Gary, IN',
    certifications: ['Cummins Insite & QuickCheck Master', 'Meritor Disc Brakes', 'ASE T4 Brake Systems'],
    experience: '12 Years',
    status: 'on_shift',
    phone: '+1 (219) 555-0123',
    activeJobs: 1,
  },
  {
    id: 'tech_07',
    name: "Kevin O'Connor",
    title: 'Commercial Hybrid & Light Duty Specialist',
    workshopId: 'ws_01',
    workshopName: 'Apex Central Workshop (Hybrid Bay), Chicago',
    certifications: ['Toyota Hybrid Systems Master', 'ASE A6 Electrical/Electronic', 'Regenerative Braking Tech'],
    experience: '8 Years',
    status: 'standby',
    phone: '+1 (312) 555-0167',
    activeJobs: 0,
  },
];

export const MaintenanceHub: React.FC = () => {
  const queryClient = useQueryClient();

  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<'orders' | 'vehicles' | 'workshops'>('orders');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');
  const [statusSubFilter, setStatusSubFilter] = useState<string>('all');
  const [typeSubFilter, setTypeSubFilter] = useState<string>('all');

  // Modals & detail drawer state
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Queries
  const { data: records = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: () => maintenanceApi.getRecords(),
  });

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['fleetVehicles', 'all', 'all'],
    queryFn: () => fleetApi.getVehicles({ status: 'all', vertical: 'all' }),
  });

  // New Work Order Form State (Initiation before repair - no pre-emptive cost)
  const [newOrder, setNewOrder] = useState({
    vehicleId: 'veh_01',
    vehicleReg: 'IL-9428-TX',
    type: 'preventive' as MaintenanceType,
    workshopName: 'Apex Central Heavy Depot & Workshop, Chicago',
    technicianName: 'Marcus Sterling (Master Heavy Diesel Specialist)',
    issueDescription: '',
    actionTaken: '',
    odometerAtService: 88500,
    priority: 'normal' as 'normal' | 'urgent',
    estimatedDays: 1,
  });

  // Package presets for rapid order creation (Task & scope based, no premature costs)
  const handleApplyPreset = (preset: 'a_service' | 'oil_filters' | 'adblue' | 'tyres' | 'brake_pads' | 'breakdown') => {
    switch (preset) {
      case 'a_service':
        setNewOrder((prev) => ({
          ...prev,
          type: 'preventive',
          issueDescription: 'Full Regular Interval A-Service: Engine oil flush, spin-on filter, air filter, AdBlue top-off & 60-point chassis safety check.',
          actionTaken: 'Drain and refill full synthetic 15W-40, install OEM spin-on oil filter, replace heavy duty air cartridge, pump 45L DEF, torque wheel nuts.',
        }));
        break;
      case 'oil_filters':
        setNewOrder((prev) => ({
          ...prev,
          type: 'preventive',
          issueDescription: 'Routine Engine Lubrication & Dual Filter Renewal: 40L 15W-40 synthetic + spin-on oil filter + primary air intake filter.',
          actionTaken: 'Flush sump, install new magnetic drain plug seal, refill with Mobil Delvac synthetic oil, swap air and fuel filters.',
        }));
        break;
      case 'adblue':
        setNewOrder((prev) => ({
          ...prev,
          type: 'preventive',
          issueDescription: 'SCR Exhaust Emissions Care: AdBlue / DEF tank drained, dosing injector ultrasonic clean, and 50L ISO 22241 DEF refill.',
          actionTaken: 'Pump 50L high purity DEF, inspect DEF line heater, clear ECM dosing diagnostics.',
        }));
        break;
      case 'tyres':
        setNewOrder((prev) => ({
          ...prev,
          type: 'preventive',
          issueDescription: 'Tandem Drive Axle Tyre Rotation, Wheel Dynamic Balancing & Air Pressure Calibration.',
          actionTaken: 'Rotate rear tandem tyres diagonally; calibrate cold pressure to 110 PSI; balance wheel hubs; replace valve stems.',
        }));
        break;
      case 'brake_pads':
        setNewOrder((prev) => ({
          ...prev,
          type: 'preventive',
          issueDescription: 'Steer & Drive Axle Air Disc Brake Pad Replacement, rotor runout check and caliper guide pin lubrication.',
          actionTaken: 'Fit Bendix/Meritor heavy duty friction pads; lubricate caliper slides; verify rotor thickness within OEM limits.',
        }));
        break;
      case 'breakdown':
        setNewOrder((prev) => ({
          ...prev,
          type: 'breakdown',
          issueDescription: 'Emergency Mechanical Breakdown: High coolant temperature warning, turbo boost pressure drop, or loss of drive power.',
          actionTaken: 'Full OBD-II commercial diagnostic scan, pressure leak test, replacement of failed actuator/hose, road test under load.',
        }));
        break;
    }
  };

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: (data: typeof newOrder) =>
      maintenanceApi.createRecord({
        vehicleId: data.vehicleId,
        vehicleReg: data.vehicleReg,
        type: data.type,
        status: 'scheduled',
        workshopName: data.workshopName,
        technicianName: data.technicianName,
        issueDescription: data.issueDescription || 'Scheduled fleet maintenance inspection',
        actionTaken: data.actionTaken || 'Initial diagnostic & bay assignment',
        odometerAtService: data.odometerAtService,
        laborCost: 0,
        totalCost: 0,
        partsConsumed: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseParts'] });
      setIsNewOrderModalOpen(false);
      // Reset form
      setNewOrder({
        vehicleId: 'veh_01',
        vehicleReg: 'IL-9428-TX',
        type: 'preventive',
        workshopName: 'Apex Central Heavy Depot & Workshop, Chicago',
        technicianName: 'Marcus Sterling (Master Heavy Diesel Specialist)',
        issueDescription: '',
        actionTaken: '',
        odometerAtService: 88500,
        priority: 'normal',
        estimatedDays: 1,
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkOrderStatus }) =>
      maintenanceApi.updateRecord(id, {
        status,
        ...(status === 'completed' ? { completedDate: new Date().toISOString().split('T')[0] } : {}),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseParts'] });
      if (selectedRecord && selectedRecord.id === updated.id) {
        setSelectedRecord(updated);
      }
    },
  });

  // Filtered maintenance records based on vehicle selection and sub-filters
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Vehicle filter
      if (selectedVehicleFilter !== 'all') {
        const matchesId = r.vehicleId === selectedVehicleFilter;
        const matchesReg = r.vehicleReg === selectedVehicleFilter;
        if (!matchesId && !matchesReg) return false;
      }
      // Status sub-filter
      if (statusSubFilter !== 'all' && r.status !== statusSubFilter) {
        return false;
      }
      // Type sub-filter
      if (typeSubFilter !== 'all' && r.type !== typeSubFilter) {
        return false;
      }
      return true;
    });
  }, [records, selectedVehicleFilter, statusSubFilter, typeSubFilter]);

  // Overall maintenance analytics
  const maintenanceAnalytics = useMemo(() => {
    const totalRecords = records.length;
    const activeInWorkshop = records.filter((r) => r.status === 'in_progress').length;
    const scheduledOrders = records.filter((r) => r.status === 'scheduled').length;
    const completedOrders = records.filter((r) => r.status === 'completed').length;
    const breakdownOrders = records.filter((r) => r.type === 'breakdown').length;

    const totalSpend = records.reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalLaborSpend = records.reduce((acc, r) => acc + (r.laborCost || 0), 0);
    const totalPartsSpend = totalSpend - totalLaborSpend;

    // Vehicles needing consumable service
    const vehiclesNeedingService = vehicles.filter(
      (v) =>
        (v.engineOilLifePercent !== undefined && v.engineOilLifePercent < 35) ||
        v.oilFilterStatus === 'replace_due' ||
        (v.tyreTreadDepthMm !== undefined && v.tyreTreadDepthMm < 5.0) ||
        (v.adBlueLevelPercent !== undefined && v.adBlueLevelPercent < 25)
    );

    const vehiclesInWorkshopCount = vehicles.filter((v) => v.status === 'maintenance').length;

    return {
      totalRecords,
      activeInWorkshop,
      scheduledOrders,
      completedOrders,
      breakdownOrders,
      totalSpend,
      totalLaborSpend,
      totalPartsSpend,
      vehiclesNeedingServiceCount: vehiclesNeedingService.length,
      vehiclesInWorkshopCount,
    };
  }, [records, vehicles]);

  // Helper status badge generator
  const getWorkOrderStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge variant="danger" dot className="animate-pulse">
            In Workshop Bay
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="warning" dot>
            Scheduled
          </Badge>
        );
      case 'waiting_parts':
        return <Badge variant="warning">Awaiting Parts</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getServiceTypeBadge = (type: MaintenanceType) => {
    switch (type) {
      case 'breakdown':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle className="h-3 w-3" />
            Breakdown
          </span>
        );
      case 'accident_repair':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Flame className="h-3 w-3" />
            Accident Repair
          </span>
        );
      case 'statutory_inspection':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldCheck className="h-3 w-3" />
            Statutory Inspection
          </span>
        );
      case 'preventive':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Sparkles className="h-3 w-3" />
            Preventive Service
          </span>
        );
    }
  };

  // Work Orders DataTable Columns
  const columns: ColumnDef<MaintenanceRecord>[] = [
    {
      key: 'code',
      header: 'Work Order & Asset',
      sortable: true,
      accessor: (r) => r.recordCode,
      render: (_, row) => {
        const v = vehicles.find((veh) => veh.id === row.vehicleId || veh.registrationNumber === row.vehicleReg);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold font-mono text-white text-xs block">{row.recordCode}</span>
              <span className="text-[10px] text-slate-400">({formatDate(row.reportedDate)})</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-blue-400 font-bold text-xs bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                {row.vehicleReg}
              </span>
              {v && (
                <span className="text-[11px] text-slate-400">
                  {v.year} {v.make} {v.model}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Service Classification',
      accessor: (r) => r.type,
      render: (val) => getServiceTypeBadge(val as MaintenanceType),
    },
    {
      key: 'status',
      header: 'Work Order Status',
      accessor: (r) => r.status,
      render: (val) => getWorkOrderStatusBadge(val as WorkOrderStatus),
    },
    {
      key: 'workshop',
      header: 'Workshop & Assigned Worker',
      render: (_, row) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-white font-medium truncate max-w-[220px]" title={row.workshopName}>
              {row.workshopName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
            <User className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="text-slate-300 font-medium">{row.technicianName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'issue',
      header: 'Issue / Action Taken',
      render: (_, row) => (
        <div className="text-xs max-w-[260px]">
          <span className="text-slate-200 font-medium line-clamp-1" title={row.issueDescription}>
            {row.issueDescription}
          </span>
          <span className="text-slate-400 text-[11px] line-clamp-1 mt-0.5" title={row.actionTaken}>
            {row.actionTaken}
          </span>
          {row.partsConsumed && row.partsConsumed.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
              <Package className="h-2.5 w-2.5" />
              {row.partsConsumed.length} part{row.partsConsumed.length > 1 ? 's' : ''} replaced
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'cost',
      header: 'Repair Cost',
      sortable: true,
      accessor: (r) => r.totalCost,
      render: (_, row) => {
        if (row.status !== 'completed' || row.totalCost === 0) {
          return (
            <div className="text-xs text-right">
              <span className="text-[11px] text-amber-400 font-semibold font-mono block">
                Pending Repair
              </span>
              <span className="text-[10px] text-slate-500 block">Billed post-service</span>
            </div>
          );
        }
        return (
          <div className="text-xs text-right">
            <span className="font-mono font-bold text-white text-xs block">{formatCurrency(row.totalCost)}</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Labor: {formatCurrency(row.laborCost)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(row);
          }}
          leftIcon={<Eye className="h-3.5 w-3.5 text-blue-400" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance & Workshop Command Center</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Fleet Care
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete vehicle service histories, commercial workshop bays, certified mechanics, and parts consumption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewOrderModalOpen(true)}
          >
            Create Work Order
          </Button>
        </div>
      </div>

      {/* Fleet Top KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Work Orders</span>
            <Wrench className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{maintenanceAnalytics.activeInWorkshop}</div>
          <span className="text-[10px] text-slate-400">
            +{maintenanceAnalytics.scheduledOrders} scheduled
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Vehicles in Bay</span>
            <Truck className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">
            {maintenanceAnalytics.vehiclesInWorkshopCount}{' '}
            <span className="text-xs text-slate-400 font-sans">units</span>
          </div>
          <span className="text-[10px] text-slate-500">Undergoing overhaul</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Consumables Due</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {maintenanceAnalytics.vehiclesNeedingServiceCount}{' '}
            <span className="text-xs text-slate-400 font-sans">units</span>
          </div>
          <span className="text-[10px] text-amber-400/80">Oil, DEF, filter or tyre</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Maintenance Spend</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {formatCurrency(maintenanceAnalytics.totalSpend)}
          </div>
          <span className="text-[10px] text-slate-500">
            Labor: {formatCurrency(maintenanceAnalytics.totalLaborSpend)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Workshops & Techs</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">
            {WORKSHOP_FACILITIES.length} <span className="text-xs text-slate-400 font-sans">centers</span>
          </div>
          <span className="text-[10px] text-slate-500">{TECHNICIANS_ROSTER.length} certified specialists</span>
        </div>
      </div>

      {/* Fleet Quick Vehicle Filter Strip (All Vehicles Displayed Here) */}

      {/* Main Tabs Navigation */}
      <Tabs
        variant="pills"
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        tabs={[
          {
            id: 'orders',
            label: 'Work Orders & Service History',
            count: filteredRecords.length,
            icon: <Wrench className="h-4 w-4" />,
          },
          {
            id: 'vehicles',
            label: 'Fleet Vehicles & Consumables Roster',
            count: vehicles.length,
            icon: <Truck className="h-4 w-4" />,
          },
          {
            id: 'workshops',
            label: 'Workshop Facilities & Certified Mechanics',
            count: WORKSHOP_FACILITIES.length,
            icon: <Building2 className="h-4 w-4" />,
          },
        ]}
      />

      {/* TAB 1: WORK ORDERS & SERVICE HISTORY */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={filteredRecords}
            isLoading={isLoadingRecords}
            searchPlaceholder="Search work orders, vehicle plates, workshops, workers, parts..."
            onRowClick={(row) => setSelectedRecord(row)}
            filterSlot={
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusSubFilter}
                  onChange={(e) => setStatusSubFilter(e.target.value)}
                  className="w-36 h-9 text-xs"
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'in_progress', label: 'In Workshop Bay' },
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'waiting_parts', label: 'Waiting Parts' },
                  ]}
                />
                <Select
                  value={typeSubFilter}
                  onChange={(e) => setTypeSubFilter(e.target.value)}
                  className="w-40 h-9 text-xs"
                  options={[
                    { value: 'all', label: 'All Service Types' },
                    { value: 'preventive', label: 'Preventive Lube & Filter' },
                    { value: 'breakdown', label: 'Emergency Breakdown' },
                    { value: 'accident_repair', label: 'Accident Damage' },
                    { value: 'statutory_inspection', label: 'Statutory Inspection' },
                  ]}
                />
              </div>
            }
          />
        </div>
      )}

      {/* TAB 2: FLEET VEHICLES & CONSUMABLES ROSTER */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((veh) => {
              const oilLife = veh.engineOilLifePercent ?? 85;
              const adBlue = veh.adBlueLevelPercent ?? 90;
              const tyreTread = veh.tyreTreadDepthMm ?? 11.5;
              const tyreAge = veh.tyreYearsInService ?? 1.2;
              const brakeLife = veh.brakePadLifePercent ?? 80;
              const vehRecords = records.filter(
                (r) => r.vehicleId === veh.id || r.vehicleReg === veh.registrationNumber
              );
              const inWorkshop = veh.status === 'maintenance';
              const isSelected = selectedVehicleFilter === veh.registrationNumber;

              return (
                <div
                  key={veh.id}
                  className={`p-4 rounded-xl bg-slate-900/70 border transition-all hover:border-slate-700 ${
                    isSelected
                      ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Vehicle Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold shrink-0">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono text-sm">{veh.registrationNumber}</span>
                          {inWorkshop && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                              In Bay
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {veh.year} {veh.make} {veh.model}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        veh.status === 'available'
                          ? 'success'
                          : veh.status === 'on_trip'
                          ? 'info'
                          : veh.status === 'maintenance'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {veh.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Telematics Bar */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs mb-3 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Odometer KM</span>
                      <span className="text-white font-semibold">{veh.odometerKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Next Service</span>
                      <span className="text-blue-400 font-semibold">
                        {veh.nextServiceKm ? `${veh.nextServiceKm.toLocaleString()} km` : 'In 12,000 km'}
                      </span>
                    </div>
                  </div>

                  {/* Regular Service Consumables Grid */}
                  <div className="space-y-2.5 text-xs mb-4">
                    {/* Engine Oil */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-300 flex items-center gap-1">
                          <span>🛢️ Engine Oil Life</span>
                          <span className="text-slate-500 font-mono">({veh.fuelType})</span>
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            oilLife < 35 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {oilLife}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            oilLife < 25 ? 'bg-red-500' : oilLife < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${oilLife}%` }}
                        />
                      </div>
                    </div>

                    {/* AdBlue / DEF Fluid */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-300 flex items-center gap-1">
                          <span>💧 AdBlue / DEF Level</span>
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            adBlue < 25 ? 'text-red-400' : 'text-cyan-400'
                          }`}
                        >
                          {adBlue}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            adBlue < 25 ? 'bg-red-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${adBlue}%` }}
                        />
                      </div>
                    </div>

                    {/* Filters & Wear Tags */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                      <div className="p-2 rounded bg-slate-800/30 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Oil / Air Filter</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold ${
                              veh.oilFilterStatus === 'replace_due'
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {veh.oilFilterStatus === 'replace_due' ? '⚠️ Replace Due' : '✓ Good'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-800/30 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Tyres & Tread</span>
                        <div className="flex items-center gap-1 mt-0.5 font-mono text-[10px] text-slate-300">
                          <Disc className="h-3 w-3 text-slate-500" />
                          <span>{tyreTread}mm</span>
                          <span className="text-slate-500">({tyreAge}y)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & History Count */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      {vehRecords.length} recorded work order{vehRecords.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVehicleFilter(veh.registrationNumber);
                          setActiveTab('orders');
                        }}
                      >
                        View History
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setNewOrder((prev) => ({
                            ...prev,
                            vehicleId: veh.id,
                            vehicleReg: veh.registrationNumber,
                            odometerAtService: veh.odometerKm,
                          }));
                          setIsNewOrderModalOpen(true);
                        }}
                      >
                        Service
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WORKSHOP FACILITIES & CERTIFIED MECHANICS */}
      {activeTab === 'workshops' && (
        <div className="space-y-6">
          {/* Workshop Facilities Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Authorized Commercial Workshop Centers & Fleet Bays
                </h3>
                <p className="text-xs text-slate-400">
                  Fully certified commercial maintenance depots equipped with hydraulic lifts, diagnostic benches, and parts storage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORKSHOP_FACILITIES.map((ws) => (
                <div key={ws.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{ws.name}</h4>
                      <span className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {ws.address}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono shrink-0">
                      {ws.totalBays} Bays
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Specialization:</span>
                      <span className="font-medium text-right text-slate-200">{ws.specialization}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Lead Mechanic:</span>
                      <span className="font-medium text-cyan-400">{ws.leadTechnician}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Hours:</span>
                      <span className="text-slate-200">{ws.operatingHours}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Active Vehicles in Workshop Bays:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ws.activeVehicles.map((reg) => (
                        <span
                          key={reg}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono text-[11px] font-bold"
                        >
                          {reg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certified Mechanics Roster Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="mb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-400" />
                Certified Fleet Technicians & Master Mechanics
              </h3>
              <p className="text-xs text-slate-400">
                ASE, Detroit Diesel, Cummins, Carrier Transicold, and High Voltage EV certified engineers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TECHNICIANS_ROSTER.map((tech) => (
                <div key={tech.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400 font-bold shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm block">{tech.name}</span>
                        <span className="text-[11px] text-cyan-400 font-medium">{tech.title}</span>
                      </div>
                    </div>

                    <Badge
                      variant={tech.status === 'in_bay' ? 'danger' : tech.status === 'on_shift' ? 'success' : 'default'}
                      size="sm"
                    >
                      {tech.status === 'in_bay' ? 'In Bay Repair' : tech.status === 'on_shift' ? 'On Shift' : 'Standby'}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Depot:</span>
                      <span className="font-medium truncate max-w-[190px]">{tech.workshopName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Commercial Experience:</span>
                      <span className="font-semibold text-white">{tech.experience}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Active Jobs:</span>
                      <span className="font-mono font-bold text-amber-400">{tech.activeJobs} Jobs</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">Certifications:</span>
                    <div className="flex flex-wrap gap-1">
                      {tech.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300"
                        >
                          ✓ {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WORK ORDER DETAIL INSPECTION MODAL */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `Work Order Details: ${selectedRecord.recordCode}` : 'Work Order'}
        description="Comprehensive workshop job card, diagnosed fault telemetry, technician action report, and itemized parts."
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            {/* Header Ribbon with Status Transition */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono">{selectedRecord.recordCode}</span>
                  {getWorkOrderStatusBadge(selectedRecord.status)}
                  {getServiceTypeBadge(selectedRecord.type)}
                </div>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Logged on {formatDate(selectedRecord.reportedDate)}
                  {selectedRecord.completedDate && ` • Completed on ${formatDate(selectedRecord.completedDate)}`}
                </span>
              </div>

              {/* Status Updater Buttons */}
              <div className="flex items-center gap-2">
                {selectedRecord.status !== 'in_progress' && selectedRecord.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedRecord.id, status: 'in_progress' })
                    }
                    isLoading={updateStatusMutation.isPending}
                  >
                    Start Bay Work
                  </Button>
                )}
                {selectedRecord.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedRecord.id, status: 'completed' })
                    }
                    isLoading={updateStatusMutation.isPending}
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                  >
                    Mark Completed
                  </Button>
                )}
              </div>
            </div>

            {/* Vehicle & Workshop Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Asset & Telematics
                </span>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-400" />
                  <span className="font-bold font-mono text-white text-sm">{selectedRecord.vehicleReg}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Odometer at Service:{' '}
                  <span className="text-slate-200 font-mono font-semibold">
                    {selectedRecord.odometerAtService.toLocaleString()} km
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Workshop & Technician
                </span>
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{selectedRecord.workshopName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400 text-[11px]">
                  <User className="h-3 w-3 shrink-0" />
                  <span>Lead Worker: {selectedRecord.technicianName}</span>
                </div>
              </div>
            </div>

            {/* Diagnosed Issue & Action Taken */}
            <div className="p-3.5 rounded-lg bg-slate-800/30 border border-slate-800 space-y-2.5">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Diagnosed Issue / Driver Complaint
                </span>
                <p className="text-slate-200 leading-relaxed bg-slate-900/50 p-2 rounded border border-slate-800 font-sans">
                  {selectedRecord.issueDescription}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Action Taken / Technical Resolution
                </span>
                <p className="text-slate-200 leading-relaxed bg-slate-900/50 p-2 rounded border border-slate-800 font-sans">
                  {selectedRecord.actionTaken || 'Preliminary fault diagnosis completed. Vehicle assigned to service bay.'}
                </p>
              </div>
            </div>

            {/* Itemized Parts Consumed */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Itemized Parts & Consumables Replaced
              </span>
              {selectedRecord.partsConsumed && selectedRecord.partsConsumed.length > 0 ? (
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/70 text-slate-300 font-semibold border-b border-slate-700/60">
                      <tr>
                        <th className="p-2">Part Description</th>
                        <th className="p-2 font-mono">Part Number</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedRecord.partsConsumed.map((part, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2 font-medium text-white">{part.partName}</td>
                          <td className="p-2 font-mono text-slate-400 text-[11px]">{part.partNumber}</td>
                          <td className="p-2 text-right font-mono">{part.quantity}</td>
                          <td className="p-2 text-right font-mono">{formatCurrency(part.unitCost)}</td>
                          <td className="p-2 text-right font-mono font-bold text-white">
                            {formatCurrency(part.quantity * part.unitCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 text-center text-slate-500 italic bg-slate-900/40 rounded border border-slate-800">
                  No replacement hardware parts billed on this order (Labor inspection only).
                </div>
              )}
            </div>

            {/* Total Repair Cost Breakdown */}
            {selectedRecord.status === 'completed' && selectedRecord.totalCost > 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between font-mono">
                <div className="space-y-0.5 text-[11px] text-slate-400">
                  <div>
                    Parts Subtotal:{' '}
                    <span className="text-slate-200">
                      {formatCurrency(selectedRecord.totalCost - selectedRecord.laborCost)}
                    </span>
                  </div>
                  <div>
                    Certified Labor:{' '}
                    <span className="text-slate-200">{formatCurrency(selectedRecord.laborCost)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">Total Work Order Bill</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatCurrency(selectedRecord.totalCost)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
                <div>
                  <span className="text-xs text-amber-400 font-semibold block font-sans">
                    Repair In Progress — Awaiting Workshop Settlement
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Parts consumption and technician labor will be itemized upon work completion.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 text-xs border border-amber-500/30 font-semibold shrink-0">
                  Billed Post-Service
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE WORK ORDER MODAL */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Issue Fleet Workshop Repair Order"
        description="Schedule preventative maintenance, regular consumables flush, or log an emergency breakdown."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createOrderMutation.mutate(newOrder);
          }}
          className="space-y-4 text-xs"
        >
          {/* Quick Package Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
              Quick Service Package Presets (One-Click Auto Fill):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('a_service')}
                className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-[11px] font-medium"
              >
                ✨ Full A-Service Routine
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('oil_filters')}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-[11px] font-medium"
              >
                🛢️ Oil & Dual Filters Renewal
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('adblue')}
                className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-[11px] font-medium"
              >
                💧 AdBlue DEF Reservoir Fill
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tyres')}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-[11px] font-medium"
              >
                🛞 Tandem Tyre Balance & Rotation
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('brake_pads')}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-[11px] font-medium"
              >
                🛑 Disc Brake Pad Replacement
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('breakdown')}
                className="px-2.5 py-1 rounded bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 text-[11px] font-medium"
              >
                ⚠️ Emergency Breakdown Diagnostic
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vehicle Selector */}
            <Select
              label="Select Fleet Vehicle"
              required
              value={newOrder.vehicleReg}
              onChange={(e) => {
                const reg = e.target.value;
                const v = vehicles.find((veh) => veh.registrationNumber === reg);
                setNewOrder({
                  ...newOrder,
                  vehicleReg: reg,
                  vehicleId: v ? v.id : 'veh_01',
                  odometerAtService: v ? v.odometerKm : newOrder.odometerAtService,
                });
              }}
              options={vehicles.map((v) => ({
                value: v.registrationNumber,
                label: `${v.registrationNumber} — ${v.year} ${v.make} ${v.model} (${v.odometerKm.toLocaleString()} km)`,
              }))}
            />

            {/* Service Type */}
            <Select
              label="Service Classification"
              required
              value={newOrder.type}
              onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as MaintenanceType })}
              options={[
                { value: 'preventive', label: 'Scheduled Preventative Service' },
                { value: 'breakdown', label: 'Emergency Mechanical Breakdown' },
                { value: 'accident_repair', label: 'Accident & Collision Damage' },
                { value: 'statutory_inspection', label: 'Statutory Fitness Inspection' },
              ]}
            />

            {/* Assigned Workshop */}
            <Select
              label="Authorized Workshop Center & Bay"
              required
              value={newOrder.workshopName}
              onChange={(e) => {
                const name = e.target.value;
                const ws = WORKSHOP_FACILITIES.find((w) => w.name === name);
                const tech = ws ? ws.leadTechnician : newOrder.technicianName;
                setNewOrder({
                  ...newOrder,
                  workshopName: name,
                  technicianName: tech,
                });
              }}
              options={WORKSHOP_FACILITIES.map((w) => ({
                value: w.name,
                label: `${w.name} (${w.location})`,
              }))}
            />

            {/* Lead Mechanic / Worker Name */}
            <Select
              label="Assigned Lead Worker / Mechanic"
              required
              value={newOrder.technicianName}
              onChange={(e) => setNewOrder({ ...newOrder, technicianName: e.target.value })}
              options={TECHNICIANS_ROSTER.map((t) => ({
                value: `${t.name} (${t.title})`,
                label: `${t.name} — ${t.title}`,
              }))}
            />

            {/* Odometer at Service */}
            <Input
              label="Odometer at Service (KM)"
              type="number"
              required
              value={newOrder.odometerAtService}
              onChange={(e) => setNewOrder({ ...newOrder, odometerAtService: Number(e.target.value) })}
            />

            {/* Priority / Urgency */}
            <Select
              label="Service Urgency / Priority"
              value={newOrder.priority}
              onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value as any })}
              options={[
                { value: 'normal', label: 'Standard Routine Service' },
                { value: 'urgent', label: 'High Priority (Expedited Bay Clearance)' },
              ]}
            />
          </div>

          <Textarea
            label="Diagnosed Issue / Driver Complaint"
            required
            rows={2}
            placeholder="e.g. Scheduled 80,000 km oil flush, engine oil filter cartridge swap, AdBlue top-up, high pressure fuel line inspection..."
            value={newOrder.issueDescription}
            onChange={(e) => setNewOrder({ ...newOrder, issueDescription: e.target.value })}
          />

          <Textarea
            label="Action Planned / Work Order Resolution"
            rows={2}
            placeholder="e.g. Drain and refill 36L 15W-40 full synthetic, torque spin-on filter to 45 Nm, replace Donaldson air cartridge, torque wheel lugs..."
            value={newOrder.actionTaken}
            onChange={(e) => setNewOrder({ ...newOrder, actionTaken: e.target.value })}
          />

          {/* Post-service billing note */}
          <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-800/40 text-xs flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
              <Clock className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-blue-300 block">Post-Service Cost Billing Workflow</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Parts and certified technician labor charges will be itemized and billed by the workshop upon physical inspection and job completion. Initial work orders are issued without premature cost estimates.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createOrderMutation.isPending}>
              Issue Repair Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
