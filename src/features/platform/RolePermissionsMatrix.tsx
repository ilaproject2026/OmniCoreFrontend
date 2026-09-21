import React, { useState } from 'react';
import { useTenant, ROLE_DEFAULT_PERMISSIONS } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { TenantRole } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import {
  Crown,
  Building2,
  Briefcase,
  Truck,
  DollarSign,
  Users,
  Boxes,
  UserCheck,
  Check,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PermissionDefinition {
  key: string;
  name: string;
  description: string;
}

interface PermissionCategory {
  category: string;
  icon: React.ElementType;
  permissions: PermissionDefinition[];
}

const PERMISSION_CATALOG: PermissionCategory[] = [
  {
    category: 'Financials & Invoicing',
    icon: DollarSign,
    permissions: [
      { key: 'finance.view', name: 'View Financial Ledgers', description: 'Access revenue metrics, P&L, and accounts receivable' },
      { key: 'finance.manage', name: 'Manage Invoicing & Billing', description: 'Create and dispatch commercial freight invoices' },
      { key: 'contracts.view', name: 'View Client Contracts', description: 'Inspect enterprise SLAs and rate cards' },
      { key: 'contracts.manage', name: 'Execute Contracts & Tenders', description: 'Sign, update, and archive B2B client contracts' },
      { key: 'insurance.view', name: 'View Insurance & Claims', description: 'Access liability policies and claim histories' },
      { key: 'insurance.manage', name: 'Manage Insurance Claims', description: 'File damage claims and adjuster documentation' },
    ],
  },
  {
    category: 'HR & Personnel',
    icon: Users,
    permissions: [
      { key: 'hr.view', name: 'View HR Directory', description: 'Access employee personnel files, certifications, and shift rosters' },
      { key: 'hr.manage', name: 'Manage HR & Onboarding', description: 'Hire, promote, and update staff records' },
      { key: 'payroll.view', name: 'View Payroll & Compensation', description: 'Inspect wage rates, overtime, and driver payouts' },
      { key: 'payroll.manage', name: 'Approve & Disburse Payroll', description: 'Trigger payroll batch runs and deductions' },
    ],
  },
  {
    category: 'Commercial & Marketing',
    icon: UserCheck,
    permissions: [
      { key: 'crm.view', name: 'View CRM & Pipeline', description: 'Browse enterprise lead accounts and deal pipeline' },
      { key: 'crm.manage', name: 'Manage CRM & Opportunities', description: 'Convert leads, set stages, and log calls' },
      { key: 'marketing.view', name: 'View Marketing Campaigns', description: 'Inspect campaign engagement and conversion rates' },
      { key: 'marketing.manage', name: 'Launch Campaigns & Promotions', description: 'Create coupon codes, email blasts, and portal promotions' },
    ],
  },
  {
    category: 'Analytics & Reports',
    icon: Sparkles,
    permissions: [
      { key: 'reports.view', name: 'View Analytics Dashboards', description: 'Access operational, financial, and safety metrics' },
      { key: 'reports.export', name: 'Export Data & Reports', description: 'Download CSV/PDF reports and audit summaries' },
      { key: 'reports.custom', name: 'Build Custom BI Queries', description: 'Design custom SQL queries and executive reports' },
    ],
  },
  {
    category: 'Fleet & Vehicle Operations',
    icon: Truck,
    permissions: [
      { key: 'fleet.view', name: 'View Fleet Inventory', description: 'Inspect vehicles, telematics sensors, and live status' },
      { key: 'fleet.manage', name: 'Manage Fleet Assets', description: 'Acquire, retire, and configure vehicles' },
      { key: 'maintenance.view', name: 'View Maintenance & Workshop', description: 'Track work orders and inspection cycles' },
      { key: 'maintenance.manage', name: 'Create Workshop Orders', description: 'Approve mechanics and service logs' },
      { key: 'warehouse.view', name: 'View Warehouse Inventory', description: 'Browse SKUs, cross-docking bays, and parts' },
      { key: 'warehouse.manage', name: 'Manage Warehouse Logistics', description: 'Stock inbound/outbound freight and bins' },
    ],
  },
  {
    category: 'Workforce Drivers & Dispatch',
    icon: Users,
    permissions: [
      { key: 'drivers.view', name: 'View Driver Directory', description: 'Inspect CDL licenses, medical cards, and hours of service' },
      { key: 'drivers.manage', name: 'Manage Driver Profiles', description: 'Assign drivers, issue warnings, and update qualifications' },
      { key: 'trips.view', name: 'View Trips & Booking Orders', description: 'Track live dispatch, waybills, and routes' },
      { key: 'trips.dispatch', name: 'Assign & Dispatch Trips', description: 'Match vehicles, assign drivers, and trigger trip orders' },
      { key: 'trips.manage', name: 'Full Trip Management', description: 'Cancel, reschedule, and adjust completed trips' },
      { key: 'courier.view', name: 'View Courier Shipments', description: 'Track last-mile packages and AWBs' },
      { key: 'courier.manage', name: 'Manage Courier Manifests', description: 'Consolidate parcel routes and generate labels' },
      { key: 'shuttle.view', name: 'View Corporate Shuttle', description: 'Monitor commuter buses and passenger manifests' },
      { key: 'shuttle.manage', name: 'Manage Shuttle Schedules', description: 'Define fixed commuter routes and stops' },
    ],
  },
];

const MANAGED_ROLES: { role: TenantRole; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  {
    role: 'operations_manager',
    label: 'Operations Manager',
    icon: Briefcase,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    desc: 'Finance, HR, Insurance claims, Marketing campaigns, and Reports analysis.',
  },
  {
    role: 'fleet_manager',
    label: 'Fleet Manager',
    icon: Truck,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    desc: 'Vehicles, telematics, drivers, workshop maintenance, and spare parts.',
  },
  {
    role: 'finance_user',
    label: 'Finance User',
    icon: DollarSign,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    desc: 'Billing, invoicing, contracts, payroll ledgers, and financial reports.',
  },
  {
    role: 'hr_user',
    label: 'HR Personnel',
    icon: Users,
    color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    desc: 'Employee files, driver onboarding, payroll records, and compliance.',
  },
  {
    role: 'warehouse_user',
    label: 'Warehouse Supervisor',
    icon: Boxes,
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    desc: 'Inventory bins, cross-docking logistics, and maintenance parts.',
  },
  {
    role: 'sales_crm_user',
    label: 'Sales & CRM Lead',
    icon: UserCheck,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    desc: 'Leads pipeline, marketing promotions, contracts, and CRM accounts.',
  },
  {
    role: 'driver_field_user',
    label: 'Driver / Field User',
    icon: Truck,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    desc: 'Assigned trip execution, dispatch orders, and vehicle telemetry view.',
  },
];

export const RolePermissionsMatrix: React.FC = () => {
  const { user } = useAuth();
  const { customRolePermissions, updateRolePermissions, resetRolePermissions } = useTenant();

  const [selectedRole, setSelectedRole] = useState<TenantRole>('operations_manager');
  const [customInputKey, setCustomInputKey] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  const isSuperAdmin = Boolean(user?.isPlatformUser || user?.platformRole === 'super_admin');

  // Current active permissions for the selected role
  const activeCustomOverride = customRolePermissions[selectedRole];
  const currentPermissions = activeCustomOverride || ROLE_DEFAULT_PERMISSIONS[selectedRole] || [];

  const handleTogglePermission = (permKey: string) => {
    if (!isSuperAdmin) return;
    const exists = currentPermissions.includes(permKey);
    const updated = exists
      ? currentPermissions.filter((p) => p !== permKey)
      : [...currentPermissions, permKey];

    updateRolePermissions(selectedRole, updated);
    triggerSavedNotice();
  };

  const handleToggleCategory = (categoryPerms: PermissionDefinition[], enable: boolean) => {
    if (!isSuperAdmin) return;
    const keys = categoryPerms.map((p) => p.key);
    let updated: string[];
    if (enable) {
      updated = Array.from(new Set([...currentPermissions, ...keys]));
    } else {
      updated = currentPermissions.filter((p) => !keys.includes(p));
    }
    updateRolePermissions(selectedRole, updated);
    triggerSavedNotice();
  };

  const handleAddCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputKey.trim() || !isSuperAdmin) return;
    const key = customInputKey.trim().toLowerCase();
    if (!currentPermissions.includes(key)) {
      updateRolePermissions(selectedRole, [...currentPermissions, key]);
      triggerSavedNotice();
    }
    setCustomInputKey('');
  };

  const handleResetRole = () => {
    if (!isSuperAdmin) return;
    resetRolePermissions(selectedRole);
    triggerSavedNotice();
  };

  const triggerSavedNotice = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Role Permissions & RBAC Matrix</h1>
            <Badge variant="purple" className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-300" /> Platform Super Admin Control
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure, customize, grant, and revoke granular operational permissions across all tenant roles.
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse">
            <CheckCircle2 className="h-4 w-4" /> Customized Permissions Persisted!
          </div>
        )}
      </div>

      {/* Role Hierarchy Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-400" /> 1. Platform Super Admin
            </span>
            <Badge variant="purple" size="xs">Supreme (*)</Badge>
          </div>
          <p className="text-[11px] text-slate-300">
            Supreme authority across the entire platform. Controls everything, overrides all boundaries, and customizes permissions for any role.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-400" /> 2. Tenant Admin
            </span>
            <Badge variant="info" size="xs">Tenant (*)</Badge>
          </div>
          <p className="text-[11px] text-slate-300">
            Manages literally anything within the tenant boundary (Fleet, Drivers, Dispatch, Operations, Warehouse, Settings), subordinate to Super Admin.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-emerald-400" /> 3. Operations Manager
            </span>
            <Badge variant="success" size="xs">Customized Scope</Badge>
          </div>
          <p className="text-[11px] text-slate-300">
            Handles Financial details, HR & personnel, Insurance claims, Marketing campaigns, and Reports analytics (No Fleet/Driver/Trips).
          </p>
        </div>
      </div>

      {/* Super Admin Status Notice */}
      {!isSuperAdmin && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center gap-3 text-xs text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            You are currently viewing role permissions in read-only mode. Switch to the <strong>Platform Super Admin</strong> role via the top-right profile switcher to customize and modify permissions.
          </span>
        </div>
      )}

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-800 pb-3">
        {MANAGED_ROLES.map((r) => {
          const isSelected = selectedRole === r.role;
          const hasOverride = Boolean(customRolePermissions[r.role]);
          const Icon = r.icon;

          return (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border select-none',
                isSelected
                  ? 'bg-slate-800 border-blue-500 text-white shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isSelected ? 'text-blue-400' : 'text-slate-400')} />
              <span>{r.label}</span>
              {hasOverride && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" title="Customized override active" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Role Configuration Header */}
      {(() => {
        const roleMeta = MANAGED_ROLES.find((r) => r.role === selectedRole);
        const Icon = roleMeta?.icon || Briefcase;

        return (
          <Card className="p-4 bg-slate-900/80 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl border', roleMeta?.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{roleMeta?.label} Permissions</h3>
                  {activeCustomOverride ? (
                    <Badge variant="warning" size="xs">Customized Override Active</Badge>
                  ) : (
                    <Badge variant="outline" size="xs">Factory System Defaults</Badge>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{roleMeta?.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeCustomOverride && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetRole}
                  disabled={!isSuperAdmin}
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  Reset to Defaults
                </Button>
              )}
              <div className="text-right text-xs">
                <span className="text-slate-400">Active Permissions: </span>
                <span className="font-mono font-bold text-emerald-400">{currentPermissions.length}</span>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Permissions Grid by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERMISSION_CATALOG.map((cat) => {
          const Icon = cat.icon;
          const enabledCount = cat.permissions.filter((p) => currentPermissions.includes(p.key)).length;
          const isAllEnabled = enabledCount === cat.permissions.length;

          return (
            <Card key={cat.category} className="p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-400" />
                    <h4 className="font-bold text-white text-xs">{cat.category}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {enabledCount}/{cat.permissions.length}
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleToggleCategory(cat.permissions, !isAllEnabled)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline ml-1"
                      >
                        {isAllEnabled ? 'Disable All' : 'Enable All'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {cat.permissions.map((perm) => {
                    const isChecked = currentPermissions.includes(perm.key) || currentPermissions.includes('*');

                    return (
                      <div
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={cn(
                          'p-2.5 rounded-lg border transition-all flex items-center justify-between text-xs select-none',
                          isSuperAdmin ? 'cursor-pointer hover:border-slate-600' : 'cursor-default',
                          isChecked
                            ? 'bg-blue-950/20 border-blue-500/40 text-slate-200'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-400 opacity-70'
                        )}
                      >
                        <div className="pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{perm.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({perm.key})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{perm.description}</p>
                        </div>

                        <div
                          className={cn(
                            'h-5 w-5 rounded shrink-0 flex items-center justify-center transition-all',
                            isChecked
                              ? 'bg-blue-600 text-white shadow'
                              : 'border border-slate-700 bg-slate-800/50'
                          )}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custom Capability Input for Super Admin */}
      {isSuperAdmin && (
        <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                Add Custom Capability String for {MANAGED_ROLES.find((r) => r.role === selectedRole)?.label}
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Grant specialized permission tags such as &quot;reports.custom&quot;, &quot;payroll.export&quot;, or domain wildcards &quot;finance.*&quot;.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddCustomKey} className="flex gap-2">
            <Input
              placeholder="e.g. compliance.audit, export.raw, finance.*"
              value={customInputKey}
              onChange={(e) => setCustomInputKey(e.target.value)}
              className="text-xs h-9"
            />
            <Button type="submit" variant="primary" size="sm" className="h-9 shrink-0 text-xs">
              Grant Capability
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};
