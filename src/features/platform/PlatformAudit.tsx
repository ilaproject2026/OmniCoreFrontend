import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { AuditLog } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Lock,
  Server,
  Activity,
  User,
  Filter,
} from 'lucide-react';

export const PlatformAudit: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['platformAuditLogs', selectedCategory],
    queryFn: () => platformApi.getAuditLogs({ category: selectedCategory !== 'all' ? selectedCategory : undefined }),
  });

  const categories = ['all', 'security', 'provisioning', 'auth', 'financial', 'fleet', 'contract'];

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedCategory === 'all') return true;
    return log.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleExport = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnicore-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const securityActionsCount = auditLogs.filter(
    (l) => l.category === 'security' || l.action.toLowerCase().includes('override') || l.action.toLowerCase().includes('delete')
  ).length;

  const uniqueActors = new Set(auditLogs.map((l) => l.actorEmail)).size;

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (val) => <span className="font-mono text-slate-400 text-[11px]">{val}</span>,
    },
    {
      key: 'action',
      header: 'Security Action',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
          {val}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => {
        const cat = String(val).toLowerCase();
        let badgeVariant: 'danger' | 'warning' | 'info' | 'purple' | 'outline' = 'outline';
        if (cat === 'security') badgeVariant = 'danger';
        else if (cat === 'auth') badgeVariant = 'warning';
        else if (cat === 'financial') badgeVariant = 'info';
        else if (cat === 'provisioning') badgeVariant = 'purple';
        return (
          <Badge variant={badgeVariant} size="sm" className="capitalize text-[10px]">
            {val}
          </Badge>
        );
      },
    },
    {
      key: 'details',
      header: 'Audit Event Summary',
      render: (val) => <span className="text-slate-200 text-xs">{val}</span>,
    },
    {
      key: 'actor',
      header: 'Operator & Role',
      render: (_, row) => (
        <div>
          <span className="text-slate-200 font-medium text-xs block truncate max-w-[160px]">{row.actorEmail}</span>
          <span className="text-[10px] font-mono text-slate-500">{row.actorRole}</span>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Target Tenant Scope',
      render: (_, row) => (
        <span className="text-slate-300 truncate max-w-[150px] block text-xs">
          {row.tenantName || <span className="text-slate-500 italic">Platform Root</span>}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'Origin IP Address',
      accessor: (r) => r.ipAddress,
      render: (val) => (
        <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          {val}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Audit & SOC-2 Compliance</h1>
            <Badge variant="glow">Append-Only Immutable Ledger</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident audit trail tracking administrative actions, tenant provisioning mutations, role grants, and security events.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export Compliance Ledger (.JSON)
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Recorded Audit Events"
          value={`${auditLogs.length} Events`}
          subtitle="Signed tamper-proof logs"
          icon={<Activity className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Security Actions"
          value={`${securityActionsCount} Events`}
          subtitle="Overrides & access updates"
          icon={<ShieldAlert className="h-5 w-5" />}
          accentColor="rose"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Administrators"
          value={`${uniqueActors} Actors`}
          subtitle="Identified operator identities"
          icon={<User className="h-5 w-5" />}
          accentColor="purple"
          isLoading={isLoading}
        />
        <StatCard
          title="Ledger Compliance"
          value="SOC-2 Type II"
          subtitle="Retention: 365 Days Guaranteed"
          icon={<Lock className="h-5 w-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        searchPlaceholder="Filter audit records by action, actor, IP, or summary..."
        emptyTitle="No audit records"
        emptyDescription="No audit records match the selected category."
      />
    </div>
  );
};
