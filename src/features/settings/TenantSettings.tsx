import React, { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PhoneNumberInput } from '../../components/common/PhoneNumberInput';
import { Select } from '../../components/common/Select';
import { Tabs } from '../../components/common/Tabs';
import { ADDONS, VERTICALS, PACKAGES, TIER_RANK } from '../../config/constants';
import { PackageTier, AddonKey, VerticalType } from '../../types';
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
  Plus,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { PackageUpgradeModal } from '../platform/PackageUpgradeModal';

export const TenantSettings: React.FC = () => {
  const { user } = useAuth();
  const { tenant, packageTier, enabledAddons, toggleAddon, updateTenantVerticals, updateTenantProfile } = useTenant();
  const [activeTab, setActiveTab] = useState('organization');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [savingAddon, setSavingAddon] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profile, setProfile] = useState({
    company_name: tenant.name,
    email: tenant.primaryContactEmail,
    phone: tenant.primaryContactPhone,
    address: tenant.address,
  });

  useEffect(() => {
    setProfile({
      company_name: tenant.name,
      email: tenant.primaryContactEmail,
      phone: tenant.primaryContactPhone,
      address: tenant.address,
    });
  }, [tenant.name, tenant.primaryContactEmail, tenant.primaryContactPhone, tenant.address]);

  const handleProfileSave = async () => {
    setSettingsError('');
    setIsSavingProfile(true);
    try {
      await updateTenantProfile(profile);
    } catch (error: any) {
      setSettingsError(error?.response?.data?.message || error?.message || 'Could not save organization profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddonToggle = async (key: string) => {
    setSettingsError('');
    setSavingAddon(key);
    try {
      await toggleAddon(key as AddonKey);
    } catch (error: any) {
      setSettingsError(error?.response?.data?.message || error?.message || 'Could not update add-on settings.');
    } finally {
      setSavingAddon(null);
    }
  };

  const isSuperAdmin = Boolean(user?.isPlatformUser || user?.platformRole === 'omnicore_admin' || user?.platformRole === 'super_admin');
  const displayedMrr = (PACKAGES[packageTier]?.monthlyPrice || 0) + ADDONS
    .filter((addon) => enabledAddons.includes(addon.key))
    .reduce((total, addon) => total + addon.monthlyPrice, 0);

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
          {settingsError && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-red-200">{settingsError}</div>}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-white">Commercial Profile</h3>
              <p className="text-slate-400 text-[11px]">Primary headquarters and tenant metadata</p>
            </div>
            <Badge variant="glow">Tenant ID: {tenant.id}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} required />
            <Input label="Subdomain / Slug" value={`${tenant.slug}.omnicore.io`} readOnly />
            <Input label="Contact Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
            <PhoneNumberInput label="Contact Phone" value={profile.phone} onChange={(phone) => setProfile({ ...profile, phone })} />
            <Input label="Headquarters Address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => void handleProfileSave()} isLoading={isSavingProfile}>Save Company Profile</Button>
          </div>
        </Card>
      )}

      {/* Tab 2: Subscription & Add-ons (Live interactive switcher!) */}
      {activeTab === 'subscription' && (
        <div className="space-y-5 text-xs">
          {settingsError && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-red-200">{settingsError}</div>}
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
                  {formatCurrency(displayedMrr)}/mo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {(['basic', 'standard', 'corporate', 'enterprise'] as PackageTier[])
                .filter((tier) => TIER_RANK[tier] >= TIER_RANK[packageTier])
                .map((tier) => {
                const isSelected = packageTier === tier;
                const pkg = PACKAGES[tier];

                return (
                  <div
                    key={tier}
                    className={`p-3.5 rounded-xl border transition-all select-none text-center flex flex-col justify-between ${
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
                      <Button size="sm" variant={isSelected ? 'primary' : 'outline'} className="w-full mt-2 text-xs" onClick={() => setIsUpgradeModalOpen(true)}>
                        {isSelected ? 'Active Plan' : 'View Upgrade Options'}
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
                    onClick={() => void handleAddonToggle(addon.key)}
                    aria-disabled={savingAddon === addon.key}
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
                      {savingAddon === addon.key ? <span className="h-2 w-2 rounded-full bg-cyan-200 animate-pulse" /> : isEnabled && <Check className="h-3.5 w-3.5" />}
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
          {settingsError && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-red-200">{settingsError}</div>}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-400" />
                Licensed Transport Verticals & Service Entitlements
              </h3>
              <p className="text-slate-400 text-[11px]">
                {isSuperAdmin
                  ? 'OmniCore Project Admin: Toggle vertical service support for this customer organization.'
                  : 'Active transport industry services contracted and provisioned by your OmniCore Project Manager.'}
              </p>
            </div>
            {isSuperAdmin && (
              <Badge variant="purple" size="sm">
                OmniCore Admin Managed
              </Badge>
            )}
          </div>

          {!isSuperAdmin && (
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 text-slate-300 text-[11px] space-y-1">
              <span className="font-semibold text-white block">Vertical-Based Service Access:</span>
              <p className="text-slate-400">
                Your workspace modules and navigation are governed by these granted verticals. If your business requires software support for new services (e.g. Courier & Express Delivery or Tourist Bus Services), request vertical activation from your OmniCore Project Manager.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {Object.values(VERTICALS).map((def) => {
              const isActive = (tenant.verticals || []).includes(def.id as VerticalType);

              // Customer admins only see granted verticals unless they are viewing the catalog
              if (!isSuperAdmin && !isActive) return null;

              return (
                <div
                  key={def.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isActive
                      ? 'border-blue-500/50 bg-blue-950/20 shadow-sm'
                      : 'border-slate-800/80 bg-slate-900/30 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{def.name}</span>
                    <Badge variant={isActive ? 'glow' : 'default'} size="xs">
                      {isActive ? 'Active Service' : 'Not Granted'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{def.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {def.features.map((f) => (
                      <span key={f} className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>

                  {isSuperAdmin && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                      <Button
                        size="xs"
                        variant={isActive ? 'outline' : 'primary'}
                        onClick={async () => {
                          const current = tenant.verticals || [];
                          let next: VerticalType[];
                          if (isActive) {
                            next = current.filter((item) => item !== def.id);
                          } else {
                            next = [...current, def.id as VerticalType];
                          }
                          setSettingsError('');
                          try {
                            await updateTenantVerticals(tenant.id, next);
                          } catch (error: any) {
                            setSettingsError(error?.response?.data?.message || error?.message || 'Could not update vertical access.');
                          }
                        }}
                        className="text-[10px]"
                      >
                        {isActive ? 'Revoke Service' : 'Grant Service to Customer'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="space-y-4 text-xs">
          {/* OmniCore Admin Control Callout */}
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-white text-xs block">OmniCore Customer Vertical Entitlements & RBAC</span>
                <span className="text-slate-400 text-[11px]">
                  Access is governed by software service contracts. The OmniCore Project Admin grants customers access to specific transport verticals.
                </span>
              </div>
            </div>
            {isSuperAdmin ? (
              <Link to="/platform/roles">
                <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold shrink-0" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Manage Customer Entitlements
                </Button>
              </Link>
            ) : (
              <Badge variant="purple" size="sm">OmniCore Admin Governed</Badge>
            )}
          </div>

          {/* Role Hierarchy Breakdown */}
          <Card className="p-5 space-y-3">
            <h4 className="font-bold text-white text-xs">Ecosystem Role Hierarchy</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border border-purple-500/30 bg-slate-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-xs flex items-center gap-1">
                    <Crown className="h-3.5 w-3.5 text-amber-400" /> OmniCore Project Admin
                  </span>
                  <Badge variant="purple" size="xs">Super Admin</Badge>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Main project administrator. Controls customer onboarding, provisioning, and grants access to specific service verticals.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-blue-500/30 bg-slate-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 text-xs flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" /> Customer Admin (Org Manager)
                  </span>
                  <Badge variant="info" size="xs">Customer Admin</Badge>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Executive management of the customer organization. Has administrative authority restricted to their granted service verticals.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-slate-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-emerald-400" /> Vertical Operations Staff
                  </span>
                  <Badge variant="success" size="xs">Staff Operations</Badge>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Operational dispatchers, drivers, and agents performing daily workflows within active contracted verticals.
                </p>
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
