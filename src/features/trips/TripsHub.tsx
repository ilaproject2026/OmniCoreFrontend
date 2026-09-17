import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '../../api/trips.api';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import { crmApi } from '../../api/crm.api';
import { contractsApi } from '../../api/contracts.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Trip, Booking, TripStatus, VerticalType, VehicleType, Vehicle } from '../../types';
import { DispatchBoard } from './DispatchBoard';
import { TripDetailsDrawer } from './TripDetailsDrawer';
import {
  Navigation,
  Plus,
  Eye,
  CheckCircle2,
  Truck,
  AlertTriangle,
  ShieldCheck,
  Users,
  Phone,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const formatVehicleType = (type?: string) => {
  switch (type) {
    case 'sedan':
      return 'Sedan / Cab';
    case 'suv':
      return 'SUV / Passenger Shuttle';
    case 'bus':
      return 'Bus / Coach';
    case 'mini_truck':
      return 'Mini Truck';
    case 'heavy_truck':
      return 'Heavy Truck (Linehaul)';
    case 'reefer_cold':
      return 'Reefer (Cold-Chain)';
    case 'flatbed':
      return 'Flatbed Trailer';
    case 'container':
      return 'Container Carrier';
    default:
      return type ? type.replace('_', ' ') : 'Commercial Vehicle';
  }
};

export const TripsHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'trips' | 'bookings' | 'dispatch'>('trips');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState<Booking | null>(null);
  const [assignModalVehicleId, setAssignModalVehicleId] = useState<string>('');

  // New booking form state
  // New booking form state
  const [newBooking, setNewBooking] = useState<{
    customerName: string;
    customerPhone: string;
    pickupLocation: string;
    dropoffLocation: string;
    vertical: VerticalType;
    vehicleType: VehicleType;
    cargoDescription: string;
    estimatedAmount: number;
    customerId?: string;
    contractId?: string;
  }>({
    customerName: '',
    customerPhone: '',
    pickupLocation: '',
    dropoffLocation: '',
    vertical: 'freight_logistics',
    vehicleType: 'heavy_truck',
    cargoDescription: '',
    estimatedAmount: 2500,
    customerId: '',
    contractId: '',
  });

  const { data: trips = [], isLoading: isTripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getTrips(),
  });

  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => tripsApi.getBookings(),
  });

  const { data: availableVehicles = [] } = useQuery({
    queryKey: ['fleetVehicles', 'available'],
    queryFn: () => fleetApi.getVehicles({ status: 'available' }),
  });

  const { data: allDrivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['crmCustomers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractsApi.getContracts(),
  });

  // Automatically adjust default vehicleType when vertical changes
  const handleVerticalChange = (vertical: VerticalType) => {
    let defaultType: VehicleType = 'heavy_truck';
    if (vertical === 'cold_chain') defaultType = 'reefer_cold';
    else if (vertical === 'corporate_shuttle') defaultType = 'sedan';
    else if (vertical === 'last_mile') defaultType = 'mini_truck';
    else if (vertical === 'b2b_contract' || vertical === 'freight_logistics') defaultType = 'heavy_truck';

    setNewBooking((prev) => ({
      ...prev,
      vertical,
      vehicleType: defaultType,
    }));
  };

  const createBookingMutation = useMutation({
    mutationFn: (data: typeof newBooking) => tripsApi.createBooking(data),
    onSuccess: (createdBooking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsNewBookingModalOpen(false);
      setNewBooking({
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        dropoffLocation: '',
        vertical: 'freight_logistics',
        vehicleType: 'heavy_truck',
        cargoDescription: '',
        estimatedAmount: 2500,
        customerId: '',
        contractId: '',
      });

      // Prompt immediate vehicle assignment for the newly created booking!
      if (createdBooking && createdBooking.status !== 'dispatched') {
        setBookingToAssign(createdBooking);
      }
    },
  });

  // Calculate matching vehicles for the assignment modal
  const requiredModalType: VehicleType = bookingToAssign?.vehicleType || (
    bookingToAssign?.vertical === 'cold_chain'
      ? 'reefer_cold'
      : bookingToAssign?.vertical === 'corporate_shuttle'
      ? 'sedan'
      : 'heavy_truck'
  );

  const matchingModalVehicles = availableVehicles.filter((v) => v.type === requiredModalType);

  // Auto-select first matching vehicle when modal opens
  useEffect(() => {
    if (bookingToAssign) {
      const ready = matchingModalVehicles.find((v) => Boolean(v.assignedDriverId)) || matchingModalVehicles[0];
      setAssignModalVehicleId(ready ? ready.id : '');
    } else {
      setAssignModalVehicleId('');
    }
  }, [bookingToAssign, availableVehicles.length]);

  const selectedModalVehicle = availableVehicles.find((v) => v.id === assignModalVehicleId);
  const selectedModalDriver = allDrivers.find((d) => d.id === selectedModalVehicle?.assignedDriverId);

  const canModalDispatch = Boolean(
    bookingToAssign &&
    selectedModalVehicle &&
    selectedModalVehicle.type === requiredModalType &&
    (selectedModalVehicle.assignedDriverId || selectedModalVehicle.assignedDriverName)
  );

  const assignAndDispatchMutation = useMutation({
    mutationFn: async () => {
      if (!bookingToAssign || !selectedModalVehicle) {
        throw new Error('Please select an available vehicle.');
      }
      return tripsApi.dispatchBooking(
        bookingToAssign.id,
        selectedModalVehicle.id,
        selectedModalVehicle.assignedDriverId
      );
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setBookingToAssign(null);
      setAssignModalVehicleId('');
      setActiveTab('trips');
      if (newTrip) {
        setSelectedTrip(newTrip);
      }
    },
  });

  const getTripStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'in_transit':
        return <Badge variant="info" dot>In Transit</Badge>;
      case 'dispatched':
        return <Badge variant="purple" dot>Dispatched</Badge>;
      case 'loading':
        return <Badge variant="warning" dot>Loading</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const tripColumns: ColumnDef<Trip>[] = [
    {
      key: 'code',
      header: 'Trip Code & Customer',
      sortable: true,
      accessor: (r) => r.tripCode,
      render: (_, row) => (
        <div>
          <span className="font-bold font-mono text-white text-xs block">{row.tripCode}</span>
          <span className="text-slate-300 font-medium">{row.customerName}</span>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Linehaul Route',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-white block font-medium">{row.origin}</span>
          <span className="text-slate-400 text-[11px]">➔ {row.destination}</span>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle Reg',
      accessor: (r) => r.vehicleReg,
      render: (val, row) => (
        <div>
          <span className="font-mono text-xs text-blue-400 font-bold block">{val}</span>
          {row.vehicleType && (
            <span className="text-[10px] text-slate-400">{formatVehicleType(row.vehicleType)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Assigned Driver',
      accessor: (r) => r.driverName,
      render: (val) => <span className="text-slate-200">{val}</span>,
    },
    {
      key: 'rate',
      header: 'Rate / Margin',
      sortable: true,
      accessor: (r) => r.commercialRate,
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="text-emerald-400 font-bold">{formatCurrency(row.commercialRate)}</span>
          <span className="text-[10px] text-slate-500 block">Exp: {formatCurrency(row.expensesTotal)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (r) => r.status,
      render: (val) => getTripStatusBadge(val as TripStatus),
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
            setSelectedTrip(row);
          }}
          leftIcon={<Eye className="h-3.5 w-3.5 text-blue-400" />}
        >
          Track
        </Button>
      ),
    },
  ];

  const bookingColumns: ColumnDef<Booking>[] = [
    {
      key: 'bookingCode',
      header: 'Booking Code',
      accessor: (r) => r.bookingCode,
      render: (val) => <span className="font-mono font-bold text-white text-xs">{val}</span>,
    },
    {
      key: 'customer',
      header: 'Client & Phone',
      render: (_, row) => (
        <div>
          <span className="text-white font-medium block">{row.customerName}</span>
          <span className="text-[11px] text-slate-400">{row.customerPhone}</span>
        </div>
      ),
    },
    {
      key: 'vehicleType',
      header: 'Required Vehicle',
      render: (_, row) => {
        const type = row.vehicleType || (
          row.vertical === 'cold_chain'
            ? 'reefer_cold'
            : row.vertical === 'corporate_shuttle'
            ? 'sedan'
            : 'heavy_truck'
        );
        return (
          <Badge variant="outline" size="sm">
            {formatVehicleType(type)}
          </Badge>
        );
      },
    },
    {
      key: 'cargo',
      header: 'Route & Cargo',
      render: (_, row) => (
        <div className="max-w-[200px] truncate text-xs">
          <span className="text-slate-300 block truncate">{row.pickupLocation} ➔ {row.dropoffLocation}</span>
          <span className="text-[10px] text-slate-500">{row.cargoDescription || 'General Cargo'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Est. Value',
      accessor: (r) => r.estimatedAmount,
      render: (val) => <span className="font-mono font-bold text-emerald-400">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (r) => r.status,
      render: (val: string) => {
        if (val === 'dispatched') return <Badge variant="purple">Dispatched</Badge>;
        if (val === 'confirmed') return <Badge variant="success">Confirmed</Badge>;
        return <Badge variant="warning">Pending</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Dispatch Action',
      render: (_, row) => {
        if (row.status === 'dispatched') {
          return (
            <Badge variant="purple" size="sm">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              On Trip
            </Badge>
          );
        }
        return (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Truck className="h-3.5 w-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              setBookingToAssign(row);
            }}
          >
            Assign Vehicle
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bookings, Trips & Dispatch Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer bookings, vehicle & driver assignment, live GPS tracking, and expense telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewBookingModalOpen(true)}
          >
            Create Customer Booking
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        tabs={[
          { id: 'trips', label: 'Active Trips & History', count: trips.length },
          { id: 'bookings', label: 'Customer Bookings', count: bookings.length },
          { id: 'dispatch', label: 'Live Dispatch Board' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="underline"
      />

      {/* Tab 1: Trips Table */}
      {activeTab === 'trips' && (
        <DataTable
          columns={tripColumns}
          data={trips}
          isLoading={isTripsLoading}
          searchPlaceholder="Search trip code, client, vehicle reg, driver..."
          onRowClick={(row) => setSelectedTrip(row)}
        />
      )}

      {/* Tab 2: Bookings Table */}
      {activeTab === 'bookings' && (
        <DataTable
          columns={bookingColumns}
          data={bookings}
          isLoading={isBookingsLoading}
          searchPlaceholder="Search customer, booking code, phone..."
        />
      )}

      {/* Tab 3: Dispatch Board */}
      {activeTab === 'dispatch' && <DispatchBoard />}

      {/* Trip Details Drawer */}
      <TripDetailsDrawer
        trip={selectedTrip}
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
      />

      {/* Assign Available Vehicle & Dispatch Modal */}
      <Modal
        isOpen={Boolean(bookingToAssign)}
        onClose={() => {
          setBookingToAssign(null);
          setAssignModalVehicleId('');
        }}
        title={`Assign Available Vehicle • ${bookingToAssign?.bookingCode || ''}`}
        description="Select an available vehicle matching the required vehicle type. Its assigned driver will automatically be dispatched."
        size="lg"
      >
        {bookingToAssign && (
          <div className="space-y-4 text-xs">
            {/* Booking Summary Box */}
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-white text-sm">{bookingToAssign.customerName}</span>
                  <span className="text-slate-400 block mt-0.5">{bookingToAssign.cargoDescription}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-bold text-base block">
                    {formatCurrency(bookingToAssign.estimatedAmount)}
                  </span>
                  <Badge variant="outline" size="sm" className="mt-1">
                    Req: {formatVehicleType(requiredModalType)}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
                <span>Route: <strong>{bookingToAssign.pickupLocation}</strong> ➔ <strong>{bookingToAssign.dropoffLocation}</strong></span>
                <span>Scheduled: <strong>{bookingToAssign.scheduledPickupTime}</strong></span>
              </div>
            </div>

            {/* Matching Available Vehicles */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-blue-400" />
                  Select Available {formatVehicleType(requiredModalType)} Asset
                </span>
                <span className="text-[11px] text-slate-400">
                  {matchingModalVehicles.length} available asset{matchingModalVehicles.length !== 1 ? 's' : ''}
                </span>
              </label>

              {matchingModalVehicles.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold block">No Available {formatVehicleType(requiredModalType)} Assets</span>
                    <p className="text-[11px] text-amber-200/80 mt-1">
                      All vehicles matching type <strong>{formatVehicleType(requiredModalType)}</strong> are currently deployed on active trips or in maintenance.
                      To safeguard linehaul operations, assigning an incompatible vehicle (e.g. assigning a truck to a cab booking or vice versa) is prohibited.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {matchingModalVehicles.map((v) => {
                    const isSelected = assignModalVehicleId === v.id;
                    const hasDriver = Boolean(v.assignedDriverId || v.assignedDriverName);

                    return (
                      <div
                        key={v.id}
                        onClick={() => setAssignModalVehicleId(v.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/40'
                            : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white text-xs">{v.registrationNumber}</span>
                          <Badge variant="success" size="sm">Available</Badge>
                        </div>
                        <p className="text-slate-300 font-medium text-[11px]">{v.make} {v.model}</p>
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">
                            Driver: <strong className={hasDriver ? 'text-blue-300' : 'text-amber-400'}>
                              {v.assignedDriverName || 'No Driver Assigned'}
                            </strong>
                          </span>
                          {v.capacityKg ? (
                            <span className="text-slate-500 font-mono">{(v.capacityKg / 1000).toFixed(0)}t cap</span>
                          ) : v.capacityPersons ? (
                            <span className="text-slate-500 font-mono">{v.capacityPersons} seats</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Auto-Assigned Driver Confirmation Card */}
            {selectedModalVehicle && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Bound Driver (Auto-Assigned with {selectedModalVehicle.registrationNumber})
                </label>

                {selectedModalDriver || selectedModalVehicle.assignedDriverName ? (
                  <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedModalDriver?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover border border-blue-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {selectedModalDriver ? `${selectedModalDriver.firstName} ${selectedModalDriver.lastName}` : selectedModalVehicle.assignedDriverName}
                          </span>
                          <Badge variant="success" size="sm">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Assigned
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {selectedModalDriver?.licenseType || 'Commercial CDL Operator'} • Score: {selectedModalDriver?.safetyScore || 96}/100
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span className="font-mono">{selectedModalDriver?.phone || '+1 (312) 555-0834'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>
                      This vehicle does not have an assigned driver. Assign a driver in Fleet Management first or pick an available vehicle that has an active driver.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Dispatch Error Notification */}
            {assignAndDispatchMutation.isError && (
              <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-semibold block">Dispatch Authorization Blocked:</span>
                  <span>{(assignAndDispatchMutation.error as Error)?.message || 'Compliance or availability constraint failed.'}</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setBookingToAssign(null);
                  setAssignModalVehicleId('');
                  assignAndDispatchMutation.reset();
                }}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => assignAndDispatchMutation.mutate()}
                isLoading={assignAndDispatchMutation.isPending}
                disabled={!canModalDispatch}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm & Dispatch Trip
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Booking Modal */}
      <Modal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        title="Create Customer Booking"
        description="Record an inbound transport or linehaul request and link to CRM accounts or active contracts."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBookingMutation.mutate(newBooking);
          }}
          className="space-y-4"
        >
          {/* CRM Quick Picker */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Registered CRM Shipper / Client (Optional)"
                value={newBooking.customerId || ''}
                onChange={(e) => {
                  const custId = e.target.value;
                  const c = customers.find((cust) => cust.id === custId);
                  if (c) {
                    setNewBooking((prev) => ({
                      ...prev,
                      customerId: c.id,
                      customerName: c.companyName || c.name,
                      customerPhone: c.phone,
                    }));
                  } else {
                    setNewBooking((prev) => ({ ...prev, customerId: '' }));
                  }
                }}
                options={[
                  { value: '', label: '-- Custom / Walk-in Shipper --' },
                  ...customers.map((c) => ({
                    value: c.id,
                    label: `${c.companyName || c.name} (${c.contactPerson})`,
                  })),
                ]}
              />

              <Select
                label="Active Dedicated Contract (Optional)"
                value={newBooking.contractId || ''}
                onChange={(e) => {
                  const contractId = e.target.value;
                  const contract = contracts.find((c) => c.id === contractId);
                  setNewBooking((prev) => ({
                    ...prev,
                    contractId: contractId || undefined,
                    ...(contract && !prev.customerName ? { customerName: contract.customerName || contract.clientName } : {}),
                  }));
                }}
                options={[
                  { value: '', label: '-- Spot / Ad-hoc Booking (No Contract) --' },
                  ...contracts
                    .filter((c) => !newBooking.customerId || (c.customerName || c.clientName) === newBooking.customerName)
                    .map((c) => ({
                      value: c.id,
                      label: `${c.contractCode || c.contractNumber} — ${c.title} (${c.customerName || c.clientName})`,
                    })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer / Shipper Name"
              required
              placeholder="e.g. Pfizer BioPharma, Target DC"
              value={newBooking.customerName}
              onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
            />

            <Input
              label="Customer Phone Contact"
              required
              placeholder="e.g. +1 (800) 555-0199"
              value={newBooking.customerPhone}
              onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
            />

            <Input
              label="Pickup Location / Hub"
              required
              placeholder="e.g. Distribution Facility, Kalamazoo, MI"
              value={newBooking.pickupLocation}
              onChange={(e) => setNewBooking({ ...newBooking, pickupLocation: e.target.value })}
            />

            <Input
              label="Dropoff Location / Terminal"
              required
              placeholder="e.g. Northwestern Memorial Hospital Hub, Chicago, IL"
              value={newBooking.dropoffLocation}
              onChange={(e) => setNewBooking({ ...newBooking, dropoffLocation: e.target.value })}
            />

            <Select
              label="Transport Vertical"
              value={newBooking.vertical}
              onChange={(e) => handleVerticalChange(e.target.value as VerticalType)}
              options={[
                { value: 'freight_logistics', label: 'Freight Logistics' },
                { value: 'cold_chain', label: 'Cold Chain & Temperature-Controlled' },
                { value: 'corporate_shuttle', label: 'Corporate Shuttle / Cab' },
                { value: 'b2b_contract', label: 'B2B Contract Logistics' },
                { value: 'last_mile', label: 'Last-Mile Delivery' },
                { value: 'tourist_taxi', label: 'Tourist Taxi & Tours' },
                { value: 'bulk_fleet', label: 'Bulk Liquid & Dry Bulk Haulage' },
                { value: 'project_logistics', label: 'Project Cargo & Over-Dimensional' },
              ]}
            />

            <Select
              label="Required Vehicle Type"
              value={newBooking.vehicleType}
              onChange={(e) => setNewBooking({ ...newBooking, vehicleType: e.target.value as VehicleType })}
              options={[
                { value: 'heavy_truck', label: 'Heavy Truck (Semi / Linehaul Freight)' },
                { value: 'reefer_cold', label: 'Reefer (Cold Storage / Temperature Controlled)' },
                { value: 'sedan', label: 'Sedan / Cab (Executive & Chauffeur)' },
                { value: 'suv', label: 'SUV (Passenger Shuttle)' },
                { value: 'mini_truck', label: 'Mini Truck (Urban / Last-Mile)' },
                { value: 'flatbed', label: 'Flatbed Trailer (Industrial)' },
                { value: 'container', label: 'Container Carrier' },
                { value: 'bus', label: 'Bus / Staff Coach' },
              ]}
            />

            <Input
              label="Commercial Agreed Rate ($)"
              type="number"
              value={newBooking.estimatedAmount}
              onChange={(e) => setNewBooking({ ...newBooking, estimatedAmount: Number(e.target.value) })}
            />

            <div className="md:col-span-2">
              <Input
                label="Cargo / Trip Description"
                placeholder="e.g. 22 Pallets Temperature-Sensitive Vaccines (-20°C strictly mandated)"
                value={newBooking.cargoDescription}
                onChange={(e) => setNewBooking({ ...newBooking, cargoDescription: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsNewBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createBookingMutation.isPending}>
              Create Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

