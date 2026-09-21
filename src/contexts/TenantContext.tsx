import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Tenant, VerticalType, PackageTier, AddonKey, User, TenantRole } from '../types';
import { useAuth } from './AuthContext';
import { PACKAGES, TIER_RANK, MODULE_REQUIRED_TIERS, TIER_DISPLAY_NAMES } from '../config/constants';
import { platformApi } from '../api/platform.api';

export const ROLE_DEFAULT_PERMISSIONS: Record<TenantRole, string[]> = {
  tenant_admin: ['*'],
  operations_manager: [
    'dashboard.view',
    'finance.view',
    'finance.manage',
    'hr.view',
    'hr.manage',
    'payroll.view',
    'payroll.manage',
    'insurance.view',
    'insurance.manage',
    'marketing.view',
    'marketing.manage',
    'reports.view',
    'reports.export',
    'reports.custom',
    'notifications.view',
  ],
  fleet_manager: [
    'dashboard.view',
    'fleet.view',
    'fleet.manage',
    'drivers.view',
    'drivers.manage',
    'maintenance.view',
    'maintenance.manage',
    'trips.view',
    'warehouse.view',
    'insurance.view',
    'insurance.manage',
    'reports.view',
    'notifications.view',
  ],
  finance_user: [
    'dashboard.view',
    'finance.view',
    'finance.manage',
    'contracts.view',
    'contracts.manage',
    'trips.view',
    'reports.view',
    'payroll.view',
    'insurance.view',
    'notifications.view',
  ],
  hr_user: [
    'dashboard.view',
    'hr.view',
    'hr.manage',
    'drivers.view',
    'drivers.manage',
    'payroll.view',
    'payroll.manage',
    'reports.view',
    'notifications.view',
  ],
  warehouse_user: [
    'dashboard.view',
    'warehouse.view',
    'warehouse.manage',
    'maintenance.view',
    'fleet.view',
    'notifications.view',
  ],
  sales_crm_user: [
    'dashboard.view',
    'crm.view',
    'crm.manage',
    'contracts.view',
    'contracts.manage',
    'marketing.view',
    'marketing.manage',
    'trips.view',
    'reports.view',
    'notifications.view',
  ],
  driver_field_user: [
    'dashboard.view',
    'trips.view',
    'fleet.view',
    'notifications.view',
  ],
};

const DEFAULT_INITIAL_TENANT: Tenant = {
  id: 'tenant_apex',
  name: 'Apex Global Logistics & Cold Chain',
  slug: 'apex-global',
  status: 'active',
  verticals: ['freight_logistics', 'cold_chain', 'b2b_contract'],
  subscription: {
    package: 'enterprise',
    status: 'active',
    billingCycle: 'monthly',
    mrr: 1899,
    startDate: '2025-01-01',
    renewalDate: '2027-01-01',
    enabledAddons: ['addon_warehouse', 'addon_contracts', 'addon_cold_chain', 'addon_telematics', 'addon_maintenance_pro'],
    currency: 'USD',
    autoRenew: true,
  },
  primaryContactName: 'Marcus Sterling',
  primaryContactEmail: 'sarang@apexlogistics.com',
  primaryContactPhone: '+1 (312) 555-0190',
  country: 'United States',
  city: 'Chicago',
  address: '100 North Michigan Ave',
  vehicleCount: 0,
  activeTripsCount: 0,
  userCount: 1,
  storageUsedGb: 0.5,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
};

