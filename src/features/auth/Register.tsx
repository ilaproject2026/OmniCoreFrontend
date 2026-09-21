import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
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
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const initialTierParam = searchParams.get('tier');

  const { register, isLoading } = useAuth();

  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(initialRoleParam === 'super_admin');
  const [selectedTier, setSelectedTier] = useState<string>(initialTierParam || 'standard');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
      await register({
        company_name: companyName.trim(),
        first_name: firstName.trim() || 'Admin',
        last_name: lastName.trim() || 'User',
        email: email.trim(),
        phone: phone.trim(),
        password: password,
        is_super_admin: isSuperAdmin,
        package_tier: isSuperAdmin ? 'enterprise' : selectedTier,
      });

      setIsSuccess(true);
      // Wait 1.2s then redirect to login with prefilled email
      setTimeout(() => {
        navigate('/auth/login', {
          state: {
            registeredEmail: email.trim(),
            successMessage: `Welcome! Account for "${companyName.trim()}" created successfully. Please sign in to proceed.`,
          },
        });
      }, 1200);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please review your details and try again.';
      setError(msg);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <Badge variant="purple" size="xs">
            {isSuperAdmin ? 'Platform Super User' : 'Tenant Workspace'}
          </Badge>
        </div>
        <p className="text-xs text-slate-400">
          Get started with OmniCore SaaS. The first user acts as the Super User with full platform power.
        </p>
      </div>

      {/* Account Type Selector Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
        <button
          type="button"
          onClick={() => setIsSuperAdmin(true)}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
            isSuperAdmin
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Crown className="h-3.5 w-3.5 text-amber-300" />
          <span>Platform Super User</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSuperAdmin(false)}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
            !isSuperAdmin
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Building2 className="h-3.5 w-3.5 text-blue-200" />
          <span>Tenant Organization</span>
        </button>
      </div>

      {/* Role Informational Callout */}
      <div
        className={cn(
          'p-3 rounded-xl border text-xs mb-5 flex items-start gap-2.5',
          isSuperAdmin
            ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
            : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
        )}
      >
        <Sparkles className={cn('h-4 w-4 shrink-0 mt-0.5', isSuperAdmin ? 'text-amber-300' : 'text-cyan-400')} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold block">
              {isSuperAdmin ? 'First Time Super User Privileges:' : 'Tenant Administrator Access:'}
            </span>
            {!isSuperAdmin && initialTierParam && (
              <Badge variant="glow" size="xs" className="uppercase font-mono text-[9px]">
                {selectedTier} Tier
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {isSuperAdmin
              ? 'Holds supreme power to oversee the entire platform, provision isolated tenants, and customize permissions for all other user roles.'
              : 'Direct authority over your isolated fleet, driver directory, dispatch waybills, and staff role assignments.'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {isSuccess && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Account created successfully! Redirecting you to the login portal...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Organization / Company Name"
          required
          placeholder="e.g. Apex Global Logistics"
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
          label="Work Email Address"
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
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

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {isSuperAdmin ? 'Register Super User & Continue' : 'Create Organization Account'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
