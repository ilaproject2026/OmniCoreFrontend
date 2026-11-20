import React, { useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PhoneNumberInput } from '../../components/common/PhoneNumberInput';
import {
  Lock,
  Mail,
  ArrowRight,
  Building2,
  User,
  Crown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
} from 'lucide-react';
import { PackageTier } from '../../types';
import { PACKAGES, TIER_DISPLAY_NAMES } from '../../config/constants';
import { cn, formatCurrency } from '../../lib/utils';
import { getApiErrorCode, getFriendlyApiErrorMessage } from '../../lib/apiErrorMessages';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTierParam = (searchParams.get('tier') as PackageTier) || 'standard';

  const { login, isLoading } = useAuth();

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
  const [warning, setWarning] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const registrationFormRef = useRef<HTMLFormElement>(null);

  const choosePlanAndContinue = (tier: PackageTier) => {
    setSelectedTier(tier);
    setShowRegistration(true);
    requestAnimationFrame(() => registrationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const showRequestError = (requestError: unknown, fallback: string) => {
    const message = getFriendlyApiErrorMessage(requestError, fallback);
    if (getApiErrorCode(requestError) === 'ACCOUNT_ALREADY_EXISTS') {
      setWarning(message);
      setError(null);
      return;
    }
    setWarning(null);
    setError(message);
  };

  const renderFeedback = () => (
    <>
      {error && (
        <div role="alert" aria-live="assertive" className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
      {warning && (
        <div role="alert" aria-live="polite" className="flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-300" />
          <span className="flex-1">{warning}</span>
          <Link to="/auth/login" className="font-semibold text-amber-100 underline underline-offset-2">Sign in</Link>
        </div>
      )}
    </>
  );

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
      tagline: 'Role permissions, audit, contracts, HR, marketing, and reports for growing fleets.',
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
      tagline: 'Advanced B2B operations with CRM, insurance, and expanded fleet capacity.',
      tenantLimit: 'Single Large Enterprise Tenant',
      keyFeatures: [
        'All Standard Fleet features',
        'CRM Sales Pipeline & Deals',
        'Insurance & Claims Management',
        'Capacity for Up to 500 Vehicles',
        'Up to 50 User Seats',
        'Priority Business Support',
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
    setWarning(null);

    if (!companyName.trim()) {
      setError('Please provide your Organization / Company Name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid Work Email Address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      await authApi.requestRegistrationOtp({
        company_name: companyName.trim(),
        first_name: firstName.trim() || 'Admin',
        last_name: lastName.trim() || 'User',
        email: email.trim(),
        phone: phone.trim(),
        password: password,
        is_super_admin: true,
        package_tier: selectedTier,
      });
      setOtpSent(true);
      setSuccessMessage(`If ${email.trim()} can be registered, a six-digit verification code will arrive shortly. If you already have an account, sign in or reset your password.`);
    } catch (err: any) {
      showRequestError(err, 'Some registration details are invalid. Check your entries and try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);
    if (!/^\d{6}$/.test(otpCode)) {
      setError('Enter the six-digit code sent to your email.');
      return;
    }
    setOtpBusy(true);
    try {
      const result = await authApi.verifyRegistrationOtp(email, otpCode);
      localStorage.setItem('omni_org_owner_email', email.trim().toLowerCase());
      localStorage.setItem('omni_registered_company', companyName.trim());
      await login({ email: email.trim().toLowerCase(), password });
      const planMessage = `Welcome to OmniCore! ${companyName} is active on the ${TIER_DISPLAY_NAMES[selectedTier]} plan.`;
      setSuccessMessage(planMessage);
      setIsSuccess(true);
      navigate('/app/dashboard', { state: { successMessage: planMessage, tenantId: result.tenant_id } });
    } catch (err: any) {
      showRequestError(err, 'The code is invalid or expired. Request a new code and try again.');
    } finally {
      setOtpBusy(false);
    }
  };

  return (
    <div className="w-full">
      {/* 1. TOP AUTH MODE SWITCHER */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center justify-between border-b border-slate-700/70 bg-[#0b0f17]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <Link to="/auth/register" className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Create your workspace</span>
        </Link>
        <Link
          to="/auth/login"
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Sign in
        </Link>
      </div>

      {/* 2. HEADER */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">One platform. Every mile.</p>
        <h2 className="bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
          <span>Get Started with OmniCore</span>
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Select your subscription tier below. Each tier includes automated vehicle telematics, role permissions, and operational dashboards.
        </p>
      </div>

      {isSuccess && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2.5 animate-pulse">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage || 'Organization successfully registered! Launching your workspace...'}</span>
        </div>
      )}

      {/* 3. SUBSCRIPTION PLAN SELECTION (DISPLAYED INITIALLY) */}
      <section aria-labelledby="plans-heading" className="mb-8 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-blue-950/20 backdrop-blur-sm sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Plans</span>
            <h3 id="plans-heading" className="text-xl font-bold text-white">Choose the right plan for your fleet</h3>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const isSelected = selectedTier === p.id;
            const price = billingCycle === 'monthly' ? p.monthlyPrice : p.annualMonthlyPrice;

            return (
              <article
                key={p.id}
                className={cn(
                  'relative min-w-0 rounded-xl border p-5 transition-all flex flex-col text-left',
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

                  <p className="min-h-10 text-xs text-slate-300 mb-3 leading-relaxed">{p.tagline}</p>

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

                <ul className="space-y-2 text-xs text-slate-300 pt-1 flex-1">
                  {p.keyFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    choosePlanAndContinue(p.id);
                  }}
                  className={cn(
                    'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'border border-slate-700 bg-slate-800/70 text-slate-100 hover:border-blue-500 hover:bg-slate-800'
                  )}
                >
                  Register with this plan <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. ORGANIZATION AND CREDENTIALS FORM */}
      {showRegistration && (otpSent ? (
        <form ref={registrationFormRef} onSubmit={handleVerifyOtp} className="scroll-mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Email verification</span>
            <h3 className="mt-1 text-xl font-bold text-white">Check your inbox</h3>
            <p className="mt-2 text-sm text-slate-400">If this email is eligible for registration, enter the six-digit code here. Codes expire after 10 minutes. Existing account? <Link to="/auth/login" className="text-cyan-300 hover:text-white">Sign in</Link>.</p>
          </div>
          <Input label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
            value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000" />
          {renderFeedback()}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="flex-1" isLoading={otpBusy || isLoading}>Verify email and create workspace</Button>
            <button type="button" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              disabled={otpBusy} onClick={async () => {
                setError(null); setWarning(null); setOtpBusy(true);
                try { await authApi.requestRegistrationOtp({ company_name: companyName.trim(), first_name: firstName.trim() || 'Admin', last_name: lastName.trim() || 'User', email: email.trim(), phone: phone.trim(), password, package_tier: selectedTier }); setSuccessMessage('If this email can be registered, a new code will arrive shortly.'); }
                catch (err: any) { showRequestError(err, 'Could not resend the code. Please try again shortly.'); }
                finally { setOtpBusy(false); }
              }}>Resend code</button>
          </div>
          <button type="button" className="text-sm text-cyan-300 hover:text-white" onClick={() => { setOtpSent(false); setOtpCode(''); setSuccessMessage(''); }}>Back to registration details</button>
        </form>
      ) : <form ref={registrationFormRef} id="registration-form" onSubmit={handleSubmit} className="scroll-mt-6 space-y-4">
        <div className="pb-1">
          <button type="button" onClick={() => setShowRegistration(false)} className="mb-4 text-sm font-medium text-cyan-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded">
            ← Back to plans
          </button>
          <span className="block text-xs font-bold uppercase tracking-wider text-cyan-400">Selected plan · {currentPlan.name}</span>
          <h3 className="mt-1 text-xl font-bold text-white">Set up your organization</h3>
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

        <PhoneNumberInput
          label="Direct Phone / Mobile (Optional)"
          value={phone}
          onChange={setPhone}
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
            helperText="Minimum 8 characters"
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
        {renderFeedback()}
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
      </form>)}

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
