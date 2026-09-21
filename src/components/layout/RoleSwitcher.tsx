import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { User, TenantRole } from '../../types';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Mail,
  LogOut,
  Crown,
  Building2,
  Briefcase,
  Truck,
  DollarSign,
  Users,
  KeyRound,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const RoleSwitcher: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { permissions, customRolePermissions } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (u: User) => {
    if (u.isPlatformUser) return { label: 'Platform Super Admin', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
    switch (u.tenantRole) {
      case 'tenant_admin':
        return { label: 'Tenant Admin', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
      case 'operations_manager':
        return { label: 'Operations Mgr', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      case 'fleet_manager':
        return { label: 'Fleet Mgr', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' };
      case 'finance_user':
        return { label: 'Finance User', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'hr_user':
        return { label: 'HR User', color: 'text-pink-400 bg-pink-500/15 border-pink-500/30' };
      case 'driver_field_user':
        return { label: 'Driver / Field', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
      default:
        return { label: u.tenantRole || 'User', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' };
    }
  };

  const currentBadge = user ? getRoleBadge(user) : { label: 'Active Session', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' };

  const ROLES_LIST: { id: TenantRole | 'super_admin'; name: string; icon: React.ElementType; note: string }[] = [
    {
      id: 'super_admin',
      name: 'Platform Super Admin',
      icon: Crown,
      note: 'Supreme power (*), controls everything & customizes roles',
    },
    {
      id: 'tenant_admin',
      name: 'Tenant Admin',
      icon: Building2,
      note: 'All tenant functions (Fleet, Drivers, Trips, Settings)',
    },
    {
      id: 'operations_manager',
      name: 'Operations Manager',
      icon: Briefcase,
      note: 'Finance, HR, Insurance, Marketing, Reports (No fleet/trips)',
    },
    {
      id: 'fleet_manager',
      name: 'Fleet Manager',
      icon: Truck,
      note: 'Fleet, Drivers, Maintenance, Warehouse, Trips',
    },
    {
      id: 'finance_user',
      name: 'Finance User',
      icon: DollarSign,
      note: 'Finance, Invoicing, Contracts, Payroll, Reports',
    },
    {
      id: 'hr_user',
      name: 'HR Personnel',
      icon: Users,
      note: 'HR, Drivers, Payroll, Reports',
    },
    {
      id: 'driver_field_user',
      name: 'Driver / Field User',
      icon: Truck,
      note: 'Assigned Trips & Telemetry view only',
    },
  ];

  const activeRoleId = user?.isPlatformUser ? 'super_admin' : (user?.tenantRole || 'tenant_admin');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
        title="Authenticated Profile & Role Switcher"
      >
        <UserCheck className="h-3.5 w-3.5 text-blue-400" />
        <span className="font-medium hidden sm:inline">{user?.firstName || 'Account'}:</span>
        <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-semibold border', currentBadge.color)}>
          {currentBadge.label}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-[#0f172a] p-3.5 shadow-2xl z-40 space-y-3">
            {/* Session Info */}
            <div className="border-b border-slate-800 pb-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Session Profile
                </p>
                <span className="font-mono text-emerald-400 text-[10px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> {user?.isPlatformUser ? 'All Platform' : 'Tenant Isolated'}
                </span>
              </div>
              <p className="text-xs font-semibold text-white mt-1">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <Mail className="h-3 w-3" />
                <span className="truncate">{user?.email || 'admin@omnicore.io'}</span>
              </div>
            </div>

            {/* Quick Role Switcher */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-300">Switch Simulated Role:</span>
                <span className="text-[10px] text-slate-500">Live preview</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {ROLES_LIST.map((r) => {
                  const isCurrent = activeRoleId === r.id;
                  const Icon = r.icon;
                  const hasCustom = r.id !== 'super_admin' && Boolean(customRolePermissions[r.id]);

                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        switchRole(r.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full text-left p-2 rounded-lg border transition-all flex items-start justify-between cursor-pointer select-none text-xs',
                        isCurrent
                          ? 'bg-blue-950/40 border-blue-500/60 text-white'
                          : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex items-start gap-2 min-w-0 pr-1">
                        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', isCurrent ? 'text-blue-400' : 'text-slate-400')} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-white truncate">{r.name}</span>
                            {hasCustom && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">Custom</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{r.note}</p>
                        </div>
                      </div>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Super Admin Manage Permissions Link */}
            {user?.isPlatformUser && (
              <div className="pt-1">
                <Link
                  to="/platform/roles"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-semibold bg-purple-950/40 border border-purple-800/50 text-purple-300 hover:bg-purple-900/50 transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  <span>Customize Role Permissions</span>
                </Link>
              </div>
            )}

            {/* Sign Out */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

