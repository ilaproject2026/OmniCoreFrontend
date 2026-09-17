import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer } from '../../components/common/Drawer';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Modal } from '../../components/common/Modal';
import { Vehicle, VehicleDocument, Driver, MaintenanceRecord, MaintenanceType, WorkOrderStatus, Trip, TripExpense } from '../../types';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import { maintenanceApi } from '../../api/maintenance.api';
import { tripsApi } from '../../api/trips.api';
import {
  Truck,
  FileCheck,
  UserCheck,
  Navigation,
  Wrench,
  Fuel,
  History,
  AlertTriangle,
  Radio,
  Clock,
  Gauge,
  Snowflake,
  ShieldCheck,
  Plus,
  Upload,
  Calendar,
  DollarSign,
  MapPin,
  Activity,
  CheckCircle2,
  Trash2,
  ExternalLink,
  FileText,
  User,
  Hash,
  Layers,
  ArrowRight,
  Info,
  Check,
  X,
  TrendingUp,
  Droplets,
  CircleDot,
  Zap,
  ChevronDown,
  ChevronUp,
  Percent,
  Receipt,
  Coins,
  Disc,
  Wind,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

export interface VehicleDetailsDrawerProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onVehicleUpdated?: (updated: Vehicle) => void;
}

const VERTICAL_LABELS: Record<string, string> = {
  freight_logistics: 'Goods & Freight Logistics',
  cold_chain: 'Cold Chain & Temperature-Controlled',
  b2b_contract: 'B2B Contract & Corporate',
  taxi_cab: 'Taxi & Cab Operations',
  tourist_bus: 'Tourist & Commercial Bus',
  last_mile: 'E-commerce Last-Mile Delivery',
  heavy_machinery: 'Specialized Heavy Machinery',
};

const BODY_TYPE_LABELS: Record<string, string> = {
  heavy_truck: 'Heavy Duty Tractor / Semi',
  reefer_cold: 'Reefer (Temperature-Controlled)',
  flatbed: 'Flatbed Trailer',
  mini_truck: 'Mini Truck / Medium Duty',
  bus: 'Commercial Passenger Bus',
  sedan: 'Urban Sedan / Cab',
  container: 'Intermodal Container Carrier',
  suv: 'Support SUV',
};

const FUEL_TYPE_LABELS: Record<string, string> = {
  diesel: 'Clean Diesel',
  ev: 'Electric Vehicle (EV)',
  cng: 'Compressed Natural Gas (CNG)',
  hybrid: 'Hybrid Electric',
  petrol: 'Gasoline / Petrol',
};

