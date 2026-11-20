import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PackageCheck,
  Search,
  Plus,
  ArrowRight,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  FileSignature,
  DollarSign,
  Building2,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  Send,
  X,
} from 'lucide-react';
import { courierApi } from '../../api/courier.api';
import { fleetApi } from '../../api/fleet.api';
import { driversApi } from '../../api/drivers.api';
import {
  CourierShipment,
  CourierShipmentStatus,
  MultiPointPickup,
  DeliveryHub,
  SortingRecord,
  CourierAgent,
  AgentCommission,
  AgentPayout,
  ProofOfDelivery,
  HubConvoy,
} from '../../types';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { PhoneNumberInput } from '../../components/common/PhoneNumberInput';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { Tabs } from '../../components/common/Tabs';
import { DataTable, Column } from '../../components/tables/DataTable';
import {
  useCourierShipments,
  useCourierPickups,
  useCourierHubs,
  useCourierSortingRecords,
  useCourierAgents,
  useCourierCommissions,
  useCourierPayouts,
  useCreateShipmentMutation,
  useUpdateShipmentStatusMutation,
  useVerifyPodMutation,
  useRecordFailedAttemptMutation,
  useUpdatePickupStopMutation,
  useProcessSortingMutation,
  useApprovePayoutMutation,
  useCreatePickupBatchMutation,
  useCourierConvoys,
  useCreateConvoyMutation,
  useConvoyActionMutation,
  useCreateCourierAgentMutation,
  useCreateCourierHubMutation,
  useAssignCourierAgentMutation,
  useRequestCourierPayoutMutation,
  usePayCourierPayoutMutation,
  useCourierExpenses,
  useCreateCourierExpenseMutation,
  useApproveCourierExpenseMutation,
} from '../../hooks/queries';
import { QueryStateWrapper } from '../../components/common/QueryStateWrapper';

