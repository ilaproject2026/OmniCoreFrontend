import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { TenantRole, VerticalType } from '../../types';
import { platformApi } from '../../api/platform.api';
import { VERTICALS } from '../../config/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { PhoneNumberInput } from '../../components/common/PhoneNumberInput';
import {
  Crown,
  Building2,
  Truck,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  Edit3,
  Mail,
  Phone,
  X,
  UserPlus,
  Navigation,
  ShieldCheck,
  PackageCheck,
  Bus,
  Car,
  Snowflake,
  Wrench,
  FileText,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type CoreRole =
  | 'omnicore_admin'
  | 'super_admin'
  | 'customer_admin'
  | 'tenant_admin'
  | 'vertical_operator'
  | 'customer_staff';

export interface AssignedRoleUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: CoreRole;
  customRoleTitle?: string;
  tenantId: string;
  tenantName: string;
  status: 'active' | 'invited' | 'disabled';
  assignedAt: string;
  lastActive: string;
}

export const ROLE_CONFIG: Record<
  CoreRole,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    badgeVariant: 'purple' | 'info' | 'success' | 'warning' | 'default';
    desc: string;
    permissionsSummary: string;
  }
> = {
  omnicore_admin: {
    label: 'OmniCore Project Admin',
    icon: Crown,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30 ring-purple-500/20',
    badgeVariant: 'purple',
    desc: 'Main project administrator. Controls all customer workspaces and grants access to specific service verticals.',
    permissionsSummary: 'Full Project Authority & Vertical Provisioner (*)',
  },
  super_admin: {
    label: 'OmniCore Project Admin',
    icon: Crown,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30 ring-purple-500/20',
    badgeVariant: 'purple',
    desc: 'Main project administrator. Controls all customer workspaces and grants access to specific service verticals.',
    permissionsSummary: 'Full Project Authority & Vertical Provisioner (*)',
  },
  customer_admin: {
    label: 'Customer Admin (Org Manager)',
    icon: Building2,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 ring-blue-500/20',
    badgeVariant: 'info',
    desc: 'Customer organization manager. Operates fleet, drivers, dispatch, and billing within granted service verticals.',
    permissionsSummary: 'Customer Workspace Authority (Active Verticals)',
  },
  tenant_admin: {
    label: 'Customer Admin (Org Manager)',
    icon: Building2,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 ring-blue-500/20',
    badgeVariant: 'info',
    desc: 'Customer organization manager. Operates fleet, drivers, dispatch, and billing within granted service verticals.',
    permissionsSummary: 'Customer Workspace Authority (Active Verticals)',
  },
  vertical_operator: {
    label: 'Vertical Operations Staff',
    icon: Navigation,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 ring-emerald-500/20',
    badgeVariant: 'success',
    desc: 'Operational dispatchers, agents, and drivers executing workflows within active contracted service verticals.',
    permissionsSummary: 'Dispatch & Operations (Contracted Verticals)',
  },
  customer_staff: {
    label: 'Customer Staff Member',
    icon: Users,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30 ring-slate-500/20',
    badgeVariant: 'default',
    desc: 'General staff viewer assisting with active customer workflows and tracking.',
    permissionsSummary: 'Operational Viewer & Task Assistant',
  },
};

// Core supported service verticals for customer contracting
const SERVICE_VERTICAL_CATALOG: {
  key: VerticalType;
  title: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    key: 'courier_express',
    title: 'Courier & Express Delivery',
    tagline: 'AWB generation, sorting hubs, e-PoD verification, agent commissions',
    icon: PackageCheck,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
  },
  {
    key: 'tourist_bus',
    title: 'Tourist Bus & Commercial Coach',
    tagline: 'Intercity scheduled routes, seat allocations, charter tours, passenger manifests',
    icon: Bus,
    color: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
  },
  {
    key: 'tourist_taxi',
    title: 'Tourist Taxi & Cab Fleet',
    tagline: 'Chauffeur tariffs, airport flight sync, multilingual itineraries, point-to-point',
    icon: Car,
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
  },
  {
    key: 'corporate_shuttle',
    title: 'Corporate Commuter Shuttle',
    tagline: 'Bus pooling, fixed employee routes, timetable schedules, QR passenger boarding',
    icon: Bus,
    color: 'text-teal-400 border-teal-500/30 bg-teal-950/20',
  },
  {
    key: 'cold_chain',
    title: 'Cold-Chain & Reefer Fleet',
    tagline: 'Pharma & food temperature telemetry, sensor breach alarms, SLA compliance',
    icon: Snowflake,
    color: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
  },
  {
    key: 'freight_logistics',
    title: 'Goods & Freight Logistics',
    tagline: 'FTL/LTL cargo, linehaul multi-drop, weighbridge sync, cross-docking',
    icon: Truck,
    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20',
  },
  {
    key: 'heavy_machinery',
    title: 'Specialized Heavy Machinery',
    tagline: 'Over-dimensional cargo (ODC), hydraulic axles, route permits, escort vehicles',
    icon: Wrench,
    color: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
  },
  {
    key: 'b2b_contract',
    title: 'B2B Dedicated Contracts & Tenders',
    tagline: 'Dedicated client fleets, minimum guarantee gauges, milestone billing',
    icon: FileText,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
  },
];

