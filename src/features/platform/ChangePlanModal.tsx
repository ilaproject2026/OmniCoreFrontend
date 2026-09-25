import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { Tenant, PackageTier, AddonKey } from '../../types';
import { PACKAGES, ADDONS, TIER_DISPLAY_NAMES } from '../../config/constants';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Crown, Check, Sparkles, AlertCircle, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSuccess?: () => void;
}

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { changeTenantPackage } = useTenant();

  const currentTier = (tenant?.subscription?.package as PackageTier) || 'standard';
  const [selectedTier, setSelectedTier] = useState<PackageTier>(currentTier);
  const [selectedAddons, setSelectedAddons] = useState<AddonKey[]>(
    tenant?.subscription?.enabledAddons || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setSelectedTier((tenant.subscription?.package as PackageTier) || 'standard');
      setSelectedAddons(tenant.subscription?.enabledAddons || []);
      setError(null);
    }
  }, [tenant]);

  if (!tenant) return null;

  const tiers: PackageTier[] = ['basic', 'standard', 'corporate', 'enterprise'];

  const handleToggleAddon = (key: AddonKey) => {
    setSelectedAddons((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await changeTenantPackage(tenant.id, selectedTier, selectedAddons);
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update tenant plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Super User: Modify Tenant Subscription Plan"
      size="xl"
    >
      <div className="space-y-6">
        {/* Tenant Summary Banner */}
        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{tenant.name}</span>
                <Badge variant="purple" size="xs">
                  Current: {TIER_DISPLAY_NAMES[currentTier]}
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Tenant ID: {tenant.id} • {tenant.slug}.omnicore.io
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            <Crown className="h-3.5 w-3.5" />
            <span>Super Admin Override Authority</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Subscription Tier Cards Grid */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Select New Subscription Plan Tier:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {tiers.map((t) => {
              const def = PACKAGES[t];
              const isCurrent = t === currentTier;
              const isSelected = t === selectedTier;

              return (
                <div
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between select-none relative',
                    isSelected
                      ? 'border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  )}
                >
                  {isCurrent && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                        Current
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="font-bold text-xs text-white uppercase block">{def.name}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-white font-mono">${def.monthlyPrice}</span>
                      <span className="text-[10px] text-slate-400">/mo</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {def.maxVehicles === 9999 ? 'Unlimited' : `${def.maxVehicles} veh • ${def.maxUsers} users`}
                    </span>

                    <ul className="mt-3 space-y-1 text-[10px] text-slate-300">
                      {def.coreFeatures.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 truncate">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80">
                    <span
                      className={cn(
                        'block text-center text-[10px] font-bold py-1 rounded',
                        isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {isSelected ? 'Selected Tier' : 'Select Plan'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Specialized Add-ons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Optional Add-on Entitlements:
            </label>
            <span className="text-[10px] text-slate-400">{selectedAddons.length} active add-ons</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ADDONS.slice(0, 6).map((addon) => {
              const isChecked = selectedAddons.includes(addon.key);

              return (
                <div
                  key={addon.key}
                  onClick={() => handleToggleAddon(addon.key)}
                  className={cn(
                    'p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between',
                    isChecked
                      ? 'border-blue-500 bg-blue-950/30'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  )}
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-semibold text-white block truncate">{addon.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">+${addon.monthlyPrice}/mo</span>
                  </div>
                  <div
                    className={cn(
                      'h-4 w-4 rounded flex items-center justify-center border shrink-0',
                      isChecked ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700'
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold"
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-300" />}
            onClick={handleSave}
            isLoading={isSubmitting}
          >
            Apply Plan & Update Tenant
          </Button>
        </div>
      </div>
    </Modal>
  );
};
