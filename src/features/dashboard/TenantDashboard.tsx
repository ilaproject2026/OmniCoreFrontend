import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../../contexts/TenantContext';
import { fleetApi } from '../../api/fleet.api';
import { tripsApi } from '../../api/trips.api';
import { driversApi } from '../../api/drivers.api';
import { financeApi } from '../../api/finance.api';
import { maintenanceApi } from '../../api/maintenance.api';
import { warehouseApi } from '../../api/warehouse.api';
import { contractsApi } from '../../api/contracts.api';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';
import {
  Truck,
  Navigation,
  DollarSign,
  AlertTriangle,
  Users,
  Wrench,
  Boxes,
  Clock,
  Fuel,
  Receipt,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';

import { MaintenanceRecord } from '../../types';

export const TenantDashboard: React.FC = () => {
  const { tenant, can } = useTenant();

  // Live Queries
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['dashboardVehicles'],
    queryFn: () => fleetApi.getVehicles(),
  });

  const { data: trips, isLoading: isTripsLoading } = useQuery({
    queryKey: ['dashboardTrips'],
    queryFn: () => tripsApi.getTrips(),
  });

  const { data: drivers, isLoading: isDriversLoading } = useQuery({
    queryKey: ['dashboardDrivers'],
    queryFn: () => driversApi.getDrivers(),
  });

  const { data: financeSummary, isLoading: isFinanceLoading } = useQuery({
    queryKey: ['dashboardFinanceSummary'],
    queryFn: () => financeApi.getSummary(),
    enabled: can('finance.view'),
  });

  const { data: maintenanceRecords, isLoading: isMaintenanceLoading } = useQuery({
    queryKey: ['dashboardMaintenance'],
    queryFn: () => maintenanceApi.getRecords(),
  });

  const { data: spareParts, isLoading: isWarehouseLoading } = useQuery({
    queryKey: ['dashboardSpareParts'],
    queryFn: () => warehouseApi.getSpareParts({ lowStockOnly: true }),
  });

  const { data: contracts, isLoading: isContractsLoading } = useQuery({
    queryKey: ['dashboardContracts'],
    queryFn: () => contractsApi.getContracts(),
  });

  // Derived real metrics
  const activeTrips = (trips || []).filter((t) => t.status === 'in_transit' || t.status === 'dispatched');
  const totalVehicles = vehicles?.length || 0;
  const availableVehicles = (vehicles || []).filter((v) => v.status === 'available').length;
  const utilizationRate = totalVehicles > 0 ? (((totalVehicles - availableVehicles) / totalVehicles) * 100).toFixed(1) : '0.0';
  const activeDrivers = (drivers || []).filter((d) => d.status === 'on_trip' || d.status === 'available').length;
  const activeWorkOrders = (maintenanceRecords || []).filter((w: MaintenanceRecord) => w.status !== 'completed' && w.status !== 'cancelled');
  const lowStockCount = spareParts?.length || 0;

  const avgSla = contracts && contracts.length > 0
    ? (contracts.reduce((acc, c) => acc + (c.slaActualPercent || 100), 0) / contracts.length).toFixed(1)
    : '100';

  // Compliance alerts calculation
  const vehiclesWithExpiringDocs = (vehicles || []).filter((v) =>
    (v.documents || []).some((d) => d.isExpired || (d.expiryDate && new Date(d.expiryDate).getTime() - Date.now() < 15 * 86400000))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Fleet Operations Hub</h1>
            <Badge variant="glow">{tenant.name}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, trip dispatch orchestration, vehicle status, and financial performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Action Shortcuts */}
          <Link to="/app/trips">
            <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              New Dispatch
            </Button>
          </Link>
          <Link to="/app/fleet">
            <Button size="sm" variant="outline" leftIcon={<Truck className="h-4 w-4" />}>
              Add Vehicle
            </Button>
          </Link>
          {can('finance.view') && (
            <Link to="/app/finance">
              <Button size="sm" variant="outline" leftIcon={<Receipt className="h-4 w-4" />}>
                Record Expense
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Operational Alert Banners if any real vehicle docs are expiring */}
      {vehiclesWithExpiringDocs.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="rounded-full bg-amber-500/20 p-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-200">
                {vehiclesWithExpiringDocs.length} Vehicle{vehiclesWithExpiringDocs.length > 1 ? 's' : ''} with Document Expiries
              </p>
              <p className="text-amber-300/80 text-[11px]">
                Requires immediate compliance review before next route dispatch
              </p>
            </div>
          </div>
          <Link to="/app/fleet" className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 shrink-0 underline">
            Review Compliance
          </Link>
        </div>
      )}

      {/* 10 Primary Operations & Finance Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Row 1: Fleet & Trips */}
        <StatCard
          title="Active In-Transit"
          value={`${activeTrips.length} Trips`}
          subtitle="Real-time routes"
          icon={<Navigation className="h-4 w-4" />}
          accentColor="blue"
          isLoading={isTripsLoading}
        />

        <StatCard
          title="Available Fleet"
          value={`${availableVehicles} Units`}
          subtitle={`${totalVehicles} registered in fleet`}
          icon={<Truck className="h-4 w-4" />}
          accentColor="emerald"
          isLoading={isVehiclesLoading}
        />

        <StatCard
          title="Fleet Utilization"
          value={`${utilizationRate}%`}
          subtitle="Active fleet ratio"
          icon={<TrendingUp className="h-4 w-4" />}
          accentColor="cyan"
          isLoading={isVehiclesLoading}
        />

        <StatCard
          title="Active Drivers"
          value={`${activeDrivers} Drivers`}
          subtitle="Assigned & available"
          icon={<Users className="h-4 w-4" />}
          accentColor="purple"
          isLoading={isDriversLoading}
        />

        <StatCard
          title="Maintenance Due"
          value={`${activeWorkOrders.length} Work Orders`}
          subtitle="Pending workshop action"
          icon={<Wrench className="h-4 w-4" />}
          accentColor="amber"
          isLoading={isMaintenanceLoading}
        />

        {/* Row 2: Finance & Inventory */}
        {can('finance.view') && (
          <StatCard
            title="Revenue"
            value={formatCurrency(financeSummary?.totalRevenue ?? 0)}
            subtitle={`Collections: ${formatCurrency(financeSummary?.totalCollections ?? 0)}`}
            icon={<DollarSign className="h-4 w-4" />}
            accentColor="emerald"
            isLoading={isFinanceLoading}
          />
        )}

        {can('finance.view') && (
          <StatCard
            title="Fuel & Toll Spend"
            value={formatCurrency((financeSummary?.fuelExpenses ?? 0) + (financeSummary?.tollExpenses ?? 0))}
            subtitle="Operational burn"
            icon={<Fuel className="h-4 w-4" />}
            accentColor="rose"
            isLoading={isFinanceLoading}
          />
        )}

        {can('finance.view') && (
          <StatCard
            title="Outstanding Invoices"
            value={formatCurrency(financeSummary?.outstandingBalance ?? 0)}
            subtitle="Receivables balance"
            icon={<Receipt className="h-4 w-4" />}
            accentColor="amber"
            isLoading={isFinanceLoading}
          />
        )}

        <StatCard
          title="Low Stock Spares"
          value={`${lowStockCount} SKUs`}
          subtitle="Below reorder threshold"
          icon={<Boxes className="h-4 w-4" />}
          accentColor="rose"
          isLoading={isWarehouseLoading}
        />

        <StatCard
          title="Contract SLA Rate"
          value={`${avgSla}%`}
          subtitle="Contract target fulfillment"
          icon={<FileText className="h-4 w-4" />}
          accentColor="blue"
          isLoading={isContractsLoading}
        />
      </div>

      {/* Main Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatch Volume chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Dispatch Volume & Trip Velocity</h3>
              <p className="text-xs text-slate-400">Completed linehaul vs active in-transit loads</p>
            </div>
            <Badge variant="outline">Telemetry</Badge>
          </div>

          <div className="h-64 mt-4 w-full">
            {isTripsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-full h-48 bg-slate-800/40 rounded-lg animate-pulse" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: 'Completed', count: (trips || []).filter((t) => t.status === 'completed').length },
                    { category: 'In Transit', count: (trips || []).filter((t) => t.status === 'in_transit').length },
                    { category: 'Dispatched', count: (trips || []).filter((t) => t.status === 'dispatched').length },
                    { category: 'Scheduled', count: (trips || []).filter((t) => t.status === 'scheduled').length },
                  ]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" name="Trips" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Revenue Trajectory or Fleet Readiness */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue & Operating Burn</h3>
              <p className="text-xs text-slate-400">Gross earnings vs monthly expenses</p>
            </div>
          </div>

          <div className="h-64 mt-4 w-full">
            {isFinanceLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-full h-48 bg-slate-800/40 rounded-lg animate-pulse" />
              </div>
            ) : financeSummary?.monthlyRevenueSeries && financeSummary.monthlyRevenueSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeSummary.monthlyRevenueSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#revGrad)" name="Revenue ($)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="none" name="Expenses ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No financial trajectory logged
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Live Dispatches & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Live Dispatched Hauls</h3>
            </div>
            <Link to="/app/trips" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Dispatch Board <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {isTripsLoading ? (
              <div className="py-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-48 bg-slate-800/50 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-slate-800/30 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : activeTrips.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No active trips currently in transit.</p>
            ) : (
              activeTrips.slice(0, 3).map((trip) => (
                <div key={trip.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{trip.tripCode}</span>
                      <Badge variant="glow">{trip.vehicleReg || 'Fleet Unit'}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {trip.origin} ➔ {trip.destination} {trip.driverName ? `(${trip.driverName})` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">{formatCurrency(trip.commercialRate || 0)}</span>
                    <span className="text-[10px] text-slate-500 block">{trip.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Upcoming Maintenance</h3>
            </div>
            <Link to="/app/maintenance" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Workshop <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {isMaintenanceLoading ? (
              <div className="py-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-48 bg-slate-800/50 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-slate-800/30 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : activeWorkOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No active maintenance work orders.</p>
            ) : (
              activeWorkOrders.slice(0, 3).map((wo: MaintenanceRecord) => (
                <div key={wo.id} className="py-3 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{wo.recordCode}: {wo.issueDescription}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {wo.vehicleReg} • {wo?.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant={wo.status === 'in_progress' ? 'warning' : 'info'} dot>
                    {wo?.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
