import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeInvitePayload, hrApi } from '../../api/hr.api';
import { tenantUsersApi } from '../../api/tenantUsers.api';
import { DataTable, ColumnDef } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Employee } from '../../types';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Users, Plus, Lock, Mail, Copy, Check, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export const HrHub: React.FC = () => {
  const { can } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canViewPayroll = can('payroll.view');
  // Older persisted browser sessions may not have the primary-membership flag yet.
  // Keep the admin action visible when that field is absent; the API independently
  // verifies primary-admin status before creating or changing employee access.
  const canInvite = can('tenant.manage') && user?.isTenantPrimary !== false;
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Employee | null>(null);
  const [accessRole, setAccessRole] = useState('');
  const [accessEnabled, setAccessEnabled] = useState(true);
  const [accessError, setAccessError] = useState('');
  const [accessResult, setAccessResult] = useState<{ message: string; invitation_url?: string } | null>(null);
  const [copiedAccessLink, setCopiedAccessLink] = useState(false);
  const [formError, setFormError] = useState('');
  const [invitationResult, setInvitationResult] = useState<{ message: string; invitation_url?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', department: 'OPERATIONS',
    designation: '', date_of_joining: new Date().toISOString().slice(0, 10), role: '',
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => hrApi.getEmployees(),
  });

  const { data: roles = [], isLoading: isLoadingRoles, isError: rolesError, refetch: refetchRoles } = useQuery({
    queryKey: ['tenantRoles'],
    queryFn: () => tenantUsersApi.getRoles(),
    enabled: canInvite && (isInviteOpen || Boolean(editingAccess)),
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: EmployeeInvitePayload) => hrApi.inviteEmployee(payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      setInvitationResult({ message: result.message, invitation_url: result.invitation_url });
      setFormError('');
    },
    onError: (error: any) => {
      const response = error?.response?.data;
      const message = response?.error?.message || response?.message || response?.detail || error?.message;
      const fields = response?.error?.fields || response?.fields;
      setFormError(fields ? Object.entries(fields).map(([name, errors]) => `${name}: ${(errors as string[]).join(', ')}`).join(' ') : (typeof message === 'string' ? message : 'Could not send the employee invitation.'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => hrApi.resendEmployeeInvitation(id),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      setAccessResult({ message: result.message, invitation_url: result.invitation_url });
      setAccessError('');
    },
    onError: (error: any) => {
      const response = error?.response?.data;
      setAccessError(response?.error?.message || response?.message || response?.detail || 'Could not resend the invitation.');
    },
  });

  const accessMutation = useMutation({
    mutationFn: (input: { id: string; role: string; is_active: boolean }) => hrApi.updateEmployeeAccess(input.id, { role: input.role, is_active: input.is_active }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      setAccessResult({ message: result.message, invitation_url: result.invitation_url });
      setAccessError('');
    },
    onError: (error: any) => {
      const response = error?.response?.data;
      setAccessError(response?.error?.message || response?.message || response?.detail || 'Could not update employee access.');
    },
  });

  const openInvite = (employee?: Employee) => {
    setFormError('');
    setInvitationResult(null);
    setCopiedLink(false);
    setForm({
      first_name: employee?.firstName || '', last_name: employee?.lastName || '', email: employee?.email || '', phone: employee?.phone || '', department: (employee?.department || 'Operations').toUpperCase(),
      designation: employee?.designation || '', date_of_joining: employee?.joiningDate || new Date().toISOString().slice(0, 10), role: employee?.roleId || '',
    });
    setIsInviteOpen(true);
  };

  const openAccess = (employee: Employee) => {
    setAccessError('');
    setAccessResult(null);
    setCopiedAccessLink(false);
    setEditingAccess(employee);
    setAccessRole(employee.roleId || '');
    setAccessEnabled(['active', 'pending'].includes(employee.accountStatus || ''));
  };

  const saveAccess = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAccess || !accessRole) {
      setAccessError('Choose an access role.');
      return;
    }
    setAccessResult(null);
    setAccessError('');
    accessMutation.mutate({ id: editingAccess.id, role: accessRole, is_active: accessEnabled });
  };

  const submitInvite = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const selectedRole = roles.find((role) => role.id === form.role);
    if (!selectedRole) {
      setFormError('Choose an employee role.');
      return;
    }
    inviteMutation.mutate({ ...form, role: selectedRole.id });
  };

  const columns: ColumnDef<Employee>[] = [
    {
      key: 'code',
      header: 'Employee Code & Name',
      sortable: true,
      accessor: (r) => `${r.firstName} ${r.lastName}`,
      render: (_, row) => (
        <div>
          <span className="font-bold text-white text-xs block">
            {row.firstName} {row.lastName}
          </span>
          <span className="text-[11px] font-mono text-slate-400">{row.employeeCode}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: (r) => r.department,
      render: (val) => <Badge variant="outline" size="sm">{val}</Badge>,
    },
    {
      key: 'role',
      header: 'Tenant Role',
      accessor: (r) => r.role,
      render: (val: string) => (
        <span className="text-blue-400 text-xs font-medium capitalize">
          {val.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'joining',
      header: 'Hire Date',
      accessor: (r) => r.joiningDate,
      render: (val) => <span className="text-slate-300 font-mono text-xs">{formatDate(val)}</span>,
    },
    {
      key: 'status',
      header: 'Employment / Account',
      accessor: (r) => r.status,
      render: (_, row) => (
        <div className="space-y-1">
          <Badge variant={row.status === 'active' ? 'success' : 'outline'}>{row.status.replace('_', ' ')}</Badge>
          {row.accountStatus && <div><Badge variant={row.accountStatus === 'active' ? 'info' : row.accountStatus === 'pending' ? 'warning' : 'outline'} size="xs">{row.accountStatus === 'pending' ? 'Invite pending' : row.accountStatus.replace('_', ' ')}</Badge></div>}
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Monthly Compensation',
      render: (_, row) => {
        if (!canViewPayroll) {
          return (
            <span className="text-slate-500 flex items-center gap-1 text-[11px] italic">
              <Lock className="h-3 w-3" /> Confidential
            </span>
          );
        }
        return (
          <span className="font-mono font-bold text-emerald-400 text-xs">
            {row.salary ? formatCurrency(row.salary.netPay) : 'Configuring'}
          </span>
        );
      },
    },
    ...(canInvite ? [{
      key: 'invite_action',
      header: 'Account Access',
      render: (_: unknown, row: Employee) => row.accountStatus === 'not_invited' ? (
        <Button size="xs" variant="outline" leftIcon={<Mail className="h-3 w-3" />} onClick={() => openInvite(row)}>Invite login</Button>
      ) : (
        <Button size="xs" variant="outline" leftIcon={<ShieldCheck className="h-3 w-3" />} onClick={() => openAccess(row)}>Manage access</Button>
      ),
    } as ColumnDef<Employee>] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Human Resources & Staff Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operations personnel, departmental assignments, attendance, and permission-protected payroll.
          </p>
        </div>

        {canInvite && <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openInvite()}>Add Employee</Button>}
      </div>

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        searchPlaceholder="Search employee name, department, email..."
      />

      <Modal isOpen={isInviteOpen} onClose={() => !inviteMutation.isPending && setIsInviteOpen(false)} title="Invite Employee" description="The employee will receive a secure link to activate their account and set a password." size="lg">
        {invitationResult ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">{invitationResult.message}</div>
            {invitationResult.invitation_url && (
              <div className="space-y-2">
                <p className="text-xs text-amber-200">Local development email is written to the backend console. Copy this link for testing:</p>
                <div className="flex gap-2">
                  <Input aria-label="Invitation link" value={invitationResult.invitation_url} readOnly />
                  <Button variant="outline" leftIcon={copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={async () => {
                    await navigator.clipboard.writeText(invitationResult.invitation_url || '');
                    setCopiedLink(true);
                  }}>{copiedLink ? 'Copied' : 'Copy'}</Button>
                </div>
              </div>
            )}
            <div className="flex justify-end"><Button onClick={() => setIsInviteOpen(false)}>Done</Button></div>
          </div>
        ) : (
          <form onSubmit={submitInvite} className="space-y-4">
            {formError && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-200">{formError}</div>}
            {rolesError && <div role="alert" className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-200"><span>Could not load employee roles.</span><Button type="button" size="xs" variant="outline" onClick={() => void refetchRoles()}>Retry</Button></div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First Name" autoComplete="given-name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <Input label="Last Name" autoComplete="family-name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <Input label="Work Email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={[
                { value: 'OPERATIONS', label: 'Operations' }, { value: 'HR', label: 'HR' },
                { value: 'FINANCE', label: 'Finance' }, { value: 'FLEET', label: 'Fleet' },
                { value: 'WAREHOUSE', label: 'Warehouse' }, { value: 'FIELD', label: 'Field' },
              ]} />
              <Input label="Job Title" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              <Input label="Joining Date" type="date" required value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
              <Select label="Access Role" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={isLoadingRoles} options={[
                { value: '', label: isLoadingRoles ? 'Loading roles…' : 'Select a role' },
                ...roles.filter((role) => role.code !== 'TENANT_ADMIN').map((role) => ({ value: role.id, label: role.name })),
              ]} helperText="The role controls this employee’s access within your licensed modules." />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <Button type="button" variant="outline" disabled={inviteMutation.isPending} onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={inviteMutation.isPending} disabled={!roles.length || isLoadingRoles} leftIcon={<Mail className="h-4 w-4" />}>Send Invitation</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={Boolean(editingAccess)} onClose={() => !accessMutation.isPending && setEditingAccess(null)} title="Manage Employee Access" description={editingAccess ? `${editingAccess.firstName} ${editingAccess.lastName} · ${editingAccess.email}` : undefined}>
        <form onSubmit={saveAccess} className="space-y-4">
          {accessError && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-200">{accessError}</div>}
          {rolesError && <div role="alert" className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-200"><span>Could not load employee roles.</span><Button type="button" size="xs" variant="outline" onClick={() => void refetchRoles()}>Retry</Button></div>}
          {accessResult && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-200">{accessResult.message}</div>}
          {accessResult?.invitation_url && (
            <div className="space-y-2">
              <p className="text-xs text-amber-200">Copy this development invitation link for testing:</p>
              <div className="flex gap-2">
                <Input aria-label="Invitation link" value={accessResult.invitation_url} readOnly />
                <Button type="button" variant="outline" leftIcon={copiedAccessLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={async () => {
                  await navigator.clipboard.writeText(accessResult.invitation_url || '');
                  setCopiedAccessLink(true);
                }}>{copiedAccessLink ? 'Copied' : 'Copy'}</Button>
              </div>
            </div>
          )}
          <Select label="Access Role" required value={accessRole} onChange={(e) => setAccessRole(e.target.value)} disabled={isLoadingRoles} options={[
            { value: '', label: isLoadingRoles ? 'Loading roles…' : 'Select a role' },
            ...roles.filter((role) => role.code !== 'TENANT_ADMIN').map((role) => ({ value: role.id, label: role.name })),
          ]} />
          <label className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs">
            <input type="checkbox" className="mt-0.5 accent-blue-500" checked={accessEnabled} onChange={(e) => setAccessEnabled(e.target.checked)} />
            <span><span className="block font-medium text-slate-200">Allow account access</span><span className="mt-1 block text-slate-400">Turn this off to revoke a pending invite or block this employee from signing in to this organization.</span></span>
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <Button type="button" variant="outline" disabled={accessMutation.isPending} onClick={() => setEditingAccess(null)}>Close</Button>
            {editingAccess && ['pending', 'expired', 'revoked'].includes(editingAccess.accountStatus || '') && <Button type="button" variant="outline" isLoading={resendMutation.isPending} disabled={accessMutation.isPending} onClick={() => {
              setAccessError('');
              setAccessResult(null);
              resendMutation.mutate(editingAccess.id);
            }}>Resend Invitation</Button>}
            <Button type="submit" isLoading={accessMutation.isPending} disabled={!accessRole || isLoadingRoles}>Save Access</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
