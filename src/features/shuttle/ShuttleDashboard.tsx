import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Bus,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Building2,
  Search,
  Phone,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { shuttleApi } from '../../api/shuttle.api';
import { ShuttleRoute, ShuttleSchedule, ShuttlePassenger } from '../../types';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { DataTable, Column } from '../../components/tables/DataTable';
import {
  useShuttleRoutes,
  useShuttleOrganizations,
  useShuttleSchedules,
  useShuttlePassengers,
  useCreateShuttleRouteMutation,
  useCreateShuttleOrganizationMutation,
  useCreateShuttleScheduleMutation,
  useUpdateScheduleStatusMutation,
  useMarkPassengerBoardedMutation,
} from '../../hooks/queries';
import { QueryStateWrapper } from '../../components/common/QueryStateWrapper';

export const ShuttleDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('routes');
  const { data: organizations = [] } = useShuttleOrganizations();

  // Search & Filters
  const [paxSearch, setPaxSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');

  // TanStack Queries
  const {
    data: routes = [],
    isLoading: isLoadingRoutes,
    isError: isRoutesError,
    error: routesError,
    refetch: refetchRoutes,
  } = useShuttleRoutes();

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    isError: isSchedulesError,
    error: schedulesError,
    refetch: refetchSchedules,
  } = useShuttleSchedules();

  const {
    data: passengers = [],
    isLoading: isLoadingPassengers,
    isError: isPassengersError,
    error: passengersError,
    refetch: refetchPassengers,
  } = useShuttlePassengers();

  // TanStack Mutations
  const createRouteMutation = useCreateShuttleRouteMutation();
  const createOrganizationMutation = useCreateShuttleOrganizationMutation();
  const createScheduleMutation = useCreateShuttleScheduleMutation();
  const updateScheduleStatusMutation = useUpdateScheduleStatusMutation();
  const markBoardedMutation = useMarkPassengerBoardedMutation();

  const loading = isLoadingRoutes || isLoadingSchedules || isLoadingPassengers;

  // Modals
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [isNewOrganizationModalOpen, setIsNewOrganizationModalOpen] = useState(false);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<ShuttleRoute | null>(null);

  // Form states
  const [newRouteForm, setNewRouteForm] = useState({
    organizationId: '',
    routeCode: '',
    name: '',
    startLocation: '',
    endLocation: '',
    direction: 'INBOUND',
  });
  const [newOrganizationForm, setNewOrganizationForm] = useState({ orgType: 'CORPORATE' as 'CORPORATE' | 'SCHOOL', name: '', code: '', contactPerson: '', contactEmail: '', contactPhone: '', address: '' });

  const [newScheduleForm, setNewScheduleForm] = useState({
    routeId: '',
    shift: 'morning_inbound' as ShuttleSchedule['shift'],
    departureTime: '07:30',
    arrivalTime: '08:15',
    busReg: 'BUS-SH-104',
    driverName: 'Arthur Vance',
    capacityTotal: 45,
  });

  // Stats calculation
  const stats = useMemo(() => {
    const totalRoutes = routes.length;
    const totalPassengers = passengers.length;
    const boardedToday = passengers.filter((p) => p.hasBoardedToday).length;
    const boardingRate = totalPassengers > 0 ? Math.round((boardedToday / totalPassengers) * 100) : 0;
    const activeShuttles = schedules.filter((s) => s.status === 'in_transit').length;

    return {
      totalRoutes,
      totalPassengers,
      boardedToday,
      boardingRate,
      activeShuttles,
    };
  }, [routes, passengers, schedules]);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRouteMutation.mutateAsync(newRouteForm);
      setIsNewRouteModalOpen(false);
    } catch (err) {
      console.error('Error creating route:', err);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const organization = await createOrganizationMutation.mutateAsync(newOrganizationForm);
      setNewRouteForm((form) => ({ ...form, organizationId: organization.id }));
      setNewOrganizationForm({ orgType: 'CORPORATE', name: '', code: '', contactPerson: '', contactEmail: '', contactPhone: '', address: '' });
      setIsNewOrganizationModalOpen(false);
      setIsNewRouteModalOpen(true);
    } catch (err) {
      console.error('Error creating shuttle organization:', err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const route = routes.find((r) => r.id === newScheduleForm.routeId) || routes[0];
    try {
      await createScheduleMutation.mutateAsync({
        ...newScheduleForm,
        routeName: route ? route.name : 'Corporate Express',
      });
      setIsNewScheduleModalOpen(false);
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  };

  const handleToggleBoarding = async (passengerId: string, currentStatus: boolean) => {
    try {
      await markBoardedMutation.mutateAsync({
        passengerId,
        hasBoarded: !currentStatus,
      });
    } catch (err) {
      console.error('Error updating boarding status:', err);
    }
  };

  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      const matchesSearch =
        !paxSearch ||
        p.name.toLowerCase().includes(paxSearch.toLowerCase()) ||
        p.employeeOrStudentId.toLowerCase().includes(paxSearch.toLowerCase()) ||
        p.assignedStopName.toLowerCase().includes(paxSearch.toLowerCase());

      const matchesRoute = routeFilter === 'all' || p.assignedRouteId === routeFilter;
      return matchesSearch && matchesRoute;
    });
  }, [passengers, paxSearch, routeFilter]);

  const passengerColumns: Column<ShuttlePassenger>[] = [
    {
      key: 'name',
      header: 'Passenger & ID',
      sortable: true,
      render: (_: any, row: ShuttlePassenger) => (
        <div>
          <div className="font-bold text-slate-200">{row.name}</div>
          <span className="text-[10px] text-slate-400 font-mono">{row.employeeOrStudentId}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Category',
      render: (_: any, row: ShuttlePassenger) => (
        <Badge variant={row.type === 'employee' ? 'info' : 'warning'} size="xs">
          {row.type.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'assignedStopName',
      header: 'Boarding Stop',
      render: (_: any, row: ShuttlePassenger) => (
        <div className="text-xs text-slate-300 flex items-center gap-1">
          <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
          <span>{row.assignedStopName}</span>
        </div>
      ),
    },
    {
      key: 'contactPhone',
      header: 'Emergency Contact',
      render: (_: any, row: ShuttlePassenger) => (
        <div className="text-xs text-slate-400">
          <div>{row.contactPhone}</div>
          <div className="text-[10px] text-slate-500 truncate max-w-xs">{row.emergencyContact}</div>
        </div>
      ),
    },
    {
      key: 'hasBoardedToday',
      header: 'Boarding Status',
      render: (_: any, row: ShuttlePassenger) => (
        <div>
          {row.hasBoardedToday ? (
            <Badge variant="success" size="sm">
              BOARDED ({row.boardingTimestamp || 'Scan verified'})
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              NOT BOARDED
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: ShuttlePassenger) => (
        <div className="flex justify-end">
          <Button
            size="xs"
            variant={row.hasBoardedToday ? 'outline' : 'primary'}
            className={row.hasBoardedToday ? 'text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'}
            onClick={() => handleToggleBoarding(row.id, row.hasBoardedToday)}
          >
            {row.hasBoardedToday ? 'Cancel Boarding' : 'Mark Boarded (QR)'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                School & Corporate Shuttle Pooling
                <Badge variant="info" size="sm" className="font-mono">
                  FIXED TRANSIT
                </Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage scheduled routes, sequential stop timetables, employee & student rosters, and digital boarding passes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchRoutes();
              refetchSchedules();
              refetchPassengers();
            }}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Shifts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewScheduleModalOpen(true)}
            icon={<Clock className="h-4 w-4 text-cyan-400" />}
          >
            Add Daily Schedule
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewRouteModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Create Shuttle Route
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Active Shuttle Routes"
          value={stats.totalRoutes}
          icon={MapPin}
          change="Sequential stop sync"
          changeType="neutral"
        />
        <StatCard
          title="Registered Passengers"
          value={stats.totalPassengers}
          icon={Users}
          change="Corporate & Students"
          changeType="positive"
        />
        <StatCard
          title="Boarded Today"
          value={`${stats.boardedToday} pax`}
          icon={CheckCircle2}
          change={`${stats.boardingRate}% Attendance Rate`}
          changeType="positive"
        />
        <StatCard
          title="Shuttles En Route"
          value={stats.activeShuttles}
          icon={Bus}
          change="Live GPS geofenced"
          changeType="positive"
        />
        <StatCard
          title="On-Time Punctuality"
          value="98.2%"
          icon={TrendingUp}
          change="Optimal shift matching"
          changeType="positive"
        />
      </div>

      {/* Module Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'routes', label: `Transit Routes (${routes.length})` },
          { id: 'schedules', label: `Shift Schedules (${schedules.length})` },
          { id: 'passengers', label: `Passenger Rosters & Attendance (${passengers.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= TAB 1: ROUTES MANAGEMENT ================= */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-indigo-400">{route.routeCode}</span>
                    <Badge variant={route.status === 'active' ? 'success' : 'neutral'} size="xs">
                      {route.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2">{route.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Destination: {route.destinationCampus}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Distance & Time:</span>
                      <span className="font-semibold text-white">{route.totalDistanceKm} km • {route.estimatedDurationMins}m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Assigned Coach:</span>
                      <span className="font-semibold text-cyan-400 font-mono">{route.assignedBusNumber || 'Pending'}</span>
                    </div>
                  </div>

                  {/* Sequential stops listing */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sequential Stop Timings ({route.stops.length})
                    </span>
                    {route.stops.map((stop) => (
                      <div
                        key={stop.id}
                        className="flex items-center justify-between p-2 rounded border border-slate-800/80 bg-slate-900/40 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-slate-800 text-slate-300 text-[9px] flex items-center justify-center font-bold">
                            {stop.sequence}
                          </span>
                          <span className="font-medium text-slate-200">{stop.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 text-[11px]">{stop.scheduledTime}</span>
                          <span className="text-[10px] text-slate-500">({stop.passengersAssignedCount} pax)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Driver: <strong className="text-slate-200">{route.assignedDriverName}</strong></span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setActiveTab('passengers');
                      setRouteFilter(route.id);
                    }}
                  >
                    View Roster
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SHIFT SCHEDULES ================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sch) => {
              const occupancyPercent = Math.round((sch.occupancyCount / sch.capacityTotal) * 100);
              return (
                <Card key={sch.id} className="p-5 border-slate-800 bg-slate-900/60">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Shift: {sch.shift.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{sch.routeName}</h4>
                    </div>
                    <Badge
                      variant={sch.status === 'in_transit' ? 'warning' : sch.status === 'arrived' ? 'success' : 'info'}
                      size="sm"
                    >
                      {sch.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="my-4 grid grid-cols-3 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Departure</span>
                      <span className="font-mono font-bold text-white text-sm">{sch.departureTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Arrival Due</span>
                      <span className="font-mono font-bold text-white text-sm">{sch.arrivalTime}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Bus Reg</span>
                      <span className="font-mono font-bold text-cyan-400">{sch.busReg}</span>
                    </div>
                  </div>

                  {/* Seat Occupancy Meter */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Seat Occupancy:</span>
                      <span className="font-bold text-white">{sch.occupancyCount} / {sch.capacityTotal} Seats ({occupancyPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          occupancyPercent > 90 ? 'bg-rose-500' : occupancyPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                    <div className="text-slate-400">
                      Assigned Driver: <span className="text-slate-200 font-medium">{sch.driverName}</span> ({sch.driverPhone})
                    </div>
                    <div className="flex gap-2">
                      {sch.status === 'scheduled' && (
                        <Button
                          size="xs"
                          variant="primary"
                          isLoading={updateScheduleStatusMutation.isPending}
                          onClick={async () => {
                            await updateScheduleStatusMutation.mutateAsync({ id: sch.id, status: 'in_transit' });
                          }}
                        >
                          Dispatch Shuttle
                        </Button>
                      )}
                      {sch.status === 'in_transit' && (
                        <Button
                          size="xs"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-500"
                          isLoading={updateScheduleStatusMutation.isPending}
                          onClick={async () => {
                            await updateScheduleStatusMutation.mutateAsync({ id: sch.id, status: 'arrived' });
                          }}
                        >
                          Confirm Arrival
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PASSENGER ROSTER & ATTENDANCE ================= */}
      {activeTab === 'passengers' && (
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/60 border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search passenger name, ID, stop..."
                  value={paxSearch}
                  onChange={(e) => setPaxSearch(e.target.value)}
                  className="pl-9 bg-slate-950/80 border-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="w-56 bg-slate-950/80 border-slate-800 text-xs"
                  options={[
                    { label: 'All Shuttle Routes', value: 'all' },
                    ...routes.map((r) => ({ label: r.name, value: r.id })),
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPaxSearch('');
                    setRouteFilter('all');
                  }}
                  className="text-xs text-slate-400"
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <QueryStateWrapper
            isLoading={isLoadingPassengers}
            isError={isPassengersError}
            error={passengersError}
            onRetry={refetchPassengers}
            loadingMessage="Synchronizing passenger boarding rosters with campus transit network..."
          >
            <Card className="p-0 overflow-hidden border-slate-800">
              <DataTable
                columns={passengerColumns}
                data={filteredPassengers}
                keyField="id"
                isLoading={false}
                emptyTitle="No passengers found"
                emptyDescription="No passengers found matching search criteria."
              />
            </Card>
          </QueryStateWrapper>
        </div>
      )}

      {/* ================= MODAL: CREATE SHUTTLE ROUTE ================= */}
      <Modal
        isOpen={isNewRouteModalOpen}
        onClose={() => setIsNewRouteModalOpen(false)}
        title="Create Fixed Transit Shuttle Route"
      >
        <form onSubmit={handleCreateRoute} className="space-y-4">
          {createRouteMutation.isError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{(createRouteMutation.error as Error)?.message || 'Could not create shuttle route.'}</p>}
          <div className="flex items-end gap-2">
            <Select
              label="Corporate / School Organization"
              required
              value={newRouteForm.organizationId}
              onChange={(e) => setNewRouteForm({ ...newRouteForm, organizationId: e.target.value })}
              options={[{ label: '-- Select organization --', value: '' }, ...organizations.filter((organization) => organization.isActive).map((organization) => ({ label: `${organization.name} (${organization.code})`, value: organization.id }))]}
            />
            <Button type="button" variant="outline" onClick={() => { setIsNewRouteModalOpen(false); setIsNewOrganizationModalOpen(true); }}>Add Organization</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Route Identifier"
              required
              value={newRouteForm.routeCode}
              onChange={(e) => setNewRouteForm({ ...newRouteForm, routeCode: e.target.value })}
              placeholder="e.g. S-CORP-202"
            />
            <Select label="Route Direction" value={newRouteForm.direction} onChange={(e) => setNewRouteForm({ ...newRouteForm, direction: e.target.value })} options={[{ label: 'Inbound', value: 'INBOUND' }, { label: 'Outbound', value: 'OUTBOUND' }, { label: 'Round Trip', value: 'ROUND_TRIP' }]} />
          </div>

          <Input
            label="Route Name"
            required
            value={newRouteForm.name}
            onChange={(e) => setNewRouteForm({ ...newRouteForm, name: e.target.value })}
            placeholder="e.g. Downtown to West Loop Campus"
          />

          <Input
            label="Starting Location"
            required
            value={newRouteForm.startLocation}
            onChange={(e) => setNewRouteForm({ ...newRouteForm, startLocation: e.target.value })}
            placeholder="e.g. Downtown Central Station"
          />
          <Input label="Destination Campus / Hub" required value={newRouteForm.endLocation} onChange={(e) => setNewRouteForm({ ...newRouteForm, endLocation: e.target.value })} placeholder="e.g. Main Innovation Campus Gate 2" />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewRouteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createRouteMutation.isPending}>
              Save Route
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNewOrganizationModalOpen} onClose={() => setIsNewOrganizationModalOpen(false)} title="Add Shuttle Organization">
        <form onSubmit={handleCreateOrganization} className="space-y-3">
          {createOrganizationMutation.isError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{(createOrganizationMutation.error as Error)?.message || 'Could not create organization.'}</p>}
          <Select label="Organization Type" value={newOrganizationForm.orgType} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, orgType: e.target.value as 'CORPORATE' | 'SCHOOL' })} options={[{ label: 'Corporate / Employer', value: 'CORPORATE' }, { label: 'School / Academic Institution', value: 'SCHOOL' }]} />
          <div className="grid grid-cols-2 gap-3"><Input label="Organization Name" required value={newOrganizationForm.name} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, name: e.target.value })} /><Input label="Organization Code" required value={newOrganizationForm.code} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, code: e.target.value })} /></div>
          <Input label="Contact Person" required value={newOrganizationForm.contactPerson} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, contactPerson: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label="Contact Email" type="email" required value={newOrganizationForm.contactEmail} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, contactEmail: e.target.value })} /><Input label="Contact Phone" required value={newOrganizationForm.contactPhone} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, contactPhone: e.target.value })} /></div>
          <Input label="Organization Address" required value={newOrganizationForm.address} onChange={(e) => setNewOrganizationForm({ ...newOrganizationForm, address: e.target.value })} />
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" onClick={() => { setIsNewOrganizationModalOpen(false); setIsNewRouteModalOpen(true); }}>Cancel</Button><Button type="submit" isLoading={createOrganizationMutation.isPending}>Save Organization</Button></div>
        </form>
      </Modal>

      {/* ================= MODAL: ADD DAILY SCHEDULE ================= */}
      <Modal
        isOpen={isNewScheduleModalOpen}
        onClose={() => setIsNewScheduleModalOpen(false)}
        title="Schedule Daily Shift Transit"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <Select
            label="Select Route"
            required
            value={newScheduleForm.routeId}
            onChange={(e) => setNewScheduleForm({ ...newScheduleForm, routeId: e.target.value })}
            options={routes.map((r) => ({ label: `${r.routeCode} - ${r.name}`, value: r.id }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Shift Type"
              value={newScheduleForm.shift}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, shift: e.target.value as any })}
              options={[
                { label: 'Morning Inbound', value: 'morning_inbound' },
                { label: 'Evening Outbound', value: 'evening_outbound' },
                { label: 'Night Shift', value: 'night_shift' },
              ]}
            />
            <Input
              label="Bus Capacity (Seats)"
              type="number"
              value={newScheduleForm.capacityTotal}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, capacityTotal: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Departure Time"
              type="time"
              value={newScheduleForm.departureTime}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, departureTime: e.target.value })}
            />
            <Input
              label="Arrival Time"
              type="time"
              value={newScheduleForm.arrivalTime}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, arrivalTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Shift Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
