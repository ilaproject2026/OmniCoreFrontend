import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Users,
  Target,
  Sparkles,
  Plus,
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  X,
  Briefcase,
  CheckCircle2,
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

interface SalesDeal {
  id: string;
  dealCode: string;
  prospectName: string;
  primaryContact: string;
  targetTier: 'corporate' | 'enterprise';
  estimatedAcv: number;
  stage: 'lead' | 'demo' | 'poc_trial' | 'negotiation' | 'closed_won';
  probability: number;
  accountExecutive: string;
  expectedCloseDate: string;
}

export const SalesAndGrowth: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deals, setDeals] = useState<SalesDeal[]>([
    {
      id: 'deal_1',
      dealCode: 'OPP-2026-901',
      prospectName: 'TransNational Reefer Logistics Corp',
      primaryContact: 'David Sterling (VP of Ops)',
      targetTier: 'enterprise',
      estimatedAcv: 38400,
      stage: 'negotiation',
      probability: 85,
      accountExecutive: 'Sarah Jenkins',
      expectedCloseDate: '2026-10-15',
    },
    {
      id: 'deal_2',
      dealCode: 'OPP-2026-902',
      prospectName: 'Midwest Intermodal Express LLC',
      primaryContact: 'Marcus Reynolds (Fleet Director)',
      targetTier: 'corporate',
      estimatedAcv: 18200,
      stage: 'poc_trial',
      probability: 70,
      accountExecutive: 'Alex Rivera',
      expectedCloseDate: '2026-10-28',
    },
    {
      id: 'deal_3',
      dealCode: 'OPP-2026-903',
      prospectName: 'Alliance Haulage & Energy Carriers',
      primaryContact: 'Elena Rostova (COO)',
      targetTier: 'enterprise',
      estimatedAcv: 42000,
      stage: 'demo',
      probability: 50,
      accountExecutive: 'Sarah Jenkins',
      expectedCloseDate: '2026-11-10',
    },
    {
      id: 'deal_4',
      dealCode: 'OPP-2026-904',
      prospectName: 'Apex Urban Courier Networks',
      primaryContact: 'Tariq Al-Mansoor (GM)',
      targetTier: 'corporate',
      estimatedAcv: 15600,
      stage: 'closed_won',
      probability: 100,
      accountExecutive: 'Devon Vance',
      expectedCloseDate: '2026-09-18',
    },
  ]);

  // Form state
  const [prospectName, setProspectName] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [targetTier, setTargetTier] = useState<'corporate' | 'enterprise'>('enterprise');
  const [estimatedAcv, setEstimatedAcv] = useState(25000);
  const [accountExecutive, setAccountExecutive] = useState('Sarah Jenkins');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => platformApi.getStats(),
  });

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName) return;

    const newDeal: SalesDeal = {
      id: `deal_${Date.now()}`,
      dealCode: `OPP-2026-${Math.floor(100 + Math.random() * 900)}`,
      prospectName,
      primaryContact: primaryContact || 'Enterprise Buyer',
      targetTier,
      estimatedAcv: Number(estimatedAcv),
      stage: 'lead',
      probability: 40,
      accountExecutive,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };

    setDeals([newDeal, ...deals]);
    setIsModalOpen(false);
    setProspectName('');
    setPrimaryContact('');
  };

  const revenueGrowthData = [
    { month: 'Apr', arr: 1720000, newMrr: 12000, expansions: 6400 },
    { month: 'May', arr: 1840000, newMrr: 14500, expansions: 8100 },
    { month: 'Jun', arr: 1980000, newMrr: 16800, expansions: 9200 },
    { month: 'Jul', arr: 2060000, newMrr: 18200, expansions: 10500 },
    { month: 'Aug', arr: 2140000, newMrr: 19400, expansions: 11800 },
    { month: 'Sep', arr: 2214000, newMrr: 21600, expansions: 13400 },
  ];

  const getStageBadge = (stage: SalesDeal['stage']) => {
    switch (stage) {
      case 'closed_won':
        return <Badge variant="success">Closed Won</Badge>;
      case 'negotiation':
        return <Badge variant="purple">Negotiation</Badge>;
      case 'poc_trial':
        return <Badge variant="info">POC / Trial</Badge>;
      case 'demo':
        return <Badge variant="warning">Product Demo</Badge>;
      case 'lead':
        return <Badge variant="outline">Qualified Lead</Badge>;
    }
  };

  const columns: ColumnDef<SalesDeal>[] = [
    {
      key: 'dealCode',
      header: 'Deal Code',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-mono text-xs font-bold text-blue-400 block">{val}</span>
          <span className="text-[10px] text-slate-500">{row.expectedCloseDate}</span>
        </div>
      ),
    },
    {
      key: 'prospect',
      header: 'Prospective Enterprise Customer',
      sortable: true,
      render: (_, row) => (
        <div>
          <span className="font-semibold text-white text-xs block">{row.prospectName}</span>
          <span className="text-[11px] text-slate-400">{row.primaryContact}</span>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Target Plan',
      accessor: (row) => row.targetTier,
      render: (val) => (
        <span className="capitalize font-bold text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
          {val}
        </span>
      ),
    },
    {
      key: 'acv',
      header: 'Estimated ACV',
      sortable: true,
      accessor: (row) => row.estimatedAcv,
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400 text-xs">
          {formatCurrency(val)} /yr
        </span>
      ),
    },
    {
      key: 'probability',
      header: 'Probability',
      accessor: (row) => row.probability,
      render: (val) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-slate-200">{val}%</span>
          <div className="h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Sales Stage',
      sortable: true,
      render: (val) => getStageBadge(val as SalesDeal['stage']),
    },
    {
      key: 'owner',
      header: 'Account Executive',
      accessor: (row) => row.accountExecutive,
      render: (val) => <span className="text-xs text-slate-300">{val}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Sales Pipeline & Growth Velocity</h1>
            <Badge variant="glow">Commercial Revenue</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executive revenue operations tracking ARR momentum, enterprise deal pipeline, vertical market share, and sales conversion velocity.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Log Enterprise Deal
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Annual Recurring Revenue"
          value={formatCurrency(stats?.arrTotal || 2214000)}
          subtitle="+16.4% YoY Expansion"
          icon={<TrendingUp className="h-5 w-5" />}
          accentColor="emerald"
          isLoading={isLoading}
          trend={{ value: 16.4, direction: 'up' }}
        />
        <StatCard
          title="New Logos Added (MoM)"
          value={`${stats?.newSubscriptionsThisMonth || 14} Enterprise`}
          subtitle="Target: 12 Logos/month"
          icon={<Building2 className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isLoading}
          trend={{ value: 16.6, direction: 'up' }}
        />
        <StatCard
          title="Net Revenue Retention (NRR)"
          value="118.5%"
          subtitle="Reflects plan tier upgrades"
          icon={<Target className="h-5 w-5" />}
          accentColor="purple"
        />
        <StatCard
          title="Avg Contract Value (ACV)"
          value={formatCurrency(18450)}
          subtitle="Corporate & Enterprise mix"
          icon={<DollarSign className="h-5 w-5" />}
          accentColor="cyan"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ARR & Net MRR Trajectory */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">ARR Momentum & Expansion Velocity</h3>
              <p className="text-xs text-slate-400">Total annualized run-rate & monthly new business</p>
            </div>
            <Badge variant="outline">Past 6 Months</Badge>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="arrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Value']}
                />
                <Area type="monotone" dataKey="arr" stroke="#10b981" fillOpacity={1} fill="url(#arrGrad)" name="ARR ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vertical Distribution */}
        <Card>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Vertical Revenue Share</h3>
              <p className="text-xs text-slate-400">Tenant concentration by industry</p>
            </div>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>

          <div className="h-64 mt-4 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-full h-48 bg-slate-800/40 rounded-lg animate-pulse" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(stats?.verticalDistribution || []).slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" name="Tenants" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Enterprise Commercial Pipeline Deals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-400" />
              Enterprise Commercial Deals Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              High-value tenant opportunities currently in pre-sales evaluation and contractual negotiations.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={deals}
          searchPlaceholder="Filter deals by prospect, deal code, or AE..."
          emptyTitle="No deals in pipeline"
          emptyDescription="No active sales deals recorded in the pipeline."
        />
      </div>

      {/* Log Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <Card className="max-w-md w-full p-6 space-y-4 border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Log Enterprise Sales Deal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Prospective Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Great Lakes Cold Chain Corp"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Primary Decision Maker</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Hansen (COO)"
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Target Package Tier</label>
                  <select
                    value={targetTier}
                    onChange={(e) => setTargetTier(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="enterprise">OmniCore Enterprise</option>
                    <option value="corporate">Corporate Fleet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Estimated ACV ($)</label>
                  <input
                    type="number"
                    value={estimatedAcv}
                    onChange={(e) => setEstimatedAcv(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Account Executive</label>
                <input
                  type="text"
                  value={accountExecutive}
                  onChange={(e) => setAccountExecutive(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button size="sm" variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit">
                  Save Opportunity
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
