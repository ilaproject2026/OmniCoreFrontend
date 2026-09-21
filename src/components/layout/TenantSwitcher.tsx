import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../../contexts/TenantContext';
import { platformApi } from '../../api/platform.api';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../feedback/Skeleton';

export const TenantSwitcher: React.FC = () => {
  const { tenant, switchTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platformTenants'],
    queryFn: () => platformApi.getTenants(),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/40 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700/70 hover:border-slate-600 transition-all max-w-[200px] cursor-pointer"
        title="Switch Multi-Tenant Context"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600/20 text-blue-400 font-bold text-[10px] shrink-0">
          {tenant.name.substring(0, 2).toUpperCase()}
        </div>
        <span className="font-medium truncate text-left">{tenant.name}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl z-40 max-h-80 overflow-y-auto">
            <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Multi-Tenant Organization
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Connected workspaces from OmniCore platform database.
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                <span>Active workspace: <strong>{tenant.name}</strong></span>
              </div>
            ) : (
              tenants.map((t) => {
                const isSelected = tenant.id === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      switchTenant(t);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer',
                      isSelected ? 'bg-blue-600/20 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium">{t.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-blue-400 font-mono capitalize">
                          {t.subscription?.package || 'standard'}
                        </span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-400">
                          {t.verticals?.length || 0} Verticals
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
