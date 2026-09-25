import React, { useState, useEffect, useMemo } from 'react';
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
} from '../../types';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
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
  useCreatePickupMutation,
  useUpdatePickupStopMutation,
  useProcessSortingMutation,
  useApprovePayoutMutation,
} from '../../hooks/queries';
import { QueryStateWrapper } from '../../components/common/QueryStateWrapper';

export const CourierDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shipments');

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

  // TanStack Mutations
  const createShipmentMutation = useCreateShipmentMutation();
  const updateShipmentStatusMutation = useUpdateShipmentStatusMutation();
  const verifyPodMutation = useVerifyPodMutation();
  const recordFailedAttemptMutation = useRecordFailedAttemptMutation();
  const createPickupMutation = useCreatePickupMutation();
  const updatePickupStopMutation = useUpdatePickupStopMutation();
  const processSortingMutation = useProcessSortingMutation();
  const approvePayoutMutation = useApprovePayoutMutation();

  const loading = isLoadingShipments || isLoadingPickups || isLoadingHubs;

  // Modals & Drawers state
  const [selectedShipment, setSelectedShipment] = useState<CourierShipment | null>(null);
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [isNewPickupModalOpen, setIsNewPickupModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

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
    sourceHub: 'Chicago Central Sort & Distribution Facility',
    destinationHub: 'North Suburbs Cross-Dock & Last Mile',
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
            onClick={() => refetchShipments()}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync Hubs
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
          change="+14% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Delivered Today (PoD Verified)"
          value={stats.deliveredToday}
          icon={CheckCircle2}
          change="99.4% On-time rate"
          changeType="positive"
        />
        <StatCard
          title="Hub Sorting Queue"
          value={stats.pendingSorting}
          icon={Layers}
          change="High-speed automated"
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
          change="Settlements ready"
          changeType="positive"
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
              onClick={() => setIsNewPickupModalOpen(true)}
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
                        {stop.status !== 'picked_up' && (
                          <Button
                            size="xs"
                            variant="outline"
                            isLoading={updatePickupStopMutation.isPending}
                            onClick={async () => {
                              await updatePickupStopMutation.mutateAsync({
                                pickupId: batch.id,
                                stopId: stop.id,
                                status: 'picked_up',
                              });
                            }}
                          >
                            Mark Picked
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
                    <span>Sorting Load:</span>
                    <span className="text-white font-medium">
                      {hub.currentParcelsCount.toLocaleString()} / {hub.capacityParcels.toLocaleString()}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (hub.currentParcelsCount / hub.capacityParcels) * 100)}%` }}
                    />
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
                    <span className="font-medium text-slate-300 capitalize">{agent.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Pending Payout:</span>
                    <span className="font-bold text-cyan-400">${agent.pendingPayoutAmount}</span>
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
                    <th className="p-2.5">Gross Base</th>
                    <th className="p-2.5">Commissions</th>
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
                      <td className="p-2.5 font-mono text-emerald-400">+${pay.commission.toFixed(2)}</td>
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
                        {pay.status === 'pending' || pay.status === 'approved' ? (
                          <Button
                            size="xs"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-500"
                            onClick={() => handleApprovePayout(pay.id)}
                          >
                            Disburse Funds
                          </Button>
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sender / Shipper Name"
              required
              value={newShipmentForm.senderName}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, senderName: e.target.value })}
              placeholder="e.g. Central Medical Logistics Hub"
            />
            <Input
              label="Sender Phone"
              required
              value={newShipmentForm.senderPhone}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, senderPhone: e.target.value })}
              placeholder="+1 555-0129"
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
            <Input
              label="Receiver Phone"
              required
              value={newShipmentForm.receiverPhone}
              onChange={(e) => setNewShipmentForm({ ...newShipmentForm, receiverPhone: e.target.value })}
              placeholder="+1 555-9011"
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
            <Button variant="primary" type="submit">
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
              options={hubs.map((h) => ({ label: h.name, value: h.name }))}
            />
            <Select
              label="Destination Hub"
              value={sortForm.destinationHub}
              onChange={(e) => setSortForm({ ...sortForm, destinationHub: e.target.value })}
              options={hubs.map((h) => ({ label: h.name, value: h.name }))}
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
            <Button variant="primary" type="submit" icon={<QrCode className="h-4 w-4" />}>
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
              { label: 'Recipient Delivery Photo', value: 'recipient_photo' },
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
    </div>
  );
};