interface TenantContextType {
  tenant: Tenant;
  verticals: VerticalType[];
  packageTier: PackageTier;
  enabledAddons: AddonKey[];
  enabledFeatures: string[];
  permissions: string[];
  customRolePermissions: Record<string, string[]>;
  currentUser: User | null;
  can: (permission: string) => boolean;
  hasFeature: (featureName: string) => boolean;
  hasAddon: (addonKey: AddonKey) => boolean;
  hasVertical: (verticalKey: VerticalType) => boolean;
  isModuleAllowedByPlan: (moduleKey: string) => boolean;
  getRequiredTierForModule: (moduleKey: string) => PackageTier;
  switchTenant: (newTenant: Tenant) => void;
  setPackageTier: (tier: PackageTier) => void;
  toggleAddon: (addonKey: AddonKey) => void;
  upgradePackage: (newTier: PackageTier, addons: AddonKey[]) => Promise<void>;
  changeTenantPackage: (tenantId: string, newTier: PackageTier, addons?: AddonKey[]) => Promise<void>;
  reactivateTenant: () => void;
  updateRolePermissions: (role: TenantRole, perms: string[]) => void;
  resetRolePermissions: (role?: TenantRole) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [tenant, setTenant] = useState<Tenant>(() => {
    const saved = localStorage.getItem('omni_active_tenant');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_INITIAL_TENANT;
      }
    }
    return DEFAULT_INITIAL_TENANT;
  });

  // Customized role permissions stored by Super Admin
  const [customRolePermissions, setCustomRolePermissions] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('omni_custom_role_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const updateRolePermissions = useCallback((role: TenantRole, perms: string[]) => {
    setCustomRolePermissions((prev) => {
      const updated = { ...prev, [role]: perms };
      localStorage.setItem('omni_custom_role_permissions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetRolePermissions = useCallback((role?: TenantRole) => {
    setCustomRolePermissions((prev) => {
      let updated = { ...prev };
      if (role) {
        delete updated[role];
      } else {
        updated = {};
      }
      localStorage.setItem('omni_custom_role_permissions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const switchTenant = useCallback((newTenant: Tenant) => {
    setTenant(newTenant);
    localStorage.setItem('omni_active_tenant', JSON.stringify(newTenant));
  }, []);

  const setPackageTier = useCallback((tier: PackageTier) => {
    setTenant((prev) => {
      const updated = {
        ...prev,
        subscription: {
          ...prev.subscription,
          package: tier,
        },
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleAddon = useCallback((addonKey: AddonKey) => {
    setTenant((prev) => {
      const current = prev.subscription.enabledAddons || [];
      const updatedAddons = current.includes(addonKey)
        ? current.filter((a) => a !== addonKey)
        : [...current, addonKey];

      const updated = {
        ...prev,
        subscription: {
          ...prev.subscription,
          enabledAddons: updatedAddons,
        },
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const upgradePackage = useCallback(async (newTier: PackageTier, addons: AddonKey[]) => {
    setTenant((prev) => {
      const updated: Tenant = {
        ...prev,
        subscription: {
          ...prev.subscription,
          package: newTier,
          enabledAddons: addons,
          mrr: newTier === 'enterprise' ? 1899 : newTier === 'corporate' ? 899 : 399,
        },
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const reactivateTenant = useCallback(() => {
    setTenant((prev) => {
      const updated: Tenant = {
        ...prev,
        status: 'active',
        subscription: {
          ...prev.subscription,
          status: 'active',
        },
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const packageTier = tenant.subscription?.package || 'standard';
  const enabledAddons = tenant.subscription?.enabledAddons || [];
  const verticals = tenant.verticals || [];

  // Derive features from package, active add-ons, and verticals
  const enabledFeatures = useMemo(() => {
    const features = [...(PACKAGES[packageTier]?.coreFeatures || [])];
    if (enabledAddons.includes('addon_warehouse')) features.push('Warehouse & Inventory', 'cross_docking', 'shipment_consolidation');
    if (enabledAddons.includes('addon_contracts')) features.push('Contracts & Tenders');
    if (enabledAddons.includes('addon_cold_chain')) features.push('Cold Chain Telemetry');
    if (enabledAddons.includes('addon_last_mile')) features.push('Last-Mile Route Optimization');
    if (enabledAddons.includes('addon_telematics')) features.push('GPS Telematics');
    if (enabledAddons.includes('addon_maintenance_pro')) features.push('Predictive Maintenance');
    if (verticals.includes('courier_express')) features.push('courier_express');
    if (verticals.includes('corporate_shuttle')) features.push('corporate_shuttle');
    features.push('social_promotions', 'public_portal');
    return features;
  }, [packageTier, enabledAddons, verticals]);

  const permissions = user?.permissions || [];

  // Centralized permission evaluator:
  // 1. Super Admin has supreme authority over everything platform and tenant
  // 2. Tenant Admin has full tenant-level administrative authority (* within tenant)
  // 3. Other roles follow customized role permissions set by Super Admin (or defaults)
  const can = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.isPlatformUser || user.platformRole === 'super_admin') return true;
      if (user.tenantRole === 'tenant_admin') return true;

      const role = user.tenantRole;
      const customPerms = role && customRolePermissions[role] ? customRolePermissions[role] : null;
      const roleDefaults = role ? (customPerms || ROLE_DEFAULT_PERMISSIONS[role] || []) : [];
      const effectivePerms = [...(user.permissions || []), ...roleDefaults];

      if (effectivePerms.includes('*')) return true;
      if (effectivePerms.includes(permission)) return true;

      // Domain-level permission prefix matching (e.g. "finance.*" covers "finance.view", "finance.manage")
      const [domain] = permission.split('.');
      if (effectivePerms.includes(`${domain}.*`)) return true;

      return false;
    },
    [user, customRolePermissions]
  );

  const getRequiredTierForModule = useCallback((moduleKey: string): PackageTier => {
    return MODULE_REQUIRED_TIERS[moduleKey] || 'basic';
  }, []);

  const isModuleAllowedByPlan = useCallback(
    (moduleKey: string): boolean => {
      if (user?.isPlatformUser || user?.platformRole === 'super_admin') return true;

      // Addon & vertical overrides
      if (moduleKey === 'warehouse' && enabledAddons.includes('addon_warehouse')) return true;
      if (moduleKey === 'contracts' && enabledAddons.includes('addon_contracts')) return true;
      if (moduleKey === 'maintenance' && enabledAddons.includes('addon_maintenance_pro')) return true;
      if (moduleKey === 'courier' && (verticals.includes('courier_express') || enabledAddons.includes('addon_last_mile'))) return true;
      if (moduleKey === 'shuttle' && verticals.includes('corporate_shuttle')) return true;

      // Subscription package tier rank check
      const requiredTier = MODULE_REQUIRED_TIERS[moduleKey] || 'basic';
      const currentRank = TIER_RANK[packageTier] || 1;
      const requiredRank = TIER_RANK[requiredTier] || 1;
      return currentRank >= requiredRank;
    },
    [user, packageTier, enabledAddons, verticals]
  );

  const changeTenantPackage = useCallback(
    async (tenantId: string, newTier: PackageTier, addons?: AddonKey[]) => {
      const effectiveAddons = addons !== undefined ? addons : (tenant.id === tenantId ? enabledAddons : []);
      const pkgDef = PACKAGES[newTier] || PACKAGES.standard;

      try {
        await platformApi.upgradeTenantPackage(tenantId, newTier, effectiveAddons);
      } catch (err) {
        console.warn('Backend upgrade endpoint notice (handled gracefully):', err);
      }

      // If updating active tenant, update context & localStorage immediately
      if (tenant.id === tenantId || tenantId === 'tenant_apex' || !tenantId) {
        setTenant((prev) => {
          const updated: Tenant = {
            ...prev,
            subscription: {
              ...prev.subscription,
              package: newTier,
              enabledAddons: effectiveAddons,
              mrr: pkgDef.monthlyPrice,
            },
            updatedAt: new Date().toISOString().slice(0, 10),
          };
          localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
          return updated;
        });
      }
    },
    [tenant.id, enabledAddons]
  );

  const hasFeature = useCallback(
    (featureName: string): boolean => {
      if (user?.isPlatformUser || user?.platformRole === 'super_admin') return true;
      if (MODULE_REQUIRED_TIERS[featureName]) {
        return isModuleAllowedByPlan(featureName);
      }
      const lower = featureName.toLowerCase();
      return enabledFeatures.some((f) => f.toLowerCase() === lower || f.toLowerCase().includes(lower));
    },
    [user, isModuleAllowedByPlan, enabledFeatures]
  );

  const hasAddon = useCallback(
    (addonKey: AddonKey): boolean => {
      return enabledAddons.includes(addonKey);
    },
    [enabledAddons]
  );

  const hasVertical = useCallback(
    (verticalKey: VerticalType): boolean => {
      if (verticals.includes('all_verticals')) return true;
      return verticals.includes(verticalKey);
    },
    [verticals]
  );

  return (
    <TenantContext.Provider
      value={{
        tenant,
        verticals,
        packageTier,
        enabledAddons,
        enabledFeatures,
        permissions,
        customRolePermissions,
        currentUser: user,
        can,
        hasFeature,
        hasAddon,
        hasVertical,
        isModuleAllowedByPlan,
        getRequiredTierForModule,
        switchTenant,
        setPackageTier,
        toggleAddon,
        upgradePackage,
        changeTenantPackage,
        reactivateTenant,
        updateRolePermissions,
        resetRolePermissions,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
