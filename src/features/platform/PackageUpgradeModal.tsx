import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { PackageTier } from '../../types';
import { PACKAGES, TIER_RANK } from '../../config/constants';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Check, Zap } from 'lucide-react';

interface PackageUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PackageUpgradeModal: React.FC<PackageUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { packageTier, enabledAddons, upgradePackage } = useTenant();
  const [selectedTier, setSelectedTier] = useState<PackageTier>(packageTier);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const tiers = useMemo(
    () => (['basic', 'standard', 'corporate', 'enterprise'] as PackageTier[])
      .filter((tier) => TIER_RANK[tier] > TIER_RANK[packageTier]),
    [packageTier]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedTier(tiers[0] ?? packageTier);
      setErrorMessage('');
    }
  }, [isOpen, packageTier, tiers]);

  const handleUpgrade = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await upgradePackage(selectedTier, enabledAddons);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Subscription update failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDef = PACKAGES[selectedTier];
  const calculatedMrr = currentDef ? currentDef.monthlyPrice : 499;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instant Subscription Tier Upgrade"
      size="xl"
    >
      <div className="space-y-6">
        {errorMessage && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200">{errorMessage}</div>}
        <p className="text-xs text-slate-400">
          Upgrade your organization's subscription tier without service interruption or page reloads.
          All newly unlocked modules will activate instantly.
        </p>

        {/* Tier Cards Grid */}
        {tiers.length > 0 ? <div className={`grid grid-cols-1 sm:grid-cols-2 ${tiers.length > 2 ? 'md:grid-cols-3' : ''} gap-3`}>
          {tiers.map((t) => {
            const def = PACKAGES[t];
            const isCurrent = t === packageTier;
            const isSelected = t === selectedTier;

            return (
              <div
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white capitalize">{def.name}</span>
                    {isCurrent && <Badge variant="info" size="xs">Current</Badge>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-white font-mono">${def.monthlyPrice}</span>
                    <span className="text-[10px] text-slate-400">/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{def.tagline}</p>

                  <ul className="mt-4 space-y-1.5 text-[11px] text-slate-300">
                    {def.coreFeatures.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                    {isSelected ? 'Selected Tier' : 'Choose Tier'}
                  </span>
                </div>
              </div>
            );
          })}
        </div> : <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">Your organization is already on the highest available plan.</p>}

        {/* Bottom confirmation */}
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Recalculated Monthly Subscription:</span>
            <span className="text-lg font-bold text-white font-mono">${calculatedMrr} USD / month</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpgrade}
              isLoading={isSubmitting}
              disabled={tiers.length === 0}
              icon={<Zap className="h-4 w-4" />}
            >
              Confirm Instant Upgrade
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
