import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../../api/fleet.api';
import { tripsApi } from '../../api/trips.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Vehicle, VehicleStatus, VerticalType } from '../../types';
import { VehicleDetailsDrawer } from './VehicleDetailsDrawer';
import { FuelManagementTab } from './FuelManagementTab';
import { AccidentManagementTab } from './AccidentManagementTab';
import { Tabs } from '../../components/common/Tabs';
import {
  Truck,
  Plus,
  Eye,
  AlertTriangle,
  Snowflake,
  Fuel,
  TrendingUp,
  Droplets,
  Disc,
  Wrench,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { formatCurrency } from '../../lib/utils';

export const FleetList: React.FC = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'fuel' | 'accidents'>('vehicles');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: 2024,
    type: 'heavy_truck' as Vehicle['type'],
    vertical: 'freight_logistics' as VerticalType,
    fuelType: 'diesel' as Vehicle['fuelType'],
    capacityKg: 24000,
    odometerKm: 0,
    vin: '',
    financingStatus: 'owned' as Vehicle['financingStatus'],
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['fleetVehicles', statusFilter, verticalFilter],
    queryFn: () => fleetApi.getVehicles({ status: statusFilter, vertical: verticalFilter }),
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ['fleetAllTrips'],
    queryFn: () => tripsApi.getTrips(),
  });

  // Trip metrics aggregated by vehicle
  const vehicleMetricsMap = useMemo(() => {
    const map = new Map<string, { totalMargin: number; totalBilling: number; tripsCount: number }>();
    allTrips.forEach((t) => {
      const gross = t.commercialRate || t.grossRate || 0;
      const margin = t.netMargin !== undefined ? t.netMargin : gross - (t.expensesTotal || 0);
      const keys = [t.vehicleId, t.vehicleReg].filter(Boolean) as string[];
      keys.forEach((k) => {
        const existing = map.get(k) || { totalMargin: 0, totalBilling: 0, tripsCount: 0 };
        existing.totalBilling += gross;
        existing.totalMargin += margin;
        existing.tripsCount += 1;
        map.set(k, existing);
      });
    });
    return map;
  }, [allTrips]);

  // Fleet wide macro metrics
  const fleetStats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const avgFuelConsumption = totalVehicles > 0
      ? (vehicles.reduce((acc, v) => acc + (v.fuelConsumptionL100km || 28.5), 0) / totalVehicles).toFixed(1)
      : '28.5';
    const avgFuelCost = totalVehicles > 0
      ? (vehicles.reduce((acc, v) => acc + (v.fuelCostPerKm || 0.35), 0) / totalVehicles).toFixed(2)
      : '0.35';

    let totalRevenue = 0;
    let totalNetProfit = 0;
    allTrips.forEach((t) => {
      const gross = t.commercialRate || t.grossRate || 0;
      const margin = t.netMargin !== undefined ? t.netMargin : gross - (t.expensesTotal || 0);
      totalRevenue += gross;
      totalNetProfit += margin;
    });
    const avgTripMarginPct = totalRevenue > 0
      ? ((totalNetProfit / totalRevenue) * 100).toFixed(1)
      : '85.2';

    const serviceAlertCount = vehicles.filter(
      (v) =>
        (v.engineOilLifePercent !== undefined && v.engineOilLifePercent < 35) ||
        v.oilFilterStatus === 'replace_due' ||
        (v.tyreTreadDepthMm !== undefined && v.tyreTreadDepthMm < 5.0) ||
        (v.adBlueLevelPercent !== undefined && v.adBlueLevelPercent < 25)
    ).length;

    return {
      totalVehicles,
      avgFuelConsumption,
      avgFuelCost,
      totalNetProfit,
      avgTripMarginPct,
      serviceAlertCount,
    };
  }, [vehicles, allTrips]);

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Vehicle>) => fleetApi.createVehicle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      setIsAddModalOpen(false);
      setNewVehicle({
        registrationNumber: '',
        make: '',
        model: '',
        year: 2024,
        type: 'heavy_truck',
        vertical: 'freight_logistics',
        fuelType: 'diesel',
        capacityKg: 24000,
        odometerKm: 0,
        vin: '',
        financingStatus: 'owned',
      });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newVehicle);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return <Badge variant="success" dot>Available</Badge>;
      case 'on_trip':
        return <Badge variant="info" dot>On Trip</Badge>;
      case 'maintenance':
        return <Badge variant="danger" dot>Workshop</Badge>;
      case 'grounded':
        return <Badge variant="warning" dot>Grounded</Badge>;
      case 'breakdown':
        return <Badge variant="danger" dot>Breakdown</Badge>;
      case 'accident':
        return <Badge variant="danger" dot>Accident / Claim</Badge>;
      case 'inactive':
        return <Badge variant="default">Inactive</Badge>;
      case 'sold':
        return <Badge variant="default">Sold</Badge>;
      case 'retired':
        return <Badge variant="default">Retired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      key: 'reg',
      header: 'Registration & Asset',
      sortable: true,
      accessor: (r) => r.registrationNumber,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs shrink-0">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white font-mono">{row.registrationNumber}</span>
              {row.temperatureSensor && (
                <span title="Pharma Cold Chain Telemetry">
                  <Snowflake className="h-3 w-3 text-cyan-400" />
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              {row.year} {row.make} {row.model}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'vertical',
      header: 'Vertical',
      accessor: (r) => r.vertical,
      render: (val: string) => (
        <Badge variant="outline" size="sm" className="capitalize">
          {val.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (r) => r.status,
      render: (val) => getStatusBadge(val as VehicleStatus),
    },
    {
      key: 'driver',
      header: 'Assigned Driver',
      render: (_, row) => (
        <div>
          {row.assignedDriverName ? (
            <span className="font-medium text-slate-200 block">{row.assignedDriverName}</span>
          ) : (
            <span className="text-slate-500 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'telematics',
      header: 'Fuel Economy & Level',
      sortable: true,
      accessor: (r) => r.odometerKm,
      render: (_, row) => {
        const consumption = row.fuelConsumptionL100km ?? 28.5;
        const costPerKm = row.fuelCostPerKm ?? 0.35;
        return (
          <div className="text-xs font-mono space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-200 font-medium">{row.odometerKm.toLocaleString()} km</span>
              <span className="text-emerald-400 font-semibold">{row.fuelLevelPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  row.fuelLevelPercent < 20
                    ? 'bg-red-500'
                    : row.fuelLevelPercent < 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${row.fuelLevelPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Fuel className="h-2.5 w-2.5 text-blue-400" />
              <span>{consumption} L/100km</span>
              <span>•</span>
              <span className="text-slate-300 font-sans">${costPerKm}/km</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'tripMargins',
      header: 'Trip Margin & Revenue',
      render: (_, row) => {
        const stats = vehicleMetricsMap.get(row.id) || vehicleMetricsMap.get(row.registrationNumber);
        if (!stats || stats.totalBilling === 0) {
          return (
            <div className="text-xs">
              <span className="text-slate-500 italic text-[11px]">No active trips</span>
            </div>
          );
        }
        const marginPct = ((stats.totalMargin / stats.totalBilling) * 100).toFixed(1);
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                <TrendingUp className="h-2.5 w-2.5" />
                +{marginPct}%
              </span>
              <span className="font-bold text-white text-[11px] font-mono">
                {formatCurrency(stats.totalMargin)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              from {formatCurrency(stats.totalBilling)} gross ({stats.tripsCount} trips)
            </span>
          </div>
        );
      },
    },
    {
      key: 'consumables',
      header: 'Consumables & Wears',
      render: (_, row) => {
        const oilLife = row.engineOilLifePercent ?? 85;
        const adBlue = row.adBlueLevelPercent ?? 90;
        const tyreDepth = row.tyreTreadDepthMm ?? 11.5;
        const tyreAge = row.tyreYearsInService ?? 1.2;
        const serviceDue = oilLife < 35 || row.oilFilterStatus === 'replace_due' || tyreDepth < 5.0;

        return (
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                  oilLife < 35 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}
                title="Engine Oil Health"
              >
                🛢️ Oil {oilLife}%
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                  adBlue < 25 ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-cyan-300'
                }`}
                title="AdBlue / DEF Fluid Level"
              >
                💧 DEF {adBlue}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Disc className="h-2.5 w-2.5 text-slate-500" />
                <span>{tyreDepth}mm</span>
                <span className="text-slate-500 font-sans">({tyreAge}y)</span>
              </span>
              {serviceDue && (
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                  Service Due
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'documents',
      header: 'Compliance & Docs',
      render: (_, row) => {
        const hasExpired = row.documents.some((d) => d.isExpired);
        const hasExpiringSoon = row.documents.some((d) => d.isExpiringSoon);

        if (hasExpired) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Expired Doc
            </span>
          );
        }
        if (hasExpiringSoon) {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Renewal Soon
            </span>
          );
        }
        return <span className="text-[11px] text-emerald-400">Compliant</span>;
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
            setSelectedVehicle(row);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fleet Asset Register</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telematics, fuel telemetry, trip margins, regular service consumables & compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Register Vehicle
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'vehicles', label: 'Fleet Assets & Telematics', count: vehicles.length },
          { id: 'fuel', label: 'Fuel & Dispensation' },
          { id: 'accidents', label: 'Accidents & Grounding Register' },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'fuel' && <FuelManagementTab />}
      {activeTab === 'accidents' && <AccidentManagementTab />}

      {activeTab === 'vehicles' && (
        <>
          {/* Fleet Top KPI Stats Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Fleet Assets</span>
                <Truck className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{fleetStats.totalVehicles}</div>
              <span className="text-[10px] text-slate-500">Commercial active units</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Avg Fuel Economy</span>
                <Fuel className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono">
                {fleetStats.avgFuelConsumption} <span className="text-xs text-slate-400 font-sans">L/100km</span>
              </div>
              <span className="text-[10px] text-slate-500">Loaded / highway blend</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Fuel Cost Index</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                ${fleetStats.avgFuelCost} <span className="text-xs text-slate-400 font-sans">/ km</span>
              </div>
              <span className="text-[10px] text-slate-500">Burn cost per distance</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Fleet Trip Margin</span>
                <TrendingUp className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-400 font-mono">
                +{fleetStats.avgTripMarginPct}%
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                {formatCurrency(fleetStats.totalNetProfit)} net profit
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Consumables Due</span>
                <Wrench className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-xl font-bold text-orange-400 font-mono">
                {fleetStats.serviceAlertCount}{' '}
                <span className="text-xs text-slate-400 font-sans">units</span>
              </div>
              <span className="text-[10px] text-slate-500">Oil, DEF, filter or tyre</span>
            </div>
          </div>

          {/* Vehicles Table */}
          <DataTable
            columns={columns}
            data={vehicles}
            isLoading={isLoading}
            searchPlaceholder="Search registration, make, model, driver..."
            onRowClick={(row) => setSelectedVehicle(row)}
            filterSlot={
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-36 h-9 text-xs"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'Available' },
                    { value: 'on_trip', label: 'On Trip' },
                    { value: 'maintenance', label: 'Workshop' },
                    { value: 'grounded', label: 'Grounded' },
                    { value: 'breakdown', label: 'Breakdown' },
                    { value: 'accident', label: 'Accident' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
                <Select
                  value={verticalFilter}
                  onChange={(e) => setVerticalFilter(e.target.value)}
                  className="w-40 h-9 text-xs"
                  options={[
                    { value: 'all', label: 'All Verticals' },
                    { value: 'freight_logistics', label: 'Freight Logistics' },
                    { value: 'cold_chain', label: 'Cold Chain' },
                    { value: 'corporate_shuttle', label: 'Corporate Shuttle' },
                    { value: 'b2b_contract', label: 'B2B Contract' },
                    { value: 'last_mile', label: 'Last Mile' },
                    { value: 'tourist_taxi', label: 'Tourist Taxi' },
                    { value: 'bulk_fleet', label: 'Bulk Fleet' },
                    { value: 'project_logistics', label: 'Project Cargo' },
                  ]}
                />
              </div>
            }
          />
        </>
      )}

      {/* Vehicle Inspection Drawer */}
      <VehicleDetailsDrawer
        vehicle={selectedVehicle}
        isOpen={Boolean(selectedVehicle)}
        onClose={() => setSelectedVehicle(null)}
        onVehicleUpdated={(updated) => setSelectedVehicle(updated)}
      />

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          createMutation.reset();
        }}
        title="Register Fleet Vehicle"
        description="Add a new commercial vehicle or reefer unit to the active fleet roster."
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {createMutation.isError && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold block">Backend Validation Error:</span>
                <span>
                  {(createMutation.error as any)?.message ||
                    'Vehicle creation failed on backend validation.'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Registration License Plate"
              required
              placeholder="e.g. IL-8820-FR"
              value={newVehicle.registrationNumber}
              onChange={(e) => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
            />

            <Input
              label="Vehicle Identification Number (VIN)"
              required
              placeholder="e.g. 1FUJBBCK4NL892019"
              value={newVehicle.vin}
              onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
            />

            <Input
              label="Make / Manufacturer"
              required
              placeholder="e.g. Volvo, Freightliner, Kenworth"
              value={newVehicle.make}
              onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
            />

            <Input
              label="Model Specification"
              required
              placeholder="e.g. FH16 750 or Cascadia Sleeper"
              value={newVehicle.model}
              onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
            />

            <Select
              label="Transport Vertical"
              value={newVehicle.vertical}
              onChange={(e) => setNewVehicle({ ...newVehicle, vertical: e.target.value as VerticalType })}
              options={[
                { value: 'freight_logistics', label: 'Goods & Freight Logistics' },
                { value: 'cold_chain', label: 'Cold Chain & Temperature-Controlled' },
                { value: 'b2b_contract', label: 'B2B Contract & Corporate' },
                { value: 'taxi_cab', label: 'Taxi & Cab Operations' },
                { value: 'tourist_bus', label: 'Tourist & Commercial Bus' },
                { value: 'last_mile', label: 'E-commerce Last-Mile Delivery' },
                { value: 'heavy_machinery', label: 'Specialized Heavy Machinery' },
              ]}
            />

            <Select
              label="Body / Asset Type"
              value={newVehicle.type}
              onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
              options={[
                { value: 'heavy_truck', label: 'Heavy Duty Tractor / Semi' },
                { value: 'reefer_cold', label: 'Reefer (Temperature-Controlled)' },
                { value: 'flatbed', label: 'Flatbed Trailer' },
                { value: 'mini_truck', label: 'Mini Truck / Medium Duty' },
                { value: 'bus', label: 'Commercial Passenger Bus' },
                { value: 'sedan', label: 'Urban Sedan / Cab' },
              ]}
            />

            <Select
              label="Fuel Propulsion Type"
              value={newVehicle.fuelType}
              onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value as any })}
              options={[
                { value: 'diesel', label: 'Clean Diesel' },
                { value: 'ev', label: 'Electric Vehicle (EV)' },
                { value: 'cng', label: 'Compressed Natural Gas (CNG)' },
                { value: 'hybrid', label: 'Hybrid Electric' },
              ]}
            />

            <Input
              label="Gross Payload Capacity (kg)"
              type="number"
              value={newVehicle.capacityKg}
              onChange={(e) => setNewVehicle({ ...newVehicle, capacityKg: Number(e.target.value) })}
            />

            <Input
              label="Total KM Run"
              type="number"
              min="0"
              placeholder="e.g. 0 or 25000"
              helperText="Current odometer reading in kilometers"
              value={newVehicle.odometerKm}
              onChange={(e) => setNewVehicle({ ...newVehicle, odometerKm: Number(e.target.value) })}
            />

            <Input
              label="Manufacturing Year"
              type="number"
              min="1990"
              max={new Date().getFullYear() + 1}
              value={newVehicle.year}
              onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
            />

            <Select
              label="Ownership Structure"
              value={newVehicle.financingStatus || 'owned'}
              onChange={(e) => setNewVehicle({ ...newVehicle, financingStatus: e.target.value as any })}
              options={[
                { value: 'owned', label: 'Company Owned (OWNED)' },
                { value: 'leased', label: 'Leased Asset (LEASED)' },
                { value: 'rented', label: 'Rented Fleet (RENTED)' },
                { value: 'attached', label: 'Attached / Partner (ATTACHED)' },
              ]}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
              Register Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
