import React, { useState } from 'react';
import { Drawer } from '../../components/common/Drawer';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Trip, TripStatus, TripExpense } from '../../types';
import { tripsApi } from '../../api/trips.api';
import {
  Navigation,
  Clock,
  DollarSign,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  ArrowRight,
  ShieldCheck,
  Snowflake,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface TripDetailsDrawerProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TripDetailsDrawer: React.FC<TripDetailsDrawerProps> = ({
  trip,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseData, setExpenseData] = useState({
    category: 'fuel' as TripExpense['category'],
    amount: 150,
    currency: 'USD',
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: TripStatus; note?: string }) =>
      tripsApi.updateTripStatus(trip!.id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['fleetVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] });
    },
  });

  const expenseMutation = useMutation({
    mutationFn: (data: typeof expenseData) =>
      tripsApi.addTripExpense(trip!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setIsAddingExpense(false);
    },
  });

  if (!trip) return null;

  const getStatusBadge = (status: TripStatus) => {
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

  const tabs = [
    { id: 'overview', label: 'Trip Overview' },
    { id: 'timeline', label: 'Route Timeline', count: trip.timeline.length },
    { id: 'expenses', label: 'Expenses & Margins', count: trip.expenses.length },
    ...(trip.temperatureLogs ? [{ id: 'temperature', label: 'Cold-Chain Telemetry' }] : []),
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${trip.tripCode} • ${trip.customerName}`}
      subtitle={`${trip.origin} ➔ ${trip.destination}`}
      width="xl"
    >
      <div className="space-y-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5 text-xs">
            {/* Status & Quick Action Bar */}
            <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {getStatusBadge(trip.status)}
                <span className="text-slate-400">Distance: <strong className="text-white font-mono">{trip.distanceKm} km</strong></span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">Estimated Arrival: <strong className="text-white font-mono">{trip.estimatedArrival}</strong></span>
              </div>

              {/* Status progression trigger */}
              <div className="flex items-center gap-2">
                {trip.status === 'dispatched' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => statusMutation.mutate({ status: 'in_transit', note: 'Departed origin point' })}
                    isLoading={statusMutation.isPending}
                  >
                    Start In-Transit
                  </Button>
                )}
                {trip.status === 'in_transit' && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => statusMutation.mutate({ status: 'completed', note: 'POD signed & delivered successfully' })}
                    isLoading={statusMutation.isPending}
                  >
                    Complete Trip & Deliver POD
                  </Button>
                )}
              </div>
            </div>

            {/* Crew & Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 space-y-2">
                <span className="text-slate-400 block text-[11px]">Assigned Vehicle Asset</span>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white font-mono">{trip.vehicleReg}</span>
                  <Badge variant="outline" size="sm" className="capitalize">{trip.vertical.replace('_', ' ')}</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4 space-y-2">
                <span className="text-slate-400 block text-[11px]">Assigned Commercial Driver</span>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">{trip.driverName}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{trip.driverPhone}</span>
                </div>
              </div>
            </div>

            {/* Commercial terms & financial margins */}
            <div className="rounded-xl border border-slate-800 bg-[#141c2e] p-4">
              <span className="text-slate-400 block text-[11px] mb-3">Commercial Terms & Trip Margins</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">CONTRACT FREIGHT RATE</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(trip.commercialRate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LOGGED OPERATING EXPENSES</span>
                  <span className="text-lg font-bold text-rose-400 font-mono">-{formatCurrency(trip.expensesTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">NET TRIP CONTRIBUTION</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">{formatCurrency(trip.commercialRate - trip.expensesTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">Step-by-step audit log of the journey and status progression.</p>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {trip.timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-[#0f172a]" />
                  <div className="rounded-lg border border-slate-800 bg-[#141c2e] p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white capitalize">{item.status.replace('_', ' ')}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{item.timestamp}</span>
                    </div>
                    {item.note && <p className="text-slate-400 mt-1">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Logged Operating Expenses</span>
              <Button size="sm" variant="outline" onClick={() => setIsAddingExpense(!isAddingExpense)}>
                {isAddingExpense ? 'Cancel' : 'Record Expense'}
              </Button>
            </div>

            {isAddingExpense && (
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3">
                <span className="font-semibold text-white block">Add Fuel, Toll, or Crew Allowance</span>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Expense Category"
                    value={expenseData.category}
                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value as any })}
                    options={[
                      { value: 'fuel', label: 'Fuel / Diesel' },
                      { value: 'toll', label: 'Highway Toll Charges' },
                      { value: 'driver_allowance', label: 'Driver Linehaul Allowance' },
                      { value: 'loading_unloading', label: 'Lumper / Loading Fee' },
                      { value: 'parking', label: 'Overnight Staging / Parking' },
                    ]}
                  />
                  <Input
                    label="Amount (USD)"
                    type="number"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => expenseMutation.mutate(expenseData)}
                    isLoading={expenseMutation.isPending}
                  >
                    Submit Expense
                  </Button>
                </div>
              </div>
            )}

            {trip.expenses.map((exp) => (
              <div key={exp.id} className="p-3 rounded-lg border border-slate-800 bg-[#141c2e] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white capitalize block">{exp.category.replace('_', ' ')}</span>
                  <span className="text-[11px] text-slate-400">Logged {exp.loggedAt}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-white text-sm">{formatCurrency(exp.amount)}</span>
                  <Badge variant="success" size="sm" className="mt-0.5 block">Approved</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cold Chain Reefer Telemetry */}
        {activeTab === 'temperature' && trip.temperatureLogs && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="h-5 w-5 text-cyan-400" />
                <h4 className="font-bold text-white">Cold Chain Pharma Audit Log</h4>
              </div>
              <p className="text-slate-400">Mandated temperature integrity logs for continuous vaccine haulage compliance.</p>

              <div className="mt-4 divide-y divide-cyan-900/40">
                {trip.temperatureLogs.map((log, idx) => (
                  <div key={idx} className="py-2 flex justify-between">
                    <span className="font-mono text-slate-400">{log.timestamp}</span>
                    <span className="font-mono font-bold text-cyan-300">{log.tempC}°C (Target: -20°C)</span>
                    <span className="text-emerald-400 font-semibold">In Compliance</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
