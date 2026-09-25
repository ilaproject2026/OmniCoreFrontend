import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { User, TenantRole } from '../../types';
import { Link, useLocation } from 'react-router-dom';
import {
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Mail,
  LogOut,
  Crown,
  Building2,
  Briefcase,
  KeyRound,
  LayoutDashboard,
  Database,
  CreditCard,
  Truck,
  Check,
  Navigation,
  Users,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useClickOutside } from '../../hooks/useClickOutside';

export const RoleSwitcher: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const isSuperAdmin = Boolean(user?.isPlatformUser || user?.platformRole === 'omnicore_admin' || user?.platformRole === 'super_admin');
  const activeRoleId: TenantRole | 'super_admin' = isSuperAdmin ? 'super_admin' : (user?.tenantRole || 'customer_admin');

  const getRoleBadge = (u: User) => {
    if (u.isPlatformUser || u.platformRole === 'omnicore_admin' || u.platformRole === 'super_admin') {
      return { label: 'OmniCore Project Admin', color: 'text-purple-300 bg-purple-500/15 border-purple-500/30' };
    }
    switch (u.tenantRole) {
      case 'customer_admin':
      case 'tenant_admin':
        return { label: 'Customer Admin', color: 'text-blue-300 bg-blue-500/15 border-blue-500/30' };
      case 'vertical_operator':
        return { label: 'Vertical Operator', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' };
      case 'customer_staff':
        return { label: 'Customer Staff', color: 'text-slate-300 bg-slate-500/15 border-slate-500/30' };
      default:
        return { label: u.tenantRole || 'User', color: 'text-slate-300 bg-slate-500/15 border-slate-500/30' };
    }
  };

  const currentBadge = user ? getRoleBadge(user) : { label: 'Active Session', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' };
  const dedicatedDbName = (tenant as any)?.database || `${tenant?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'tenant'}_db`;
  const activePlan = tenant?.subscription?.package || (tenant as any)?.plan || 'Enterprise';

  const ROLES_LIST: { id: TenantRole | 'super_admin'; name: string; icon: React.ElementType; note: string; badge: string; color: string }[] = [
    {
      id: 'super_admin',
      name: 'OmniCore Project Admin',
      icon: Crown,
      badge: 'Super Admin',
      color: 'text-purple-400',
      note: 'Main project administrator: controls tenants, contracts, and grants vertical service access',
    },
    {
      id: 'customer_admin',
      name: 'Customer Admin (Org Manager)',
      icon: Building2,
      badge: 'Customer Admin',
      color: 'text-blue-400',
      note: 'Customer organization manager with access strictly to verticals granted by OmniCore',
    },
    {
      id: 'vertical_operator',
      name: 'Vertical Operations Staff',
      icon: Navigation,
      badge: 'Operations',
      color: 'text-emerald-400',
      note: 'Daily dispatch and operational execution within the customer active service verticals',
    },
    {
      id: 'customer_staff',
      name: 'Customer Staff Member',
      icon: Users,
      badge: 'Staff',
      color: 'text-slate-400',
      note: 'Operational viewer & assistant across active organization workflows',
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
        title="Role Switcher & Profile Details"
      >
        <UserCheck className="h-3.5 w-3.5 text-blue-400" />
        <span className="font-medium hidden sm:inline">{user?.firstName || 'Account'}:</span>
        <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-semibold border', currentBadge.color)}>
          {currentBadge.label}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 rounded-xl border border-slate-700 bg-[#0f172a] p-3.5 shadow-2xl z-40 space-y-3">
          {/* User Session Info */}
          <div className="border-b border-slate-800 pb-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                User Profile
              </p>
              <span className="font-mono text-emerald-400 text-[10px] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Tenant Isolated
              </span>
            </div>
            <p className="text-xs font-semibold text-white mt-1">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{user?.email || 'admin@omnicore.io'}</span>
            </div>
          </div>

          {/* Organization & Dedicated Database Info */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="font-medium text-slate-200 truncate">{tenant?.name || 'Organization'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                {activePlan} Plan
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Database className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate">DB: {dedicatedDbName}</span>
            </div>
          </div>

          {/* Role Switcher Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Role
              </p>
              <span className="text-[10px] text-slate-500">Live Permissions</span>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
              {ROLES_LIST.map((r) => {
                const isCurrent = activeRoleId === r.id;
                const Icon = r.icon;

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
                        ? 'bg-blue-950/40 border-blue-500/60 text-white shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex items-start gap-2 min-w-0 pr-1">
                      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', isCurrent ? 'text-blue-400' : r.color)} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white truncate">{r.name}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60 font-semibold">
                            {r.badge}
                          </span>
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

          {/* Workspace Navigation Links */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Workspace Navigation
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              <Link
                to="/platform/dashboard"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg p-2 text-xs border transition-all',
                  location.pathname.startsWith('/platform')
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                )}
              >
                <Crown className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="truncate font-medium">Super Admin</span>
              </Link>

              <Link
                to="/app/dashboard"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg p-2 text-xs border transition-all',
                  location.pathname.startsWith('/app')
                    ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                )}
              >
                <Truck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate font-medium">Operations</span>
              </Link>
            </div>

            {isSuperAdmin && (
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <Link
                  to="/platform/roles"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-medium bg-slate-900/40 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <KeyRound className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="truncate">Roles Matrix</span>
                </Link>
                <Link
                  to="/platform/subscriptions"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-medium bg-slate-900/40 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <CreditCard className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">Plan Details</span>
                </Link>
              </div>
            )}
          </div>

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
      )}
    </div>
  );
};

