import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelApi } from '../../api/fuel.api';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { FuelLogEntry } from '../../types';
import { Fuel, Plus, AlertTriangle, TrendingUp, CheckCircle2, DollarSign, Gauge, Droplets } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export const FuelManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [newFuelLog, setNewFuelLog] = useState({
    vehicleId: '',
    vehicleReg: '',
    driverId: '',
    driverName: '',
    liters: 180,
    costPerLiter: 1.15,
    odometerKm: 85000,
    fuelStation: 'Love\'s Travel Stop #412',
    receiptNumber: '',
    paymentMethod: 'fuel_card' as FuelLogEntry['paymentMethod'],
  });

  const { data: fuelLogs = [], isLoading } = useQuery({
    queryKey: ['fuelLogs'],
    queryFn: () => fuelApi.getFuelLogs(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['fleetVehicles', 'all', 'all'],
    queryFn: () => fleetApi.getVehicles({ status: 'all', vertical: 'all' }),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
  });

  const logFuelMutation = useMutation({
    mutationFn: (data: typeof newFuelLog) =>
      fuelApi.logFuelEntry({
        vehicleId: data.vehicleId,
        vehicleReg: data.vehicleReg,
        driverId: data.driverId || undefined,
        driverName: data.driverName || undefined,
        liters: data.liters,
        costPerLiter: data.costPerLiter,
        odometerKm: data.odometerKm,
        fuelStation: data.fuelStation,
        receiptNumber: data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
        paymentMethod: data.paymentMethod,
        date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
      setIsLogModalOpen(false);
      setNewFuelLog({
        vehicleId: '',
        vehicleReg: '',
        driverId: '',
        driverName: '',
        liters: 180,
        costPerLiter: 1.15,
        odometerKm: 85000,
        fuelStation: 'Love\'s Travel Stop #412',
        receiptNumber: '',
        paymentMethod: 'fuel_card',
      });
    },
  });

  // Calculate Fuel Metrics
  const totalVolume = fuelLogs.reduce((acc, log) => acc + log.liters, 0);
  const totalSpend = fuelLogs.reduce((acc, log) => acc + log.totalCost, 0);
  const logsWithEfficiency = fuelLogs.filter((log) => (log.kmPerLiter || 0) > 0);
  const avgEfficiency = logsWithEfficiency.length > 0
    ? (logsWithEfficiency.reduce((acc, log) => acc + (log.kmPerLiter || 0), 0) / logsWithEfficiency.length).toFixed(2)
    : '3.15';
  const abnormalLogs = fuelLogs.filter((log) => log.isAbnormal);

  const columns: ColumnDef<FuelLogEntry>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle & Driver',
      sortable: true,
      accessor: (r) => r.vehicleReg,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.vehicleReg}</span>
          <span className="text-slate-300 text-xs">{row.driverName || 'Depot Refuel'}</span>
        </div>
      ),
    },
    {
      key: 'station',
      header: 'Dispensation Station & Date',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-slate-200 block font-medium">{row.fuelStation}</span>
          <span className="text-[10px] text-slate-400">
            {formatDate(row.date || row.loggedAt)} • Ref: {row.receiptNumber || 'POS'}
          </span>
        </div>
      ),
    },
    {
      key: 'volume',
      header: 'Volume & Rate',
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="text-white font-bold block">{row.liters.toLocaleString()} Liters</span>
          <span className="text-[10px] text-slate-400">
            {formatCurrency(row.costPerLiter || row.pricePerLiter || 0)}/L
          </span>
        </div>
      ),
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      sortable: true,
      accessor: (r) => r.totalCost,
      render: (val) => <span className="font-mono font-bold text-emerald-400 text-xs">{formatCurrency(val)}</span>,
    },
    {
      key: 'efficiency',
      header: 'Calculated Efficiency',
      render: (_, row) => (
        <div className="text-xs font-mono">
          {row.kmPerLiter ? (
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${row.isAbnormal ? 'text-rose-400' : 'text-emerald-400'}`}>
                {row.kmPerLiter.toFixed(2)} km/L
              </span>
              {row.isAbnormal && (
                <Badge variant="danger" size="sm">Abnormal Burn</Badge>
              )}
            </div>
          ) : (
            <span className="text-slate-500 italic">First Baseline</span>
          )}
          <span className="text-[10px] text-slate-500 block">Odo: {row.odometerKm.toLocaleString()} km</span>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Payment Type',
      accessor: (r) => r.paymentMethod,
      render: (val) => (
        <Badge variant="outline" size="sm" className="uppercase font-mono text-[10px]">
          {val?.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Fuel className="h-5 w-5 text-amber-400" />
            Fleet Fuel & Consumables Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time fuel card transaction reconciliation, odometer delta tracking, and fuel theft detection.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsLogModalOpen(true)}
        >
          Log Fuel Dispensation
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fuel Volume"
          value={`${totalVolume.toLocaleString()} L`}
          subtitle="All fleet assets (MTD)"
          icon={<Droplets className="h-4 w-4" />}
          accentColor="amber"
        />

        <StatCard
          title="Gross Fuel Spend"
          value={formatCurrency(totalSpend)}
          subtitle="Reconciled pump receipts"
          icon={<DollarSign className="h-4 w-4" />}
          accentColor="emerald"
        />

        <StatCard
          title="Average Fuel Economy"
          value={`${avgEfficiency} km/L`}
          subtitle="Fleet-wide linehaul average"
          icon={<Gauge className="h-4 w-4" />}
          accentColor="blue"
        />

        <StatCard
          title="Fuel Anomaly Alerts"
          value={`${abnormalLogs.length} Events`}
          subtitle="Consumption below 2.0 km/L threshold"
          icon={<AlertTriangle className="h-4 w-4" />}
          accentColor={abnormalLogs.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Fuel Logs Data Table */}
      <DataTable
        columns={columns}
        data={fuelLogs}
        isLoading={isLoading}
        searchPlaceholder="Search vehicle reg, station, driver..."
      />

      {/* LOG FUEL DISPENSATION MODAL */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Vehicle Fuel Dispensation"
        description="Record pump receipt, odometer readings, and verify engine combustion efficiency."
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            logFuelMutation.mutate(newFuelLog);
          }}
          className="space-y-4 text-xs"
        >
          <Select
            label="Fleet Vehicle"
            required
            value={newFuelLog.vehicleId}
            onChange={(e) => {
              const vehId = e.target.value;
              const v = vehicles.find((veh) => veh.id === vehId);
              setNewFuelLog({
                ...newFuelLog,
                vehicleId: vehId,
                vehicleReg: v ? v.registrationNumber : '',
                driverId: v?.assignedDriverId || newFuelLog.driverId,
                driverName: v?.assignedDriverName || newFuelLog.driverName,
                odometerKm: v ? v.odometerKm + 450 : newFuelLog.odometerKm,
              });
            }}
            options={[
              { value: '', label: '-- Select Vehicle --' },
              ...vehicles.map((v) => ({
                value: v.id,
                label: `${v.registrationNumber} — ${v.make} ${v.model} (${v.odometerKm.toLocaleString()} km)`,
              })),
            ]}
          />

          <Select
            label="Assigned / Operating Driver"
            value={newFuelLog.driverId}
            onChange={(e) => {
              const driverId = e.target.value;
              const d = drivers.find((dr) => dr.id === driverId);
              setNewFuelLog({
                ...newFuelLog,
                driverId,
                driverName: d ? `${d.firstName} ${d.lastName}` : '',
              });
            }}
            options={[
              { value: '', label: '-- Select Driver (Optional) --' },
              ...drivers.map((d) => ({
                value: d.id,
                label: `${d.firstName} ${d.lastName} (${d.phone})`,
              })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Volume Dispensed (Liters)"
              type="number"
              required
              step="0.1"
              value={newFuelLog.liters}
              onChange={(e) => setNewFuelLog({ ...newFuelLog, liters: Number(e.target.value) })}
            />

            <Input
              label="Unit Cost Per Liter ($)"
              type="number"
              required
              step="0.01"
              value={newFuelLog.costPerLiter}
              onChange={(e) => setNewFuelLog({ ...newFuelLog, costPerLiter: Number(e.target.value) })}
            />

            <Input
              label="Current Odometer at Pump (KM)"
              type="number"
              required
              value={newFuelLog.odometerKm}
              onChange={(e) => setNewFuelLog({ ...newFuelLog, odometerKm: Number(e.target.value) })}
            />

            <Select
              label="Settlement Method"
              value={newFuelLog.paymentMethod}
              onChange={(e) => setNewFuelLog({ ...newFuelLog, paymentMethod: e.target.value as any })}
              options={[
                { value: 'fuel_card', label: 'Commercial Fleet Fuel Card' },
                { value: 'corporate_card', label: 'Corporate Credit Card' },
                { value: 'cash', label: 'Driver Cash Advance' },
                { value: 'depot_tank', label: 'In-House Depot Pump' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fuel Station & Location"
              required
              value={newFuelLog.fuelStation}
              onChange={(e) => setNewFuelLog({ ...newFuelLog, fuelStation: e.target.value })}
            />

            <Input
              label="Receipt / POS Transaction #"
              placeholder="e.g. REC-99201"
              value={newFuelLog.receiptNumber}
              onChange={(e) => setNewFuelLog({ ...newFuelLog, receiptNumber: e.target.value })}
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between font-mono">
            <span className="text-slate-400 font-sans">Total Transaction Value:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatCurrency(newFuelLog.liters * newFuelLog.costPerLiter)}
            </span>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={logFuelMutation.isPending}>
              Submit Fuel Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
