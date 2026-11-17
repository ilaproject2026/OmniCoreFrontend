import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '../../api/platform.api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { PACKAGES } from '../../config/constants';
import {
  Check,
  X,
  Package as PackageIcon,
  Sparkles,
  Shield,
  Truck,
  Users,
  HardDrive,
  Headphones,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { PackageTier } from '../../types';

export const PackageManagement: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<PackageTier | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platformStats'],
    queryFn: () => platformApi.getStats(),
  });

  const comparisonFeatures = [
    { name: 'Multiple Tenants Creation', basic: false, standard: false, corporate: false, enterprise: true },
    { name: 'Vehicle Capacity Limit', basic: 'Up to 25 Units', standard: 'Up to 100 Units', corporate: 'Up to 500 Units', enterprise: 'Unlimited Units' },
    { name: 'Operator & Driver User Seats', basic: '5 Seats', standard: '25 Seats', corporate: '50 Seats', enterprise: 'Unlimited' },
    { name: 'Fleet & Driver Registry', basic: true, standard: true, corporate: true, enterprise: true },
    { name: 'Trip Dispatch & Live Tracking', basic: true, standard: true, corporate: true, enterprise: true },
    { name: 'Workshop & Maintenance', basic: true, standard: true, corporate: true, enterprise: true },
    { name: 'Finance & Invoicing Engine', basic: true, standard: true, corporate: true, enterprise: true },
    { name: 'Warehouse & Inventory Hub', basic: true, standard: true, corporate: true, enterprise: true },
    { name: 'Role Permissions & Access Matrix', basic: false, standard: true, corporate: true, enterprise: true },
    { name: 'Platform Audit Log & Security', basic: false, standard: true, corporate: true, enterprise: true },
    { name: 'Contracts & Tenders (SLA Tracking)', basic: false, standard: true, corporate: true, enterprise: true },
    { name: 'HR Department & Personnel', basic: false, standard: true, corporate: true, enterprise: true },
    { name: 'Marketing Campaigns & Promos', basic: false, standard: true, corporate: true, enterprise: true },
    { name: 'Reports & Business Analytics', basic: false, standard: true, corporate: true, enterprise: true },
    { name: 'CRM & Sales Pipeline Hub', basic: false, standard: false, corporate: true, enterprise: true },
    { name: 'Insurance & Claims', basic: false, standard: false, corporate: true, enterprise: true },
    { name: 'Courier & Express Delivery (AWB)', basic: false, standard: false, corporate: false, enterprise: true },
    { name: 'Corporate Shuttle / Pooling', basic: false, standard: false, corporate: false, enterprise: true },
    { name: 'Public Booking Portal & Tracking', basic: false, standard: false, corporate: false, enterprise: true },
    { name: 'Dedicated Lead & 24/7 SLA', basic: false, standard: false, corporate: false, enterprise: true },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Packages & Subscription Tiers</h1>
            <Badge variant="info">Core Commercial Plans</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-tenant SaaS tiers, fleet size allowances, user quotas, annual billing discounts, and base package inclusions.
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annually')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === 'annually'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual (Prepaid)</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded">Save 15%</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tier Subscriptions"
          value={stats?.totalTenants ?? 0}
          subtitle={`${stats?.newSubscriptionsThisMonth ?? 0} signed this month`}
          icon={<PackageIcon className="h-5 w-5" />}
          accentColor="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(stats?.mrrTotal ?? 0)}
          subtitle="Tier baseline subscription value"
          icon={<TrendingUp className="h-5 w-5" />}
          accentColor="emerald"
          isLoading={isLoading}
        />
        <StatCard
          title="Average Contract Value"
          value={formatCurrency(stats?.totalTenants ? Math.round((stats.mrrTotal * 12) / stats.totalTenants) : 0)}
          subtitle="ARR run-rate per customer"
          icon={<Shield className="h-5 w-5" />}
          accentColor="purple"
          isLoading={isLoading}
        />
        <StatCard
          title="Tier Retention Rate"
          value="98.4%"
          subtitle="Low downgrade / churn rate"
          icon={<Sparkles className="h-5 w-5" />}
          accentColor="cyan"
        />
      </div>

      {/* Package Tier Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-blue-400" />
            Core Subscription Tiers
          </h2>
          <span className="text-xs text-slate-400">3 commercial plans available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Object.values(PACKAGES).map((pkg) => {
            const isEnterprise = pkg.id === 'enterprise';
            const price = billingCycle === 'annually' ? Math.round(pkg.annualPrice / 12) : pkg.monthlyPrice;

            return (
              <Card
                key={pkg.id}
                className={`flex flex-col justify-between relative overflow-hidden transition-all ${
                  isEnterprise ? 'border-purple-500/50 bg-purple-950/10 ring-1 ring-purple-500/20' : ''
                }`}
              >
                {isEnterprise && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl shadow uppercase tracking-wider">
                    Flagship
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{pkg.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{pkg.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{pkg.tagline}</p>

                  <div className="my-4 pb-4 border-b border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{formatCurrency(price)}</span>
                      <span className="text-xs text-slate-400"> /month</span>
                    </div>
                    {billingCycle === 'annually' ? (
                      <span className="block text-[11px] text-emerald-400 mt-1 font-medium">
                        Billed annually: {formatCurrency(pkg.annualPrice)}/yr
                      </span>
                    ) : (
                      <span className="block text-[11px] text-slate-500 mt-1">
                        Billed monthly, cancel anytime
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-slate-500" />
                        Fleet Capacity:
                      </span>
                      <span className="font-bold text-white">{pkg.maxVehicles === 9999 ? 'Unlimited' : `${pkg.maxVehicles} Units`}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        User Seats:
                      </span>
                      <span className="font-bold text-white">{pkg.maxUsers === 9999 ? 'Unlimited' : `${pkg.maxUsers} Users`}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Included Base Modules:
                      </span>
                      {pkg.coreFeatures.map((feat) => (
                        <div key={feat} className="flex items-start gap-1.5 text-slate-300">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Badge variant="outline" size="sm">Available</Badge>
                  <Button
                    size="sm"
                    variant={isEnterprise ? 'primary' : 'outline'}
                    onClick={() => setSelectedPlanForEdit(pkg.id as PackageTier)}
                    leftIcon={<Sliders className="h-3.5 w-3.5" />}
                  >
                    Configure Plan
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature & Entitlement Comparison Matrix */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sliders className="h-5 w-5 text-purple-400" />
            Tier Entitlement & Capacity Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed breakdown of fleet quotas, system capabilities, and service commitments across all subscription tiers.
          </p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold text-slate-300">Platform Capability / Quota</th>
                  <th className="py-3.5 px-4 font-semibold text-blue-400 uppercase">Basic Starter</th>
                  <th className="py-3.5 px-4 font-semibold text-cyan-400 uppercase">Standard Fleet</th>
                  <th className="py-3.5 px-4 font-semibold text-emerald-400 uppercase">Corporate</th>
                  <th className="py-3.5 px-4 font-semibold text-purple-400 uppercase">OmniCore Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonFeatures.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200">{row.name}</td>
                    {(['basic', 'standard', 'corporate', 'enterprise'] as const).map((tierKey) => {
                      const val = row[tierKey];
                      return (
                        <td key={tierKey} className="py-3 px-4">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <div className="flex items-center gap-1.5 text-emerald-400">
                                <Check className="h-4 w-4" />
                                <span className="text-[11px]">Included</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <X className="h-4 w-4" />
                                <span className="text-[11px]">—</span>
                              </div>
                            )
                          ) : (
                            <span className="font-semibold text-slate-300 font-mono text-[11px]">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Tier Modal Mock Preview */}
      {selectedPlanForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <Card className="max-w-md w-full p-6 space-y-4 border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white capitalize">
                Configure {selectedPlanForEdit} Plan
              </h3>
              <button
                onClick={() => setSelectedPlanForEdit(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Monthly Subscription Rate ($)</label>
                <input
                  type="number"
                  defaultValue={PACKAGES[selectedPlanForEdit]?.monthlyPrice}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Annual Prepaid Rate ($)</label>
                <input
                  type="number"
                  defaultValue={PACKAGES[selectedPlanForEdit]?.annualPrice}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Max Vehicle Quota</label>
                <input
                  type="number"
                  defaultValue={PACKAGES[selectedPlanForEdit]?.maxVehicles}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Max User Seats</label>
                <input
                  type="number"
                  defaultValue={PACKAGES[selectedPlanForEdit]?.maxUsers}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedPlanForEdit(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={() => setSelectedPlanForEdit(null)}>
                Save Tier Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
