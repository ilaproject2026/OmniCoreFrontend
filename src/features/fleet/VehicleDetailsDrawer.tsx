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
import { Vehicle, VehicleDocument, Driver, MaintenanceRecord, MaintenanceType, WorkOrderStatus } from '../../types';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import { maintenanceApi } from '../../api/maintenance.api';
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
      label: 'Trips',
      icon: <Navigation className="h-3.5 w-3.5" />,
      count: currentVehicle.totalTripsCount,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Vehicle Status</span>
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

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Total KM Run (Odometer)</span>
                  <span className="text-base font-bold text-white font-mono mt-0.5 block">
                    {currentVehicle.odometerKm.toLocaleString()} km
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Fuel / Energy Level</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-emerald-400 font-mono">
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

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Gross Payload Capacity</span>
                  <span className="text-base font-bold text-slate-200 mt-0.5 block">
                    {currentVehicle.capacityKg
                      ? `${(currentVehicle.capacityKg / 1000).toFixed(1)} Tons (${currentVehicle.capacityKg.toLocaleString()} kg)`
                      : '25.0 Tons'}
                  </span>
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
          {/* TAB 4: TRIPS                                                              */}
          {/* ========================================================================= */}
          {activeTab === 'trips' && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <p className="text-slate-400">
                  Recent linehaul voyages and assigned freight manifests for {currentVehicle.registrationNumber}.
                </p>
                <Badge variant="outline" className="font-mono">
                  {currentVehicle.totalTripsCount} Completed
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">TRP-2026-8801</span>
                    <span className="text-slate-400 text-[11px]">Abbott Park, IL ➔ St. Louis, MO</span>
                  </div>
                  <Badge variant="info">In Transit</Badge>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">TRP-2026-8794</span>
                    <span className="text-slate-400 text-[11px]">Detroit, MI ➔ Chicago, IL</span>
                  </div>
                  <Badge variant="success">Delivered</Badge>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white block">TRP-2026-8650</span>
                    <span className="text-slate-400 text-[11px]">Indianapolis, IN ➔ Green Bay, WI</span>
                  </div>
                  <Badge variant="success">Delivered</Badge>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: MAINTENANCE (FUNCTIONAL LOG SERVICE)                               */}
          {/* ========================================================================= */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200">Scheduled Service & Work Orders</span>
                  <p className="text-slate-400 text-[11px]">
                    Next Scheduled Interval:{' '}
                    <span className="font-mono font-medium text-blue-400">
                      {currentVehicle.nextServiceKm
                        ? `${currentVehicle.nextServiceKm.toLocaleString()} km`
                        : `${((currentVehicle.odometerKm || 0) + 15000).toLocaleString()} km`}
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Wrench className="h-3.5 w-3.5" />}
                  onClick={() => setIsMaintModalOpen(true)}
                >
                  Log Service
                </Button>
              </div>

              {vehicleMaintenanceRecords.length === 0 ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-slate-800 p-6">
                  <Wrench className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No maintenance service records found for this vehicle.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setIsMaintModalOpen(true)}
                  >
                    Log First Service
                  </Button>
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
          )}

          {/* ========================================================================= */}
          {/* TAB 6: FUEL & TELEMATICS                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'fuel' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Propulsion Fuel Type</span>
                  <span className="font-bold text-white uppercase text-sm mt-0.5 block">
                    {FUEL_TYPE_LABELS[currentVehicle.fuelType] || currentVehicle.fuelType}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Current Fuel Tank Level</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm mt-0.5 block">
                    {currentVehicle.fuelLevelPercent}% Capacity
                  </span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Average Efficiency</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">28.8 L / 100 km</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                  <span className="text-slate-400 block text-[11px]">Estimated Cruising Range</span>
                  <span className="font-bold text-blue-400 font-mono text-sm mt-0.5 block">
                    ~{Math.round(currentVehicle.fuelLevelPercent * 11.2)} KM
                  </span>
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

            <Input
              label="Total Cost ($ USD)"
              type="number"
              min="0"
              value={maintForm.totalCost}
              onChange={(e) =>
                setMaintForm({ ...maintForm, totalCost: Number(e.target.value) })
              }
            />

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
