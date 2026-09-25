import React, { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { PackageTier } from '../../types';
import { PACKAGES, TIER_DISPLAY_NAMES } from '../../config/constants';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Lock, Sparkles, Check, ArrowRight, ArrowLeft, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PackageUpgradeModal } from '../../features/platform/PackageUpgradeModal';

interface PlanFeatureRestrictedProps {
  moduleName: string;
  requiredTier: PackageTier;
  description?: string;
}

export const PlanFeatureRestricted: React.FC<PlanFeatureRestrictedProps> = ({
  moduleName,
  requiredTier,
  description,
}) => {
  const { tenant, packageTier, setPackageTier } = useTenant();
  const { user } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUpgradingDirectly, setIsUpgradingDirectly] = useState(false);

  const isSuperAdmin = Boolean(
    user?.isPlatformUser ||
    user?.platformRole === 'super_admin' ||
    user?.platformRole === 'omnicore_admin'
  );
  const isTenantAdmin = user?.tenantRole === 'tenant_admin' || user?.tenantRole === 'customer_admin';

  const currentPkg = PACKAGES[packageTier] || PACKAGES.standard;
  const targetPkg = PACKAGES[requiredTier] || PACKAGES.corporate;

  const handleInstantUpgrade = async () => {
    setIsUpgradingDirectly(true);
    try {
      setPackageTier(requiredTier);
    } finally {
      setIsUpgradingDirectly(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Card className="max-w-xl w-full p-8 border-slate-800 bg-[#0c1220]/80 shadow-2xl space-y-6">
        {/* Glow Header Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="purple" size="sm" dot>
              {TIER_DISPLAY_NAMES[requiredTier]} Required
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {moduleName} Not Included in Your Plan
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            {description ||
              `The ${moduleName} operational module is available starting from the ${TIER_DISPLAY_NAMES[requiredTier]} plan. Your organization is currently on the ${TIER_DISPLAY_NAMES[packageTier]} plan.`}
          </p>
        </div>

        {/* Plan Comparison Spec Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Current Plan
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-white text-sm uppercase">{packageTier}</span>
              <span className="text-[11px] text-slate-400 font-mono">${currentPkg.monthlyPrice}/mo</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{currentPkg.tagline}</p>
            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
              Capacity: {currentPkg.maxVehicles === 9999 ? 'Unlimited' : `${currentPkg.maxVehicles} Vehicles`}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-500/40 bg-blue-950/20 space-y-2 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Badge variant="glow" size="xs">Unlocked</Badge>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
              Required Plan
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-white text-sm uppercase">{requiredTier}</span>
              <span className="text-[11px] text-cyan-300 font-mono">${targetPkg.monthlyPrice}/mo</span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2">{targetPkg.tagline}</p>
            <div className="pt-2 border-t border-blue-500/20 text-[10px] text-blue-200 flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Includes {moduleName}</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights of the target plan */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-left space-y-2">
          <span className="font-semibold text-white block text-[11px] uppercase tracking-wider">
            Upgrading to {TIER_DISPLAY_NAMES[requiredTier]} Unlocks:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            {targetPkg.coreFeatures.slice(0, 4).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/app/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full text-xs" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Back to Operations Hub
            </Button>
          </Link>

          {(isSuperAdmin || isTenantAdmin) && (
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold shadow-lg shadow-blue-600/25"
              leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-300" />}
              onClick={handleInstantUpgrade}
              isLoading={isUpgradingDirectly}
            >
              {isSuperAdmin
                ? `Super Admin: Switch to ${TIER_DISPLAY_NAMES[requiredTier]}`
                : `Instant Upgrade to ${TIER_DISPLAY_NAMES[requiredTier]}`}
            </Button>
          )}

          {isTenantAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Browse All Plans
            </Button>
          )}
        </div>
      </Card>

      {/* Upgrade Wizard Modal */}
      <PackageUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
};
