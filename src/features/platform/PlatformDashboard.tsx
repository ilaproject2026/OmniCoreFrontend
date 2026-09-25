import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Link } from 'react-router-dom';
import {
  Building2,
  DollarSign,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../../lib/utils';
import { useTenant } from '../../contexts/TenantContext';
import { PackageUpgradeModal } from './PackageUpgradeModal';

export const PlatformDashboard: React.FC = () => {
  const { canCreateMultipleTenants } = useTenant();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => platformApi.getStats(),
  });

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['platformAuditLogs'],
    queryFn: () => platformApi.getAuditLogs(),
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Platform Operations</h1>
            <Badge variant="purple">OmniCore Cloud Core</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global monitoring, tenant lifecycle orchestration, subscription revenue, and ecosystem security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateMultipleTenants ? (
            <Link to="/platform/tenants?action=create">
              <Button size="sm" variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>
                Provision New Tenant
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="border-purple-500/40 text-purple-300 hover:bg-purple-950/30"
              leftIcon={<Lock className="h-4 w-4 text-purple-400" />}
            >
              Provision New Tenant (Enterprise)
            </Button>
          )}
        </div>
      </div>

      <PackageUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Tenants"
          value={stats?.totalTenants ?? 0}
          subtitle={`${stats?.activeTenants ?? 0} currently active`}
          icon={<Building2 className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isStatsLoading}
          trend={{ value: 12, direction: 'up', label: 'vs last month' }}
        />

        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(stats?.mrrTotal ?? 0)}
          subtitle={`ARR: ${formatCurrency(stats?.arrTotal ?? 0)}`}
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="emerald"
          isLoading={isStatsLoading}
          trend={{ value: 16.4, direction: 'up', label: 'new expansions' }}
        />

        <StatCard
          title="Subscriptions & Renewals"
          value={stats?.newSubscriptionsThisMonth ?? 0}
          subtitle={`${stats?.renewalsThisMonth ?? 0} renewed this month`}
          icon={<Package className="h-5 w-5" />}
          accentColor="purple"
          isLoading={isStatsLoading}
          trend={{ value: 8, direction: 'up' }}
        />

        <StatCard
          title="Outstanding Balances"
          value={formatCurrency(stats?.outstandingPayments ?? 0)}
          subtitle={`${stats?.activeAlertsCount ?? 0} invoices past 30 days`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="amber"
          isLoading={isStatsLoading}
          trend={{ value: 4.1, direction: 'down' }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Distribution */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Active Tenants by Vertical</h3>
              <p className="text-xs text-slate-400">Distribution across transport specializations</p>
            </div>
            <Badge variant="outline">Multi-Vertical</Badge>
          </div>

          <div className="h-64 mt-4 w-full">
            {isStatsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-full h-48 bg-slate-800/40 rounded-lg animate-pulse" />
              </div>
            ) : !stats?.verticalDistribution || stats.verticalDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No vertical distribution data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.verticalDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Package Distribution */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Subscription Package Tier Share</h3>
              <p className="text-xs text-slate-400">Basic, Standard, Corporate, Enterprise</p>
            </div>
          </div>

          <div className="h-52 mt-2 w-full">
            {isStatsLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="h-36 w-36 rounded-full bg-slate-800/40 animate-pulse" />
              </div>
            ) : !stats?.packageDistribution || stats.packageDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No subscription tier data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.packageDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {stats.packageDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80">
            {(stats?.packageDistribution || []).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-400 truncate">{item.name}:</span>
                <span className="font-semibold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add-on Adoption & Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add-on adoption */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Feature & Add-on Penetration</h3>
              <p className="text-xs text-slate-400">Tenant adoption across specialized modules</p>
            </div>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>

          <div className="space-y-4 mt-4">
            {isStatsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse" />
                    <div className="h-2 w-full bg-slate-800/30 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : !stats?.addonAdoption || stats.addonAdoption.length === 0 ? (
              <p className="text-xs text-slate-500">No add-on adoption metrics recorded yet.</p>
            ) : (
              stats.addonAdoption.map((addon) => (
                <div key={addon.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{addon.name}</span>
                    <span className="text-slate-400 font-mono">{addon.percentage}% ({addon.count} tenants)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${addon.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Live Platform Audit Feed */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Live Platform Security & Audit Trail</h3>
              <p className="text-xs text-slate-400">Real-time actor events, provisioning and role dispatches</p>
            </div>
            <Link to="/platform/audit" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {isAuditLoading ? (
              <div className="py-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-4 w-48 bg-slate-800/50 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-slate-800/30 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No security audit entries recorded yet.</p>
            ) : (
              auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="font-medium text-slate-200">{log.details}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Actor: {log.actorEmail} ({log.actorRole})</span>
                      <span>•</span>
                      <span>Tenant: {log.tenantName}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">{log.timestamp}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">{log.ipAddress}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
