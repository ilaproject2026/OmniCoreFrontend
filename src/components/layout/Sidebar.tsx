import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  FileText,
  Wrench,
  Boxes,
  DollarSign,
  UserCheck,
  Building2,
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  Receipt,
  Headphones,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Megaphone,
  LifeBuoy,
  PackageCheck,
  Bus,
  Globe,
  Lock,
  KeyRound,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../common/Badge';

export interface SidebarProps {
  isPlatform?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isPlatform = false,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { tenant, packageTier, enabledAddons, can, isModuleAllowedByPlan, isVerticalEnabled, getRequiredTierForModule } = useTenant();
  const { user } = useAuth();

  // Platform / Super Admin Navigation Items
  const platformNav = [
    { label: 'Platform Overview', path: '/platform/dashboard', icon: LayoutDashboard },
    { label: 'Tenants & Provisioning', path: '/platform/tenants', icon: Building2 },
    {
      label: 'Vertical Access & RBAC',
      path: '/platform/roles',
      icon: ShieldCheck,
      badge: 'RBAC',
    },
    { label: 'Packages & Tiers', path: '/platform/packages', icon: Package },
    { label: 'Features & Add-ons', path: '/platform/features', icon: Layers },
    { label: 'Subscriptions', path: '/platform/subscriptions', icon: Receipt },
    { label: 'Sales & Growth', path: '/platform/sales', icon: TrendingUp },
    { label: 'Support & Tickets', path: '/platform/support', icon: Headphones },
    {
      label: 'Platform Audit Log',
      path: '/platform/audit',
      icon: ShieldCheck,
      moduleKey: 'audit',
      isPlanAllowed: isModuleAllowedByPlan('audit'),
      requiredTier: getRequiredTierForModule('audit'),
    },
  ];

