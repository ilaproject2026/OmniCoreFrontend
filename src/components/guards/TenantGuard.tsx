import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_TENANTS } from '../../api/mockData';
import { formatCurrency } from '../../lib/utils';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Shield,
  ArrowRight,
  RefreshCw,
  Mail,
  Phone,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface TenantGuardProps {
  children: React.ReactNode;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { tenant, switchTenant, reactivateTenant } = useTenant();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  if (!tenant) {
    return <Navigate to="/auth/login" replace />;
  }

  if (tenant.status === 'suspended') {
    const activeTenants = MOCK_TENANTS.filter((t) => t.status === 'active');
    const defaultApex = MOCK_TENANTS[0];

    const handleReactivate = () => {
      setIsReactivating(true);
      setTimeout(() => {
        reactivateTenant();
        setIsReactivating(false);
      }, 300);
    };

    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#070b14] p-4 sm:p-6 text-white overflow-hidden">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-xl">
          {/* Main Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Red Alert Icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 ring-8 ring-red-500/5">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 mb-3">
                Lifecycle State: Suspended
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Tenant Account Suspended
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Access for <strong className="text-white">{tenant.name}</strong> is currently paused due to billing or compliance review.
              </p>
            </div>

            {/* Tenant Metadata Box */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Organization</span>
                <span className="font-mono text-slate-200 font-semibold">{tenant.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Workspace Subdomain</span>
                <span className="font-mono text-blue-400">{tenant.slug}.omnicore.io</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Subscription Tier</span>
                <span className="font-medium text-amber-400 uppercase tracking-wide">
                  {tenant.subscription?.package} • {formatCurrency(tenant.subscription?.mrr || 0)}/mo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Designated Contact</span>
                <span className="text-slate-300">
                  {tenant.primaryContactName} ({tenant.primaryContactEmail})
                </span>
              </div>
            </div>

            {/* Demo Explainer Badge */}
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300/90 leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
              <span>
                <strong>Multi-Tenant Demo Note:</strong> Titan Heavy Rigging & Machinery is deliberately seeded as suspended to showcase tenant isolation and policy enforcement. You can reactivate it below or switch back to an active workspace.
              </span>
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              {/* Reactivate Button (Demo Mode) */}
              <button
                onClick={handleReactivate}
                disabled={isReactivating}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isReactivating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Reactivate Tenant (Demo Mode)</span>
              </button>

              {/* Switch back to Apex Logistics */}
              <button
                onClick={() => switchTenant(defaultApex)}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/80 py-2.5 px-4 text-sm font-medium text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>Switch to Active Tenant (Apex Global Logistics)</span>
                <ArrowRight className="h-4 w-4 ml-auto text-slate-400" />
              </button>

              {/* Tenant Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-full rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 py-2.5 px-4 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Select Other Organization ({MOCK_TENANTS.length} available)
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute left-0 bottom-full mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-30 max-h-60 overflow-y-auto">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">
                        Choose Multi-Tenant Context
                      </p>
                      {MOCK_TENANTS.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            switchTenant(t);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                            t.id === tenant.id
                              ? 'bg-blue-600/20 text-white font-medium'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-medium">{t.name}</p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {t.status} • {t.subscription.package}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              t.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : t.status === 'trial'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {t.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Secondary Navigation Links */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <Link
                to="/platform/tenants"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                <span>Super Admin Console</span>
              </Link>

              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
