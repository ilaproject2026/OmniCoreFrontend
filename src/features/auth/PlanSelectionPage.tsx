import React, { useState } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { PackageTier } from '../../types';
import { PACKAGES, TIER_DISPLAY_NAMES } from '../../config/constants';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Crown,
  Cpu,
  ChevronRight,
  Users,
  Truck,
  DollarSign,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

export const PlanSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setPackageTier, tenant } = useTenant();
  const { user } = useAuth();

  const state = (location.state as {
    companyName?: string;
    registeredEmail?: string;
    initialTier?: PackageTier;
  }) || {};

  const companyName = state.companyName || searchParams.get('company') || tenant?.name || 'Your Fleet Organization';
  const email = state.registeredEmail || searchParams.get('email') || user?.email || '';
  const initialTier = state.initialTier || (searchParams.get('tier') as PackageTier) || 'corporate';

  const [selectedTier, setSelectedTier] = useState<PackageTier>(initialTier);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [isActivating, setIsActivating] = useState(false);

  const planKeys: PackageTier[] = ['basic', 'standard', 'corporate', 'enterprise'];

  const handleActivatePlan = async (tier: PackageTier) => {
    setSelectedTier(tier);
    setIsActivating(true);

    try {
      // 1. Update package tier in context and localStorage
      setPackageTier(tier);

      const pkgDef = PACKAGES[tier] || PACKAGES.corporate;
      const updatedTenant = {
        ...tenant,
        name: companyName,
        subscription: {
          ...tenant.subscription,
          package: tier,
          status: 'active',
          mrr: billingCycle === 'monthly' ? pkgDef.monthlyPrice : Math.round(pkgDef.annualPrice / 12),
        },
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updatedTenant));

      // 2. Redirect to login with confirmation
      setTimeout(() => {
        navigate('/auth/login', {
          state: {
            registeredEmail: email,
            successMessage: `Congratulations! ${companyName} has been activated on the ${TIER_DISPLAY_NAMES[tier]} Plan (${formatCurrency(billingCycle === 'monthly' ? pkgDef.monthlyPrice : Math.round(pkgDef.annualPrice / 12))}/mo). Please sign in to launch your workspace.`,
          },
        });
      }, 700);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* 1. TOP MINIMAL HEADER */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <Cpu className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-lg">
                Omni<span className="text-blue-500">Core</span>
              </span>
              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold uppercase">
                Plan Setup
              </span>
            </div>
          </Link>

          {/* Stepper Wizard Indicator */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span>1. Account Created</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                2
              </div>
              <span>2. Choose Plan</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <div className="flex items-center gap-1.5 text-slate-500">
              <div className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]">
                3
              </div>
              <span>3. Launch Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO HIGHLIGHTING PRICING & SELECTION */}
      <section className="pt-10 pb-16 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-4">
            <Building2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Setup for: <strong className="text-white">{companyName}</strong></span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Select Your Subscription Plan
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            All plans include isolated tenant cloud storage and multi-modal fleet capabilities. Features, add-ons, and quotas adjust instantly based on your tier.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={cn(
                'px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none',
                billingCycle === 'annually'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3. 4-TIER FULL-WIDTH SUBSCRIPTION PLANS MATRIX */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planKeys.map((tierKey) => {
              const pkg = PACKAGES[tierKey];
              const price = billingCycle === 'monthly' ? pkg.monthlyPrice : Math.round(pkg.annualPrice / 12);
              const isSelected = selectedTier === tierKey;
              const isPopular = tierKey === 'corporate';
              const isEnterprise = tierKey === 'enterprise';

              return (
                <Card
                  key={tierKey}
                  onClick={() => setSelectedTier(tierKey)}
                  className={cn(
                    'p-6 flex flex-col justify-between transition-all relative cursor-pointer select-none',
                    isSelected
                      ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20 scale-[1.02]'
                      : isPopular
                      ? 'border-purple-500/60 bg-purple-950/20 hover:border-purple-500'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                  )}
                >
                  {/* Popular Ribbon */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-[10px] font-extrabold uppercase tracking-wider text-white px-3 py-1 rounded-full shadow-lg border border-white/20">
                        ⭐ Most Popular Tier
                      </span>
                    </div>
                  )}

                  {/* Enterprise Crown Badge */}
                  {isEnterprise && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 px-3 py-1 rounded-full shadow-lg border border-amber-300/30 flex items-center gap-1">
                        <Crown className="h-3 w-3 text-amber-300" />
                        <span>Maximum Power</span>
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="pb-4 border-b border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider font-mono text-slate-400">
                          {pkg.name}
                        </span>
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full border flex items-center justify-center',
                            isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-700'
                          )}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>

                      {/* PROMINENT HIGHLIGHTED PRICING */}
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                          ${price}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/month</span>
                      </div>

                      {billingCycle === 'annually' && (
                        <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                          Billed ${pkg.annualPrice}/yr (Save 20%)
                        </span>
                      )}

                      <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                        {pkg.tagline}
                      </p>
                    </div>

                    {/* Capacity Specs */}
                    <div className="py-4 border-b border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-blue-400" />
                          <span>Fleet Capacity:</span>
                        </span>
                        <span className="font-bold text-white font-mono">
                          {pkg.maxVehicles === 9999 ? 'Unlimited' : `${pkg.maxVehicles} Vehicles`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-purple-400" />
                          <span>User Seats:</span>
                        </span>
                        <span className="font-bold text-white font-mono">
                          {pkg.maxUsers === 9999 ? 'Unlimited' : `${pkg.maxUsers} Users`}
                        </span>
                      </div>
                    </div>

                    {/* Core Features Checklist */}
                    <div className="py-4 space-y-2 text-xs text-slate-300">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                        Included Features:
                      </span>
                      {pkg.coreFeatures.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <Button
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      className={cn(
                        'w-full text-xs font-bold py-2.5 transition-all',
                        isSelected && 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivatePlan(tierKey);
                      }}
                      isLoading={isActivating && selectedTier === tierKey}
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      {isSelected ? `Activate ${pkg.name}` : `Choose ${tierKey.toUpperCase()}`}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 4. BOTTOM TRUST BADGES */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800/80 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Isolated Multi-Tenant Security Guaranteed</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Instant Module Activation on Plan Upgrade</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-4 w-4 text-purple-400" />
              <span>Super Admin Can Modify Plans Anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
