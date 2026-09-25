import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '../../api/warehouse.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Tabs } from '../../components/common/Tabs';
import { QueryStateWrapper } from '../../components/common/QueryStateWrapper';
import { queryKeys } from '../../hooks/queries/queryKeys';
import { SparePart, WarehouseLocation, CrossDockRecord, ShipmentConsolidationGroup } from '../../types';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Building2,
  PackageCheck,
  Layers,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useTenant } from '../../contexts/TenantContext';

export const WarehouseHub: React.FC = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState('inventory');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ShipmentConsolidationGroup | null>(null);
  const [sealNumberInput, setSealNumberInput] = useState('');
  const [sealVehicleInput, setSealVehicleInput] = useState('');

  const [newPart, setNewPart] = useState({
    sku: '',
    name: '',
    category: 'tyres' as SparePart['category'],
    warehouseId: '',
    availableQuantity: 0,
    minQuantity: 0,
    reorderLevel: 0,
    unitCost: 0,
    sellingPrice: 0,
    locationBin: '',
    supplierName: '',
  });

  // Queries
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses', tenant.id],
    queryFn: () => warehouseApi.getWarehouses(),
  });

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['spareParts', tenant.id, warehouseFilter, lowStockOnly],
    queryFn: () => warehouseApi.getSpareParts({ warehouseId: warehouseFilter, lowStockOnly }),
  });

  const {
    data: crossDockRecords = [],
    isLoading: isLoadingCrossDock,
    isError: isCrossDockError,
    error: crossDockError,
    refetch: refetchCrossDock,
  } = useQuery({
    queryKey: queryKeys.warehouse.crossDock(),
    queryFn: () => warehouseApi.getCrossDockRecords(),
  });

  const {
    data: consolidationGroups = [],
    isLoading: isLoadingConsolidation,
    isError: isConsolidationError,
    error: consolidationError,
    refetch: refetchConsolidation,
  } = useQuery({
    queryKey: queryKeys.warehouse.consolidation(),
    queryFn: () => warehouseApi.getConsolidationGroups(),
  });

  // Mutations
  const createPartMutation = useMutation({
    mutationFn: (data: typeof newPart) => warehouseApi.createSparePart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
      setIsAddPartModalOpen(false);
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ partId, delta }: { partId: string; delta: number }) =>
      warehouseApi.adjustStock(partId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts'] });
    },
  });

  const updateCrossDockMutation = useMutation({
    mutationFn: ({
      id,
      sortingStatus,
      dispatchStatus,
    }: {
      id: string;
      sortingStatus?: CrossDockRecord['sortingStatus'];
      dispatchStatus?: CrossDockRecord['dispatchStatus'];
    }) => warehouseApi.updateCrossDockStatus(id, sortingStatus, dispatchStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.crossDock() });
      queryClient.invalidateQueries({ queryKey: ['crossDockRecords'] });
    },
  });

  const sealConsolidationMutation = useMutation({
    mutationFn: ({
      groupId,
      sealNumber,
      vehicle,
    }: {
      groupId: string;
      sealNumber: string;
      vehicle: string;
    }) => warehouseApi.sealConsolidationGroup(groupId, sealNumber, vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.consolidation() });
      queryClient.invalidateQueries({ queryKey: ['consolidationGroups'] });
    },
  });

  const handleUpdateCrossDock = async (
    id: string,
    sortingStatus?: CrossDockRecord['sortingStatus'],
    dispatchStatus?: CrossDockRecord['dispatchStatus']
  ) => {
    await updateCrossDockMutation.mutateAsync({ id, sortingStatus, dispatchStatus });
  };

  const handleSealGroup = async () => {
    if (!selectedGroup) return;
    await sealConsolidationMutation.mutateAsync({
      groupId: selectedGroup.id,
      sealNumber: sealNumberInput,
      vehicle: sealVehicleInput,
    });
    setIsSealModalOpen(false);
  };

  const columns: ColumnDef<SparePart>[] = [
    {
      key: 'sku',
      header: 'SKU & Part Description',
      sortable: true,
      accessor: (r) => r.sku,
      render: (_, row) => (
        <div>
          <span className="font-mono font-bold text-white text-xs block">{row.sku}</span>
          <span className="text-slate-300 font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (r) => r.category,
      render: (val: string) => (
        <Badge variant="outline" size="sm" className="capitalize">
          {val.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'warehouse',
      header: 'Warehouse & Bin',
      render: (_, row) => (
        <div className="text-xs">
          <span className="text-slate-200 block">{row.warehouseName}</span>
          <span className="text-[10px] font-mono text-slate-400">Bin: {row.locationBin}</span>
        </div>
      ),
    },
    {
      key: 'quantities',
      header: 'Available / Min / Reorder',
      render: (_, row) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold text-sm ${row.isLowStock ? 'text-red-400' : 'text-white'}`}>
              {row.availableQuantity} Units
            </span>
            {row.isLowStock && (
              <Badge variant="danger" size="sm" dot>Reorder Level Reached</Badge>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">Min: {row.minQuantity} • Trigger: {row.reorderLevel}</span>
        </div>
      ),
    },
    {
      key: 'valuation',
      header: 'Valuation & Unit Cost',
      sortable: true,
      accessor: (r) => r.unitCost * r.availableQuantity,
      render: (_, row) => (
        <div className="text-xs font-mono">
          <span className="font-bold text-emerald-400 block">{formatCurrency(row.unitCost * row.availableQuantity)}</span>
          <span className="text-[10px] text-slate-500">@{formatCurrency(row.unitCost)} / unit</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Stock Delta',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustStockMutation.mutate({ partId: row.id, delta: -1 })}
            disabled={row.availableQuantity <= 0}
            title="Issue 1 Part"
          >
            -1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustStockMutation.mutate({ partId: row.id, delta: 1 })}
            title="Receive 1 Part"
          >
            +1
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Warehouse Logistics & Cross-Dock Hub
            <Badge variant="success" size="sm" className="font-mono">INTEGRATED WMS</Badge>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spare parts inventory, rapid cross-docking workspace (Inbound ➔ Sort ➔ Consolidate ➔ Outbound), and multi-day shipment consolidation.
          </p>
        </div>

        {activeTab === 'inventory' && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddPartModalOpen(true)}
          >
            Add Inventory SKU
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'inventory', label: 'Spare Parts & Inventory' },
          { id: 'cross_dock', label: `Cross-Docking Workspace (${crossDockRecords.length})` },
          { id: 'consolidation', label: `Shipment Consolidation (${consolidationGroups.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ================= TAB 1: SPARE PARTS INVENTORY ================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Warehouse Depots Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <Card key={wh.id} className="p-4 space-y-2 border-slate-800 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">{wh.name}</h3>
                  </div>
                  <Badge variant="outline">{wh.code}</Badge>
                </div>
                <p className="text-xs text-slate-400">{wh.address}, {wh.city} • Manager: {wh.managerName}</p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Capacity Utilization:</span>
                  <span className="font-mono text-slate-200">
                    {wh.utilizedUnits.toLocaleString()} / {wh.capacityUnits.toLocaleString()} Units ({Math.round((wh.utilizedUnits / wh.capacityUnits) * 100)}%)
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={parts}
            isLoading={isLoading}
            searchPlaceholder="Search SKU, part name, category, supplier..."
            filterSlot={
              <div className="flex items-center gap-2">
                <Select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="w-44 h-9 text-xs"
                  options={[
                    { value: 'all', label: 'All Warehouses' },
                    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                  ]}
                />
                <button
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    lowStockOnly
                      ? 'border-red-500 bg-red-950/40 text-red-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Low Stock Only
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* ================= TAB 2: CROSS-DOCKING WORKSPACE ================= */}
      {activeTab === 'cross_dock' && (
        <QueryStateWrapper
          isLoading={isLoadingCrossDock}
          isError={isCrossDockError}
          error={crossDockError}
          onRetry={refetchCrossDock}
          loadingMessage="Synchronizing cross-docking bays..."
        >
        <div className="space-y-6">
          {/* Flow Stepper Indicator */}
          <Card className="p-4 bg-slate-950/70 border-slate-800">
            <div className="flex items-center justify-between max-w-3xl mx-auto text-xs font-semibold">
              <div className="flex items-center gap-2 text-blue-400">
                <span className="h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs">1</span>
                <span>Inbound Received</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="flex items-center gap-2 text-amber-400">
                <span className="h-6 w-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs">2</span>
                <span>Sort & Repackage</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="flex items-center gap-2 text-purple-400">
                <span className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs">3</span>
                <span>Consolidate</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600" />
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs">4</span>
                <span>Outbound Linehaul</span>
              </div>
            </div>
          </Card>

          {/* Staged Consignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crossDockRecords.map((item) => (
              <Card key={item.id} className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono font-bold text-sm text-cyan-400">{item.inboundShipmentRef}</span>
                    <Badge
                      variant={item.sortingStatus === 'repackaged' ? 'success' : item.sortingStatus === 'sorted' ? 'info' : 'warning'}
                      size="xs"
                    >
                      {item.sortingStatus.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Origin:</span>
                      <span className="text-white font-medium">{item.origin}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Final Destination:</span>
                      <span className="text-white font-medium">{item.destination}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Dock Received Time:</span>
                      <span className="font-mono text-slate-300">{item.receivedAt}</span>
                    </div>
                    {item.consolidationGroupRef && (
                      <div className="flex items-center justify-between text-slate-400 pt-1">
                        <span>Consolidation Batch:</span>
                        <span className="font-mono text-purple-300 font-semibold">{item.consolidationGroupRef}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <Badge
                    variant={item.dispatchStatus === 'dispatched' ? 'success' : item.dispatchStatus === 'consolidated' ? 'info' : 'neutral'}
                    size="xs"
                  >
                    {item.dispatchStatus.replace(/_/g, ' ').toUpperCase()}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    {item.sortingStatus === 'pending' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleUpdateCrossDock(item.id, 'sorted', 'waiting_consolidation')}
                      >
                        Sort Consignment
                      </Button>
                    )}
                    {item.sortingStatus === 'sorted' && item.dispatchStatus === 'waiting_consolidation' && (
                      <Button
                        size="xs"
                        variant="primary"
                        className="bg-purple-600 hover:bg-purple-500"
                        onClick={() => handleUpdateCrossDock(item.id, 'repackaged', 'consolidated')}
                      >
                        Consolidate
                      </Button>
                    )}
                    {item.dispatchStatus === 'consolidated' && (
                      <Button
                        size="xs"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-500"
                        onClick={() => handleUpdateCrossDock(item.id, 'repackaged', 'dispatched')}
                      >
                        Dispatch Linehaul
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        </QueryStateWrapper>
      )}

      {/* ================= TAB 3: SHIPMENT CONSOLIDATION ================= */}
      {activeTab === 'consolidation' && (
        <QueryStateWrapper
          isLoading={isLoadingConsolidation}
          isError={isConsolidationError}
          error={consolidationError}
          onRetry={refetchConsolidation}
          loadingMessage="Loading consolidation groups..."
        >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Multi-Day Shipment Consolidation Groups</h3>
              <p className="text-xs text-slate-400">Assemble multi-drop shipments into sealed full truckloads with tamper-proof master seals.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {consolidationGroups.map((group) => (
              <Card key={group.id} className="p-5 border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-purple-400">{group.groupCode}</span>
                    <Badge
                      variant={group.status === 'dispatched' ? 'success' : group.status === 'sealed' ? 'info' : 'warning'}
                      size="xs"
                    >
                      {group.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm text-white mt-2">{group.destinationHub}</h4>

                  <div className="my-3 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Shipments:</span>
                      <span className="font-bold text-white">{group.totalShipments} Consignments</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Total Weight:</span>
                      <span className="font-bold text-emerald-400">{group.totalWeightKg.toLocaleString()} kg</span>
                    </div>
                  </div>

                  {group.masterSealNumber && (
                    <div className="p-2 rounded bg-blue-950/30 border border-blue-900/50 text-xs flex items-center gap-2">
                      <Lock className="h-4 w-4 text-blue-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Master Tamper Seal</span>
                        <span className="font-mono font-bold text-blue-300">{group.masterSealNumber}</span>
                      </div>
                    </div>
                  )}

                  {group.assignedVehicleReg && (
                    <div className="mt-2 text-xs text-slate-400">
                      Assigned Truck: <span className="font-mono font-bold text-slate-200">{group.assignedVehicleReg}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                  {group.status === 'open' && (
                    <Button
                      size="xs"
                      variant="primary"
                      className="bg-blue-600 hover:bg-blue-500"
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsSealModalOpen(true);
                      }}
                      icon={<Lock className="h-3.5 w-3.5" />}
                    >
                      Seal Container
                    </Button>
                  )}
                  {group.status === 'sealed' && (
                    <Button
                      size="xs"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      onClick={async () => {
                        await sealConsolidationMutation.mutateAsync({
                          groupId: group.id,
                          sealNumber: group.masterSealNumber || 'SEAL-01',
                          vehicle: group.assignedVehicleReg || 'TRK-9001',
                        });
                      }}
                      icon={<Truck className="h-3.5 w-3.5" />}
                    >
                      Dispatch Truck
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
        </QueryStateWrapper>
      )}

      {/* Add SKU Modal */}
      <Modal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        title="Add Inventory Spare Part SKU"
        description="Record new tyres, filters, lubricants or components into warehouse inventory."
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPartMutation.mutate(newPart);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              required
              placeholder="e.g. TYR-MICH-295-80"
              value={newPart.sku}
              onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })}
            />

            <Input
              label="Part Description / Name"
              required
              placeholder="e.g. Michelin Heavy Truck Tyre 295/80"
              value={newPart.name}
              onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
            />

            <Select
              label="Part Category"
              value={newPart.category}
              onChange={(e) => setNewPart({ ...newPart, category: e.target.value as any })}
              options={[
                { value: 'tyres', label: 'Tyres & Wheels' },
                { value: 'filters', label: 'Filters (Fuel, Oil, Air)' },
                { value: 'brakes', label: 'Brakes & Friction Parts' },
                { value: 'lubricants', label: 'Lubricants & Coolants' },
                { value: 'cooling', label: 'Reefer & Cooling Units' },
                { value: 'electrical', label: 'Electrical & Batteries' },
              ]}
            />

            <Input
              label="Storage Bin / Shelf"
              placeholder="e.g. RACK-A3-BIN-12"
              value={newPart.locationBin}
              onChange={(e) => setNewPart({ ...newPart, locationBin: e.target.value })}
            />

            <Input
              label="Initial Stock Quantity"
              type="number"
              value={newPart.availableQuantity}
              onChange={(e) => setNewPart({ ...newPart, availableQuantity: Number(e.target.value) })}
            />

            <Input
              label="Reorder Alert Threshold"
              type="number"
              value={newPart.reorderLevel}
              onChange={(e) => setNewPart({ ...newPart, reorderLevel: Number(e.target.value) })}
            />

            <Input
              label="Unit Cost ($)"
              type="number"
              value={newPart.unitCost}
              onChange={(e) => setNewPart({ ...newPart, unitCost: Number(e.target.value) })}
            />

            <Input
              label="Supplier Commercial Partner"
              placeholder="e.g. Michelin Fleet Direct"
              value={newPart.supplierName}
              onChange={(e) => setNewPart({ ...newPart, supplierName: e.target.value })}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddPartModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={createPartMutation.isPending}>
              Create Part SKU
            </Button>
          </div>
        </form>
      </Modal>

      {/* Seal Container Modal */}
      <Modal
        isOpen={isSealModalOpen}
        onClose={() => setIsSealModalOpen(false)}
        title={`Apply Master Seal: ${selectedGroup?.groupCode}`}
      >
        <div className="space-y-4">
          <Input
            label="Master Container Seal Number"
            required
            value={sealNumberInput}
            onChange={(e) => setSealNumberInput(e.target.value)}
            placeholder="e.g. SEAL-MIDWEST-9941"
          />

          <Input
            label="Assigned Linehaul Vehicle Registration"
            required
            value={sealVehicleInput}
            onChange={(e) => setSealVehicleInput(e.target.value)}
            placeholder="e.g. IL-6102-FR"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsSealModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSealGroup} icon={<Lock className="h-4 w-4" />}>
              Verify & Lock Master Seal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
