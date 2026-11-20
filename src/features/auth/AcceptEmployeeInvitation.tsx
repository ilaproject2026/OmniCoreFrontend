import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { hrApi, EmployeeInvitationDetails } from '../../api/hr.api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';

export const AcceptEmployeeInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [invitation, setInvitation] = useState<EmployeeInvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [acceptedEmail, setAcceptedEmail] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setError('This invitation link is missing its token. Ask your organization admin to send a new invitation.');
      setIsLoading(false);
      return () => { active = false; };
    }
    hrApi.getInvitation(token)
      .then((data) => { if (active) setInvitation(data); })
      .catch((err: any) => {
        const data = err?.response?.data;
        const message = data?.error?.message || data?.message || data?.detail || 'This invitation is invalid or has expired.';
        if (active) setError(typeof message === 'string' ? message : 'This invitation is invalid or has expired.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (invitation?.requires_password) {
      if (password.length < 8) {
        setError('Your password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('The passwords do not match.');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const result = await hrApi.acceptInvitation(token, invitation?.requires_password ? password : undefined);
      setAcceptedEmail(result.email);
    } catch (err: any) {
      const data = err?.response?.data;
      const message = data?.error?.message || data?.message || data?.detail || err?.message || 'Could not accept this invitation.';
      const fields = data?.error?.fields || data?.fields;
      setError(fields ? Object.values(fields).flat().join(' ') : (typeof message === 'string' ? message : 'Could not accept this invitation.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-sm text-slate-300">Checking your invitation…</div>;

  if (acceptedEmail) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="h-6 w-6" /></div>
        <div>
          <h2 className="text-2xl font-bold text-white">Account ready</h2>
          <p className="mt-2 text-xs text-slate-400">You now have access to {invitation?.company_name} as {invitation?.role_name}.</p>
        </div>
        <Link to="/auth/login" state={{ registeredEmail: acceptedEmail, successMessage: 'Invitation accepted. Sign in with your email and password.' }}>
          <Button className="w-full" rightIcon={<Lock className="h-4 w-4" />}>Continue to Sign In</Button>
        </Link>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="space-y-4 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Invitation unavailable</h2>
        <p role="alert" className="text-xs text-slate-400">{error}</p>
        <Link to="/auth/login" className="text-xs text-blue-400 hover:text-blue-300">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300"><Mail className="h-5 w-5" /></div>
        <h2 className="text-2xl font-bold text-white">Join {invitation.company_name}</h2>
        <p className="mt-2 text-xs text-slate-400">You’ve been invited as <strong className="text-slate-200">{invitation.role_name}</strong>. Confirm your account to continue.</p>
      </div>

      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
        <div>{invitation.first_name} {invitation.last_name}</div>
        <div className="mt-1 text-slate-400">{invitation.email}</div>
      </div>

      {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <form onSubmit={submit} className="space-y-4">
        {invitation.requires_password ? (
          <>
            <p className="text-xs text-slate-400">Create a password for your OmniCore login. Use at least 8 characters and avoid using your name or email.</p>
            <Input label="Create Password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <Input label="Confirm Password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </>
        ) : (
          <p className="text-xs text-slate-400">This email already has an OmniCore login. Accept the invitation, then sign in with your existing password.</p>
        )}
        <Button type="submit" className="w-full" isLoading={isSubmitting}>Accept Invitation</Button>
      </form>
    </div>
  );
};
