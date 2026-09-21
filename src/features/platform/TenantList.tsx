import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Tenant, TenantStatus } from '../../types';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Truck,
  Users,
  Eye,
  Power,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { TenantProvisioningWizard } from './TenantProvisioningWizard';
import { ChangePlanModal } from './ChangePlanModal';

export const TenantList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const showCreateWizard = searchParams.get('action') === 'create';
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantForPlanChange, setTenantForPlanChange] = useState<Tenant | null>(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platformTenants', statusFilter],
    queryFn: () => platformApi.getTenants({ status: statusFilter }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TenantStatus }) =>
      platformApi.updateTenantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      if (selectedTenant) setSelectedTenant(null);
    },
  });

  if (showCreateWizard) {
    return <TenantProvisioningWizard />;
  }

  const getStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" dot>Active</Badge>;
      case 'trial':
        return <Badge variant="info" dot>Trial Period</Badge>;
      case 'provisioning':
        return <Badge variant="purple" dot>Provisioning</Badge>;
      case 'suspended':
        return <Badge variant="danger" dot>Suspended</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant Name & Domain',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs shrink-0">
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-white block">{row.name}</span>
            <span className="text-[11px] font-mono text-slate-400">
              {row.slug}.omnicore.io
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      sortable: true,
      render: (val) => getStatusBadge(val as TenantStatus),
    },
    {
      key: 'package',
      header: 'Tier & MRR',
      render: (_, row) => (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTenantForPlanChange(row);
            }}
            className="font-semibold text-blue-400 hover:text-cyan-300 uppercase text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            title="Click to modify subscription tier"
          >
            <span>{row.subscription.package}</span>
            <Sparkles className="h-3 w-3 text-amber-300" />
          </button>
          <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
            {formatCurrency(row.subscription.mrr)}/mo
          </span>
        </div>
      ),
    },
    {
      key: 'verticals',
      header: 'Verticals Enabled',
      render: (val: string[]) => (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {val.slice(0, 2).map((v) => (
            <span key={v} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] capitalize">
              {v.replace('_', ' ')}
            </span>
          ))}
          {val.length > 2 && (
            <span className="bg-slate-800 text-slate-400 px-1 py-0.5 rounded text-[9px]">
              +{val.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fleetScale',
      header: 'Fleet Scale',
      render: (_, row) => (
        <div className="text-slate-300">
          <span className="font-bold text-white">{row.vehicleCount}</span> vehicles
          <span className="block text-[10px] text-slate-500">{row.userCount} users</span>
        </div>
      ),
    },
    {
      key: 'primaryContact',
      header: 'Primary Contact',
      render: (_, row) => (
        <div>
          <span className="text-slate-200 block truncate max-w-[130px]">{row.primaryContactName}</span>
          <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">{row.primaryContactEmail}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link to={`/platform/tenants/${row.id}/features`} title="Custom Feature Overrides">
            <Button variant="outline" size="icon">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTenantForPlanChange(row)}
            title="Modify Subscription Plan"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedTenant(row)}
            title="Inspect Tenant Details"
          >
            <Eye className="h-3.5 w-3.5 text-blue-400" />
          </Button>

          {row.status === 'active' ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => statusMutation.mutate({ id: row.id, status: 'suspended' })}
              title="Suspend Tenant Access"
            >
              <Power className="h-3.5 w-3.5 text-amber-400" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => statusMutation.mutate({ id: row.id, status: 'active' })}
              title="Reactivate Tenant"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tenant Fleet Operators</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage provisioned multi-tenant subscriptions, vertically tailored instances, and operational lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/platform/tenants?action=create">
            <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Provision Tenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Tenants Table */}
      <DataTable
        columns={columns}
        data={tenants}
        isLoading={isLoading}
        searchPlaceholder="Search by tenant name, domain, contact..."
        onRowClick={(row) => setSelectedTenant(row)}
        filterSlot={
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 h-9 text-xs"
            options={[
              { value: 'all', label: 'All Lifecycles' },
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'Trial' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        }
      />

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <Modal
          isOpen={Boolean(selectedTenant)}
          onClose={() => setSelectedTenant(null)}
          title={selectedTenant.name}
          description={`Tenant ID: ${selectedTenant.id} • Registered ${formatDate(selectedTenant.createdAt)}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTenant.status)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setTenantForPlanChange(selectedTenant)}
                  leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-300" />}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold"
                >
                  Change Subscription Plan
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedTenant(null)}>
                  Close
                </Button>
                {selectedTenant.status === 'active' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => statusMutation.mutate({ id: selectedTenant.id, status: 'suspended' })}
                  >
                    Suspend Tenant
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => statusMutation.mutate({ id: selectedTenant.id, status: 'active' })}
                  >
                    Reactivate Tenant
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Package Tier</span>
                <span className="text-white font-bold uppercase">{selectedTenant.subscription.package}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Monthly MRR</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(selectedTenant.subscription.mrr)}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Fleet Vehicles</span>
                <span className="text-white font-bold">{selectedTenant.vehicleCount} Units</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Storage Used</span>
                <span className="text-white font-bold">{selectedTenant.storageUsedGb} GB</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="font-semibold text-white mb-2">Enabled Verticals</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedTenant.verticals.map((v) => (
                  <span key={v} className="bg-blue-950/40 text-blue-300 border border-blue-800/40 px-2.5 py-1 rounded text-xs capitalize">
                    {v.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="font-semibold text-white mb-2">Specialized Add-ons</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedTenant.subscription.enabledAddons.map((addon) => (
                  <span key={addon} className="bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 px-2.5 py-1 rounded text-xs">
                    {addon.replace('addon_', '').replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Primary Contact</span>
                <span className="text-slate-200 font-medium">{selectedTenant.primaryContactName}</span>
                <span className="text-slate-400 block text-[11px]">{selectedTenant.primaryContactEmail}</span>
                <span className="text-slate-400 block text-[11px]">{selectedTenant.primaryContactPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hub Location</span>
                <span className="text-slate-200 font-medium">{selectedTenant.address}</span>
                <span className="text-slate-400 block text-[11px]">{selectedTenant.city}, {selectedTenant.country}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Super User Change Subscription Plan Modal */}
      <ChangePlanModal
        isOpen={Boolean(tenantForPlanChange)}
        tenant={tenantForPlanChange}
        onClose={() => setTenantForPlanChange(null)}
      />
    </div>
  );
};
