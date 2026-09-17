import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password });
      if (res.user?.isPlatformUser) {
        navigate('/platform/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    }
  };

  const handleQuickDemo = async (demoEmail: string, isSuperAdmin: boolean = false) => {
    setEmail(demoEmail);
    setPassword('admin');
    try {
      const res = await login({ email: demoEmail, password: 'admin' });
      if (isSuperAdmin || res.user?.isPlatformUser) {
        navigate('/platform/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to OmniCore</h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in to access your logistics workspace, fleet telematics, and operations.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
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
      </form>

      {/* Quick Demo Login Preset Buttons */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Quick Demo Access Roles</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('admin@gmail.com', true)}
            className="flex flex-col text-left p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold text-purple-300">Super Admin</span>
            <span className="text-[10px] text-slate-400">admin@gmail.com</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('sarang@apexlogistics.com', false)}
            className="flex flex-col text-left p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold text-blue-300">Tenant Admin</span>
            <span className="text-[10px] text-slate-400">sarang@apexlogistics.com</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('operations@apexcargo.com', false)}
            className="flex flex-col text-left p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold text-emerald-300">Operations Mgr</span>
            <span className="text-[10px] text-slate-400">operations@apexcargo.com</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('admin@omnicore.io', true)}
            className="flex flex-col text-left p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            <span className="text-xs font-semibold text-amber-300">Platform Super Admin</span>
            <span className="text-[10px] text-slate-400">admin@omnicore.io</span>
          </button>
        </div>
      </div>
    </div>
  );
};
