import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../../api/fleet.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Vehicle, VehicleStatus, VerticalType } from '../../types';
import { VehicleDetailsDrawer } from './VehicleDetailsDrawer';
import { Truck, Plus, Eye, Radio, AlertTriangle, Snowflake } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

export const FleetList: React.FC = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

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
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['fleetVehicles', statusFilter, verticalFilter],
    queryFn: () => fleetApi.getVehicles({ status: statusFilter, vertical: verticalFilter }),
  });

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
      header: 'Total KM & Fuel',
      sortable: true,
      accessor: (r) => r.odometerKm,
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="text-slate-200">{row.odometerKm.toLocaleString()} km</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${row.fuelLevelPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">{row.fuelLevelPercent}%</span>
          </div>
        </div>
      ),
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
            Real-time telematics, document compliance, maintenance history, and driver assignments.
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
              className="w-32 h-9 text-xs"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'available', label: 'Available' },
                { value: 'on_trip', label: 'On Trip' },
                { value: 'maintenance', label: 'Workshop' },
              ]}
            />
            <Select
              value={verticalFilter}
              onChange={(e) => setVerticalFilter(e.target.value)}
              className="w-36 h-9 text-xs"
              options={[
                { value: 'all', label: 'All Verticals' },
                { value: 'freight_logistics', label: 'Freight Logistics' },
                { value: 'cold_chain', label: 'Cold Chain' },
                { value: 'b2b_contract', label: 'B2B Contract' },
                { value: 'taxi_cab', label: 'Taxi & Cab' },
              ]}
            />
          </div>
        }
      />

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
        onClose={() => setIsAddModalOpen(false)}
        title="Register Fleet Vehicle"
        description="Add a new commercial vehicle or reefer unit to the active fleet roster."
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
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