export const RolePermissionsMatrix: React.FC = () => {
  const { user } = useAuth();
  const { tenant, updateTenantVerticals } = useTenant();
  const queryClient = useQueryClient();

  const isPlatformRootAdmin = Boolean(
    user?.isPlatformUser ||
    user?.platformRole === 'omnicore_admin' ||
    user?.platformRole === 'super_admin'
  );

  // Active Main Tab
  const [activeMainTab, setActiveMainTab] = useState<'verticals' | 'users' | 'architecture'>('verticals');

  // Load connected tenants from platform API
  const { data: rawTenants = [] } = useQuery({
    queryKey: ['platformTenants'],
    queryFn: () => platformApi.getTenants(),
    enabled: isPlatformRootAdmin,
  });

  const tenants = isPlatformRootAdmin ? rawTenants : [tenant];

  // Search & Filters for Verticals
  const [verticalSearchTerm, setVerticalSearchTerm] = useState('');
  const [filterVerticalKey, setFilterVerticalKey] = useState<string>('all');

  // Users State with localStorage Persistence
  const [assignedUsers, setAssignedUsers] = useState<AssignedRoleUser[]>(() => {
    const saved = localStorage.getItem('omni_assigned_roles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => ({
            ...u,
            role:
              u.role === 'super_admin' || u.role === 'omnicore_admin'
                ? 'omnicore_admin'
                : u.role === 'tenant_admin' || u.role === 'customer_admin'
                ? 'customer_admin'
                : u.role === 'vertical_operator'
                ? 'vertical_operator'
                : 'customer_staff',
          }));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('omni_assigned_roles', JSON.stringify(assignedUsers));
  }, [assignedUsers]);

  // Isolate assigned users to real profiles and active tenant
  const tenantScopedUsers = useMemo(() => {
    const primaryAdmin: AssignedRoleUser | null = user
      ? {
          id: user.id || 'usr_project_admin',
          firstName: user.firstName || 'OmniCore',
          lastName: user.lastName || 'Admin',
          email: user.email,
          phone: user.phone || '',
          role: 'omnicore_admin',
          tenantId: tenant.id || 'platform_global',
          tenantName: tenant.name || 'OmniCore Ecosystem',
          status: 'active',
          assignedAt: new Date().toISOString().slice(0, 10),
          lastActive: 'Active now',
        }
      : null;

    const isolated = assignedUsers.filter((u) => {
      const matchId = u.tenantId === tenant.id;
      const matchEmail = Boolean(user?.email && u.email.toLowerCase() === user.email.toLowerCase());
      return matchId || matchEmail || isPlatformRootAdmin;
    });

    const hasCurrentAdmin = isolated.some((u) => user?.email && u.email.toLowerCase() === user.email.toLowerCase());
    if (!hasCurrentAdmin && primaryAdmin) {
      return [primaryAdmin, ...isolated];
    }
    return isolated;
  }, [assignedUsers, tenant, user, isPlatformRootAdmin]);

  // Filters for User Accounts Tab
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');

  // Modal State for New/Edit User Assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AssignedRoleUser | null>(null);

  // Form Fields
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<CoreRole>('customer_admin');
  const [formCustomTitle, setFormCustomTitle] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState(tenant.id);
  const [formStatus, setFormStatus] = useState<'active' | 'invited'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  // Toast Notification
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Toggle vertical entitlement for a tenant
  const handleToggleTenantVertical = async (tenantId: string, verticalKey: VerticalType) => {
    const targetTenant = tenants.find((t) => t.id === tenantId);
    if (!targetTenant) return;

    const currentVerticals = targetTenant.verticals || [];
    const isGranted = currentVerticals.includes(verticalKey);
    let updated: VerticalType[];

    if (isGranted) {
      if (currentVerticals.length <= 1) {
        triggerToast(`Cannot revoke all verticals. Organization requires at least one active service.`);
        return;
      }
      updated = currentVerticals.filter((v) => v !== verticalKey);
    } else {
      updated = [...currentVerticals, verticalKey];
    }

    // Call update on context / platform
    await updateTenantVerticals(tenantId, updated);

    // Invalidate platform tenants cache
    queryClient.invalidateQueries({ queryKey: ['platformTenants'] });

    const vertDef = VERTICALS[verticalKey];
    triggerToast(
      isGranted
        ? `Revoked ${vertDef?.name || verticalKey} from ${targetTenant.name}`
        : `Successfully granted ${vertDef?.name || verticalKey} to ${targetTenant.name}!`
    );
  };

  // Open modal for new user
  const openNewUserModal = () => {
    setEditingUser(null);
    setFormFirstName('');
    setFormLastName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('customer_admin');
    setFormCustomTitle('');
    setSelectedTenantId(tenant.id);
    setFormStatus('active');
    setFormError(null);
    setIsAssignModalOpen(true);
  };

  // Open modal for editing user
  const openEditModal = (u: AssignedRoleUser) => {
    setEditingUser(u);
    setFormFirstName(u.firstName);
    setFormLastName(u.lastName);
    setFormEmail(u.email);
    setFormPhone(u.phone || '');
    setFormRole(u.role);
    setFormCustomTitle(u.customRoleTitle || '');
    setSelectedTenantId(u.tenantId);
    setFormStatus(u.status === 'disabled' ? 'active' : u.status);
    setFormError(null);
    setIsAssignModalOpen(true);
  };

  // Save role assignment
  const handleSaveRoleAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim() || !formEmail.trim()) {
      setFormError('First Name, Last Name, and Work Email are required.');
      return;
    }

    const selectedTenantObj = tenants.find((t) => t.id === selectedTenantId) || tenant;
    const selectedTenantName = formRole === 'omnicore_admin' || formRole === 'super_admin' ? 'OmniCore Platform Global' : selectedTenantObj.name;

    if (editingUser) {
      setAssignedUsers((prev) =>
        prev.map((u) => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              firstName: formFirstName.trim(),
              lastName: formLastName.trim(),
              email: formEmail.trim(),
              phone: formPhone.trim() || undefined,
              role: formRole,
              customRoleTitle: formCustomTitle.trim() || undefined,
              tenantId: formRole === 'omnicore_admin' || formRole === 'super_admin' ? 'platform_global' : selectedTenantId,
              tenantName: selectedTenantName,
              status: formStatus,
              lastActive: 'Updated now',
            };
          }
          return u;
        })
      );
      triggerToast(`Updated assignment for ${formFirstName} ${formLastName}!`);
    } else {
      const newAssignment: AssignedRoleUser = {
        id: `user_${Date.now()}`,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        role: formRole,
        customRoleTitle: formCustomTitle.trim() || undefined,
        tenantId: formRole === 'omnicore_admin' || formRole === 'super_admin' ? 'platform_global' : selectedTenantId,
        tenantName: selectedTenantName,
        status: formStatus,
        assignedAt: new Date().toISOString().slice(0, 10),
        lastActive: 'Just assigned',
      };
      setAssignedUsers((prev) => [newAssignment, ...prev]);
      triggerToast(`Assigned ${formFirstName} ${formLastName} as ${ROLE_CONFIG[formRole]?.label}!`);
    }

    setIsAssignModalOpen(false);
  };

  const handleDeleteAssignment = (id: string, name: string) => {
    if (window.confirm(`Revoke user assignment for ${name}?`)) {
      setAssignedUsers((prev) => prev.filter((u) => u.id !== id));
      triggerToast(`Assignment for ${name} revoked.`);
    }
  };

  // Filtered tenants for Vertical Entitlements
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(verticalSearchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(verticalSearchTerm.toLowerCase()) ||
        (t.primaryContactEmail && t.primaryContactEmail.toLowerCase().includes(verticalSearchTerm.toLowerCase()));

      const matchesVertical =
        filterVerticalKey === 'all' ||
        (t.verticals && t.verticals.includes(filterVerticalKey as VerticalType));

      return matchesSearch && matchesVertical;
    });
  }, [tenants, verticalSearchTerm, filterVerticalKey]);

  // Filtered users for Users Tab
  const filteredUsers = useMemo(() => {
    return tenantScopedUsers.filter((u) => {
      const matchesSearch =
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ROLE_CONFIG[u.role]?.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.tenantName && u.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesTenant = tenantFilter === 'all' || u.tenantId === tenantFilter || u.tenantName === tenantFilter;

      return matchesSearch && matchesRole && matchesTenant;
    });
  }, [tenantScopedUsers, searchTerm, roleFilter, tenantFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalVerticalGrants = tenants.reduce((acc, t) => acc + (t.verticals?.length || 0), 0);
    return {
      totalTenants: tenants.length,
      totalUsers: tenantScopedUsers.length,
      omniCoreAdmins: tenantScopedUsers.filter((u) => u.role === 'omnicore_admin' || u.role === 'super_admin').length,
      customerAdmins: tenantScopedUsers.filter((u) => u.role === 'customer_admin' || u.role === 'tenant_admin').length,
      verticalOperators: tenantScopedUsers.filter((u) => u.role === 'vertical_operator').length,
      totalGrants: totalVerticalGrants,
    };
  }, [tenants, tenantScopedUsers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-emerald-400 shadow-2xl backdrop-blur-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Customer Vertical Entitlements & RBAC Hub
            </h1>
            <Badge variant="purple" className="flex items-center gap-1 font-mono text-[10px]">
              <Crown className="h-3 w-3 text-amber-300" /> OmniCore Project Admin Control
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            When a customer approaches the OmniCore Project Manager for software support (e.g. Courier & Express Delivery or Tourist Bus services), the OmniCore Project Admin provisions access to those specific verticals. Access to modules and workflows is governed by these granted services.
          </p>
        </div>

        {/* Action Button */}
        {activeMainTab === 'users' && (
          <Button
            onClick={openNewUserModal}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold px-4 py-2.5 shadow-lg shadow-blue-600/25 cursor-pointer shrink-0"
            leftIcon={<UserPlus className="h-4 w-4 text-white" />}
          >
            + Assign Customer User
          </Button>
        )}
      </div>

      {/* Top Stat Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Customer Organizations
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white">{stats.totalTenants}</span>
            <span className="text-[10px] text-slate-500">workspaces</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-purple-950/20 border-purple-500/30">
          <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider block flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-400" /> OmniCore Admins
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-200">{stats.omniCoreAdmins}</span>
            <span className="text-[10px] text-purple-400">project governors</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-blue-950/20 border-blue-500/30">
          <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider block flex items-center gap-1">
            <Building2 className="h-3 w-3 text-blue-400" /> Customer Admins
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-200">{stats.customerAdmins}</span>
            <span className="text-[10px] text-blue-400">organization leads</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-emerald-950/20 border-emerald-500/30">
          <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
            <Navigation className="h-3 w-3 text-emerald-400" /> Vertical Operators
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-200">{stats.verticalOperators}</span>
            <span className="text-[10px] text-emerald-400">operations staff</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-cyan-950/20 border-cyan-500/30">
          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" /> Vertical Grants
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-200">{stats.totalGrants}</span>
            <span className="text-[10px] text-cyan-400">active services</span>
          </div>
        </Card>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveMainTab('verticals')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'verticals'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="h-4 w-4 text-blue-400" />
          Customer Vertical Entitlements (Service Access Matrix)
        </button>
        <button
          onClick={() => setActiveMainTab('users')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'users'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4 text-purple-400" />
          Customer Accounts & Operations Staff
        </button>
        <button
          onClick={() => setActiveMainTab('architecture')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'architecture'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Service-Driven RBAC Architecture Guide
        </button>
      </div>

      {/* TAB 1: CUSTOMER VERTICAL ENTITLEMENTS (SERVICE ACCESS MATRIX) */}
      {activeMainTab === 'verticals' && (
        <div className="space-y-4">
          {/* Informational Callout */}
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 flex items-start gap-3 text-xs">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">
                How Service-Based Role Access Works in OmniCore:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                Each customer approaches the OmniCore Project Manager with specific software requirements (e.g., Courier & Express or Tourist Bus). As OmniCore Admin, toggle the buttons below to grant or revoke specific vertical service support for each customer. When granted, that customer organization immediately receives access to the associated modules, dispatch engines, and menus.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="w-full sm:w-80">
                <Input
                  placeholder="Search customer name, slug, or contact..."
                  value={verticalSearchTerm}
                  onChange={(e) => setVerticalSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Service Filter:</span>
                <select
                  value={filterVerticalKey}
                  onChange={(e) => setFilterVerticalKey(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Service Verticals</option>
                  {SERVICE_VERTICAL_CATALOG.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Customer Entitlements Cards */}
          <div className="space-y-4">
            {filteredTenants.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-400">
                No customer organizations found matching your search.
              </Card>
            ) : (
              filteredTenants.map((t) => {
                const activeVerticals = t.verticals || [];

                return (
                  <Card key={t.id} className="p-5 bg-slate-900/60 border-slate-800 space-y-4 shadow-lg">
                    {/* Organization Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold text-sm shrink-0">
                          {t.name ? t.name[0] : 'O'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{t.name}</span>
                            <Badge variant="glow" size="xs">
                              {t.subscription?.package || 'standard'} tier
                            </Badge>
                            <span className="text-[10px] font-mono text-slate-400">
                              {t.slug}.omnicore.io
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Primary Contact: {t.primaryContactName || 'Admin'} &lt;{t.primaryContactEmail || 'admin@omnicore.io'}&gt;
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="sm">
                          {activeVerticals.length} Active Services
                        </Badge>
                      </div>
                    </div>

                    {/* Vertical Services Matrix for this Tenant */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {SERVICE_VERTICAL_CATALOG.map((service) => {
                        const isGranted = activeVerticals.includes(service.key);
                        const ServiceIcon = service.icon;

                        return (
                          <div
                            key={service.key}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between select-none ${
                              isGranted
                                ? `${service.color} shadow-sm ring-1 ring-emerald-500/20`
                                : 'border-slate-800/80 bg-slate-950/40 opacity-70 hover:opacity-100 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <ServiceIcon className="h-4 w-4 shrink-0" />
                                  <span className="font-semibold text-xs text-white">
                                    {service.title.split(' ')[0]} {service.title.split(' ')[1] || ''}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    isGranted
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isGranted ? 'Active' : 'Locked'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                {service.tagline}
                              </p>
                            </div>

                            {/* OmniCore Admin Grant/Revoke Button */}
                            <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {isGranted ? 'Granted by Admin' : 'Not contracted'}
                              </span>
                              <Button
                                size="xs"
                                variant={isGranted ? 'outline' : 'primary'}
                                onClick={() => handleToggleTenantVertical(t.id, service.key)}
                                className={`text-[10px] py-1 px-2.5 font-semibold cursor-pointer ${
                                  isGranted
                                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                }`}
                              >
                                {isGranted ? 'Revoke' : '+ Grant'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER ACCOUNTS & OPERATIONS STAFF */}
      {activeMainTab === 'users' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="w-full sm:w-80">
                <Input
                  placeholder="Search user name, email, role, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span>Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="omnicore_admin">OmniCore Project Admin</option>
                    <option value="customer_admin">Customer Admin (Org Manager)</option>
                    <option value="vertical_operator">Vertical Operations Staff</option>
                    <option value="customer_staff">Customer Staff Member</option>
                  </select>
                </div>

                {isPlatformRootAdmin && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Organization:</span>
                    <select
                      value={tenantFilter}
                      onChange={(e) => setTenantFilter(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Organizations</option>
                      <option value="platform_global">Platform Global</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* User Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Organization Workspace</th>
                    <th className="py-3 px-4">Operational Scope</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No assigned users found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleMeta = ROLE_CONFIG[u.role] || ROLE_CONFIG.customer_admin;
                      const RoleIcon = roleMeta.icon;

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                          {/* User Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white text-xs shrink-0 shadow-md">
                                {u.firstName[0]}
                                {u.lastName[0]}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">
                                  {u.firstName} {u.lastName}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-slate-500" />
                                    {u.email}
                                  </span>
                                  {u.phone && (
                                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                                      <Phone className="h-3 w-3 text-slate-500" />
                                      {u.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-[11px]',
                                roleMeta.color
                              )}
                            >
                              <RoleIcon className="h-3.5 w-3.5 shrink-0" />
                              {roleMeta.label}
                            </span>
                            {u.customRoleTitle && (
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                {u.customRoleTitle}
                              </span>
                            )}
                          </td>

                          {/* Tenant Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-medium text-slate-200">
                              <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span>{u.tenantName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {u.tenantId.slice(0, 14)}...
                            </span>
                          </td>

                          {/* Capabilities Scope */}
                          <td className="py-3 px-4">
                            <span className="text-slate-300 text-[11px] block">
                              {roleMeta.permissionsSummary}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {roleMeta.desc}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                                u.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  u.status === 'active' ? 'bg-emerald-400' : 'bg-blue-400'
                                )}
                              />
                              {u.status}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">{u.lastActive}</span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit Role Assignment"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(u.id, `${u.firstName} ${u.lastName}`)}
                                className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                title="Revoke Role Assignment"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICE-DRIVEN RBAC ARCHITECTURE GUIDE */}
      {activeMainTab === 'architecture' && (
        <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-6 text-xs">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              OmniCore Service-Driven RBAC Architecture
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Role-Based Access Control in OmniCore is not defined by arbitrary permission toggles. It is built directly around the customer business contracting model.
            </p>
          </div>

          {/* 4-Step Interactive Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30">
                  1
                </span>
                Customer Request
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                A customer approaches the OmniCore Project Manager stating their logistics business model (e.g. Courier & Express Delivery or Tourist Bus).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30">
                  2
                </span>
                Admin Vertical Grant
              </div>
              <p className="text-[11px] text-purple-200/80 leading-relaxed">
                The OmniCore Project Admin provisions the customer organization and grants access strictly to the requested transport service verticals.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  3
                </span>
                Automatic Gating
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                Customer Admin and operators log in. Navigation, dispatch engines, and modules corresponding to their active verticals automatically activate.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
                  4
                </span>
                Shielded Extensions
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Modules for uncontracted verticals display the Vertical Access Restricted screen, prompting the customer to contact OmniCore to add services.
              </p>
            </div>
          </div>

          {/* 3 Core Roles Table */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Ecosystem Roles Matrix
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-purple-500/30 bg-slate-900/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-400" />
                  <span className="font-bold text-white text-xs">OmniCore Project Admin</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Main platform super administrator. Has universal access across all workspaces and possesses the exclusive authority to grant or revoke vertical services for any customer.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/30 bg-slate-900/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-white text-xs">Customer Admin (Org Manager)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Executive in charge of the customer organization. Has full administrative access to manage vehicles, drivers, dispatch, maintenance, and finance within their granted verticals.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/30 bg-slate-900/80 space-y-2">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">Vertical Operations Staff</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Operational specialists (e.g. Courier Sorter, Tourist Route Dispatcher, Commuter Driver). Their functional day-to-day screens belong strictly to the active contracted verticals.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal for New / Edit User Role Assignment */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAssignModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {editingUser ? 'Edit User Role Assignment' : 'Assign Customer User'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Assign a user to an organization and define their role in the ecosystem.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoleAssignment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. John"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="e.g. Doe"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Work Email"
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                />
                <PhoneNumberInput
                  label="Phone (Optional)"
                  value={formPhone}
                  onChange={setFormPhone}
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as CoreRole)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="omnicore_admin">1. OmniCore Project Admin (Supreme Global & Vertical Provisioner)</option>
                  <option value="customer_admin">2. Customer Admin (Organization Manager)</option>
                  <option value="vertical_operator">3. Vertical Operations Staff (Dispatch & Tasks)</option>
                  <option value="customer_staff">4. Customer Staff Member (General Operations Viewer)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  {ROLE_CONFIG[formRole]?.desc}
                </p>
              </div>

              {/* Organization Picker (if not platform root admin) */}
              {(formRole === 'customer_admin' || formRole === 'vertical_operator' || formRole === 'customer_staff') && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Customer Organization <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug}.omnicore.io)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Role Title / Designation (Optional)
                </label>
                <Input
                  placeholder="e.g. Lead Courier Dispatcher, Tour Bus Coordinator"
                  value={formCustomTitle}
                  onChange={(e) => setFormCustomTitle(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500">
                  {editingUser ? 'Save Changes' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
