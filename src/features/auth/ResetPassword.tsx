import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lock, CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authApi.resetPassword(password, 'token-from-url');
      setSuccess(true);
    } catch (err: any) {
      let msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to reset password';
      if (typeof msg === 'object') {
        msg = msg?.message || msg?.detail || JSON.stringify(msg);
      }
      setError(typeof msg === 'string' ? msg : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Password Updated</h3>
        <p className="mt-2 text-xs text-slate-400">
          Your credentials have been securely reset. You can now sign in with your new password.
        </p>
        <div className="mt-6">
          <Link to="/auth/login">
            <Button size="sm" className="w-full">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Set New Password</h2>
        <p className="mt-1 text-xs text-slate-400">
          Choose a strong password with at least 8 characters.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {typeof error === 'string' ? error : String(error)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Input
          label="Confirm Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Update Password
        </Button>
      </form>
    </div>
  );
};