  // Tenant Operations Navigation Items (All functions always present, plan & permission-aware indicators)
  const tenantNav = [
    {
      label: 'Operations Hub',
      path: '/app/dashboard',
      icon: LayoutDashboard,
      moduleKey: 'dashboard',
      isAccessible: true,
      isPlanAllowed: true,
    },
    {
      label: 'Fleet Management',
      path: '/app/fleet',
      icon: Truck,
      badge: `${tenant.vehicleCount}`,
      moduleKey: 'fleet',
      isAccessible: can('fleet.view'),
      isPlanAllowed: isModuleAllowedByPlan('fleet'),
      requiredTier: getRequiredTierForModule('fleet'),
      requiredPermission: 'fleet.view',
    },
    {
      label: 'Driver Directory',
      path: '/app/drivers',
      icon: Users,
      moduleKey: 'drivers',
      isAccessible: can('drivers.view'),
      isPlanAllowed: isModuleAllowedByPlan('drivers'),
      requiredTier: getRequiredTierForModule('drivers'),
      requiredPermission: 'drivers.view',
    },
    {
      label: 'Bookings & Dispatch',
      path: '/app/trips',
      icon: Navigation,
      badge: `${tenant.activeTripsCount} live`,
      badgeVariant: 'success' as const,
      moduleKey: 'trips',
      isAccessible: can('trips.view'),
      isPlanAllowed: isModuleAllowedByPlan('trips'),
      requiredTier: getRequiredTierForModule('trips'),
      requiredPermission: 'trips.view',
    },
    {
      label: 'Courier & Express',
      path: '/app/courier',
      icon: PackageCheck,
      badge: !isVerticalEnabled('courier_express') ? 'Vertical Req' : 'AWB Hub',
      badgeVariant: (!isVerticalEnabled('courier_express') ? 'warning' : 'success') as any,
      moduleKey: 'courier',
      isAccessible: can('courier.view'),
      isPlanAllowed: isModuleAllowedByPlan('courier') && isVerticalEnabled('courier_express'),
      requiredTier: getRequiredTierForModule('courier'),
      requiredPermission: 'courier.view',
    },
    {
      label: 'Corporate Shuttle',
      path: '/app/shuttle',
      icon: Bus,
      badge: !isVerticalEnabled('corporate_shuttle') ? 'Vertical Req' : 'Routes',
      badgeVariant: (!isVerticalEnabled('corporate_shuttle') ? 'warning' : 'default') as any,
      moduleKey: 'shuttle',
      isAccessible: can('shuttle.view'),
      isPlanAllowed: isModuleAllowedByPlan('shuttle') && isVerticalEnabled('corporate_shuttle'),
      requiredTier: getRequiredTierForModule('shuttle'),
      requiredPermission: 'shuttle.view',
    },
    {
      label: 'Contracts & Tenders',
      path: '/app/contracts',
      icon: FileText,
      moduleKey: 'contracts',
      isAccessible: can('contract.view'),
      isPlanAllowed: isModuleAllowedByPlan('contracts'),
      requiredTier: getRequiredTierForModule('contracts'),
      requiredPermission: 'contract.view',
    },
    {
      label: 'Workshop & Maintenance',
      path: '/app/maintenance',
      icon: Wrench,
      moduleKey: 'maintenance',
      isAccessible: can('maintenance.view'),
      isPlanAllowed: isModuleAllowedByPlan('maintenance'),
      requiredTier: getRequiredTierForModule('maintenance'),
      requiredPermission: 'maintenance.view',
    },
    {
      label: 'Warehouse & Spare Parts',
      path: '/app/warehouse',
      icon: Boxes,
      moduleKey: 'warehouse',
      isAccessible: can('warehouse.view'),
      isPlanAllowed: isModuleAllowedByPlan('warehouse'),
      requiredTier: getRequiredTierForModule('warehouse'),
      requiredPermission: 'warehouse.view',
    },
    {
      label: 'CRM & Pipeline',
      path: '/app/crm',
      icon: UserCheck,
      moduleKey: 'crm',
      isAccessible: can('crm.view'),
      isPlanAllowed: isModuleAllowedByPlan('crm'),
      requiredTier: getRequiredTierForModule('crm'),
      requiredPermission: 'crm.view',
    },
    {
      label: 'Finance & Invoicing',
      path: '/app/finance',
      icon: DollarSign,
      moduleKey: 'finance',
      isAccessible: can('finance.view'),
      isPlanAllowed: isModuleAllowedByPlan('finance'),
      requiredTier: getRequiredTierForModule('finance'),
      requiredPermission: 'finance.view',
    },
    {
      label: 'HR & Personnel',
      path: '/app/hr',
      icon: Users,
      moduleKey: 'hr',
      isAccessible: can('hr.view'),
      isPlanAllowed: isModuleAllowedByPlan('hr'),
      requiredTier: getRequiredTierForModule('hr'),
      requiredPermission: 'hr.view',
    },
    {
      label: 'Insurance & Claims',
      path: '/app/insurance',
      icon: ShieldCheck,
      moduleKey: 'insurance',
      isAccessible: can('insurance.view'),
      isPlanAllowed: isModuleAllowedByPlan('insurance'),
      requiredTier: getRequiredTierForModule('insurance'),
      requiredPermission: 'insurance.view',
    },
    {
      label: 'Marketing Campaigns',
      path: '/app/marketing',
      icon: Megaphone,
      moduleKey: 'marketing',
      isAccessible: can('marketing.view'),
      isPlanAllowed: isModuleAllowedByPlan('marketing'),
      requiredTier: getRequiredTierForModule('marketing'),
      requiredPermission: 'marketing.view',
    },
    {
      label: 'Public Booking Portal',
      path: `/public/${tenant?.slug || tenant?.id || 'workspace'}`,
      icon: Globe,
      badge: 'Live',
      moduleKey: 'public_portal',
      isAccessible: true,
      isPlanAllowed: isModuleAllowedByPlan('public_portal'),
      requiredTier: getRequiredTierForModule('public_portal'),
      external: true,
    },
    {
      label: 'Reports & Analytics',
      path: '/app/reports',
      icon: FileBarChart,
      moduleKey: 'reports',
      isAccessible: can('reports.view'),
      isPlanAllowed: isModuleAllowedByPlan('reports'),
      requiredTier: getRequiredTierForModule('reports'),
      requiredPermission: 'reports.view',
    },
    {
      label: 'Tenant Settings',
      path: '/app/settings',
      icon: Settings,
      moduleKey: 'settings',
      isAccessible: can('tenant.manage') || user?.tenantRole === 'tenant_admin' || user?.tenantRole === 'customer_admin' || Boolean(user?.isPlatformUser || user?.platformRole === 'omnicore_admin' || user?.platformRole === 'super_admin'),
      isPlanAllowed: true,
      requiredPermission: 'tenant.manage',
    },
  ];

  const isSuperAdmin = Boolean(user?.isPlatformUser || user?.platformRole === 'super_admin' || user?.platformRole === 'omnicore_admin');
  const showPlatformSection = isPlatform || isSuperAdmin;

