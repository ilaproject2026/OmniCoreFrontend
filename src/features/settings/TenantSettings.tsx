import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { ADDONS, VERTICALS, PACKAGES } from '../../config/constants';
import { PackageTier, AddonKey } from '../../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Package,
  Layers,
  ShieldCheck,
  Check,
  Sparkles,
  KeyRound,
  Users,
  Crown,
  Briefcase,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { PackageUpgradeModal } from '../platform/PackageUpgradeModal';

export const TenantSettings: React.FC = () => {
  const { user } = useAuth();
  const { tenant, packageTier, enabledAddons, setPackageTier, toggleAddon, customRolePermissions } = useTenant();
  const [activeTab, setActiveTab] = useState('organization');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isSuperAdmin = Boolean(user?.isPlatformUser || user?.platformRole === 'super_admin');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Tenant Workspace Configuration</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Organization identity, active vertical configurations, subscription tier, and dynamic add-on entitlements.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'organization', label: 'Company Profile' },
          { id: 'subscription', label: 'Subscription & Add-ons' },
          { id: 'verticals', label: 'Vertical Domains', count: tenant.verticals.length },
          { id: 'security', label: 'Security & RBAC' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* Tab 1: Organization */}
      {activeTab === 'organization' && (
        <Card className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-white">Commercial Profile</h3>
              <p className="text-slate-400 text-[11px]">Primary headquarters and tenant metadata</p>
            </div>
            <Badge variant="glow">Tenant ID: {tenant.id}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" value={tenant.name} readOnly />
            <Input label="Subdomain / Slug" value={`${tenant.slug}.omnicore.io`} readOnly />
            <Input label="Primary Contact" value={tenant.primaryContactName} readOnly />
            <Input label="Contact Email" value={tenant.primaryContactEmail} readOnly />
            <Input label="Hub Address" value={tenant.address} readOnly />
            <Input label="City / Region" value={`${tenant.city}, ${tenant.country}`} readOnly />
          </div>
        </Card>
      )}

      {/* Tab 2: Subscription & Add-ons (Live interactive switcher!) */}
      {activeTab === 'subscription' && (
        <div className="space-y-5 text-xs">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  Active License Package Tier
                </h3>
                <p className="text-slate-400 text-[11px]">Switch tiers to observe how navigation and menus adapt</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-500 font-bold text-xs"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  leftIcon={<Sparkles className="h-4 w-4 text-cyan-300" />}
                >
                  Upgrade Plan Wizard
                </Button>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {formatCurrency(tenant.subscription.mrr)}/mo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {(['basic', 'standard', 'corporate', 'enterprise'] as PackageTier[]).map((tier) => {
                const isSelected = packageTier === tier;
                const pkg = PACKAGES[tier];

                return (
                  <div
                    key={tier}
                    onClick={() => setPackageTier(tier)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none text-center flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/40'
                        : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white uppercase text-xs block">{tier}</span>
                      <span className="text-slate-400 text-[10px] line-clamp-2 mt-1">{pkg.tagline}</span>
                    </div>
                    <div className="mt-3">
                      <span className="font-mono font-bold text-white block">${pkg.monthlyPrice}/mo</span>
                      <Button size="sm" variant={isSelected ? 'primary' : 'outline'} className="w-full mt-2 text-xs">
                        {isSelected ? 'Active Plan' : 'Select'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  Specialized Add-ons (Live Entitlement Toggles)
                </h3>
                <p className="text-slate-400 text-[11px]">Toggle add-ons on/off to immediately show/hide modules in the sidebar</p>
              </div>
              <Badge variant="outline">{enabledAddons.length} Enabled</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {ADDONS.map((addon) => {
                const isEnabled = enabledAddons.includes(addon.key);

                return (
                  <div
                    key={addon.key}
                    onClick={() => toggleAddon(addon.key)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isEnabled
                        ? 'border-cyan-500/60 bg-cyan-950/30'
                        : 'border-slate-800 bg-[#0f172a] hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-white block truncate">{addon.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{addon.category} • +${addon.monthlyPrice}/mo</span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
                        isEnabled ? 'bg-cyan-600 text-white' : 'border border-slate-700'
                      }`}
                    >
                      {isEnabled && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Verticals */}
      {activeTab === 'verticals' && (
        <Card className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-white">Licensed Transport Verticals</h3>
              <p className="text-slate-400 text-[11px]">Active industry vertical operational logic</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tenant.verticals.map((v) => {
              const def = VERTICALS[v] || { name: v, description: 'Specialized domain', features: [] };

              return (
                <div key={v} className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{def.name}</span>
                    <Badge variant="glow" size="sm">Active</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400">{def.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {def.features.map((f) => (
                      <span key={f} className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="space-y-4 text-xs">
          {/* Super Admin Control Callout */}
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-white text-xs block">Platform Role Hierarchy & RBAC Matrix</span>
                <span className="text-slate-400 text-[11px]">
                  Super Admin has supreme authority to customize permissions for Manager, Fleet, HR, and other roles.
                </span>
              </div>
            </div>
            {isSuperAdmin ? (
              <Link to="/platform/roles">
                <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold shrink-0" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Customize Role Permissions
                </Button>
              </Link>
            ) : (
              <Badge variant="purple" size="sm">Super Admin Configured</Badge>
            )}
          </div>

          {/* Role Hierarchy Breakdown */}
          <Card className="p-5 space-y-3">
            <h4 className="font-bold text-white text-xs">Tenant Role Permissions Hierarchy</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-purple-500/30 bg-slate-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-xs flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5 text-amber-400" /> Platform Super Admin
                  </span>
                  <Badge variant="purple" size="xs">Supreme (*)</Badge>
                </div>
                <p className="text-[10px] text-slate-400">Controls everything across platform and tenants. Can set customized permissions.</p>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/30 bg-slate-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 text-xs flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" /> Tenant Admin
                  </span>
                  <Badge variant="info" size="xs">Full Tenant (*)</Badge>
                </div>
                <p className="text-[10px] text-slate-400">Manages fleet, drivers, dispatch, warehouse, finance, hr, and settings under Super Admin.</p>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/30 bg-slate-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-emerald-400" /> Operations Manager
                  </span>
                  <Badge variant="success" size="xs">Role Scoped</Badge>
                </div>
                <p className="text-[10px] text-slate-400">Finance, HR, insurance claims, marketing campaigns, and reports analytics.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-white">Security, RBAC & MFA</h3>
                <p className="text-slate-400 text-[11px]">Authentication requirements and session security policies</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-[#0f172a]">
                <div>
                  <span className="font-semibold text-white block">Enforce Multi-Factor Authentication (MFA)</span>
                  <span className="text-[11px] text-slate-400">Requires TOTP token for all tenant administrative users</span>
                </div>
                <Badge variant="success">Enforced</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-[#0f172a]">
                <div>
                  <span className="font-semibold text-white block">Session Token Refresh Window</span>
                  <span className="text-[11px] text-slate-400">JWT access token expires every 15 minutes; auto-refreshed via DRF interceptor</span>
                </div>
                <span className="font-mono text-slate-300">15m / 7d</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <PackageUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