export const VehicleDetailsDrawer: React.FC<VehicleDetailsDrawerProps> = ({
  vehicle,
  isOpen,
  onClose,
  onVehicleUpdated,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Synchronize local vehicle state
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(vehicle);

  // Modal visibility states
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);

  // Status feedback toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Document Upload Form State
  const [docForm, setDocForm] = useState({
    type: 'insurance' as VehicleDocument['type'],
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    verificationStatus: 'verified' as VehicleDocument['verificationStatus'],
    fileName: 'vehicle_doc_scan.pdf',
  });

  // Driver Assignment Form State (dedicated to modal)
  const [modalDriverId, setModalDriverId] = useState<string>('unassigned');

  // Maintenance Service Log Form State
  const [maintForm, setMaintForm] = useState({
    type: 'preventive' as MaintenanceType,
    status: 'completed' as WorkOrderStatus,
    issueDescription: '',
    actionTaken: '',
    workshopName: 'Apex Central Workshop',
    technicianName: '',
    odometerAtService: 0,
    totalCost: 250,
    nextServiceKm: 0,
  });

  useEffect(() => {
    setCurrentVehicle(vehicle);
    if (vehicle) {
      setModalDriverId(vehicle.assignedDriverId || 'unassigned');
      setMaintForm((prev) => ({
        ...prev,
        odometerAtService: vehicle.odometerKm || 0,
        nextServiceKm: vehicle.nextServiceKm || (vehicle.odometerKm ? vehicle.odometerKm + 15000 : 15000),
      }));
    }
  }, [vehicle]);

  // Query available drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
  });

  // Query all vehicles to enforce unique driver assignments and trip status tracking
  const { data: allVehicles = [] } = useQuery({
    queryKey: ['fleetVehicles'],
    queryFn: () => fleetApi.getVehicles(),
  });

  // Query maintenance records
  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: () => maintenanceApi.getRecords(),
  });

  // Query all trips to calculate margins, fuel costs, and trip expenses
  const { data: allTrips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
  });

  // Expanded trip details state
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Maintenance preset helper state
  const [servicePreset, setServicePreset] = useState<string>('custom');

  // Filter trips for this vehicle
  const vehicleTrips = useMemo(() => {
    if (!currentVehicle) return [];
    const matched = allTrips.filter(
      (t) => t.vehicleId === currentVehicle.id || t.vehicleReg === currentVehicle.registrationNumber
    );
    return matched;
  }, [allTrips, currentVehicle]);

  // Aggregate trip economics, fuel expenses, and margins for this vehicle
  const tripEconomics = useMemo(() => {
    const tripsCount = vehicleTrips.length;
    const totalRevenue = vehicleTrips.reduce((sum, t) => sum + (t.commercialRate || 0), 0);
    const totalExpenses = vehicleTrips.reduce((sum, t) => sum + (t.expensesTotal || 0), 0);
    const netMargin = totalRevenue - totalExpenses;
    const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

    const totalFuelExpense = vehicleTrips.reduce(
      (sum, t) =>
        sum +
        (t.expenses || [])
          .filter((e) => e.category === 'fuel')
          .reduce((es, e) => es + e.amount, 0),
      0
    );

    const totalFuelLitres = vehicleTrips.reduce(
      (sum, t) =>
        sum +
        (t.expenses || [])
          .filter((e) => e.category === 'fuel')
          .reduce((es, e) => es + (e.fuelLitres || Math.round(e.amount / 1.25)), 0),
      0
    );

    const totalTollExpense = vehicleTrips.reduce(
      (sum, t) =>
        sum +
        (t.expenses || [])
          .filter((e) => e.category === 'toll')
          .reduce((es, e) => es + e.amount, 0),
      0
    );

    const totalDriverAllowance = vehicleTrips.reduce(
      (sum, t) =>
        sum +
        (t.expenses || [])
          .filter((e) => e.category === 'driver_allowance')
          .reduce((es, e) => es + e.amount, 0),
      0
    );

    const totalOtherExpenses = Math.max(
      0,
      totalExpenses - totalFuelExpense - totalTollExpense - totalDriverAllowance
    );

    return {
      tripsCount,
      totalRevenue,
      totalExpenses,
      netMargin,
      marginPercent,
      totalFuelExpense,
      totalFuelLitres,
      totalTollExpense,
      totalDriverAllowance,
      totalOtherExpenses,
    };
  }, [vehicleTrips]);

  // Check if current vehicle is actively on a drive/trip
  const isVehicleOnTrip = currentVehicle?.status === 'on_trip';

  // Helper to check if any driver is currently on an active trip (drive)
  const isDriverOnActiveTrip = (driver: Driver) => {
    if (driver.status === 'on_trip') return true;
    if (driver.assignedVehicleId) {
      const v = allVehicles.find((veh) => veh.id === driver.assignedVehicleId);
      if (v && v.status === 'on_trip') return true;
    }
    const assignedVeh = allVehicles.find((veh) => veh.assignedDriverId === driver.id);
    if (assignedVeh && assignedVeh.status === 'on_trip') return true;
    return false;
  };

  // Helper to find the vehicle a driver is currently driving on
  const getDriverActiveTripVehicle = (driver: Driver) => {
    if (driver.assignedVehicleId) {
      const v = allVehicles.find((veh) => veh.id === driver.assignedVehicleId);
      if (v && v.status === 'on_trip') return v;
    }
    const assignedVeh = allVehicles.find((veh) => veh.assignedDriverId === driver.id);
    if (assignedVeh && assignedVeh.status === 'on_trip') return assignedVeh;
    return null;
  };

  // Selected driver object in the modal
  const selectedDriverObj = useMemo(() => {
    return drivers.find((d) => d.id === modalDriverId);
  }, [drivers, modalDriverId]);

  // Check if the driver selected in the modal is currently on a drive
  const selectedDriverOnTrip = useMemo(() => {
    if (!selectedDriverObj) return false;
    return isDriverOnActiveTrip(selectedDriverObj);
  }, [selectedDriverObj, allVehicles]);

  const selectedDriverTripVehicle = useMemo(() => {
    if (!selectedDriverObj) return null;
    return getDriverActiveTripVehicle(selectedDriverObj);
  }, [selectedDriverObj, allVehicles]);

  // Check if selected driver is assigned to another IDLE vehicle (transferable conflict)
  // ONLY true if the driver is NOT on a trip, NOT on the current vehicle, and assigned to another vehicle!
  const conflictingIdleVehicle = useMemo(() => {
    if (!modalDriverId || modalDriverId === 'unassigned' || !currentVehicle) return null;
    if (modalDriverId === currentVehicle.assignedDriverId) return null;
    if (selectedDriverOnTrip) return null; // If on trip, handled by prohibition banner!

    const otherVeh = allVehicles.find(
      (v) => v.assignedDriverId === modalDriverId && v.id !== currentVehicle.id
    );
    return otherVeh || null;
  }, [modalDriverId, allVehicles, currentVehicle, selectedDriverOnTrip]);

  // Filter maintenance records for this vehicle
  const vehicleMaintenanceRecords = useMemo(() => {
    if (!currentVehicle) return [];
    const list = maintenanceRecords.filter(
      (m) => m.vehicleId === currentVehicle.id || m.vehicleReg === currentVehicle.registrationNumber
    );
    return list.length > 0 ? list : maintenanceRecords.slice(0, 3);
  }, [maintenanceRecords, currentVehicle]);

  // Helper to commit vehicle updates
  const commitVehicleUpdate = (updated: Vehicle, message: string) => {
    setCurrentVehicle(updated);
    onVehicleUpdated?.(updated);
    queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
    setActionFeedback(message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Upload Document Mutation
  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!currentVehicle) throw new Error('No vehicle selected');
      const isExpired = new Date(docForm.expiryDate) < new Date();
      const isExpiringSoon =
        !isExpired &&
        new Date(docForm.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

      const newDoc: VehicleDocument = {
        id: 'doc_' + Math.random().toString(36).substring(2, 9),
        type: docForm.type,
        documentNumber: docForm.documentNumber || `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
        issueDate: docForm.issueDate,
        expiryDate: docForm.expiryDate,
        fileUrl: `/uploads/docs/${docForm.fileName}`,
        isExpired,
        isExpiringSoon,
        verificationStatus: docForm.verificationStatus,
      };

      const updatedDocs = [newDoc, ...(currentVehicle.documents || [])];
      await fleetApi.updateVehicle(currentVehicle.id, { documents: updatedDocs });
      return { ...currentVehicle, documents: updatedDocs };
    },
    onSuccess: (updatedVehicle) => {
      commitVehicleUpdate(updatedVehicle, 'New statutory document uploaded and verified.');
      setIsUploadDocModalOpen(false);
      setDocForm({
        type: 'insurance',
        documentNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        verificationStatus: 'verified',
        fileName: 'vehicle_doc_scan.pdf',
      });
    },
  });

  // Delete Document Handler
  const handleDeleteDocument = async (docId: string) => {
    if (!currentVehicle) return;
    const updatedDocs = currentVehicle.documents.filter((d) => d.id !== docId);
    await fleetApi.updateVehicle(currentVehicle.id, { documents: updatedDocs });
    commitVehicleUpdate(
      { ...currentVehicle, documents: updatedDocs },
      'Document removed from regulatory roster.'
    );
  };

  // Driver Assignment Mutation
  const assignDriverMutation = useMutation({
    mutationFn: async () => {
      if (!currentVehicle) throw new Error('No vehicle selected');

      // Rule 1: Prohibit changing driver while vehicle is currently on a trip
      if (currentVehicle.status === 'on_trip') {
        throw new Error('Prohibited: Cannot reassign driver while vehicle is in transit on an active trip.');
      }

      // Handle unassignment
      if (modalDriverId === 'unassigned') {
        if (currentVehicle.assignedDriverId) {
          await driversApi.updateDriver(currentVehicle.assignedDriverId, {
            assignedVehicleId: undefined,
            assignedVehicleReg: undefined,
            status: 'available',
          });
        }

        await fleetApi.updateVehicle(currentVehicle.id, {
          assignedDriverId: undefined,
          assignedDriverName: undefined,
        });

        return {
          ...currentVehicle,
          assignedDriverId: undefined,
          assignedDriverName: undefined,
          transferredFromReg: null,
        };
      }

      const driver = drivers.find((d) => d.id === modalDriverId);
      if (!driver) throw new Error('Driver not found');

      // Rule 2: Prohibit assigning a driver who is currently on an active trip
      if (isDriverOnActiveTrip(driver)) {
        const tripVeh = getDriverActiveTripVehicle(driver);
        throw new Error(
          `Prohibited: ${driver.firstName} ${driver.lastName} is currently on an active drive (${tripVeh?.registrationNumber || 'In Transit'}). Trips must be completed before reassigning.`
        );
      }

      // Check if driver was assigned to another idle vehicle (transfer)
      const previousVehicleOfDriver = allVehicles.find(
        (v) => v.assignedDriverId === modalDriverId && v.id !== currentVehicle.id
      );

      if (previousVehicleOfDriver) {
        await fleetApi.updateVehicle(previousVehicleOfDriver.id, {
          assignedDriverId: undefined,
          assignedDriverName: undefined,
        });
      }

      // If current vehicle previously had a different driver, unbind that old driver
      if (currentVehicle.assignedDriverId && currentVehicle.assignedDriverId !== modalDriverId) {
        await driversApi.updateDriver(currentVehicle.assignedDriverId, {
          assignedVehicleId: undefined,
          assignedVehicleReg: undefined,
          status: 'available',
        });
      }

      const driverName = `${driver.firstName} ${driver.lastName}`;

      // Assign driver to this vehicle
      await fleetApi.updateVehicle(currentVehicle.id, {
        assignedDriverId: modalDriverId,
        assignedDriverName: driverName,
      });

      // Bind driver to this vehicle
      await driversApi.updateDriver(driver.id, {
        assignedVehicleId: currentVehicle.id,
        assignedVehicleReg: currentVehicle.registrationNumber,
        status: 'available',
      });

      return {
        ...currentVehicle,
        assignedDriverId: modalDriverId,
        assignedDriverName: driverName,
        transferredFromReg: previousVehicleOfDriver?.registrationNumber || null,
      };
    },
    onSuccess: (result) => {
      // Close modal first to prevent any render flickers
      setIsDriverModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });

      const feedbackMsg = result.transferredFromReg
        ? `Driver ${result.assignedDriverName} transferred from ${result.transferredFromReg} and assigned exclusively to ${result.registrationNumber}.`
        : result.assignedDriverName
        ? `Driver ${result.assignedDriverName} assigned successfully.`
        : 'Vehicle unassigned and returned to available roster.';

      commitVehicleUpdate(result, feedbackMsg);
    },
    onError: (err: any) => {
      setActionFeedback(err?.message || 'Failed to update driver assignment.');
    },
  });

  // Maintenance Log Mutation
  const logMaintMutation = useMutation({
    mutationFn: async () => {
      if (!currentVehicle) throw new Error('No vehicle selected');

      await maintenanceApi.createRecord({
        vehicleId: currentVehicle.id,
        vehicleReg: currentVehicle.registrationNumber,
        type: maintForm.type,
        status: maintForm.status,
        workshopName: maintForm.workshopName || 'Apex Central Workshop',
        technicianName: maintForm.technicianName || 'Certified Technician',
        issueDescription: maintForm.issueDescription || 'Scheduled preventative service inspection',
        actionTaken: maintForm.actionTaken || 'Full diagnostic inspection and service completed',
        odometerAtService: maintForm.odometerAtService || currentVehicle.odometerKm,
        laborCost: Math.round(maintForm.totalCost * 0.4),
        totalCost: Number(maintForm.totalCost) || 250,
      });

      const nextKm = Number(maintForm.nextServiceKm) || currentVehicle.odometerKm + 15000;
      const today = new Date().toISOString().split('T')[0];

      await fleetApi.updateVehicle(currentVehicle.id, {
        nextServiceKm: nextKm,
        lastServiceDate: today,
        status: maintForm.status === 'in_progress' ? 'maintenance' : currentVehicle.status,
      });

      return {
        ...currentVehicle,
        nextServiceKm: nextKm,
        lastServiceDate: today,
        status: maintForm.status === 'in_progress' ? ('maintenance' as const) : currentVehicle.status,
      };
    },
    onSuccess: (updatedVehicle) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] });
      commitVehicleUpdate(updatedVehicle, 'Maintenance service record successfully logged.');
      setIsMaintModalOpen(false);
      setMaintForm({
        type: 'preventive',
        status: 'completed',
        issueDescription: '',
        actionTaken: '',
        workshopName: 'Apex Central Workshop',
        technicianName: '',
        odometerAtService: updatedVehicle.odometerKm || 0,
        totalCost: 250,
        nextServiceKm: (updatedVehicle.odometerKm || 0) + 15000,
      });
    },
  });

  if (!currentVehicle) return null;

  const expiredDocsCount = currentVehicle.documents.filter((d) => d.isExpired).length;
  const expiringSoonDocsCount = currentVehicle.documents.filter((d) => d.isExpiringSoon).length;
  const compliantDocsCount = currentVehicle.documents.filter(
    (d) => !d.isExpired && !d.isExpiringSoon
  ).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Truck className="h-3.5 w-3.5" /> },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileCheck className="h-3.5 w-3.5" />,
      count: currentVehicle.documents.length,
    },
    {
      id: 'assignments',
      label: 'Driver Assignment',
      icon: <UserCheck className="h-3.5 w-3.5" />,
    },
    {
      id: 'trips',
      label: 'Trips & Margins',
      icon: <Navigation className="h-3.5 w-3.5" />,
      count: vehicleTrips.length,
    },
    {
      id: 'maintenance',
      label: 'Service & Consumables',
      icon: <Wrench className="h-3.5 w-3.5" />,
      count: vehicleMaintenanceRecords.length,
    },
    { id: 'fuel', label: 'Fuel & Telematics', icon: <Fuel className="h-3.5 w-3.5" /> },
    { id: 'history', label: 'Audit Log', icon: <History className="h-3.5 w-3.5" /> },
  ];

  const handleOpenDriverModal = () => {
    if (isVehicleOnTrip) return;
    setModalDriverId(currentVehicle.assignedDriverId || 'unassigned');
    setIsDriverModalOpen(true);
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${currentVehicle.registrationNumber} • ${currentVehicle.make} ${currentVehicle.model}`}
        subtitle={`VIN: ${currentVehicle.vin} • Vertical: ${
          VERTICAL_LABELS[currentVehicle.vertical] || currentVehicle.vertical
        }`}
        width="xl"
      >
        <div className="space-y-5">
          {/* Action Notification Banner */}
          {actionFeedback && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{actionFeedback}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW (ALL VEHICLE DETAILS)                                      */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-5 text-xs">
              {/* Telemetry quick bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-2.5">
                  <span className="text-slate-400 block text-[10px]">Vehicle Status</span>
                  <Badge
                    variant={
                      currentVehicle.status === 'available'
                        ? 'success'
                        : currentVehicle.status === 'on_trip'
                        ? 'info'
                        : currentVehicle.status === 'maintenance'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                    className="mt-1 capitalize"
                    dot
                  >
                    {currentVehicle.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-2.5">
                  <span className="text-slate-400 block text-[10px]">Odometer Total</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    {currentVehicle.odometerKm.toLocaleString()} km
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-2.5">
                  <span className="text-slate-400 block text-[10px]">Fuel Level</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {currentVehicle.fuelLevelPercent}%
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${currentVehicle.fuelLevelPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-2.5">
                  <span className="text-slate-400 block text-[10px]">Avg Fuel Consumption</span>
                  <span className="text-sm font-bold text-blue-400 font-mono mt-0.5 block">
                    {currentVehicle.fuelConsumptionL100km || 28.4} L/100km
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatCurrency(currentVehicle.fuelCostPerKm || 0.35)}/km
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-2.5">
                  <span className="text-slate-400 block text-[10px]">AdBlue / DEF Level</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-cyan-400 font-mono">
                      {currentVehicle.adBlueLevelPercent || 82}%
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${currentVehicle.adBlueLevelPercent || 82}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">Fluid Tank OK</span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-2.5">
                  <span className="text-slate-400 block text-[10px]">Engine Oil Life</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {currentVehicle.engineOilLifePercent || 76}%
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${currentVehicle.engineOilLifePercent || 76}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">15W-40 Synthetic</span>
                </div>
              </div>

              {/* Complete Vehicle Specifications & Asset Data */}
              <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4.5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-400" />
                    <h4 className="font-semibold text-white text-sm">
                      Complete Vehicle Specifications & Asset Data
                    </h4>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    VIN: {currentVehicle.vin}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Make & Manufacturer
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.make}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Model Specification
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.model}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      License Registration
                    </span>
                    <span className="font-mono font-bold text-blue-400 mt-0.5 block text-sm">
                      {currentVehicle.registrationNumber}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Manufacturing Year
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.year || 2024}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Body / Asset Class
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {BODY_TYPE_LABELS[currentVehicle.type] || currentVehicle.type}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Transport Vertical
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {VERTICAL_LABELS[currentVehicle.vertical] || currentVehicle.vertical}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Fuel Propulsion
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {FUEL_TYPE_LABELS[currentVehicle.fuelType] || currentVehicle.fuelType}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Total Distance Run
                    </span>
                    <span className="text-emerald-400 font-mono font-medium mt-0.5 block text-sm">
                      {currentVehicle.odometerKm.toLocaleString()} KM
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Gross Payload Capacity
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.capacityKg ? `${currentVehicle.capacityKg.toLocaleString()} kg` : '24,000 kg'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Passenger / Seating Capacity
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.capacityPersons ? `${currentVehicle.capacityPersons} Passengers` : 'Standard Commercial Cab'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Assigned Primary Operator
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.assignedDriverName || 'Unassigned / Roster Available'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Linehaul Trips Completed
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.totalTripsCount} Manifests
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Last Workshop Service
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      {currentVehicle.lastServiceDate ? formatDate(currentVehicle.lastServiceDate) : 'Recently Inspected'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Next Service Interval
                    </span>
                    <span className="text-slate-100 font-mono font-medium mt-0.5 block text-sm">
                      {currentVehicle.nextServiceKm
                        ? `${currentVehicle.nextServiceKm.toLocaleString()} KM`
                        : `${((currentVehicle.odometerKm || 0) + 15000).toLocaleString()} KM`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Fleet Operator Roster
                    </span>
                    <span className="text-slate-100 font-medium mt-0.5 block text-sm">
                      Apex Linehaul Operations
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Assignment & Compliance Split Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Active Driver Card */}
                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                        <h5 className="font-semibold text-white">Linehaul Driver Assignment</h5>
                      </div>
                      <Badge
                        variant={
                          isVehicleOnTrip
                            ? 'info'
                            : currentVehicle.assignedDriverName
                            ? 'success'
                            : 'default'
                        }
                        size="sm"
                        dot={isVehicleOnTrip}
                      >
                        {isVehicleOnTrip
                          ? 'Trip In Progress'
                          : currentVehicle.assignedDriverName
                          ? 'Driver Assigned'
                          : 'Unassigned'}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {currentVehicle.assignedDriverName
                          ? currentVehicle.assignedDriverName.substring(0, 2).toUpperCase()
                          : 'NA'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">
                          {currentVehicle.assignedDriverName || 'Available for Dispatch'}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {isVehicleOnTrip
                            ? 'Currently in transit on active voyage — locked'
                            : currentVehicle.assignedDriverName
                            ? 'Primary Commercial CDL Operator'
                            : 'No operator currently linked to this vehicle asset.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2">
                    {isVehicleOnTrip ? (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Driver locked during active trip
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Asset idle • Ready for roster changes</span>
                    )}

                    <Button
                      size="sm"
                      variant={isVehicleOnTrip ? 'outline' : 'primary'}
                      leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                      disabled={isVehicleOnTrip}
                      title={isVehicleOnTrip ? 'Cannot change driver while vehicle is in transit on an active trip' : undefined}
                      onClick={handleOpenDriverModal}
                    >
                      {isVehicleOnTrip
                        ? 'Trip In Transit (Locked)'
                        : currentVehicle.assignedDriverName
                        ? 'Reassign Driver'
                        : 'Assign Driver'}
                    </Button>
                  </div>
                </div>

                {/* Regulatory Document Compliance Card */}
                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-400" />
                        <h5 className="font-semibold text-white">Document Compliance</h5>
                      </div>
                      <Badge
                        variant={
                          expiredDocsCount > 0
                            ? 'danger'
                            : expiringSoonDocsCount > 0
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {expiredDocsCount > 0
                          ? 'Action Required'
                          : expiringSoonDocsCount > 0
                          ? 'Renewal Soon'
                          : 'Fully Compliant'}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-base font-bold text-emerald-400 block font-mono">
                          {compliantDocsCount}
                        </span>
                        <span className="text-[10px] text-slate-400">Valid</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-base font-bold text-amber-400 block font-mono">
                          {expiringSoonDocsCount}
                        </span>
                        <span className="text-[10px] text-slate-400">&lt;30 Days</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-base font-bold text-rose-400 block font-mono">
                          {expiredDocsCount}
                        </span>
                        <span className="text-[10px] text-slate-400">Expired</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Upload className="h-3.5 w-3.5" />}
                      onClick={() => setIsUploadDocModalOpen(true)}
                    >
                      Upload Document
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab('documents')}
                    >
                      View All ({currentVehicle.documents.length})
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cold Chain Reefer Sensor if available */}
              {currentVehicle.temperatureSensor && (
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Snowflake className="h-5 w-5 text-cyan-400 animate-pulse" />
                      <div>
                        <h4 className="font-semibold text-white">Live Reefer Telemetry (Pharma Grade)</h4>
                        <p className="text-[11px] text-slate-400">Continuous sensor ping via Iridium dual-satellite</p>
                      </div>
                    </div>
                    <Badge variant="glow">Sensor Online</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-cyan-900/40">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CURRENT TEMPERATURE</span>
                      <span className="text-xl font-bold font-mono text-cyan-300">
                        {currentVehicle.temperatureSensor.currentTempC}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SETPOINT TARGET</span>
                      <span className="text-xl font-bold font-mono text-slate-300">
                        {currentVehicle.temperatureSensor.targetTempC}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">CARGO HUMIDITY</span>
                      <span className="text-xl font-bold font-mono text-slate-300">
                        {currentVehicle.temperatureSensor.humidityPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live GPS Telematics Box */}
              {currentVehicle.currentLocation && (
                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <span className="font-semibold text-white">Live Geolocation Feed</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Pinged {currentVehicle.currentLocation.lastUpdated}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">{currentVehicle.currentLocation.address}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Lat: {currentVehicle.currentLocation.lat.toFixed(4)}, Lng:{' '}
                        {currentVehicle.currentLocation.lng.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-blue-400">
                        {currentVehicle.currentLocation.speedKmh}
                      </span>
                      <span className="text-[10px] text-slate-400 block">KM/H Speed</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DOCUMENTS (FUNCTIONAL UPLOAD & MANAGEMENT)                         */}
          {/* ========================================================================= */}
          {activeTab === 'documents' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200">Statutory & Regulatory Documents</span>
                  <p className="text-[11px] text-slate-400">
                    Commercial insurance, fitness certificates, road tax permits, and pollution filings.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                  onClick={() => setIsUploadDocModalOpen(true)}
                >
                  Upload Document
                </Button>
              </div>

              {currentVehicle.documents.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-slate-800 p-6">
                  <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">No statutory documents uploaded for this asset.</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Upload certificates and insurance to maintain commercial compliance.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setIsUploadDocModalOpen(true)}
                  >
                    Upload First Document
                  </Button>
                </div>
              ) : (
                currentVehicle.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-lg border border-slate-800 bg-[#141c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">
                          {doc.type.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" size="sm" className="font-mono">
                          {doc.documentNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Issued: {formatDate(doc.issueDate)}</span>
                        <span>•</span>
                        <span>Expires: {formatDate(doc.expiryDate)}</span>
                        {doc.fileUrl && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400 flex items-center gap-1 font-mono">
                              <FileCheck className="h-3 w-3" />
                              Attached
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.isExpired ? (
                        <Badge variant="danger" dot>Expired Document</Badge>
                      ) : doc.isExpiringSoon ? (
                        <Badge variant="warning" dot>Expiring in &lt; 30 Days</Badge>
                      ) : (
                        <Badge variant="success">Verified Valid</Badge>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 p-1.5 h-8 w-8"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DRIVER ASSIGNMENT (FUNCTIONAL REASSIGN & UNASSIGN)                  */}
          {/* ========================================================================= */}
          {activeTab === 'assignments' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Operational Driver</span>
                    <h4 className="font-semibold text-white text-base mt-0.5">
                      {currentVehicle.assignedDriverName || 'Unassigned / Available for Roster'}
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant={isVehicleOnTrip ? 'outline' : 'primary'}
                    leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                    disabled={isVehicleOnTrip}
                    title={isVehicleOnTrip ? 'Driver cannot be reassigned while vehicle is in transit on an active trip' : undefined}
                    onClick={handleOpenDriverModal}
                  >
                    {isVehicleOnTrip
                      ? 'Trip In Transit (Locked)'
                      : currentVehicle.assignedDriverName
                      ? 'Reassign Driver'
                      : 'Assign Driver'}
                  </Button>
                </div>

                {isVehicleOnTrip && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      Active Linehaul Voyage In Progress: Driver reassignment is locked while vehicle is in transit on a drive. The active trip must be completed and delivered first.
                    </span>
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base">
                      {currentVehicle.assignedDriverName
                        ? currentVehicle.assignedDriverName.substring(0, 2).toUpperCase()
                        : 'NA'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">
                        {currentVehicle.assignedDriverName || 'No Driver Assigned'}
                      </h4>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        {isVehicleOnTrip
                          ? 'Active Linehaul Voyage in Progress'
                          : currentVehicle.assignedDriverName
                          ? 'Certified Linehaul CDL Operator'
                          : 'Asset can be linked to any active roster driver'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 w-full sm:w-auto">
                    <span className="text-slate-400 block text-[10px]">CURRENT ASSET LINK</span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {currentVehicle.registrationNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Driver Compliance Checklist */}
              <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 space-y-2">
                <h5 className="font-semibold text-white text-xs">Driver Telematics & Safety Requirements</h5>
                <p className="text-slate-400 text-[11px]">
                  All assigned commercial drivers must maintain valid medical certifications and adhere to ELD hours of service.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Commercial Driver License (CDL Class A)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>FMCSA Drug & Alcohol Clearinghouse Validated</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>DOT Medical Examiner Certificate</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Electronic Logging Device (ELD) Paired</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TRIPS & OPERATING MARGINS                                          */}
          {/* ========================================================================= */}
          {activeTab === 'trips' && (
            <div className="space-y-4 text-xs">
              {/* Financial telemetry summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Gross Revenue</span>
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-base font-bold text-white font-mono mt-1 block">
                    {formatCurrency(tripEconomics.totalRevenue)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {tripEconomics.tripsCount} commercial voyage manifests
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Total Trip Expenses</span>
                    <Receipt className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <span className="text-base font-bold text-rose-300 font-mono mt-1 block">
                    {formatCurrency(tripEconomics.totalExpenses)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Fuel: {formatCurrency(tripEconomics.totalFuelExpense)} ({tripEconomics.totalExpenses > 0 ? ((tripEconomics.totalFuelExpense / tripEconomics.totalExpenses) * 100).toFixed(0) : 0}%)
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Net Operating Margin</span>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">
                    +{formatCurrency(tripEconomics.netMargin)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400/90 flex items-center gap-1">
                    <Percent className="h-3 w-3 inline" />
                    {tripEconomics.marginPercent.toFixed(1)}% profit margin
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Fuel Incurred on Trips</span>
                    <Fuel className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span className="text-base font-bold text-blue-400 font-mono mt-1 block">
                    {formatCurrency(tripEconomics.totalFuelExpense)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ~{tripEconomics.totalFuelLitres.toLocaleString()} Litres burned
                  </span>
                </div>
              </div>

              {/* Trip Cards Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 text-sm">Linehaul Trips & Financial Economics</span>
                  <p className="text-[11px] text-slate-400">
                    Commercial rate, fuel expenses, tolls, crew allowances, and net margin for {currentVehicle.registrationNumber}.
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {vehicleTrips.length} Recorded Trips
                </Badge>
              </div>

              {vehicleTrips.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-slate-800 p-6">
                  <Navigation className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 font-medium">No trip records found for this asset.</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Dispatch this vehicle on bookings or trips to log live expenses and margins.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleTrips.map((trip) => {
                    const fuelExp = trip.expenses?.find((e) => e.category === 'fuel');
                    const tollExp = trip.expenses?.find((e) => e.category === 'toll');
                    const allowExp = trip.expenses?.find((e) => e.category === 'driver_allowance');
                    const otherExps = trip.expenses?.filter(
                      (e) => !['fuel', 'toll', 'driver_allowance'].includes(e.category)
                    ) || [];
                    const otherExpAmount = otherExps.reduce((s, e) => s + e.amount, 0);

                    const tripMargin = (trip.commercialRate || 0) - (trip.expensesTotal || 0);
                    const tripMarginPct = trip.commercialRate > 0 ? (tripMargin / trip.commercialRate) * 100 : 0;
                    const costPerKm = trip.distanceKm > 0 ? (trip.expensesTotal / trip.distanceKm) : 0;
                    const isExpanded = expandedTripId === trip.id;

                    return (
                      <div
                        key={trip.id}
                        className="rounded-xl border border-slate-800 bg-[#141c2e] overflow-hidden hover:border-slate-700 transition-colors"
                      >
                        {/* Trip Summary Row */}
                        <div className="p-3.5 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono text-xs">{trip.tripCode}</span>
                              <Badge
                                variant={
                                  trip.status === 'in_transit'
                                    ? 'info'
                                    : trip.status === 'completed'
                                    ? 'success'
                                    : trip.status === 'dispatched'
                                    ? 'purple'
                                    : 'warning'
                                }
                                size="sm"
                                dot={trip.status === 'in_transit'}
                              >
                                {trip.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-slate-400 text-[11px] font-medium truncate max-w-[180px]">
                                • {trip.customerName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono">{trip.distanceKm} km</span>
                              <span>•</span>
                              <span>Driver: <strong className="text-slate-200">{trip.driverName}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-slate-300 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            <span>{trip.origin}</span>
                            <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                            <span>{trip.destination}</span>
                          </div>

                          {/* Financial Economics Strip */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-800/80">
                            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Commercial Billing</span>
                              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                                {formatCurrency(trip.commercialRate)}
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Trip Expenses</span>
                              <span className="text-sm font-bold text-rose-300 font-mono mt-0.5 block">
                                {formatCurrency(trip.expensesTotal)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {formatCurrency(costPerKm)}/km
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Net Profit Margin</span>
                              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                                +{formatCurrency(tripMargin)}
                              </span>
                              <span className="text-[10px] text-emerald-400/90 font-medium">
                                {tripMarginPct.toFixed(1)}% margin
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Fuel Incurred</span>
                                <span className="text-sm font-bold text-blue-400 font-mono mt-0.5 block">
                                  {formatCurrency(fuelExp?.amount || 0)}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-white h-7 px-2 text-[11px]"
                                onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                              >
                                {isExpanded ? (
                                  <>Less <ChevronUp className="h-3 w-3 ml-1" /></>
                                ) : (
                                  <>Breakdown <ChevronDown className="h-3 w-3 ml-1" /></>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Itemized Cost & Consumables Breakdown */}
                        {isExpanded && (
                          <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 space-y-3 animate-in fade-in">
                            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                              Itemized Operating Costs & Fuel Consumption
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                              <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-950/20 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-blue-300 font-semibold flex items-center gap-1.5">
                                    <Fuel className="h-3.5 w-3.5 text-blue-400" />
                                    Fuel Expense
                                  </span>
                                  <span className="font-mono font-bold text-white text-xs">
                                    {formatCurrency(fuelExp?.amount || 0)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {fuelExp?.fuelLitres || Math.round(trip.distanceKm * 0.28)} L pumped • ${fuelExp?.fuelPricePerLitre || 1.25}/L
                                </p>
                                {fuelExp?.note && (
                                  <p className="text-[10px] text-slate-500 italic truncate" title={fuelExp.note}>
                                    {fuelExp.note}
                                  </p>
                                )}
                              </div>

                              <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-950/20 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5 text-purple-400" />
                                    Highway Tolls
                                  </span>
                                  <span className="font-mono font-bold text-white text-xs">
                                    {formatCurrency(tollExp?.amount || 0)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Electronic pass & expressway fees</p>
                                {tollExp?.note && (
                                  <p className="text-[10px] text-slate-500 italic truncate" title={tollExp.note}>
                                    {tollExp.note}
                                  </p>
                                )}
                              </div>

                              <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-950/20 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-amber-400" />
                                    Driver Allowance
                                  </span>
                                  <span className="font-mono font-bold text-white text-xs">
                                    {formatCurrency(allowExp?.amount || 0)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Linehaul per-diem & trip stipend</p>
                                {allowExp?.note && (
                                  <p className="text-[10px] text-slate-500 italic truncate" title={allowExp.note}>
                                    {allowExp.note}
                                  </p>
                                )}
                              </div>

                              <div className="p-2.5 rounded-lg border border-slate-700/60 bg-slate-800/40 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                                    <Wrench className="h-3.5 w-3.5 text-slate-400" />
                                    Vehicle / Handling
                                  </span>
                                  <span className="font-mono font-bold text-white text-xs">
                                    {formatCurrency(otherExpAmount)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">Loading, AdBlue top-up, staging</p>
                                {otherExps[0]?.note && (
                                  <p className="text-[10px] text-slate-500 italic truncate" title={otherExps[0].note}>
                                    {otherExps[0].note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: REGULAR SERVICE, CONSUMABLES & WORKSHOP                             */}
          {/* ========================================================================= */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4 text-xs">
              {/* Consumables & Wear Tracker Hub */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <span className="font-semibold text-white text-sm">
                      Consumables, Fluids & Wear-and-Tear Lifecycle
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Mandated regular service items: engine oil, oil & air filtration, AdBlue/DEF, tyre wear, and brakes.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Wrench className="h-3.5 w-3.5" />}
                    onClick={() => setIsMaintModalOpen(true)}
                  >
                    Log Service / Maintenance
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Card 1: Engine Oil Service */}
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-white">Engine Oil Service</span>
                      </div>
                      <Badge variant="warning" size="sm">
                        {currentVehicle.engineOilLifePercent || 76}% Life Remaining
                      </Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${currentVehicle.engineOilLifePercent || 76}%` }}
                      />
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Oil Grade & Viscosity:</span>
                        <strong className="text-slate-200">15W-40 Synthetic Heavy Duty</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Crankcase Sump Capacity:</span>
                        <strong className="text-slate-200">36.0 Litres (~$220 fill)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Oil Flush Due:</span>
                        <strong className="text-blue-400 font-mono">
                          {((currentVehicle.odometerKm || 0) + 6800).toLocaleString()} km
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Oil & Air Filters */}
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Disc className="h-4 w-4 text-emerald-400" />
                        <span className="font-semibold text-white">Oil & Air Filtration</span>
                      </div>
                      <Badge variant="success" size="sm">Clean & Certified</Badge>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-200 block">Full-Flow Spin-On Oil Filter</span>
                          <span className="text-slate-500 text-[10px]">Replaced with oil flush • ~$45</span>
                        </div>
                        <Badge variant="outline" size="sm" className="text-emerald-400 border-emerald-500/30">
                          {currentVehicle.oilFilterStatus === 'replace_due' ? 'Replace Due' : 'Good'}
                        </Badge>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-200 block">Heavy Duty Dual Air Filter</span>
                          <span className="text-slate-500 text-[10px]">Intake restriction: 1.8 kPa • ~$85</span>
                        </div>
                        <Badge variant="outline" size="sm" className="text-emerald-400 border-emerald-500/30">
                          {currentVehicle.airFilterStatus === 'replace_due' ? 'Replace Due' : 'Clean'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: AdBlue / DEF Fluid */}
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-cyan-400" />
                        <span className="font-semibold text-white">AdBlue / DEF Fluid</span>
                      </div>
                      <Badge variant="glow" size="sm">
                        {currentVehicle.adBlueLevelPercent || 82}% Full
                      </Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${currentVehicle.adBlueLevelPercent || 82}%` }}
                      />
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>DEF Reservoir Level:</span>
                        <strong className="text-slate-200 font-mono">
                          {Math.round((currentVehicle.adBlueLevelPercent || 82) * 0.75)} L / 75 L Tank
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Consumption Rate:</span>
                        <strong className="text-slate-200 font-mono">1.35 L / 100 km (~4.7% ratio)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Cruising Range Remaining:</span>
                        <strong className="text-cyan-400 font-mono">~4,600 km</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Tyre Wear & Years in Service */}
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-blue-400" />
                        <span className="font-semibold text-white">Tyre Wear & Age</span>
                      </div>
                      <Badge variant="outline" size="sm">
                        {currentVehicle.tyreHealthPercent || 84}% Tread Health
                      </Badge>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Steer Axle Tread Depth:</span>
                        <strong className="text-emerald-400 font-mono">
                          {currentVehicle.tyreTreadDepthMm || 8.2} mm (Min: 2.0 mm)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Drive Tandem Tread:</span>
                        <strong className="text-slate-200 font-mono">7.4 mm • 7.1 mm</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Age (Years/Months):</span>
                        <strong className="text-slate-200 font-mono">
                          {currentVehicle.tyreYearsInService || 1.8} Years (Batch 4124)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Tyre Rotation Due:</span>
                        <strong className="text-blue-400 font-mono">In ~3,800 km</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Brake Linings & Wear Consumables */}
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-400" />
                        <span className="font-semibold text-white">Brakes & Wearables</span>
                      </div>
                      <Badge variant="purple" size="sm">
                        {currentVehicle.brakePadLifePercent || 78}% Life
                      </Badge>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Air Disc Brake Linings:</span>
                        <strong className="text-slate-200 font-mono">9.4 mm (Safe threshold)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Coolant / Antifreeze:</span>
                        <strong className="text-emerald-400">-38°C Protection (pH 8.4)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Transmission Fluid:</span>
                        <strong className="text-slate-200">Inspected / Viscosity Valid</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Quick Cost Estimate for Major Service */}
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-emerald-400" />
                          <span className="font-semibold text-white">Estimated Service Cost</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">OEM Benchmark</span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Full Consumables Flush:</span>
                          <strong className="text-white font-mono">~$950 (Parts & Labor)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>10-Wheel Full Tyre Set:</span>
                          <strong className="text-white font-mono">~$4,200</strong>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setIsMaintModalOpen(true)}
                    >
                      Record Consumable Refill
                    </Button>
                  </div>
                </div>
              </div>

              {/* Maintenance Work Orders History */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-slate-200 text-sm">Historical Work Orders & Service Invoices</h5>
                  <span className="text-slate-500 text-[11px]">
                    Next Interval:{' '}
                    <strong className="text-blue-400 font-mono">
                      {currentVehicle.nextServiceKm ? `${currentVehicle.nextServiceKm.toLocaleString()} km` : 'Scheduled'}
                    </strong>
                  </span>
                </div>

                {vehicleMaintenanceRecords.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-slate-800 p-6">
                    <Wrench className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">No maintenance service records found for this vehicle.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {vehicleMaintenanceRecords.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-slate-800 bg-[#141c2e] p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {m.recordCode}
                            </Badge>
                            <Badge
                              variant={
                                m.type === 'preventive'
                                  ? 'success'
                                  : m.type === 'breakdown'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {m.type}
                            </Badge>
                          </div>
                          <span className="text-emerald-400 font-bold font-mono">
                            {formatCurrency(m.totalCost)}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-semibold text-white text-sm">{m.issueDescription}</h5>
                          {m.actionTaken && (
                            <p className="text-slate-400 text-[11px] mt-0.5">{m.actionTaken}</p>
                          )}
                        </div>

                        {/* Parts consumed badges */}
                        {m.partsConsumed && m.partsConsumed.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/60 space-y-1">
                            <span className="text-slate-500 text-[10px] uppercase font-semibold block">Consumables Replaced:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {m.partsConsumed.map((part, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
                                >
                                  {part.partName} ({part.quantity}x • {formatCurrency(part.unitCost)})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <span>Reported: {formatDate(m.reportedDate)}</span>
                          <span>•</span>
                          <span>Odometer: {m.odometerAtService.toLocaleString()} km</span>
                          <span>•</span>
                          <span>Workshop: {m.workshopName}</span>
                          {m.technicianName && (
                            <>
                              <span>•</span>
                              <span>Tech: {m.technicianName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: FUEL CONSUMPTION & COST ANALYTICS                                  */}
          {/* ========================================================================= */}
          {activeTab === 'fuel' && (
            <div className="space-y-4 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-semibold text-white text-sm">Fuel Consumption & Operating Cost Telematics</h4>
                  <p className="text-slate-400 text-[11px]">
                    Real-time tank level, average fuel burn rate, idling loss, AdBlue ratio, and fuel expense analytics.
                  </p>
                </div>
                <Badge variant="outline" className="font-mono uppercase">
                  {FUEL_TYPE_LABELS[currentVehicle.fuelType] || currentVehicle.fuelType}
                </Badge>
              </div>

              {/* Fuel Consumption Metrics */}
              <div>
                <span className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider block mb-2">
                  Fuel Consumption Telemetry
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Avg Fuel Consumption</span>
                      <Fuel className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-white block">
                      {currentVehicle.fuelConsumptionL100km || 28.4} L / 100 km
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Empty: 24.2 L • Loaded 24T: 32.6 L
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Engine Idling Burn</span>
                      <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-amber-300 block">
                      1.8 L / Hour
                    </span>
                    <span className="text-[10px] text-slate-500">
                      38.5 L idle burn this month (~$48)
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">AdBlue / DEF Ratio</span>
                      <Zap className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-cyan-300 block">
                      1.35 L / 100 km
                    </span>
                    <span className="text-[10px] text-slate-500">
                      4.7% DEF-to-Diesel consumption ratio
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Eco-Driving Score</span>
                      <Activity className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-400 block">
                      94 / 100
                    </span>
                    <span className="text-[10px] text-emerald-400/90">
                      Optimal cruise & gentle throttle
                    </span>
                  </div>
                </div>
              </div>

              {/* Fuel Cost Metrics */}
              <div>
                <span className="text-slate-400 text-[11px] uppercase font-semibold tracking-wider block mb-2">
                  Fuel Cost Economics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Fuel Cost per KM</span>
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-emerald-400 block">
                      {formatCurrency(currentVehicle.fuelCostPerKm || 0.35)} / km
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Fleet benchmark: $0.38 / km (Saving $0.03/km)
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Estimated Lifetime Fuel Cost</span>
                      <Coins className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-white block">
                      {formatCurrency((currentVehicle.odometerKm || 84000) * (currentVehicle.fuelCostPerKm || 0.35))}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Based on {currentVehicle.odometerKm.toLocaleString()} km run
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Fuel Expense Share</span>
                      <Percent className="h-4 w-4 text-rose-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-rose-300 block">
                      68.5%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Primary vehicle operating expenditure
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Cruising Range at Tank Level</span>
                      <Gauge className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-xl font-bold font-mono text-blue-400 block">
                      ~{Math.round(currentVehicle.fuelLevelPercent * 11.2)} KM
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {currentVehicle.fuelLevelPercent}% Tank Capacity remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Fuel Station Refills Log */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-slate-200 text-sm">Recent Commercial Fuel Pump & DEF Receipts</h5>
                  <Badge variant="outline" className="font-mono text-[10px]">Commercial Fuel Card #9410</Badge>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-slate-800 bg-[#141c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Pilot Flying J Travel Plaza #810</span>
                        <Badge variant="info" size="sm">Diesel #2</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Springfield, IL • 2026-09-16 09:15 • Odometer: 84,100 km
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-emerald-400 text-sm">$280.00</span>
                      <span className="text-[10px] text-slate-500 block font-mono">224.0 L @ $1.25/L</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-[#141c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Love’s Travel Stop & Country Store #412</span>
                        <Badge variant="purple" size="sm">AdBlue DEF</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Gary, IN • 2026-09-14 18:30 • Odometer: 82,450 km
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-cyan-400 text-sm">$54.00</span>
                      <span className="text-[10px] text-slate-500 block font-mono">45.0 L @ $1.20/L</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-[#141c2e] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">TravelCenters of America (TA) #118</span>
                        <Badge variant="info" size="sm">Diesel #2</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Benton Harbor, MI • 2026-09-11 11:20 • Odometer: 80,920 km
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-emerald-400 text-sm">$237.50</span>
                      <span className="text-[10px] text-slate-500 block font-mono">190.0 L @ $1.25/L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: AUDIT HISTORY                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-2.5 text-xs">
              <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                <span className="text-slate-400 block text-[10px]">2026-09-17 12:00 UTC</span>
                <p className="font-medium text-slate-200 mt-0.5">Asset telemetry synchronization verified via GPS IoT gateway.</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                <span className="text-slate-400 block text-[10px]">2026-09-12 09:30 UTC</span>
                <p className="font-medium text-slate-200 mt-0.5">Commercial vehicle registered to active Apex Linehaul roster.</p>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD REGULATORY DOCUMENT                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        title="Upload Statutory & Regulatory Document"
        description={`Attach and register commercial compliance documentation for ${currentVehicle.registrationNumber}.`}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadDocMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Document Classification"
              value={docForm.type}
              onChange={(e) =>
                setDocForm({ ...docForm, type: e.target.value as VehicleDocument['type'] })
              }
              options={[
                { value: 'insurance', label: 'Commercial Fleet Insurance Policy' },
                { value: 'registration', label: 'Vehicle Registration Certificate (RC)' },
                { value: 'fitness_cert', label: 'Annual Vehicle Fitness Certificate' },
                { value: 'road_tax', label: 'Interstate Road Tax Receipt' },
                { value: 'permit', label: 'National Commercial Freight Permit' },
                { value: 'pollution_cert', label: 'Pollution Under Control (PUC) Filing' },
              ]}
            />

            <Input
              label="Document / Policy / Registration Number"
              required
              placeholder="e.g. POL-IL-984201"
              value={docForm.documentNumber}
              onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })}
            />

            <Input
              label="Issuance Date"
              type="date"
              required
              value={docForm.issueDate}
              onChange={(e) => setDocForm({ ...docForm, issueDate: e.target.value })}
            />

            <Input
              label="Expiration Date"
              type="date"
              required
              value={docForm.expiryDate}
              onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
            />

            <Select
              label="Verification Roster Status"
              value={docForm.verificationStatus}
              onChange={(e) =>
                setDocForm({
                  ...docForm,
                  verificationStatus: e.target.value as VehicleDocument['verificationStatus'],
                })
              }
              options={[
                { value: 'verified', label: 'Verified & Active' },
                { value: 'pending', label: 'Pending Compliance Review' },
              ]}
            />

            <Input
              label="Attached Document File Name"
              placeholder="e.g. il_fleet_cert_2026.pdf"
              value={docForm.fileName}
              onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
            />
          </div>

          <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-400" />
              <span className="text-slate-300">Digital Document Verification & Archival</span>
            </div>
            <span className="text-slate-500 text-[11px]">AES-256 Cloud Encrypted</span>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsUploadDocModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={uploadDocMutation.isPending}
            >
              Save & Upload Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN / REASSIGN DRIVER                                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        title="Assign Commercial Linehaul Driver"
        description={`Select or reassign the primary CDL operator for vehicle ${currentVehicle.registrationNumber}.`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignDriverMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="space-y-3">
            <Select
              label="Choose Driver from Active Roster"
              value={modalDriverId}
              onChange={(e) => setModalDriverId(e.target.value)}
              options={[
                { value: 'unassigned', label: '⚠️ Unassign Driver (Keep Vehicle Available for Roster)' },
                ...drivers.map((d) => {
                  const isCurrent = currentVehicle.assignedDriverId === d.id;
                  const onTrip = isDriverOnActiveTrip(d);
                  const tripVeh = getDriverActiveTripVehicle(d);
                  const assignedVeh = allVehicles.find(
                    (v) => v.assignedDriverId === d.id && v.id !== currentVehicle.id
                  );

                  let statusText = 'Available';
                  if (isCurrent) {
                    statusText = 'Currently Assigned Here';
                  } else if (onTrip) {
                    statusText = `⛔ On Active Trip (${tripVeh?.registrationNumber || d.assignedVehicleReg || 'In Transit'}) — Locked`;
                  } else if (assignedVeh) {
                    statusText = `Assigned to ${assignedVeh.registrationNumber} (Idle) • Transferable`;
                  }

                  return {
                    value: d.id,
                    label: `${d.firstName} ${d.lastName} (${d.licenseType}) • [${statusText}]`,
                  };
                }),
              ]}
            />

            {/* RED PROHIBITION ALERT: Driver is currently on an active trip (drive) */}
            {selectedDriverOnTrip && (
              <div className="p-3.5 rounded-lg border border-red-500/50 bg-red-950/30 text-red-300 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-semibold text-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>Prohibited: Driver Currently Operating a Drive</span>
                </div>
                <p className="text-[11px] text-red-200/90 leading-relaxed">
                  <strong>{selectedDriverObj?.firstName} {selectedDriverObj?.lastName}</strong> is currently in transit on an active commercial trip on vehicle{' '}
                  <span className="font-mono font-bold text-white bg-red-900/70 px-1.5 py-0.5 rounded border border-red-500/40">
                    {selectedDriverTripVehicle?.registrationNumber || selectedDriverObj?.assignedVehicleReg || 'in transit'}
                  </span>
                  . A driver cannot be assigned to other vehicles while on a drive. The active trip must be completed and delivered first.
                </p>
              </div>
            )}

            {/* AMBER TRANSFER NOTICE: Driver is assigned to another IDLE vehicle (transferable) */}
            {conflictingIdleVehicle && (
              <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-semibold text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Exclusive Single Vehicle Binding Rule</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  <strong>{selectedDriverObj?.firstName} {selectedDriverObj?.lastName}</strong> is currently assigned to idle vehicle{' '}
                  <span className="font-mono font-bold text-white bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {conflictingIdleVehicle.registrationNumber}
                  </span>
                  . Confirming will automatically <strong>unassign them from {conflictingIdleVehicle.registrationNumber}</strong> and bind them exclusively to <strong>{currentVehicle.registrationNumber}</strong>.
                </p>
              </div>
            )}

            {selectedDriverObj && (
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {selectedDriverObj.firstName[0]}
                      {selectedDriverObj.lastName[0]}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white">
                        {selectedDriverObj.firstName} {selectedDriverObj.lastName}
                      </h5>
                      <span className="text-slate-400 text-[10px]">{selectedDriverObj.licenseNumber}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      selectedDriverOnTrip
                        ? 'danger'
                        : conflictingIdleVehicle
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                    dot={selectedDriverOnTrip}
                  >
                    {selectedDriverOnTrip
                      ? 'On Drive (Locked)'
                      : conflictingIdleVehicle
                      ? `On ${conflictingIdleVehicle.registrationNumber}`
                      : 'Available for Roster'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Safety Rating</span>
                    <span className="font-semibold text-emerald-400">{selectedDriverObj.safetyScore}% Safe</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Direct Phone</span>
                    <span className="font-mono">{selectedDriverObj.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsDriverModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={selectedDriverOnTrip ? 'outline' : 'primary'}
              size="sm"
              type="submit"
              disabled={selectedDriverOnTrip}
              isLoading={assignDriverMutation.isPending}
            >
              {selectedDriverOnTrip
                ? 'Cannot Assign — Driver On Drive'
                : conflictingIdleVehicle
                ? 'Transfer & Assign Driver'
                : 'Confirm Driver Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: LOG MAINTENANCE SERVICE                                          */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="Log Maintenance & Workshop Service"
        description={`Record preventative maintenance, fluid inspection, or workshop repair for ${currentVehicle.registrationNumber}.`}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            logMaintMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Select
                label="Quick Service Package Preset"
                value={servicePreset}
                onChange={(e) => {
                  const val = e.target.value;
                  setServicePreset(val);
                  if (val === 'full_service') {
                    setMaintForm((prev) => ({
                      ...prev,
                      type: 'preventive',
                      issueDescription: 'Full Regular Service Interval (Engine Oil 15W-40, Oil Filter, Air Filter & AdBlue Refill)',
                      actionTaken: 'Mobil Delvac 15W-40 Synthetic (36L) replaced, spin-on oil filter installed, heavy-duty air filter replaced, 45L AdBlue DEF pumped into reservoir.',
                      totalCost: 0,
                      nextServiceKm: (prev.odometerAtService || 0) + 15000,
                    }));
                  } else if (val === 'oil_and_filter') {
                    setMaintForm((prev) => ({
                      ...prev,
                      type: 'preventive',
                      issueDescription: 'Scheduled Engine Oil Flush & Oil Filter Replacement',
                      actionTaken: 'Drained engine oil, replaced with 36L synthetic 15W-40 heavy-duty oil, and replaced full-flow spin-on oil filter.',
                      totalCost: 0,
                      nextServiceKm: (prev.odometerAtService || 0) + 15000,
                    }));
                  } else if (val === 'air_filter') {
                    setMaintForm((prev) => ({
                      ...prev,
                      type: 'preventive',
                      issueDescription: 'Engine Intake Air Cleaner Element Replacement',
                      actionTaken: 'Swapped primary heavy-duty air filter cartridge; cleaned plenum housing; reset intake restriction gauge.',
                      totalCost: 0,
                    }));
                  } else if (val === 'adblue') {
                    setMaintForm((prev) => ({
                      ...prev,
                      type: 'preventive',
                      issueDescription: 'AdBlue / Diesel Exhaust Fluid (DEF) 50L Reservoir Top-up',
                      actionTaken: 'Pumped 50L ISO-22241 certified DEF fluid; tested SCR doser nozzle; verified no crystallisation.',
                      totalCost: 0,
                    }));
                  } else if (val === 'tyre_service') {
                    setMaintForm((prev) => ({
                      ...prev,
                      type: 'preventive',
                      issueDescription: 'Drive Axle Tyre Wear Rotation, Dynamic Balancing & Alignment',
                      actionTaken: 'Tread depth checked across all axles, drive tyres rotated diagonally, pressure balanced to 110 PSI.',
                      totalCost: 0,
                    }));
                  }
                }}
                options={[
                  { value: 'custom', label: 'Custom Maintenance / Specific Work Order' },
                  { value: 'full_service', label: '⭐ Full Regular Service (Engine Oil + Oil Filter + Air Filter + AdBlue Refill)' },
                  { value: 'oil_and_filter', label: '🛢️ Engine Oil Flush & Oil Filter Replacement' },
                  { value: 'air_filter', label: '💨 Engine Air Intake Filter Swapped' },
                  { value: 'adblue', label: '⚡ AdBlue / DEF Fluid 50L Reservoir Top-up' },
                  { value: 'tyre_service', label: '🔄 Tyre Replacement / Rotation & Tread Wear Alignment' },
                ]}
              />
            </div>

            <Select
              label="Maintenance Classification"
              value={maintForm.type}
              onChange={(e) =>
                setMaintForm({ ...maintForm, type: e.target.value as MaintenanceType })
              }
              options={[
                { value: 'preventive', label: 'Scheduled Preventative Maintenance' },
                { value: 'corrective', label: 'Corrective Component Repair' },
                { value: 'breakdown', label: 'Emergency Roadside / Breakdown' },
                { value: 'inspection', label: 'Annual Regulatory Safety Inspection' },
              ]}
            />

            <Select
              label="Work Order Status"
              value={maintForm.status}
              onChange={(e) =>
                setMaintForm({ ...maintForm, status: e.target.value as WorkOrderStatus })
              }
              options={[
                { value: 'completed', label: 'Work Completed' },
                { value: 'in_progress', label: 'In Progress (Vehicle in Workshop)' },
                { value: 'scheduled', label: 'Scheduled for Service' },
              ]}
            />

            <div className="md:col-span-2">
              <Input
                label="Issue Summary / Service Scope"
                required
                placeholder="e.g. 100,000 km Transmission & Brake Fluid Overhaul"
                value={maintForm.issueDescription}
                onChange={(e) => setMaintForm({ ...maintForm, issueDescription: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Work Action Taken / Mechanic Notes"
                rows={2}
                placeholder="e.g. Drained fluid, replaced oil filter, torqued pan bolts to spec, and road-tested."
                value={maintForm.actionTaken}
                onChange={(e) => setMaintForm({ ...maintForm, actionTaken: e.target.value })}
              />
            </div>

            <Input
              label="Workshop / Service Facility Name"
              placeholder="e.g. Apex Central Fleet Workshop"
              value={maintForm.workshopName}
              onChange={(e) => setMaintForm({ ...maintForm, workshopName: e.target.value })}
            />

            <Input
              label="Lead Mechanic / Technician Name"
              placeholder="e.g. Travis Becker (Master Tech)"
              value={maintForm.technicianName}
              onChange={(e) => setMaintForm({ ...maintForm, technicianName: e.target.value })}
            />

            <Input
              label="Odometer at Service (KM)"
              type="number"
              value={maintForm.odometerAtService}
              onChange={(e) =>
                setMaintForm({ ...maintForm, odometerAtService: Number(e.target.value) })
              }
            />

            {maintForm.status === 'completed' ? (
              <Input
                label="Final Invoice Total Cost ($ USD)"
                type="number"
                min="0"
                value={maintForm.totalCost}
                onChange={(e) =>
                  setMaintForm({ ...maintForm, totalCost: Number(e.target.value) })
                }
              />
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400">
                <span className="text-slate-300 font-semibold block text-[11px]">Billed Post-Service</span>
                Parts & labor charges will be calculated and invoiced upon repair completion.
              </div>
            )}

            <div className="md:col-span-2">
              <Input
                label="Next Scheduled Service Interval (KM)"
                type="number"
                helperText="Odometer milestone when next service inspection is mandatory"
                value={maintForm.nextServiceKm}
                onChange={(e) =>
                  setMaintForm({ ...maintForm, nextServiceKm: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsMaintModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={logMaintMutation.isPending}
            >
              Log & Update Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
