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
  useShuttleTrips,
  useCreateShuttleRouteMutation,
  useCreateShuttleOrganizationMutation,
  useCreateShuttleScheduleMutation,
  useCreatePassengerEnrollmentMutation,
  useGenerateShuttleTripMutation,
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

  const { data: shuttleTrips = [], isLoading: isLoadingTrips } = useShuttleTrips();

  // TanStack Mutations
  const createRouteMutation = useCreateShuttleRouteMutation();
  const createOrganizationMutation = useCreateShuttleOrganizationMutation();
  const createScheduleMutation = useCreateShuttleScheduleMutation();
  const createPassengerMutation = useCreatePassengerEnrollmentMutation();
  const generateTripMutation = useGenerateShuttleTripMutation();
  const updateScheduleStatusMutation = useUpdateScheduleStatusMutation();
  const markBoardedMutation = useMarkPassengerBoardedMutation();

  const loading = isLoadingRoutes || isLoadingSchedules || isLoadingPassengers;

  // Modals
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [isNewOrganizationModalOpen, setIsNewOrganizationModalOpen] = useState(false);
  const [isNewScheduleModalOpen, setIsNewScheduleModalOpen] = useState(false);
  const [isNewPassengerModalOpen, setIsNewPassengerModalOpen] = useState(false);
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
    dayOfWeek: 'WEEKDAYS',
    departureTime: '07:30',
    arrivalTime: '08:15',
  });
  const [newPassengerForm, setNewPassengerForm] = useState({
    organizationId: '', routeId: '', passengerType: 'EMPLOYEE' as 'EMPLOYEE' | 'STUDENT',
    firstName: '', lastName: '', idNumber: '', email: '', phone: '',
    emergencyContactName: '', emergencyContactPhone: '', pickupStopId: '',
    effectiveFrom: new Date().toISOString().slice(0, 10), seatNumber: '',
  });
  const [selectedTripId, setSelectedTripId] = useState('');
  const [tripScheduleId, setTripScheduleId] = useState('');
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const currentTrip = shuttleTrips.find((trip) => trip.id === selectedTripId);
    if (currentTrip && !['completed', 'cancelled'].includes(currentTrip.status)) return;
    const activeTrip = shuttleTrips.find((trip) => ['in_progress', 'dispatched', 'scheduled'].includes(trip.status));
    setSelectedTripId(activeTrip?.id || '');
  }, [shuttleTrips, selectedTripId]);

  const selectedTrip = shuttleTrips.find((trip) => trip.id === selectedTripId);
  const attendanceByPassenger = new Map((selectedTrip?.attendanceRecords || []).map((record) => [record.passengerId, record]));

  // Stats calculation
  const stats = useMemo(() => {
    const totalRoutes = routes.length;
    const totalPassengers = passengers.length;
    const boardedToday = selectedTrip?.attendanceRecords.filter((record) => record.status === 'BOARDED' || record.status === 'ALIGHTED').length || 0;
    const attendanceRosterSize = selectedTrip ? passengers.filter((passenger) => passenger.assignedRouteId === selectedTrip.routeId).length : 0;
    const boardingRate = attendanceRosterSize > 0 ? Math.round((boardedToday / attendanceRosterSize) * 100) : 0;
    const activeShuttles = shuttleTrips.filter((trip) => trip.status === 'in_progress').length;

    return {
      totalRoutes,
      totalPassengers,
      boardedToday,
      boardingRate,
      activeShuttles,
    };
  }, [routes, passengers, schedules, selectedTrip, shuttleTrips]);

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
    try {
      await createScheduleMutation.mutateAsync(newScheduleForm);
      setIsNewScheduleModalOpen(false);
      setNewScheduleForm({ routeId: '', dayOfWeek: 'WEEKDAYS', departureTime: '07:30', arrivalTime: '08:15' });
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  };

  const handleEnrollPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPassengerMutation.mutateAsync(newPassengerForm);
      setIsNewPassengerModalOpen(false);
      setNewPassengerForm({
        organizationId: '', routeId: '', passengerType: 'EMPLOYEE', firstName: '', lastName: '',
        idNumber: '', email: '', phone: '', emergencyContactName: '', emergencyContactPhone: '',
        pickupStopId: '', effectiveFrom: new Date().toISOString().slice(0, 10), seatNumber: '',
      });
    } catch (err) {
      console.error('Error enrolling shuttle passenger:', err);
    }
  };

  const handleCreateDailyTrip = async () => {
    if (!tripScheduleId || !tripDate) return;
    try {
      const trip = await generateTripMutation.mutateAsync({ scheduleId: tripScheduleId, tripDate });
      setSelectedTripId(trip.id);
    } catch (err) {
      console.error('Error creating daily shuttle trip:', err);
    }
  };

  const handleRecordAttendance = async (passenger: ShuttlePassenger, status: 'BOARDED' | 'ALIGHTED' | 'ABSENT' | 'EXCUSED') => {
    if (!selectedTripId) return;
    try {
      await markBoardedMutation.mutateAsync({
        tripId: selectedTripId,
        passengerId: passenger.id,
        stopId: passenger.pickupStopId,
        status,
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

  const rosterWithAttendance = filteredPassengers.map((passenger) => {
    const attendance = attendanceByPassenger.get(passenger.id);
    return {
      ...passenger,
      attendanceStatus: attendance?.status,
      hasBoardedToday: attendance?.status === 'BOARDED' || attendance?.status === 'ALIGHTED',
      boardingTimestamp: attendance?.timestamp ? new Date(attendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    };
  });

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
          {row.attendanceStatus === 'BOARDED' || row.attendanceStatus === 'ALIGHTED' ? (
            <Badge variant="success" size="sm">
              {row.attendanceStatus} ({row.boardingTimestamp || 'Recorded'})
            </Badge>
          ) : row.attendanceStatus ? (
            <Badge variant={row.attendanceStatus === 'ABSENT' ? 'warning' : 'neutral'} size="sm">{row.attendanceStatus}</Badge>
          ) : (
            <Badge variant="default" size="sm">NOT RECORDED</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: ShuttlePassenger) => (
        <div className="min-w-36">
          <Select aria-label={`Record attendance for ${row.name}`} value={row.attendanceStatus || ''} disabled={!selectedTrip || selectedTrip.routeId !== row.assignedRouteId || markBoardedMutation.isPending}
            onChange={(e) => { if (e.target.value) void handleRecordAttendance(row, e.target.value as 'BOARDED' | 'ALIGHTED' | 'ABSENT' | 'EXCUSED'); }}
            options={[{ label: row.attendanceStatus ? 'Update attendance…' : 'Record attendance…', value: '' }, { label: 'Boarded', value: 'BOARDED' }, { label: 'Absent', value: 'ABSENT' }, { label: 'Excused', value: 'EXCUSED' }, { label: 'Alighted', value: 'ALIGHTED' }]} />
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
          title="Boarded on Selected Trip"
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
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="text-sm font-bold text-white">Trip Attendance</h3><p className="text-xs text-slate-400">Choose an active trip to record boarding, or create today’s trip from a recurring schedule.</p></div>
              <Button variant="primary" size="sm" onClick={() => setIsNewPassengerModalOpen(true)} icon={<Plus className="h-4 w-4" />}>Add Passenger</Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
              <Select label="Attendance Trip" value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} options={[{ label: '-- Select trip --', value: '' }, ...shuttleTrips.filter((trip) => ['scheduled', 'dispatched', 'in_progress'].includes(trip.status)).map((trip) => ({ label: `${trip.tripNumber} · ${trip.routeCode} · ${trip.tripDate} · ${trip.status.replace(/_/g, ' ')}`, value: trip.id }))]} />
              <Select label="Recurring Schedule" value={tripScheduleId} onChange={(e) => setTripScheduleId(e.target.value)} options={[{ label: '-- Select schedule --', value: '' }, ...schedules.filter((schedule) => schedule.status !== 'cancelled').map((schedule) => ({ label: `${schedule.routeName} · ${schedule.departureTime}`, value: schedule.id }))]} />
              <Input label="Trip Date" type="date" required value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
              <Button variant="outline" disabled={!tripScheduleId || !tripDate || generateTripMutation.isPending} isLoading={generateTripMutation.isPending} onClick={handleCreateDailyTrip}>Create Daily Trip</Button>
            </div>
            {generateTripMutation.isError && <p role="alert" className="mt-2 text-xs text-rose-300">{(generateTripMutation.error as Error)?.message || 'Could not create the trip.'}</p>}
            {shuttleTrips.length === 0 && !isLoadingTrips && <p className="mt-2 text-xs text-amber-300">No trip is available yet. Select a recurring schedule and create today’s trip to take attendance.</p>}
            {markBoardedMutation.isError && <p role="alert" className="mt-2 text-xs text-rose-300">{(markBoardedMutation.error as Error)?.message || 'Could not save attendance.'}</p>}
          </Card>
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
                data={rosterWithAttendance}
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
          {createScheduleMutation.isError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{(createScheduleMutation.error as Error)?.message || 'Could not create shuttle schedule.'}</p>}
          <Select
            label="Select Route"
            required
            value={newScheduleForm.routeId}
            onChange={(e) => setNewScheduleForm({ ...newScheduleForm, routeId: e.target.value })}
            options={[{ label: '-- Select a route --', value: '' }, ...routes.map((r) => ({ label: `${r.routeCode} - ${r.name}`, value: r.id }))]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Operating Days"
              value={newScheduleForm.dayOfWeek}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, dayOfWeek: e.target.value })}
              options={[
                { label: 'Weekdays', value: 'WEEKDAYS' },
                { label: 'Every day', value: 'ALL' },
                { label: 'Monday', value: 'MON' },
                { label: 'Tuesday', value: 'TUE' },
                { label: 'Wednesday', value: 'WED' },
                { label: 'Thursday', value: 'THU' },
                { label: 'Friday', value: 'FRI' },
                { label: 'Saturday', value: 'SAT' },
                { label: 'Sunday', value: 'SUN' },
              ]}
            />
            <p className="self-center text-xs text-slate-400">Select the days this recurring shuttle schedule runs.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Departure Time"
              type="time"
              required
              value={newScheduleForm.departureTime}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, departureTime: e.target.value })}
            />
            <Input
              label="Arrival Time"
              type="time"
              required
              value={newScheduleForm.arrivalTime}
              onChange={(e) => setNewScheduleForm({ ...newScheduleForm, arrivalTime: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createScheduleMutation.isPending}>
              Create Shift Schedule
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNewPassengerModalOpen} onClose={() => setIsNewPassengerModalOpen(false)} title="Enroll Passenger & Assign Route" size="lg">
        <form onSubmit={handleEnrollPassenger} className="space-y-4">
          {createPassengerMutation.isError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{(createPassengerMutation.error as Error)?.message || 'Could not enroll passenger.'}</p>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select label="Organization" required value={newPassengerForm.organizationId} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, organizationId: e.target.value, routeId: '' })} options={[{ label: '-- Select organization --', value: '' }, ...organizations.filter((organization) => organization.isActive).map((organization) => ({ label: `${organization.name} (${organization.code})`, value: organization.id }))]} />
            <Select label="Shuttle Route" required disabled={!newPassengerForm.organizationId} value={newPassengerForm.routeId} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, routeId: e.target.value, pickupStopId: '' })} options={[{ label: '-- Select route --', value: '' }, ...routes.filter((route) => route.organizationId === newPassengerForm.organizationId && route.status === 'active').map((route) => ({ label: `${route.routeCode} · ${route.name}`, value: route.id }))]} />
            <Select label="Passenger Type" required value={newPassengerForm.passengerType} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, passengerType: e.target.value as 'EMPLOYEE' | 'STUDENT' })} options={[{ label: 'Employee', value: 'EMPLOYEE' }, { label: 'Student', value: 'STUDENT' }]} />
            <Input label="Employee / Student ID" required value={newPassengerForm.idNumber} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, idNumber: e.target.value })} />
            <Input label="First Name" required value={newPassengerForm.firstName} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, firstName: e.target.value })} />
            <Input label="Last Name" required value={newPassengerForm.lastName} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, lastName: e.target.value })} />
            <Input label="Phone" type="tel" required value={newPassengerForm.phone} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, phone: e.target.value })} />
            <Input label="Email" type="email" value={newPassengerForm.email} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, email: e.target.value })} />
            <Input label="Emergency Contact Name" value={newPassengerForm.emergencyContactName} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, emergencyContactName: e.target.value })} />
            <Input label="Emergency Contact Phone" type="tel" value={newPassengerForm.emergencyContactPhone} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, emergencyContactPhone: e.target.value })} />
            <Select label="Pickup Stop (Optional)" disabled={!newPassengerForm.routeId} value={newPassengerForm.pickupStopId} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, pickupStopId: e.target.value })} options={[{ label: '-- No stop selected --', value: '' }, ...(routes.find((route) => route.id === newPassengerForm.routeId)?.stops || []).map((stop) => ({ label: `${stop.sequence}. ${stop.name}`, value: stop.id }))]} />
            <Input label="Seat Number (Optional)" value={newPassengerForm.seatNumber} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, seatNumber: e.target.value })} />
            <Input label="Assignment Effective From" type="date" required value={newPassengerForm.effectiveFrom} onChange={(e) => setNewPassengerForm({ ...newPassengerForm, effectiveFrom: e.target.value })} />
          </div>
          <p className="text-xs text-slate-400">Passenger enrollment and route assignment are saved together. If validation fails, neither record is created.</p>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" onClick={() => setIsNewPassengerModalOpen(false)}>Cancel</Button><Button type="submit" isLoading={createPassengerMutation.isPending}>Enroll Passenger</Button></div>
        </form>
      </Modal>
    </div>
  );
};
