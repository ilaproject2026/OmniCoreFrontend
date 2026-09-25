import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Lock,
  Mail,
  ArrowRight,
  Building2,
  User,
  Phone,
  Crown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Check,
  Layers,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { PackageTier } from '../../types';
import { PACKAGES, TIER_DISPLAY_NAMES } from '../../config/constants';
import { cn, formatCurrency } from '../../lib/utils';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTierParam = (searchParams.get('tier') as PackageTier) || 'standard';

  const { register, isLoading } = useAuth();

  const [selectedTier, setSelectedTier] = useState<PackageTier>(
    initialTierParam === 'basic' || initialTierParam === 'enterprise' ? initialTierParam : 'standard'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const plans: Array<{
    id: PackageTier;
    name: string;
    monthlyPrice: number;
    annualMonthlyPrice: number;
    badge?: string;
    badgeColor?: string;
    highlight?: boolean;
    multiTenantBadge?: boolean;
    tagline: string;
    keyFeatures: string[];
    tenantLimit: string;
  }> = [
    {
      id: 'basic',
      name: 'Basic Starter',
      monthlyPrice: PACKAGES.basic?.monthlyPrice || 149,
      annualMonthlyPrice: Math.round((PACKAGES.basic?.annualPrice || 1490) / 12),
      badge: 'Starter',
      badgeColor: 'bg-slate-700/60 text-slate-300 border-slate-600',
      tagline: 'Single-org core fleet, vehicle & driver operations.',
      tenantLimit: 'Single Tenant Only',
      keyFeatures: [
        'Fleet & Vehicle Registry',
        'Driver Directory & Rosters',
        'Bookings & Trip Dispatch',
        'Workshop & Maintenance',
        'Basic Warehouse & Parts',
      ],
    },
    {
      id: 'standard',
      name: 'Standard Fleet',
      monthlyPrice: PACKAGES.standard?.monthlyPrice || 399,
      annualMonthlyPrice: Math.round((PACKAGES.standard?.annualPrice || 3990) / 12),
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      highlight: true,
      tagline: 'Full operations + Role Permissions, Audit, CRM & Reports.',
      tenantLimit: 'Single Tenant Only',
      keyFeatures: [
        'All Basic Starter features',
        'Custom Role Permissions Matrix',
        'Platform Audit Log & Security',
        'Contracts & Tenders with SLAs',
        'HR Department & Personnel',
        'Reports & Fleet Analytics',
      ],
    },
    {
      id: 'corporate',
      name: 'Corporate Enterprise',
      monthlyPrice: PACKAGES.corporate?.monthlyPrice || 899,
      annualMonthlyPrice: Math.round((PACKAGES.corporate?.annualPrice || 8990) / 12),
      badge: 'Mid-Market B2B',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      tagline: 'Advanced B2B contracts, CRM, Insurance, Courier & Shuttle.',
      tenantLimit: 'Single Large Enterprise Tenant',
      keyFeatures: [
        'All Standard Fleet features',
        'CRM Sales Pipeline & Deals',
        'Insurance & Claim Tracking',
        'Courier & Express Delivery Hub',
        'School & Corporate Shuttle',
        'Warehouse & Cross-Docking',
      ],
    },
    {
      id: 'enterprise',
      name: 'OmniCore Enterprise',
      monthlyPrice: PACKAGES.enterprise?.monthlyPrice || 1899,
      annualMonthlyPrice: Math.round((PACKAGES.enterprise?.annualPrice || 18990) / 12),
      badge: 'Multi-Tenant',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      multiTenantBadge: true,
      tagline: 'Multiple Tenant Creation, Courier AWB, Shuttle Pooling & CRM.',
      tenantLimit: 'Multiple Tenants Creation Enabled',
      keyFeatures: [
        'Multiple Tenants Provisioning',
        'Courier & Express Delivery (AWB)',
        'Corporate Shuttle Bus Pooling',
        'CRM Pipeline & Customer Accounts',
        'Public Booking & Tracking Portal',
        'Unlimited Fleets & Priority SLA',
      ],
    },
  ];

  const currentPlan = plans.find((p) => p.id === selectedTier) || plans[1];
  const activePrice = billingCycle === 'monthly' ? currentPlan.monthlyPrice : currentPlan.annualMonthlyPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError('Please provide your Organization / Company Name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid Work Email Address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      localStorage.setItem('omni_org_owner_email', email.trim().toLowerCase());
      localStorage.setItem('omni_registered_company', companyName.trim());

      await register({
        company_name: companyName.trim(),
        first_name: firstName.trim() || 'Admin',
        last_name: lastName.trim() || 'User',
        email: email.trim(),
        phone: phone.trim(),
        password: password,
        is_super_admin: true,
        package_tier: selectedTier,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/platform/dashboard', {
          state: {
            successMessage: `Welcome to OmniCore! ${companyName} has been initialized with the ${TIER_DISPLAY_NAMES[selectedTier]} plan.`,
          },
        });
      }, 500);
    } catch (err: any) {
      let msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please review your details and try again.';
      if (typeof msg === 'object') {
        msg = msg?.message || msg?.detail || JSON.stringify(msg);
      }
      setError(typeof msg === 'string' ? msg : 'Registration failed. Please review your details and try again.');
    }
  };

  return (
    <div className="w-full">
      {/* 1. TOP AUTH MODE SWITCHER */}
      <div className="flex items-center justify-between p-1 mb-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <button
          type="button"
          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Choose Plan & Register</span>
        </button>
        <Link
          to="/auth/login"
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Sign In to Existing Account</span>
        </Link>
      </div>

      {/* 2. HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Get Started with OmniCore</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Select your subscription tier below. Each tier includes automated vehicle telematics, role permissions, and operational dashboards.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{typeof error === 'string' ? error : String(error)}</span>
        </div>
      )}

      {isSuccess && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2.5 animate-pulse">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Organization successfully registered! Launching your workspace...</span>
        </div>
      )}

      {/* 3. SUBSCRIPTION PLAN SELECTION (DISPLAYED INITIALLY) */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Step 1</span>
            <h3 className="text-sm font-semibold text-white">Choose Your Organization Plan</h3>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer',
                billingCycle === 'monthly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annually')}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded transition-all flex items-center gap-1 cursor-pointer',
                billingCycle === 'annually' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <span>Annual</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 4 Subscription Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {plans.map((p) => {
            const isSelected = selectedTier === p.id;
            const price = billingCycle === 'monthly' ? p.monthlyPrice : p.annualMonthlyPrice;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedTier(p.id)}
                className={cn(
                  'relative rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between group text-left',
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900/90 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                    : 'border-slate-800/90 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/30'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{p.name}</span>
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border flex items-center justify-center transition-colors',
                        isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-700 bg-slate-800'
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  {p.badge && (
                    <div className="mb-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          p.badgeColor
                        )}
                      >
                        {p.multiTenantBadge && <Crown className="h-3 w-3" />}
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-xl font-black text-white">{formatCurrency(price)}</span>
                    <span className="text-[11px] text-slate-400">/mo</span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed line-clamp-2">{p.tagline}</p>

                  <div className="pt-2 border-t border-slate-800/80 mb-2">
                    <span
                      className={cn(
                        'text-[10px] font-semibold tracking-wide uppercase block',
                        p.multiTenantBadge ? 'text-amber-400 font-bold' : 'text-slate-400'
                      )}
                    >
                      {p.tenantLimit}
                    </span>
                  </div>
                </div>

                <ul className="space-y-1 text-[11px] text-slate-300 pt-1">
                  {p.keyFeatures.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ORGANIZATION AND CREDENTIALS FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Step 2</span>
          <h3 className="text-sm font-semibold text-white">Organization & Admin Credentials</h3>
        </div>

        <Input
          label="Organization / Company Name"
          required
          placeholder="e.g. Continental Freight & Logistics"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          leftIcon={<Building2 className="h-4 w-4 text-slate-400" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Name"
            required
            placeholder="e.g. Sarah"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            leftIcon={<User className="h-4 w-4 text-slate-400" />}
          />
          <Input
            label="Last Name"
            required
            placeholder="e.g. Sterling"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Input
          label="Work Email Address (Super Admin)"
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
          helperText="This email will be granted root Super Admin ownership for your organization."
        />

        <Input
          label="Direct Phone / Mobile (Optional)"
          placeholder="+1 (555) 019-2834"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
            helperText="Minimum 6 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
          />
        </div>

        {/* 5. SUBMIT BUTTON WITH ACTIVE PLAN SUMMARY */}
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-bold shadow-xl shadow-blue-600/30 text-sm cursor-pointer"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Launch Organization on {currentPlan.name} ({formatCurrency(activePrice)}/mo)
          </Button>

          <p className="mt-2 text-center text-[11px] text-slate-500">
            By registering, you agree to the OmniCore Master Services Agreement and Privacy Policy.
          </p>
        </div>
      </form>

      {/* 6. SIGN IN FOOTER */}
      <div className="mt-6 pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            Sign in to your organization
          </Link>
        </p>
      </div>
    </div>
  );
};