  const renderNavGroup = (navItems: typeof platformNav | typeof tenantNav, groupTitle?: string, groupBadge?: string) => (
    <div className="space-y-1">
      {!collapsed && groupTitle && (
        <div className="px-3 pb-1 pt-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            {groupTitle}
          </span>
          {groupBadge && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60 font-semibold">
              {groupBadge}
            </span>
          )}
        </div>
      )}
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/app/dashboard' && item.path !== '/platform/dashboard' && location.pathname.startsWith(item.path));
        const isPlanAllowed = (item as any).isPlanAllowed !== false;
        const isAccessible = (item as any).isAccessible !== false;
        const isFullyActive = isPlanAllowed && isAccessible;
        const requiredTier = (item as any).requiredTier;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            target={(item as any).external ? '_blank' : undefined}
            rel={(item as any).external ? 'noopener noreferrer' : undefined}
            onClick={onCloseMobile}
            title={
              collapsed
                ? `${item.label}${!isPlanAllowed ? ` (${requiredTier?.toUpperCase()} Plan Required)` : !isAccessible ? ' (Role Restricted)' : ''}`
                : undefined
            }
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all group relative',
              isActive
                ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                : isFullyActive
                ? 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                : !isPlanAllowed
                ? 'text-purple-300/80 hover:bg-purple-950/20 hover:text-purple-200'
                : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive
                  ? 'text-white'
                  : isFullyActive
                  ? 'text-slate-400 group-hover:text-blue-400'
                  : !isPlanAllowed
                  ? 'text-purple-400/90 group-hover:text-purple-300'
                  : 'text-slate-500'
              )}
            />
            {!collapsed && (
              <>
                <span
                  className={cn(
                    'truncate flex-1',
                    !isFullyActive && !isPlanAllowed && 'text-slate-300',
                    !isFullyActive && isPlanAllowed && 'text-slate-400'
                  )}
                >
                  {item.label}
                </span>

                {!isPlanAllowed ? (
                  <span
                    title={`This module requires the ${requiredTier?.toUpperCase()} Plan`}
                    className="flex items-center gap-1 rounded bg-purple-950/70 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/30 shrink-0 uppercase font-mono shadow-sm"
                  >
                    <Lock className="h-2.5 w-2.5 text-purple-400" />
                    <span>{requiredTier}+</span>
                  </span>
                ) : !isAccessible ? (
                  <span
                    title="Permission required for your role"
                    className="flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-medium text-amber-400/90 border border-amber-500/20 shrink-0"
                  >
                    <Lock className="h-2.5 w-2.5" />
                    <span>Restricted</span>
                  </span>
                ) : (item as any).badge ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-bold shrink-0',
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                    )}
                  >
                    {(item as any).badge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-[#0f172a] transition-all duration-300 lg:static',
          collapsed ? 'w-18' : 'w-64',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
              OC
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight text-white block truncate">
                  Omni<span className="text-blue-400">Core</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block -mt-1">
                  {isSuperAdmin ? 'Super Admin Ecosystem' : 'Fleet Ecosystem'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Tenant Vertical & Subscription Plan Badge in Sidebar */}
        {!collapsed && (
          <div className="px-4 py-2.5 bg-[#0b0f17]/60 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Subscription Plan:</span>
              <span className="font-semibold text-blue-400 uppercase tracking-wider font-mono">
                {packageTier}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-200 truncate max-w-[135px] font-medium" title={tenant.name}>
                {tenant?.name}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                {tenant?.status}
              </span>
            </div>
            {tenant?.verticals && tenant?.verticals?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {tenant?.verticals?.slice(0, 2)?.map((v) => (
                  <span
                    key={v}
                    className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-300 capitalize"
                  >
                    {v?.replace('_', ' ')}
                  </span>
                ))}
                {tenant?.verticals?.length > 2 && (
                  <span className="rounded bg-slate-800/80 px-1 py-0.5 text-[9px] text-slate-400 font-mono">
                    +{tenant?.verticals?.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {showPlatformSection && (
            <div>
              {renderNavGroup(platformNav, 'Platform Governance', 'Super Admin')}
            </div>
          )}

          <div className={cn(showPlatformSection && 'pt-2 border-t border-slate-800/80')}>
            {renderNavGroup(
              tenantNav,
              showPlatformSection ? 'Workspace Operations' : undefined,
              showPlatformSection ? `${packageTier.toUpperCase()} PLAN` : undefined
            )}
          </div>
        </div>

        {/* Bottom Support / SLA info */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-800/80 bg-[#0b0f17]/40">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-cyan-400" />
                <span className="text-[11px] font-medium text-slate-300">
                  {isSuperAdmin ? 'Platform SLA Healthy' : 'Mission SLA Active'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isSuperAdmin ? 'Full Entitlement Access Active' : '24/7 Telemetry Stream'}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