export const CourierDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('shipments');
  const [selectedShipment, setSelectedShipment] = useState<CourierShipment | null>(null);
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [isNewPickupModalOpen, setIsNewPickupModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isNewHubModalOpen, setIsNewHubModalOpen] = useState(false);
  const [isNewConvoyModalOpen, setIsNewConvoyModalOpen] = useState(false);
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);

  // Search & Filter state
  const [awbSearch, setAwbSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // TanStack Queries
  const {
    data: shipments = [],
    isLoading: isLoadingShipments,
    isError: isShipmentsError,
    error: shipmentsError,
    refetch: refetchShipments,
  } = useCourierShipments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: awbSearch || undefined,
  });

  const { data: pickups = [], isLoading: isLoadingPickups } = useCourierPickups();
  const { data: hubs = [], isLoading: isLoadingHubs } = useCourierHubs();
  const { data: sortingRecords = [] } = useCourierSortingRecords();
  const { data: agents = [] } = useCourierAgents();
  const { data: commissions = [] } = useCourierCommissions();
  const { data: payouts = [] } = useCourierPayouts();
  const { data: convoys = [] } = useCourierConvoys();
  const { data: agentExpenses = [] } = useCourierExpenses();
  const { data: allCourierShipments = [] } = useQuery({
    queryKey: ['courier', 'allShipmentsForOperations'], queryFn: () => courierApi.getShipments(),
    enabled: isNewPickupModalOpen || isNewConvoyModalOpen,
  });
  const { data: fleetVehicles = [] } = useQuery({
    queryKey: ['courier', 'availableVehicles'], queryFn: () => fleetApi.getVehicles({ status: 'available' }),
    enabled: ['hubs', 'agents'].includes(activeTab) || isNewConvoyModalOpen,
  });
  const { data: rosterDrivers = [] } = useQuery({
    queryKey: ['courier', 'driverRoster'], queryFn: () => driversApi.getDrivers(),
    enabled: ['pickups', 'agents', 'hubs', 'payouts'].includes(activeTab) || isNewConvoyModalOpen || isNewAgentModalOpen,
  });

  // TanStack Mutations
  const createShipmentMutation = useCreateShipmentMutation();
  const updateShipmentStatusMutation = useUpdateShipmentStatusMutation();
  const verifyPodMutation = useVerifyPodMutation();
  const recordFailedAttemptMutation = useRecordFailedAttemptMutation();
  const createPickupMutation = useCreatePickupBatchMutation();
  const updatePickupStopMutation = useUpdatePickupStopMutation();
  const processSortingMutation = useProcessSortingMutation();
  const approvePayoutMutation = useApprovePayoutMutation();
  const createConvoyMutation = useCreateConvoyMutation();
  const dispatchConvoyMutation = useConvoyActionMutation('dispatch');
  const arriveConvoyMutation = useConvoyActionMutation('arrive');
  const createAgentMutation = useCreateCourierAgentMutation();
  const createHubMutation = useCreateCourierHubMutation();
  const assignAgentMutation = useAssignCourierAgentMutation();
  const requestPayoutMutation = useRequestCourierPayoutMutation();
  const payPayoutMutation = usePayCourierPayoutMutation();
  const createExpenseMutation = useCreateCourierExpenseMutation();
  const approveExpenseMutation = useApproveCourierExpenseMutation();

  const loading = isLoadingShipments || isLoadingPickups || isLoadingHubs;

  // Form states
  const [newShipmentForm, setNewShipmentForm] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    serviceType: 'same_day' as CourierShipment['serviceType'],
    weightKg: 2.5,
    declaredValue: 100,
    description: '',
    codAmount: 0,
    isFragile: false,
  });

  const [sortForm, setSortForm] = useState({
    awbNumber: '',
    sourceHub: '',
    destinationHub: '',
    sortingCategory: 'Air Express' as SortingRecord['sortingCategory'],
    scannedBy: 'Scan Operator Station 1',
  });

  const [podForm, setPodForm] = useState({
    confirmationMethod: 'digital_signature' as ProofOfDelivery['confirmationMethod'],
    recipientName: '',
    recipientPhone: '',
    otpCode: '',
    notes: '',
  });

  const [attemptReason, setAttemptReason] = useState('Recipient unavailable');
  const [pickupForm, setPickupForm] = useState({
    shipmentId: '', assignedAgentId: '', stops: [{ locationName: '', address: '', contactPerson: '', contactPhone: '', timeWindow: '', parcelCount: 1, status: 'pending' as const }],
  });
  const [hubForm, setHubForm] = useState({ name: '', code: '', address: '', city: '', state: '', postalCode: '', contactPhone: '', contactEmail: '', capacitySqft: 0 });
  const [convoyForm, setConvoyForm] = useState({ originHubId: '', destinationHubId: '', vehicleId: '', driverId: '', shipmentIds: [] as string[], scheduledDeparture: '', notes: '' });
  const [agentForm, setAgentForm] = useState({ agentCode: '', driverId: '', vehicleId: '', serviceArea: '', commissionRate: 0, currentHubId: '' });
  const [payoutForm, setPayoutForm] = useState({ agentId: '', periodStart: new Date().toISOString().slice(0, 10), periodEnd: new Date().toISOString().slice(0, 10) });
  const [expenseForm, setExpenseForm] = useState({ agentId: '', expenseType: 'FUEL', amount: 0, notes: '' });
  const [selectedShipmentAgentId, setSelectedShipmentAgentId] = useState('');

  useEffect(() => {
    setSelectedShipmentAgentId(selectedShipment?.assignedAgentId || '');
  }, [selectedShipment?.id, selectedShipment?.assignedAgentId]);

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalActive = shipments.filter(
      (s) => !['delivered', 'returned'].includes(s.currentStatus)
    ).length;
    const deliveredToday = shipments.filter((s) => s.currentStatus === 'delivered').length;
    const pendingSorting = hubs.reduce((acc, h) => acc + h.pendingSortingCount, 0);
    const activePickups = pickups.filter((p) => p.overallStatus !== 'completed').length;
    const totalCommissions = commissions.reduce((acc, c) => acc + c.totalPayable, 0);

    return {
      totalActive,
      deliveredToday,
      pendingSorting,
      activePickups,
      totalCommissions,
    };
  }, [shipments, hubs, pickups, commissions]);

  // Handlers
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createShipmentMutation.mutateAsync({
        sender: {
          name: newShipmentForm.senderName,
          phone: newShipmentForm.senderPhone,
          address: newShipmentForm.senderAddress,
          city: 'Chicago',
          postalCode: '60601',
        },
        receiver: {
          name: newShipmentForm.receiverName,
          phone: newShipmentForm.receiverPhone,
          address: newShipmentForm.receiverAddress,
          city: 'Chicago',
          postalCode: '60611',
        },
        parcel: {
          weightKg: Number(newShipmentForm.weightKg),
          lengthCm: 30,
          widthCm: 20,
          heightCm: 15,
          declaredValue: Number(newShipmentForm.declaredValue),
          description: newShipmentForm.description || 'General Merchandise',
          isFragile: newShipmentForm.isFragile,
        },
        serviceType: newShipmentForm.serviceType,
        codAmount: Number(newShipmentForm.codAmount),
      });

      setIsNewShipmentModalOpen(false);
      setSelectedShipment(created);
    } catch (err) {
      console.error('Error creating shipment:', err);
    }
  };

  const handleScanAndSort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sortForm.awbNumber) return;
    try {
      await processSortingMutation.mutateAsync({
        awbNumber: sortForm.awbNumber,
        sourceHub: sortForm.sourceHub,
        destinationHub: sortForm.destinationHub,
        sortingCategory: sortForm.sortingCategory,
        scannedBy: sortForm.scannedBy,
      });
      setIsSortModalOpen(false);
      setSortForm((prev) => ({ ...prev, awbNumber: '' }));
    } catch (err) {
      console.error('Error sorting:', err);
    }
  };

  const handleVerifyPod = async () => {
    if (!selectedShipment) return;
    try {
      const updated = await verifyPodMutation.mutateAsync({
        shipmentId: selectedShipment.id,
        podData: {
          confirmationMethod: podForm.confirmationMethod,
          recipientName: podForm.recipientName || selectedShipment.receiver.name,
          recipientPhone: podForm.recipientPhone || selectedShipment.receiver.phone,
          otpCode: podForm.confirmationMethod === 'otp' ? podForm.otpCode || '4920' : undefined,
          signatureDataUrl:
            podForm.confirmationMethod === 'digital_signature'
              ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M 10 30 Q 50 10 90 30 T 170 30" stroke="%2310b981" stroke-width="3" fill="none"/></svg>'
              : undefined,
          notes: podForm.notes || 'Verified on customer mobile device at doorstep.',
          status: 'pod_verified',
        },
      });

      setSelectedShipment(updated);
      setIsPodModalOpen(false);
    } catch (err) {
      console.error('Error verifying PoD:', err);
    }
  };

  const handleRecordAttempt = async () => {
    if (!selectedShipment) return;
    try {
      const updated = await recordFailedAttemptMutation.mutateAsync({
        shipmentId: selectedShipment.id,
        reason: attemptReason,
        agentName: selectedShipment.assignedAgentName || 'Courier Field Agent',
      });
      setSelectedShipment(updated);
      setIsAttemptModalOpen(false);
    } catch (err) {
      console.error('Error recording attempt:', err);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    try {
      await approvePayoutMutation.mutateAsync(payoutId);
    } catch (err) {
      console.error('Error approving payout:', err);
    }
  };

  const handleCreatePickupBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPickupMutation.mutateAsync({
      ...pickupForm,
      stops: pickupForm.stops.map((stop, index) => ({ ...stop, id: `new-${index}`, sequenceNumber: index + 1 })),
    });
    setIsNewPickupModalOpen(false);
    setPickupForm({ shipmentId: '', assignedAgentId: '', stops: [{ locationName: '', address: '', contactPerson: '', contactPhone: '', timeWindow: '', parcelCount: 1, status: 'pending' }] });
  };

  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    await createHubMutation.mutateAsync({ ...hubForm, capacitySqft: Number(hubForm.capacitySqft) } as any);
    setIsNewHubModalOpen(false);
    setHubForm({ name: '', code: '', address: '', city: '', state: '', postalCode: '', contactPhone: '', contactEmail: '', capacitySqft: 0 });
  };

  const handleCreateConvoy = async (e: React.FormEvent) => {
    e.preventDefault();
    await createConvoyMutation.mutateAsync({ ...convoyForm, scheduledDeparture: convoyForm.scheduledDeparture ? new Date(convoyForm.scheduledDeparture).toISOString() : undefined });
    setIsNewConvoyModalOpen(false);
    setConvoyForm({ originHubId: '', destinationHubId: '', vehicleId: '', driverId: '', shipmentIds: [], scheduledDeparture: '', notes: '' });
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAgentMutation.mutateAsync(agentForm);
    setIsNewAgentModalOpen(false);
    setAgentForm({ agentCode: '', driverId: '', vehicleId: '', serviceArea: '', commissionRate: 0, currentHubId: '' });
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestPayoutMutation.mutateAsync(payoutForm as any);
    setIsPayoutModalOpen(false);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExpenseMutation.mutateAsync(expenseForm);
    setIsNewExpenseModalOpen(false);
    setExpenseForm({ agentId: '', expenseType: 'FUEL', amount: 0, notes: '' });
  };

  const handleAssignSelectedAgent = async () => {
    if (!selectedShipment || !selectedShipmentAgentId) return;
    const updated = await assignAgentMutation.mutateAsync({ shipmentId: selectedShipment.id, agentId: selectedShipmentAgentId });
    setSelectedShipment(updated);
  };

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchesSearch =
        !awbSearch ||
        s.awbNumber.toLowerCase().includes(awbSearch.toLowerCase()) ||
        s.receiver.name.toLowerCase().includes(awbSearch.toLowerCase()) ||
        s.sender.name.toLowerCase().includes(awbSearch.toLowerCase());

      const matchesStatus = statusFilter === 'all' || s.currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shipments, awbSearch, statusFilter]);

  // Shipment columns
  const shipmentColumns: Column<CourierShipment>[] = [
    {
      key: 'awbNumber',
      header: 'AWB Number',
      sortable: true,
      render: (_: any, row: CourierShipment) => (
        <div>
          <button
            onClick={() => setSelectedShipment(row)}
            className="font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors block text-left"
          >
            {row.awbNumber}
          </button>
          <span className="text-[10px] text-slate-400 font-mono">{row.trackingNumber}</span>
        </div>
      ),
    },
    {
      key: 'serviceType',
      header: 'Service Level',
      render: (_: any, row: CourierShipment) => {
        const labels: Record<string, { text: string; variant: 'info' | 'success' | 'warning' | 'neutral' }> = {
          same_day: { text: '⚡ Same Day', variant: 'warning' },
          next_day_express: { text: '🚀 Next Day Express', variant: 'info' },
          standard_ground: { text: '🚚 Ground', variant: 'neutral' },
          economy: { text: '📦 Economy', variant: 'neutral' },
        };
        const conf = labels[row.serviceType] || { text: row.serviceType, variant: 'neutral' };
        return <Badge variant={conf.variant} size="sm">{conf.text}</Badge>;
      },
    },
    {
      key: 'sender',
      header: 'Route (Origin ➔ Consignee)',
      render: (_: any, row: CourierShipment) => (
        <div className="text-xs">
          <div className="font-medium text-slate-200">{row.sender.name} ({row.sender.city})</div>
          <div className="text-slate-400 flex items-center gap-1 mt-0.5">
            <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="truncate">{row.receiver.name} ({row.receiver.city})</span>
          </div>
        </div>
      ),
    },
    {
      key: 'currentStatus',
      header: 'Status',
      sortable: true,
      render: (_: any, row: CourierShipment) => {
        const statusMap: Record<CourierShipmentStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'; text: string }> = {
          pickup_pending: { variant: 'neutral', text: 'Pickup Pending' },
          pickup_assigned: { variant: 'info', text: 'Pickup Assigned' },
          picked_up: { variant: 'info', text: 'Picked Up' },
          at_origin_hub: { variant: 'info', text: 'At Origin Hub' },
          sorting_pending: { variant: 'warning', text: 'Sorting Pending' },
          sorted: { variant: 'info', text: 'Sorted' },
          in_transit: { variant: 'info', text: 'In Transit' },
          at_destination_hub: { variant: 'info', text: 'At Dest Hub' },
          out_for_delivery: { variant: 'warning', text: 'Out for Delivery' },
          delivered: { variant: 'success', text: 'Delivered' },
          delivery_failed: { variant: 'danger', text: 'Failed Attempt' },
          returned: { variant: 'danger', text: 'Returned' },
        };
        const conf = statusMap[row.currentStatus] || { variant: 'neutral', text: row.currentStatus };
        return <Badge variant={conf.variant} size="sm">{conf.text}</Badge>;
      },
    },
    {
      key: 'assignedAgentName',
      header: 'Assigned Agent',
      render: (_: any, row: CourierShipment) => (
        <div className="text-xs">
          {row.assignedAgentName ? (
            <div className="flex items-center gap-1.5 text-slate-300">
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span>{row.assignedAgentName}</span>
            </div>
          ) : (
            <span className="text-slate-500 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'expectedDeliveryDate',
      header: 'Delivery Due',
      sortable: true,
      render: (_: any, row: CourierShipment) => (
        <div className="text-xs font-mono text-slate-400">
          {row.expectedDeliveryDate.slice(5, 16)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: CourierShipment) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setSelectedShipment(row)}
          >
            Track
          </Button>
          {row.currentStatus === 'out_for_delivery' && (
            <Button
              size="xs"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => {
                setSelectedShipment(row);
                setIsPodModalOpen(true);
              }}
            >
              Verify PoD
            </Button>
          )}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                Courier & Express Operations Hub
                <Badge variant="success" size="sm" className="font-mono">
                  LIVE AWB ENGINE
                </Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative AWB lifecycle, high-speed sorting hubs, multi-point collections, and real-time OTP/signature PoD verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { void queryClient.invalidateQueries({ queryKey: ['courier'] }); }}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync Courier Operations
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSortModalOpen(true)}
            icon={<QrCode className="h-4 w-4 text-cyan-400" />}
          >
            Barcode Sort Scan
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewShipmentModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            New Consignment
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Active AWBs In-Transit"
          value={stats.totalActive}
          icon={Truck}
          change="Current shipment workload"
          changeType="neutral"
        />
        <StatCard
          title="Delivered Shipments"
          value={stats.deliveredToday}
          icon={CheckCircle2}
          change="All-time delivered count"
          changeType="neutral"
        />
        <StatCard
          title="Hub Sorting Queue"
          value={stats.pendingSorting}
          icon={Layers}
          change="Awaiting hub sorting"
          changeType="neutral"
        />
        <StatCard
          title="Multi-Point Pickups Active"
          value={stats.activePickups}
          icon={MapPin}
          change="Sequenced batches"
          changeType="neutral"
        />
        <StatCard
          title="Agent Commission Ledger"
          value={`$${stats.totalCommissions.toFixed(2)}`}
          icon={DollarSign}
          change="Earned commissions"
          changeType="neutral"
        />
      </div>

      {/* Module Navigation Tabs */}
      <Tabs
        tabs={[
          { id: 'shipments', label: `AWB Shipments (${shipments.length})` },
          { id: 'pickups', label: `Multi-Point Pickups (${pickups.length})` },
          { id: 'hubs', label: `Sorting Hubs & Conveyors (${hubs.length})` },
          { id: 'agents', label: `Courier Agents (${agents.length})` },
          { id: 'payouts', label: `Commissions & Payouts (${payouts.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= TAB 1: SHIPMENTS LIST ================= */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <Card className="p-4 bg-slate-900/60 border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search AWB (e.g. AWB-EXP-88910), sender, receiver..."
                  value={awbSearch}
                  onChange={(e) => setAwbSearch(e.target.value)}
                  className="pl-9 bg-slate-950/80 border-slate-800 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-44 bg-slate-950/80 border-slate-800 text-xs"
                  options={[
                    { label: 'All Lifecycle Statuses', value: 'all' },
                    { label: 'Pickup Pending', value: 'pickup_pending' },
                    { label: 'Sorted', value: 'sorted' },
                    { label: 'In Transit', value: 'in_transit' },
                    { label: 'Out for Delivery', value: 'out_for_delivery' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Failed Attempt', value: 'delivery_failed' },
                  ]}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAwbSearch('');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          <QueryStateWrapper
            isLoading={isLoadingShipments}
            isError={isShipmentsError}
            error={shipmentsError}
            onRetry={refetchShipments}
            loadingMessage="Synchronizing AWB shipments with central sorting ledger..."
          >
            <Card className="p-0 overflow-hidden border-slate-800">
              <DataTable
                columns={shipmentColumns}
                data={filteredShipments}
                keyField="id"
                isLoading={false}
                emptyTitle="No shipments found"
                emptyDescription="No shipments found matching criteria."
              />
            </Card>
          </QueryStateWrapper>
        </div>
      )}

      {/* ================= TAB 2: MULTI-POINT PICKUPS ================= */}
      {activeTab === 'pickups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Consolidated Multi-Stop Pickups</h3>
              <p className="text-xs text-slate-400">Scheduled sequence collection for high-volume merchant dispatch.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPickupForm({ shipmentId: '', assignedAgentId: '', stops: [{ locationName: '', address: '', contactPerson: '', contactPhone: '', timeWindow: '', parcelCount: 1, status: 'pending' }] });
                setIsNewPickupModalOpen(true);
              }}
              icon={<Plus className="h-4 w-4" />}
            >
              Configure Pickup Batch
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickups.map((batch) => (
              <Card key={batch.id} className="p-5 border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-400">{batch.pickupCode}</span>
                    <h4 className="text-sm font-semibold text-white mt-0.5">Destination: {batch.destinationHubName}</h4>
                  </div>
                  <Badge
                    variant={batch.overallStatus === 'completed' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {batch.overallStatus.toUpperCase()}
                  </Badge>
                </div>

                <div className="my-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500">Assigned Driver:</span>{' '}
                    <span className="text-slate-200 font-medium">{batch.assignedAgentName || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Parcels:</span>{' '}
                    <span className="text-emerald-400 font-bold">{batch.totalParcels} units</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                    Sequenced Collection Stops ({batch.stops.length})
                  </div>
                  {batch.stops.map((stop) => (
                    <div
                      key={stop.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                          {stop.sequenceNumber}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{stop.locationName}</div>
                          <div className="text-[10px] text-slate-400">{stop.address} • {stop.timeWindow}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            stop.status === 'picked_up' || stop.status === 'completed'
                              ? 'success'
                              : 'neutral'
                          }
                          size="xs"
                        >
                          {stop.parcelCount} pkgs
                        </Badge>
                        {stop.status === 'assigned' && (
                          <Button
                            size="xs"
                            variant="outline"
                            isLoading={updatePickupStopMutation.isPending}
                            onClick={async () => {
                              await updatePickupStopMutation.mutateAsync({
                                pickupId: batch.id,
                                stopId: stop.id,
                                status: 'in_progress',
                              });
                            }}
                          >
                            Start Pickup
                          </Button>
                        )}
                        {stop.status === 'in_progress' && (
                          <Button size="xs" variant="success" isLoading={updatePickupStopMutation.isPending} onClick={() => updatePickupStopMutation.mutateAsync({ pickupId: batch.id, stopId: stop.id, status: 'picked_up' })}>
                            Confirm Picked
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: SORTING HUBS & CONVEYORS ================= */}
      {activeTab === 'hubs' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewHubModalOpen(true)}>Add Hub</Button>
            <Button size="sm" variant="primary" leftIcon={<Truck className="h-4 w-4" />} onClick={() => {
              const availableOrigin = hubs[0]?.id || '';
              setConvoyForm({ originHubId: availableOrigin, destinationHubId: '', vehicleId: '', driverId: '', shipmentIds: [], scheduledDeparture: '', notes: '' });
              setIsNewConvoyModalOpen(true);
            }}>Plan Convoy</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hubs.map((hub) => (
              <Card key={hub.id} className="p-4 border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan-400">{hub.code}</span>
                  <Badge variant={hub.status === 'operational' ? 'success' : 'warning'} size="xs">
                    {hub.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-white mt-1">{hub.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{hub.city}</p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Current floor area:</span>
                    <span className="text-white font-medium">{Number(hub.capacitySqft || 0).toLocaleString()} sq ft</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                    <div>
                      <span className="text-slate-500">Incoming:</span>{' '}
                      <span className="text-emerald-400 font-bold">{hub.incomingShipmentsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pending Sort:</span>{' '}
                      <span className="text-amber-400 font-bold">{hub.pendingSortingCount}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Live Automated Sorting Station Audit</h3>
                <p className="text-xs text-slate-400">High-speed barcode scanner conveyor routing events.</p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsSortModalOpen(true)}
                icon={<QrCode className="h-4 w-4" />}
              >
                Trigger Barcode Scan
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Scanned Timestamp</th>
                    <th className="p-2.5">AWB Tracking #</th>
                    <th className="p-2.5">Source Facility</th>
                    <th className="p-2.5">Destination Facility</th>
                    <th className="p-2.5">Conveyor Sorting Category</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Station Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sortingRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-mono text-slate-400">{rec.scannedAt}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-400">{rec.awbNumber}</td>
                      <td className="p-2.5 text-slate-300 truncate max-w-xs">{rec.sourceHub}</td>
                      <td className="p-2.5 text-slate-300 truncate max-w-xs">{rec.destinationHub}</td>
                      <td className="p-2.5">
                        <Badge variant="info" size="xs">{rec.sortingCategory}</Badge>
                      </td>
                      <td className="p-2.5">
                        <Badge variant="success" size="xs">{rec.status}</Badge>
                      </td>
                      <td className="p-2.5 text-slate-400">{rec.scannedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Linehaul Convoys</h3>
                <p className="text-xs text-slate-400">Move sorted consignments between hubs with an assigned vehicle and driver.</p>
              </div>
              <Badge variant="info">{convoys.length} total</Badge>
            </div>
            {convoys.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No convoys planned yet. Create one after sorting shipments at an origin hub.</p>
            ) : (
              <div className="space-y-2">
                {convoys.map((convoy) => (
                  <div key={convoy.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                    <div>
                      <div className="font-mono text-xs font-bold text-cyan-300">{convoy.convoyNumber}</div>
                      <div className="mt-1 text-xs text-slate-300">{convoy.originHubName} → {convoy.destinationHubName}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{convoy.vehicleRegistration || 'No vehicle'} · {convoy.driverName || 'No driver'} · {convoy.shipmentAwbs.join(', ')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={convoy.status === 'arrived' ? 'success' : convoy.status === 'departed' ? 'info' : 'warning'}>{convoy.status}</Badge>
                      {convoy.status === 'planned' && <Button size="xs" variant="primary" isLoading={dispatchConvoyMutation.isPending} onClick={() => dispatchConvoyMutation.mutate(convoy.id)}>Dispatch Convoy</Button>}
                      {convoy.status === 'departed' && <Button size="xs" variant="success" isLoading={arriveConvoyMutation.isPending} onClick={() => arriveConvoyMutation.mutate(convoy.id)}>Mark Arrived</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ================= TAB 4: COURIER AGENTS ================= */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Active Courier Agents & Roster</h3>
              <p className="text-xs text-slate-400">Field drivers, motorbikes, e-bikes, zones, and delivery success rates.</p>
            </div>
            <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewAgentModalOpen(true)}>Add Courier Agent</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="p-4 border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{agent.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{agent.phone}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">{agent.assignedZone}</span>
                  <Badge
                    variant={
                      agent.status === 'out_for_delivery'
                        ? 'warning'
                        : agent.status === 'available'
                        ? 'success'
                        : 'neutral'
                    }
                    size="xs"
                  >
                    {agent.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Today Assigned:</span>
                    <span className="font-bold text-white">{agent.assignedDeliveriesCount} pkgs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Completed:</span>
                    <span className="font-bold text-emerald-400">{agent.completedDeliveriesCount} pkgs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Vehicle:</span>
                    <span className="font-medium text-slate-300">{agent.vehicleRegistration || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Earned Commission:</span>
                    <span className="font-bold text-cyan-400">${agent.commissionEarnedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: COMMISSIONS & PAYOUTS ================= */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <Card className="p-4 border-slate-800">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white">Commission Ledger</h3>
              <p className="text-xs text-slate-400">A delivery earns a commission when proof of delivery is completed for an assigned agent.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800"><tr><th className="p-2.5">Delivery Date</th><th className="p-2.5">Agent</th><th className="p-2.5">AWB</th><th className="p-2.5">Commission</th></tr></thead>
                <tbody className="divide-y divide-slate-800/80">
                  {commissions.map((commission) => <tr key={commission.id}><td className="p-2.5 text-slate-400">{commission.deliveryDate}</td><td className="p-2.5 text-slate-200">{commission.agentName}</td><td className="p-2.5 font-mono text-blue-300">{commission.awbNumber}</td><td className="p-2.5 font-mono text-emerald-400">${commission.commission.toFixed(2)}</td></tr>)}
                  {commissions.length === 0 && <tr><td colSpan={4} className="p-5 text-center text-slate-500">No earned commissions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-base font-bold text-white">Agent Expense Claims</h3><p className="text-xs text-slate-400">Approved expenses are deducted when a payout is calculated.</p></div>
              <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsNewExpenseModalOpen(true)}>Record Expense</Button>
            </div>
            <div className="space-y-2">
              {agentExpenses.map((expense) => <div key={expense.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs">
                <div><span className="font-semibold text-slate-200">{expense.agentName}</span><span className="mx-2 text-slate-600">·</span><span className="text-slate-400">{expense.expenseType} · {expense.date}</span><div className="mt-1 text-slate-500">{expense.notes || 'No notes'}</div></div>
                <div className="flex items-center gap-3"><strong className="font-mono text-white">${expense.amount.toFixed(2)}</strong><Badge variant={expense.isApproved ? 'success' : 'warning'}>{expense.isApproved ? 'Approved' : 'Pending'}</Badge>{!expense.isApproved && <Button size="xs" variant="outline" isLoading={approveExpenseMutation.isPending} onClick={() => approveExpenseMutation.mutate(expense.id)}>Approve</Button>}</div>
              </div>)}
              {agentExpenses.length === 0 && <p className="py-5 text-center text-xs text-slate-500">No agent expenses recorded.</p>}
            </div>
          </Card>

          <Card className="p-4 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Agent Payout Settlement Batches</h3>
                <p className="text-xs text-slate-400">Bi-weekly commission disbursements and approved reimbursements.</p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsPayoutModalOpen(true)}
                icon={<DollarSign className="h-4 w-4" />}
              >
                Request Agent Payout
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Payout Reference</th>
                    <th className="p-2.5">Agent Name</th>
                    <th className="p-2.5">Settlement Period</th>
                    <th className="p-2.5">Earned Commissions</th>
                    <th className="p-2.5">Approved Expenses</th>
                    <th className="p-2.5">Net Payable</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-blue-400">{pay.payoutReference}</td>
                      <td className="p-2.5 font-medium text-slate-200">{pay.agentName}</td>
                      <td className="p-2.5 text-slate-400">{pay.periodStart} ➔ {pay.periodEnd}</td>
                      <td className="p-2.5 font-mono text-slate-300">${pay.grossEarnings.toFixed(2)}</td>
                      <td className="p-2.5 font-mono text-amber-300">-${pay.expenses.toFixed(2)}</td>
                      <td className="p-2.5 font-mono font-bold text-white">${pay.netPayable.toFixed(2)}</td>
                      <td className="p-2.5">
                        <Badge
                          variant={pay.status === 'paid' ? 'success' : pay.status === 'approved' ? 'info' : 'warning'}
                          size="xs"
                        >
                          {pay.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right">
                        {pay.status === 'pending' ? (
                          <Button
                            size="xs"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handleApprovePayout(pay.id)}
                          >
                            Approve Payout
                          </Button>
                        ) : pay.status === 'approved' ? (
                          <Button size="xs" variant="success" isLoading={payPayoutMutation.isPending} onClick={() => payPayoutMutation.mutate(pay.id)}>Disburse Funds</Button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================= SHIPMENT DETAILS & TRACKING DRAWER ================= */}
      <Drawer
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        title={selectedShipment ? `AWB Consignment: ${selectedShipment.awbNumber}` : ''}
        size="lg"
      >
        {selectedShipment && (
          <div className="space-y-6">
            {/* Header summary */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Tracking ID</span>
                <span className="text-base font-bold text-white font-mono">{selectedShipment.trackingNumber}</span>
              </div>
              <Badge variant="success" size="md">
                {selectedShipment.currentStatus.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Origin & Destination */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sender / Shipper</span>
                <div className="font-bold text-slate-200 mt-1">{selectedShipment.sender.name}</div>
                <div className="text-slate-400 mt-0.5">{selectedShipment.sender.address}, {selectedShipment.sender.city}</div>
                <div className="text-slate-500 font-mono mt-0.5">{selectedShipment.sender.phone}</div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Receiver / Consignee</span>
                <div className="font-bold text-slate-200 mt-1">{selectedShipment.receiver.name}</div>
                <div className="text-slate-400 mt-0.5">{selectedShipment.receiver.address}, {selectedShipment.receiver.city}</div>
                <div className="text-slate-500 font-mono mt-0.5">{selectedShipment.receiver.phone}</div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Parcel Dimensions & Valuation
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500">Weight:</span>{' '}
                  <span className="font-bold text-white">{selectedShipment.parcel.weightKg} kg</span>
                </div>
                <div>
                  <span className="text-slate-500">Declared Value:</span>{' '}
                  <span className="font-bold text-white">${selectedShipment.parcel.declaredValue}</span>
                </div>
                <div>
                  <span className="text-slate-500">Handling:</span>{' '}
                  <span className={selectedShipment.parcel.isFragile ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {selectedShipment.parcel.isFragile ? '⚠️ FRAGILE' : 'Standard'}
                  </span>
                </div>
              </div>
              <div className="text-slate-400 mt-2 text-[11px]">
                {selectedShipment.parcel.description}
              </div>
            </div>

            {/* Proof of Delivery Card (If verified) */}
            {selectedShipment.pod && selectedShipment.pod.status === 'pod_verified' && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="h-5 w-5" />
                  Proof of Delivery Verified (e-PoD)
                </div>
                <div className="mt-2 text-xs text-slate-300 space-y-1">
                  <div><span className="text-slate-400">Recipient Name:</span> {selectedShipment.pod.recipientName}</div>
                  <div><span className="text-slate-400">Timestamp:</span> {selectedShipment.pod.deliveryTimestamp}</div>
                  <div><span className="text-slate-400">Confirmation Method:</span> {selectedShipment.pod.confirmationMethod.toUpperCase()}</div>
                  {selectedShipment.pod.signatureDataUrl && (
                    <div className="mt-2 p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 block mb-1">Digital Signature Capture:</span>
                      <img src={selectedShipment.pod.signatureDataUrl} alt="Signature" className="h-10 w-auto" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {['sorted', 'at_destination_hub', 'out_for_delivery', 'delivery_failed'].includes(selectedShipment.currentStatus) && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                <div><h4 className="text-sm font-semibold text-white">Last-Mile Agent</h4><p className="text-[11px] text-slate-400">Assigning an agent moves the shipment to Out for Delivery and enables commission on successful delivery.</p></div>
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedShipmentAgentId} onChange={(e) => setSelectedShipmentAgentId(e.target.value)} className="min-w-[220px] flex-1" options={[{ label: '-- Choose active courier agent --', value: '' }, ...agents.filter((agent) => agent.status === 'available').map((agent) => ({ label: `${agent.name}${agent.vehicleRegistration ? ` · ${agent.vehicleRegistration}` : ''}`, value: agent.id }))]} />
                  <Button size="sm" variant="primary" disabled={!selectedShipmentAgentId} isLoading={assignAgentMutation.isPending} onClick={handleAssignSelectedAgent}>Assign Agent</Button>
                </div>
              </div>
            )}

            {/* Tracking Event Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Live Lifecycle Telemetry Log
              </h4>
              <div className="relative pl-6 space-y-4 border-l border-slate-800">
                {selectedShipment.timeline.map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-[#0f172a]" />
                    <div className="text-xs font-mono text-blue-400">{event.timestamp}</div>
                    <div className="text-xs font-semibold text-white mt-0.5">{event.description}</div>
                    <div className="text-[11px] text-slate-400">{event.location} • {event.actor || 'System Engine'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar inside Drawer */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAttemptModalOpen(true)}
                icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
              >
                Log Delivery Attempt
              </Button>
              {selectedShipment.currentStatus !== 'delivered' && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => setIsPodModalOpen(true)}
                  icon={<FileSignature className="h-4 w-4" />}
                >
                  Verify Proof of Delivery (PoD)
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ================= MODAL: NEW AWB SHIPMENT ================= */}
      <Modal
        isOpen={isNewShipmentModalOpen}
        onClose={() => setIsNewShipmentModalOpen(false)}
        title="Generate New AWB Express Consignment"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4">
          {createShipmentMutation.isError && (
            <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {(createShipmentMutation.error as Error)?.message || 'Shipment could not be created.'}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sender / Shipper Name"
              required
              value={newShipmentForm.senderName}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, senderName: e.target.value })}
              placeholder="e.g. Central Medical Logistics Hub"
            />
            <PhoneNumberInput
              label="Sender Phone"
              required
              value={newShipmentForm.senderPhone}
              onChange={(senderPhone) => setNewShipmentForm({ ...newShipmentForm, senderPhone })}
            />
          </div>
          <Input
            label="Sender Pickup Address"
            required
            value={newShipmentForm.senderAddress}
            onChange={(e) => setNewShipmentForm({ ...newShipmentForm, senderAddress: e.target.value })}
            placeholder="400 N Michigan Ave, Chicago"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Receiver / Consignee Name"
              required
              value={newShipmentForm.receiverName}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, receiverName: e.target.value })}
              placeholder="e.g. St. Jude Hospital"
            />
            <PhoneNumberInput
              label="Receiver Phone"
              required
              value={newShipmentForm.receiverPhone}
              onChange={(receiverPhone) => setNewShipmentForm({ ...newShipmentForm, receiverPhone })}
            />
          </div>
          <Input
            label="Receiver Delivery Address"
            required
            value={newShipmentForm.receiverAddress}
            onChange={(e) => setNewShipmentForm({ ...newShipmentForm, receiverAddress: e.target.value })}
            placeholder="251 E Huron St, Chicago"
          />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Service Level"
              value={newShipmentForm.serviceType}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, serviceType: e.target.value as any })}
              options={[
                { label: 'Same Day Express', value: 'same_day' },
                { label: 'Next Day Express', value: 'next_day_express' },
                { label: 'Standard Ground', value: 'standard_ground' },
              ]}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={newShipmentForm.weightKg}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, weightKg: Number(e.target.value) })}
            />
            <Input
              label="Declared Value ($)"
              type="number"
              value={newShipmentForm.declaredValue}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, declaredValue: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Parcel Description"
            value={newShipmentForm.description}
            onChange={(e) => setNewShipmentForm({ ...newShipmentForm, description: e.target.value })}
            placeholder="e.g. Pathology diagnostic specimens"
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fragileCheck"
              checked={newShipmentForm.isFragile}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, isFragile: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-500"
            />
            <label htmlFor="fragileCheck" className="text-xs text-slate-300 cursor-pointer">
              Fragile / High-Priority Handling Required
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsNewShipmentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createShipmentMutation.isPending}>
              Generate Authoritative AWB
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: BARCODE SCAN & SORT ================= */}
      <Modal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        title="High-Speed Barcode Sorting Station"
      >
        <form onSubmit={handleScanAndSort} className="space-y-4">
          <Input
            label="Scan / Input AWB Barcode"
            required
            autoFocus
            value={sortForm.awbNumber}
            onChange={(e) => setSortForm({ ...sortForm, awbNumber: e.target.value })}
            placeholder="e.g. AWB-EXP-88910"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Source Scanning Hub"
              value={sortForm.sourceHub}
              onChange={(e) => setSortForm({ ...sortForm, sourceHub: e.target.value })}
              options={hubs.map((h) => ({ label: h.name, value: h.id }))}
            />
            <Select
              label="Destination Hub"
              value={sortForm.destinationHub}
              onChange={(e) => setSortForm({ ...sortForm, destinationHub: e.target.value })}
              options={[{ label: 'No destination hub', value: '' }, ...hubs.map((h) => ({ label: h.name, value: h.id }))]}
            />
          </div>

          <Select
            label="Conveyor Sorting Category"
            value={sortForm.sortingCategory}
            onChange={(e) => setSortForm({ ...sortForm, sortingCategory: e.target.value as any })}
            options={[
              { label: 'Air Express', value: 'Air Express' },
              { label: 'Surface North', value: 'Surface North' },
              { label: 'Surface South', value: 'Surface South' },
              { label: 'Local Delivery', value: 'Local Delivery' },
              { label: 'Exception', value: 'Exception' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsSortModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={processSortingMutation.isPending} icon={<QrCode className="h-4 w-4" />}>
              Process Scan & Route
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: PROOF OF DELIVERY (PoD) ================= */}
      <Modal
        isOpen={isPodModalOpen}
        onClose={() => setIsPodModalOpen(false)}
        title={`Verify Proof of Delivery (PoD) - ${selectedShipment?.awbNumber}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Recipient:</span>{' '}
            <span className="text-white font-bold">{selectedShipment?.receiver.name}</span>
            <div className="text-slate-400 mt-1">{selectedShipment?.receiver.address}</div>
          </div>

          <Select
            label="Confirmation Method"
            value={podForm.confirmationMethod}
            onChange={(e) => setPodForm({ ...podForm, confirmationMethod: e.target.value as any })}
            options={[
              { label: 'Digital Signature on Glass', value: 'digital_signature' },
              { label: 'SMS One-Time Password (OTP)', value: 'otp' },
            ]}
          />

          <Input
            label="Recipient Signer Name"
            value={podForm.recipientName}
            onChange={(e) => setPodForm({ ...podForm, recipientName: e.target.value })}
            placeholder={selectedShipment?.receiver.name || 'Signer name'}
          />

          {podForm.confirmationMethod === 'otp' && (
            <Input
              label="Enter 4-Digit OTP Code"
              maxLength={4}
              value={podForm.otpCode}
              onChange={(e) => setPodForm({ ...podForm, otpCode: e.target.value })}
              placeholder="e.g. 4920"
            />
          )}

          {podForm.confirmationMethod === 'digital_signature' && (
            <div className="p-4 border-2 border-dashed border-slate-700 rounded-lg text-center bg-slate-950">
              <FileSignature className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300">Simulating Touch Signature Capture</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Captures high-resolution cryptographic vector signature</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsPodModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleVerifyPod} className="bg-emerald-600 hover:bg-emerald-500">
              Confirm & Generate e-PoD
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL: RECORD DELIVERY ATTEMPT ================= */}
      <Modal
        isOpen={isAttemptModalOpen}
        onClose={() => setIsAttemptModalOpen(false)}
        title="Log Failed Delivery Attempt"
      >
        <div className="space-y-4">
          <Select
            label="Primary Failure Reason"
            value={attemptReason}
            onChange={(e) => setAttemptReason(e.target.value)}
            options={[
              { label: 'Customer / Recipient Unavailable', value: 'Customer Unavailable' },
              { label: 'Building Access / Intercom Code Missing', value: 'Building Access Locked' },
              { label: 'Incorrect Delivery Address', value: 'Incorrect Address' },
              { label: 'Cash on Delivery (COD) Not Ready', value: 'COD Amount Not Ready' },
              { label: 'Security Gate Rejected Entry', value: 'Security Access Denied' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsAttemptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRecordAttempt}>
              Record Attempt & Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isNewPickupModalOpen} onClose={() => setIsNewPickupModalOpen(false)} title="Create Multi-Stop Pickup Batch" size="lg">
        <form onSubmit={handleCreatePickupBatch} className="space-y-4">
          {createPickupMutation.isError && <p role="alert" className="text-xs text-rose-300">{(createPickupMutation.error as Error)?.message || 'Could not create pickup batch.'}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Shipment" required value={pickupForm.shipmentId} onChange={(e) => setPickupForm({ ...pickupForm, shipmentId: e.target.value })} options={[{ label: '-- Select shipment --', value: '' }, ...allCourierShipments.filter((s) => ['pickup_pending', 'pickup_assigned'].includes(s.currentStatus)).map((s) => ({ label: `${s.awbNumber} · ${s.receiver.name}`, value: s.id }))]} />
            <Select label="Pickup Agent" required value={pickupForm.assignedAgentId} onChange={(e) => setPickupForm({ ...pickupForm, assignedAgentId: e.target.value })} options={[{ label: '-- Select active agent --', value: '' }, ...agents.filter((a) => a.status === 'available').map((a) => ({ label: a.name, value: a.id }))]} />
          </div>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {pickupForm.stops.map((stop, index) => <div key={index} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-300">Stop {index + 1}</span>{pickupForm.stops.length > 1 && <Button type="button" size="xs" variant="ghost" onClick={() => setPickupForm({ ...pickupForm, stops: pickupForm.stops.filter((_, i) => i !== index) })}>Remove</Button>}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Pickup Location Name" required value={stop.locationName} onChange={(e) => setPickupForm({ ...pickupForm, stops: pickupForm.stops.map((s, i) => i === index ? { ...s, locationName: e.target.value } : s) })} />
                <Input label="Contact Person" required value={stop.contactPerson} onChange={(e) => setPickupForm({ ...pickupForm, stops: pickupForm.stops.map((s, i) => i === index ? { ...s, contactPerson: e.target.value } : s) })} />
                <PhoneNumberInput label="Contact Phone" required value={stop.contactPhone} onChange={(contactPhone) => setPickupForm({ ...pickupForm, stops: pickupForm.stops.map((s, i) => i === index ? { ...s, contactPhone } : s) })} />
                <Input label="Scheduled Pickup" type="datetime-local" required value={stop.timeWindow} onChange={(e) => setPickupForm({ ...pickupForm, stops: pickupForm.stops.map((s, i) => i === index ? { ...s, timeWindow: e.target.value } : s) })} />
                <Input label="Pickup Address" required value={stop.address} onChange={(e) => setPickupForm({ ...pickupForm, stops: pickupForm.stops.map((s, i) => i === index ? { ...s, address: e.target.value } : s) })} />
                <Input label="Parcel Count" type="number" min="1" required value={stop.parcelCount} onChange={(e) => setPickupForm({ ...pickupForm, stops: pickupForm.stops.map((s, i) => i === index ? { ...s, parcelCount: Math.max(1, Number(e.target.value)) } : s) })} />
              </div>
            </div>)}
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setPickupForm({ ...pickupForm, stops: [...pickupForm.stops, { locationName: '', address: '', contactPerson: '', contactPhone: '', timeWindow: '', parcelCount: 1, status: 'pending' }] })}>Add Another Stop</Button>
            <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setIsNewPickupModalOpen(false)}>Cancel</Button><Button type="submit" size="sm" isLoading={createPickupMutation.isPending}>Save Pickup Batch</Button></div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isNewHubModalOpen} onClose={() => setIsNewHubModalOpen(false)} title="Add Courier Hub" size="lg">
        <form onSubmit={handleCreateHub} className="space-y-4">
          {createHubMutation.isError && <p role="alert" className="text-xs text-rose-300">{(createHubMutation.error as Error)?.message || 'Could not create hub.'}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Hub Name" required value={hubForm.name} onChange={(e) => setHubForm({ ...hubForm, name: e.target.value })} />
            <Input label="Hub Code" required value={hubForm.code} onChange={(e) => setHubForm({ ...hubForm, code: e.target.value.toUpperCase() })} />
            <Input label="City" required value={hubForm.city} onChange={(e) => setHubForm({ ...hubForm, city: e.target.value })} />
            <Input label="State / Region" value={hubForm.state} onChange={(e) => setHubForm({ ...hubForm, state: e.target.value })} />
            <Input label="Postal Code" required value={hubForm.postalCode} onChange={(e) => setHubForm({ ...hubForm, postalCode: e.target.value })} />
            <PhoneNumberInput label="Contact Phone" value={hubForm.contactPhone} onChange={(contactPhone) => setHubForm({ ...hubForm, contactPhone })} />
            <Input label="Contact Email" type="email" value={hubForm.contactEmail} onChange={(e) => setHubForm({ ...hubForm, contactEmail: e.target.value })} />
            <Input label="Floor Area (sq ft)" type="number" min="0" value={hubForm.capacitySqft} onChange={(e) => setHubForm({ ...hubForm, capacitySqft: Number(e.target.value) })} />
            <div className="md:col-span-2"><Input label="Street Address" required value={hubForm.address} onChange={(e) => setHubForm({ ...hubForm, address: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" size="sm" onClick={() => setIsNewHubModalOpen(false)}>Cancel</Button><Button type="submit" size="sm" isLoading={createHubMutation.isPending}>Create Hub</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isNewConvoyModalOpen} onClose={() => setIsNewConvoyModalOpen(false)} title="Plan Hub-to-Hub Convoy" size="lg">
        <form onSubmit={handleCreateConvoy} className="space-y-4">
          {createConvoyMutation.isError && <p role="alert" className="text-xs text-rose-300">{(createConvoyMutation.error as Error)?.message || 'Could not plan convoy.'}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Origin Hub" required value={convoyForm.originHubId} onChange={(e) => setConvoyForm({ ...convoyForm, originHubId: e.target.value, shipmentIds: [] })} options={[{ label: '-- Choose origin --', value: '' }, ...hubs.map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))]} />
            <Select label="Destination Hub" required value={convoyForm.destinationHubId} onChange={(e) => setConvoyForm({ ...convoyForm, destinationHubId: e.target.value })} options={[{ label: '-- Choose destination --', value: '' }, ...hubs.filter((h) => h.id !== convoyForm.originHubId).map((h) => ({ label: `${h.name} (${h.code})`, value: h.id }))]} />
            <Select label="Available Vehicle" required value={convoyForm.vehicleId} onChange={(e) => setConvoyForm({ ...convoyForm, vehicleId: e.target.value })} options={[{ label: '-- Choose vehicle --', value: '' }, ...fleetVehicles.map((v) => ({ label: `${v.registrationNumber} · ${v.make} ${v.model}`, value: v.id }))]} />
            <Select label="Available Driver" required value={convoyForm.driverId} onChange={(e) => setConvoyForm({ ...convoyForm, driverId: e.target.value })} options={[{ label: '-- Choose driver --', value: '' }, ...rosterDrivers.filter((d) => d.status === 'available').map((d) => ({ label: `${d.firstName} ${d.lastName}`, value: d.id }))]} />
            <Input label="Scheduled Departure" type="datetime-local" value={convoyForm.scheduledDeparture} onChange={(e) => setConvoyForm({ ...convoyForm, scheduledDeparture: e.target.value })} />
            <div className="md:col-span-2 space-y-2"><div className="text-xs font-semibold text-slate-300">Sorted shipments at this origin</div><div className="max-h-40 overflow-y-auto rounded-lg border border-slate-800 p-2 space-y-1">
              {allCourierShipments.filter((s) => s.currentStatus === 'sorted' && s.currentHubId === convoyForm.originHubId).map((shipment) => <label key={shipment.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-800/60"><input type="checkbox" checked={convoyForm.shipmentIds.includes(shipment.id)} onChange={(e) => setConvoyForm({ ...convoyForm, shipmentIds: e.target.checked ? [...convoyForm.shipmentIds, shipment.id] : convoyForm.shipmentIds.filter((id) => id !== shipment.id) })} /><span className="font-mono text-blue-300">{shipment.awbNumber}</span><span className="text-slate-400">{shipment.receiver.name}</span></label>)}
              {allCourierShipments.filter((s) => s.currentStatus === 'sorted' && s.currentHubId === convoyForm.originHubId).length === 0 && <p className="px-2 py-3 text-xs text-slate-500">No sorted shipments are waiting at this hub.</p>}
            </div></div>
            <div className="md:col-span-2"><Input label="Convoy Notes" value={convoyForm.notes} onChange={(e) => setConvoyForm({ ...convoyForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" size="sm" onClick={() => setIsNewConvoyModalOpen(false)}>Cancel</Button><Button type="submit" size="sm" isLoading={createConvoyMutation.isPending} disabled={convoyForm.shipmentIds.length === 0}>Plan Convoy</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isNewAgentModalOpen} onClose={() => setIsNewAgentModalOpen(false)} title="Register Courier Agent">
        <form onSubmit={handleCreateAgent} className="space-y-4">
          {createAgentMutation.isError && <p role="alert" className="text-xs text-rose-300">{(createAgentMutation.error as Error)?.message || 'Could not create courier agent.'}</p>}
          <Input label="Agent Code" required value={agentForm.agentCode} onChange={(e) => setAgentForm({ ...agentForm, agentCode: e.target.value.toUpperCase() })} />
          <Select label="Driver Profile" required value={agentForm.driverId} onChange={(e) => setAgentForm({ ...agentForm, driverId: e.target.value })} options={[{ label: '-- Choose available driver --', value: '' }, ...rosterDrivers.filter((d) => d.status === 'available').map((d) => ({ label: `${d.firstName} ${d.lastName} · ${d.phone}`, value: d.id }))]} />
          <Select label="Vehicle (Optional)" value={agentForm.vehicleId} onChange={(e) => setAgentForm({ ...agentForm, vehicleId: e.target.value })} options={[{ label: '-- No vehicle --', value: '' }, ...fleetVehicles.map((v) => ({ label: `${v.registrationNumber} · ${v.make} ${v.model}`, value: v.id }))]} />
          <Select label="Home Hub" value={agentForm.currentHubId} onChange={(e) => setAgentForm({ ...agentForm, currentHubId: e.target.value })} options={[{ label: '-- No home hub --', value: '' }, ...hubs.map((h) => ({ label: h.name, value: h.id }))]} />
          <Input label="Service Area" required value={agentForm.serviceArea} onChange={(e) => setAgentForm({ ...agentForm, serviceArea: e.target.value })} />
          <Input label="Commission per Delivery ($)" type="number" min="0" step="0.01" value={agentForm.commissionRate} onChange={(e) => setAgentForm({ ...agentForm, commissionRate: Number(e.target.value) })} />
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" size="sm" onClick={() => setIsNewAgentModalOpen(false)}>Cancel</Button><Button type="submit" size="sm" isLoading={createAgentMutation.isPending}>Save Agent</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isPayoutModalOpen} onClose={() => setIsPayoutModalOpen(false)} title="Request Agent Payout">
        <form onSubmit={handleRequestPayout} className="space-y-4">
          {requestPayoutMutation.isError && <p role="alert" className="text-xs text-rose-300">{(requestPayoutMutation.error as Error)?.message || 'Could not calculate payout.'}</p>}
          <Select label="Courier Agent" required value={payoutForm.agentId} onChange={(e) => setPayoutForm({ ...payoutForm, agentId: e.target.value })} options={[{ label: '-- Choose agent --', value: '' }, ...agents.map((a) => ({ label: a.name, value: a.id }))]} />
          <div className="grid grid-cols-2 gap-3"><Input label="Period Start" type="date" required value={payoutForm.periodStart} onChange={(e) => setPayoutForm({ ...payoutForm, periodStart: e.target.value })} /><Input label="Period End" type="date" required value={payoutForm.periodEnd} onChange={(e) => setPayoutForm({ ...payoutForm, periodEnd: e.target.value })} /></div>
          <p className="text-[11px] text-slate-500">The request totals earned commissions and subtracts approved expenses in this period. It creates a pending payout for review.</p>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" size="sm" onClick={() => setIsPayoutModalOpen(false)}>Cancel</Button><Button type="submit" size="sm" isLoading={requestPayoutMutation.isPending}>Calculate Payout</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isNewExpenseModalOpen} onClose={() => setIsNewExpenseModalOpen(false)} title="Record Agent Expense">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {createExpenseMutation.isError && <p role="alert" className="text-xs text-rose-300">{(createExpenseMutation.error as Error)?.message || 'Could not save expense.'}</p>}
          <Select label="Courier Agent" required value={expenseForm.agentId} onChange={(e) => setExpenseForm({ ...expenseForm, agentId: e.target.value })} options={[{ label: '-- Choose agent --', value: '' }, ...agents.map((a) => ({ label: a.name, value: a.id }))]} />
          <Select label="Expense Type" value={expenseForm.expenseType} onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })} options={[{ label: 'Fuel', value: 'FUEL' }, { label: 'Toll', value: 'TOLL' }, { label: 'Parking', value: 'PARKING' }, { label: 'Phone', value: 'PHONE' }, { label: 'Maintenance', value: 'MAINTENANCE' }, { label: 'Other', value: 'OTHER' }]} />
          <Input label="Amount ($)" type="number" min="0.01" step="0.01" required value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })} />
          <Input label="Notes" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><Button type="button" variant="outline" size="sm" onClick={() => setIsNewExpenseModalOpen(false)}>Cancel</Button><Button type="submit" size="sm" isLoading={createExpenseMutation.isPending}>Save Expense</Button></div>
        </form>
      </Modal>
    </div>
  );
};
