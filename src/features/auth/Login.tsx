import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Authentication failed. Please check your credentials.';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  if (err.message && typeof err.message === 'object') {
    return err.message.message || err.message.detail || JSON.stringify(err.message);
  }
  if (typeof err.detail === 'string') return err.detail;
  if (err.error) {
    if (typeof err.error === 'string') return err.error;
    if (typeof err.error === 'object') return err.error.message || err.error.detail || JSON.stringify(err.error);
  }
  return 'Failed to authenticate. Please check your credentials.';
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, switchRole } = useAuth();

  const state = location.state as { registeredEmail?: string; successMessage?: string } | null;

  const [email, setEmail] = useState(
    typeof state?.registeredEmail === 'string' ? state.registeredEmail : ''
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(
    typeof state?.successMessage === 'string' ? state.successMessage : null
  );

  useEffect(() => {
    if (typeof state?.registeredEmail === 'string' && state.registeredEmail) {
      setEmail(state.registeredEmail);
      setPassword('');
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password });
      if (res?.mfaRequired) {
        navigate('/auth/mfa');
        return;
      }
      if (res.user?.isPlatformUser || res.user?.platformRole === 'super_admin' || res.user?.platformRole === 'omnicore_admin') {
        navigate('/platform/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="w-full">
      {/* 1. TOP AUTH MODE SWITCHER */}
      <div className="flex items-center justify-between p-1 mb-6 rounded-xl bg-slate-900/80 border border-slate-800">
        <Link
          to="/auth/register"
          className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Choose Plan & Register</span>
        </Link>
        <button
          type="button"
          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-blue-600 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Sign In to Existing Account</span>
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to OmniCore</h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in to access your logistics workspace, fleet telematics, and operations.
        </p>
      </div>

      {successNotice && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {typeof error === 'string' ? error : extractErrorMessage(error)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Sign In to OmniCore
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            First time using OmniCore?{' '}
            <Link to="/auth/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Create an account / Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
