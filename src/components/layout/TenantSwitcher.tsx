import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { platformApi } from '../../api/platform.api';
import { Building2, ChevronDown, Check, ShieldCheck, Lock, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../feedback/Skeleton';
import { Badge } from '../common/Badge';
import { useClickOutside } from '../../hooks/useClickOutside';

export const TenantSwitcher: React.FC = () => {
  const { tenant, switchTenant, packageTier } = useTenant();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  // Strictly check if logged in user is the platform root operator
  const isPlatformRootAdmin = Boolean(
    user?.isPlatformUser ||
    user?.platformRole === 'super_admin' ||
    user?.platformRole === 'omnicore_admin'
  );

  // Only query cross-platform tenants if user is platform root operator
  const { data: rawTenants = [], isLoading } = useQuery({
    queryKey: ['platformTenants'],
    queryFn: () => platformApi.getTenants(),
    enabled: isPlatformRootAdmin,
  });

  const tenants = isPlatformRootAdmin ? rawTenants : [tenant];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/40 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700/70 hover:border-slate-600 transition-all max-w-[210px] cursor-pointer"
        title={isPlatformRootAdmin ? 'Switch Multi-Tenant Context' : 'Dedicated Organization Workspace'}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600/20 text-blue-400 font-bold text-[10px] shrink-0">
          {(tenant.name || 'TN').substring(0, 2).toUpperCase()}
        </div>
        <span className="font-medium truncate text-left text-white">{tenant.name}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl z-40 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="pb-2 border-b border-slate-800 mb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isPlatformRootAdmin ? 'Platform Cross-Tenant Control' : 'Dedicated SaaS Organization'}
              </p>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="h-3 w-3" /> Isolated
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              {tenant.name}
            </p>
          </div>

          {/* If Platform Root Admin: List platform tenants with switching */}
          {isPlatformRootAdmin ? (
            <div>
              <p className="text-[10px] text-slate-500 mb-1.5">Switch tenant workspace:</p>
              {isLoading ? (
                <div className="space-y-2 py-1">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : (
                <div className="space-y-1">
                  {tenants.map((t) => {
                    const isSelected = tenant.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          switchTenant(t);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer',
                          isSelected ? 'bg-blue-600/20 text-white font-medium border border-blue-500/40' : 'text-slate-300 hover:bg-slate-800'
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-medium">{t.name}</p>
                          <span className="text-[10px] text-blue-400 font-mono capitalize">
                            {t.subscription?.package || 'standard'} Tier
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Customer Tenant User: STRICT PRIVACY & DATA ISOLATION CARD */
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Subscription Tier:</span>
                  <span className="font-bold text-blue-400 uppercase font-mono">{packageTier}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Tenant Status:</span>
                  <Badge variant="success" dot className="text-[10px] py-0 px-1.5">Active</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Subdomain:</span>
                  <span className="font-mono text-slate-300 text-[10px] truncate max-w-[130px]">
                    {tenant.slug || 'workspace'}.omnicore.io
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-950/20 border border-blue-800/30 p-2 text-[11px] text-slate-300 flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                <span>
                  Tenant data is strictly isolated. Other organizations on the platform cannot access or view your operations.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
