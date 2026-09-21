import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Tenant } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Receipt, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, DollarSign, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SubscriptionsList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: tenants = [], isLoading: isTenantsLoading } = useQuery({
    queryKey: ['platformTenants'],
    queryFn: () => platformApi.getTenants(),
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => platformApi.getStats(),
  });

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.subscription?.status === statusFilter;
  });

  const totalMrr = tenants.reduce((acc, t) => acc + (t.subscription?.mrr || 0), 0);
  const activeCount = tenants.filter((t) => t.subscription?.status === 'active').length;
  const trialCount = tenants.filter((t) => t.subscription?.status === 'trial').length;
  const pastDueCount = tenants.filter((t) => t.subscription?.status === 'past_due').length;

  const columns: ColumnDef<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant Customer',
      sortable: true,
      render: (_, row) => (
        <div>
          <span className="font-semibold text-white block text-xs">{row.name}</span>
          <span className="text-[11px] text-slate-400">{row.primaryContactEmail}</span>
        </div>
      ),
    },
    {
      key: 'package',
      header: 'Subscribed Tier',
      accessor: (row) => row?.subscription?.package,
      render: (val) => {
        const isEnterprise = val === 'enterprise';
        return (
          <span className={`font-bold text-xs uppercase px-2 py-0.5 rounded ${
            isEnterprise
              ? 'text-purple-300 bg-purple-500/10 border border-purple-500/20'
              : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
          }`}>
            {val}
          </span>
        );
      },
    },
    {
      key: 'cycle',
      header: 'Billing Cycle',
      accessor: (row) => row?.subscription?.billingCycle,
      render: (val) => (
        <span className="capitalize text-slate-300 text-xs">
          {val}
        </span>
      ),
    },
    {
      key: 'mrr',
      header: 'Monthly MRR',
      sortable: true,
      accessor: (row) => row?.subscription?.mrr,
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(val || 0)}
        </span>
      ),
    },
    {
      key: 'renewal',
      header: 'Renewal Date',
      sortable: true,
      accessor: (row) => row?.subscription?.renewalDate,
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{formatDate(val)}</span>
        </div>
      ),
    },
    {
      key: 'addons',
      header: 'Active Add-ons',
      accessor: (row) => row?.subscription?.enabledAddons?.length || 0,
      render: (val) => (
        <Badge variant="outline" size="sm">{val} Add-ons</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Billing Status',
      accessor: (row) => row?.subscription?.status,
      render: (val) => {
        if (val === 'active') return <Badge variant="success" dot>Active</Badge>;
        if (val === 'trial') return <Badge variant="info">Trial</Badge>;
        if (val === 'past_due') return <Badge variant="danger" dot>Past Due</Badge>;
        return <Badge variant="outline">{val}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Manage',
      render: (_, row) => (
        <Link to={`/platform/tenants`}>
          <Button size="sm" variant="outline" className="text-[11px] py-1">
            Configure
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions & Billing Operations</h1>
            <Badge variant="glow">Live Accounts</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active recurring revenue contracts, subscription lifecycles, renewal schedules, and license entitlements.
          </p>
        </div>

        <Link to="/platform/tenants?action=create">
          <Button size="sm" variant="primary" leftIcon={<RefreshCw className="h-4 w-4" />}>
            Provision Subscription
          </Button>
        </Link>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={`${activeCount} Tenants`}
          subtitle={`${trialCount} in trial evaluation`}
          icon={<Receipt className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isTenantsLoading}
        />
        <StatCard
          title="Monthly Recurring Billing"
          value={formatCurrency(stats?.mrrTotal || totalMrr)}
          subtitle={`Annualized: ${formatCurrency((stats?.mrrTotal || totalMrr) * 12)}`}
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="emerald"
          isLoading={isStatsLoading || isTenantsLoading}
        />
        <StatCard
          title="Upcoming Renewals"
          value={`${stats?.renewalsThisMonth || 0} Accounts`}
          subtitle="Scheduled this billing cycle"
          icon={<RefreshCw className="h-5 w-5" />}
          accentColor="purple"
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Past Due Receivables"
          value={formatCurrency(stats?.outstandingPayments || 0)}
          subtitle={`${pastDueCount} accounts past payment term`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="amber"
          isLoading={isStatsLoading}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 self-start w-fit">
        {['all', 'active', 'trial', 'past_due'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
      <DataTable
        columns={columns}
        data={filteredTenants}
        isLoading={isTenantsLoading}
        searchPlaceholder="Search subscriber by tenant name, package, or contact email..."
        emptyTitle="No subscriptions found"
        emptyDescription="No customer accounts match the selected subscription billing status."
      />
    </div>
  );
};
