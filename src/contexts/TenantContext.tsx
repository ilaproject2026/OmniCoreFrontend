import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Tenant, VerticalType, PackageTier, AddonKey, User, TenantRole } from '../types';
import { useAuth } from './AuthContext';
import { PACKAGES, TIER_RANK, MODULE_REQUIRED_TIERS, TIER_DISPLAY_NAMES } from '../config/constants';
import { platformApi } from '../api/platform.api';
import { apiClient, tenantStorage } from '../api/client';
import { clearQueryClientCache } from '../api/queryClient';

const normalizePackageTier = (value: unknown): PackageTier | undefined => {
  const tier = String(value || '').toLowerCase();
  return tier === 'basic' || tier === 'standard' || tier === 'corporate' || tier === 'enterprise'
    ? tier
    : undefined;
};

export const ROLE_DEFAULT_PERMISSIONS: Record<TenantRole, string[]> = {
  customer_admin: ['*'],
  tenant_admin: ['*'],
  vertical_operator: [
    'dashboard.view',
    'fleet.view',
    'drivers.view',
    'trips.view',
    'trips.dispatch',
    'courier.view',
    'courier.dispatch',
    'shuttle.view',
    'shuttle.manage',
    'maintenance.view',
    'warehouse.view',
    'finance.view',
    'reports.view',
    'notifications.view',
  ],
  customer_staff: [
    'dashboard.view',
    'trips.view',
    'notifications.view',
  ],
};

const DEFAULT_INITIAL_TENANT: Tenant = {
  id: '',
  name: 'Organization Workspace',
  slug: 'workspace',
  status: 'active',
  verticals: ['freight_logistics'],
  subscription: {
    package: 'enterprise',
    status: 'active',
    billingCycle: 'monthly',
    mrr: 0,
    startDate: new Date().toISOString().slice(0, 10),
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    enabledAddons: [],
    currency: 'USD',
    autoRenew: true,
  },
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  country: '',
  city: '',
  address: '',
  vehicleCount: 0,
  activeTripsCount: 0,
  userCount: 1,
  storageUsedGb: 0,
  createdAt: new Date().toISOString().slice(0, 10),
  updatedAt: new Date().toISOString().slice(0, 10),
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
  isVerticalEnabled: (vertical: VerticalType | VerticalType[]) => boolean;
  isModuleAllowedByVertical: (moduleKey: string) => boolean;
  updateTenantVerticals: (tenantId: string, verticals: VerticalType[]) => Promise<void>;
  updateTenantProfile: (payload: { company_name: string; email: string; phone: string; address: string }) => Promise<void>;
  isModuleAllowedByPlan: (moduleKey: string) => boolean;
  getRequiredTierForModule: (moduleKey: string) => PackageTier;
  canCreateMultipleTenants: boolean;
  switchTenant: (newTenant: Tenant) => void;
  setPackageTier: (tier: PackageTier) => Promise<void>;
  toggleAddon: (addonKey: AddonKey) => Promise<void>;
  upgradePackage: (newTier: PackageTier, addons: AddonKey[]) => Promise<void>;
  changeTenantPackage: (tenantId: string, newTier: PackageTier, addons?: AddonKey[]) => Promise<void>;
  reactivateTenant: () => Promise<void>;
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
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return parsed;
        }
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

  // Reset active tenant when omni_session_cleared event fires
  useEffect(() => {
    const handleCleared = () => {
      setTenant(DEFAULT_INITIAL_TENANT);
    };
    window.addEventListener('omni_session_cleared', handleCleared);
    return () => window.removeEventListener('omni_session_cleared', handleCleared);
  }, []);

  // Synchronize active tenant strictly matching the authenticated user
  useEffect(() => {
    if (!user) {
      setTenant(DEFAULT_INITIAL_TENANT);
      return;
    }

    const savedTenantStr = localStorage.getItem('omni_active_tenant');
    if (savedTenantStr) {
      try {
        const parsed = JSON.parse(savedTenantStr);
        if (parsed && parsed.id) {
          const userEmail = (user.email || '').toLowerCase().trim();
          const parsedEmail = (parsed.primaryContactEmail || '').toLowerCase().trim();
          const isMatchingTenant =
            Boolean(user.tenantId && parsed.id === user.tenantId) ||
            Boolean(userEmail && parsedEmail && parsedEmail === userEmail);

          if (isMatchingTenant) {
            setTenant(parsed);
            const tenantId = parsed.id;
            apiClient.get<any>('/subscriptions/current/').then((response) => {
              const subscription = response.data?.subscription || response.data;
              const packageTier = normalizePackageTier(subscription?.package?.code || subscription?.package?.name);
              if (!subscription || subscription === null) return;
              setTenant((current) => {
                if (current.id !== tenantId) return current;
                const updated = {
                  ...current,
                  verticals: packageTier === 'enterprise' ? ['all_verticals'] as VerticalType[] : current.verticals,
                  subscription: {
                    ...current.subscription,
                    ...(packageTier ? { package: packageTier } : {}),
                    status: String(subscription.status || current.subscription.status).toLowerCase() as Tenant['subscription']['status'],
                    billingCycle: (() => {
                      const cycle = String(subscription.billing_cycle || current.subscription.billingCycle).toLowerCase();
                      return (cycle === 'yearly' ? 'annually' : cycle) as Tenant['subscription']['billingCycle'];
                    })(),
                    enabledAddons: Array.isArray(subscription.addons)
                      ? subscription.addons.map((addon: any) => String(addon.code || '').toLowerCase()).filter(Boolean)
                      : current.subscription.enabledAddons,
                    mrr: Number(subscription.package?.price_monthly ?? current.subscription.mrr ?? 0),
                  },
                };
                localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
                return updated;
              });
            }).catch(() => {});
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    if (user.tenantId && user.tenantId !== 'platform_global') {
      platformApi
        .getTenantById(user.tenantId)
        .then((t) => {
          if (t && t.id) {
            setTenant(t);
            localStorage.setItem('omni_active_tenant', JSON.stringify(t));
          }
        })
        .catch(() => {});
    }
  }, [user?.tenantId, user?.email]);

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
    if (newTenant.id) tenantStorage.setActiveTenantId(newTenant.id);
    clearQueryClientCache();
  }, []);

  const setPackageTier = useCallback(async (tier: PackageTier) => {
    if (!tenant.id) throw new Error('An active tenant is required to update the subscription.');
    await platformApi.upgradeTenantPackage(tenant.id, tier, tenant.subscription.enabledAddons || []);
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
  }, [tenant.id, tenant.subscription.enabledAddons]);

  const toggleAddon = useCallback(async (addonKey: AddonKey) => {
    if (!tenant.id) throw new Error('An active tenant is required to update add-ons.');
    const current = tenant.subscription.enabledAddons || [];
    const updatedAddons = current.includes(addonKey)
      ? current.filter((a) => a !== addonKey)
      : [...current, addonKey];
    await platformApi.upgradeTenantPackage(tenant.id, tenant.subscription?.package || 'standard', updatedAddons);
    setTenant((prev) => {
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
  }, [tenant.id, tenant.subscription.enabledAddons, tenant.subscription?.package]);

  const upgradePackage = useCallback(async (newTier: PackageTier, addons: AddonKey[]) => {
    const pkgDef = PACKAGES[newTier] || PACKAGES.standard;
    if (!tenant.id) throw new Error('An active tenant is required to update the subscription.');
    await platformApi.upgradeTenantPackage(tenant.id, newTier, addons);
    setTenant((prev) => {
      const updated: Tenant = {
        ...prev,
        subscription: {
          ...prev.subscription,
          package: newTier,
          enabledAddons: addons,
          mrr: pkgDef.monthlyPrice,
        },
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
      return updated;
    });
  }, [tenant.id]);

  const reactivateTenant = useCallback(async () => {
    if (tenant.id) {
      try {
        await platformApi.updateTenantStatus(tenant.id, 'active');
      } catch (err) {
        console.warn('Backend updateTenantStatus notice:', err);
      }
    }
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
  }, [tenant.id]);

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
      if (
        user.isPlatformUser ||
        user.platformRole === 'omnicore_admin' ||
        user.platformRole === 'super_admin'
      ) {
        return true;
      }
      if (user.tenantRole === 'customer_admin' || user.tenantRole === 'tenant_admin') {
        return true;
      }

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

  const canCreateMultipleTenants =
    packageTier === 'enterprise' ||
    Boolean(user?.isPlatformUser || user?.platformRole === 'super_admin');

  const isModuleAllowedByPlan = useCallback(
    (moduleKey: string): boolean => {
      // Addon overrides for specific optional packs
      if (moduleKey === 'warehouse' && enabledAddons.includes('addon_warehouse')) return true;
      if (moduleKey === 'contracts' && enabledAddons.includes('addon_contracts')) return true;
      if (moduleKey === 'maintenance' && enabledAddons.includes('addon_maintenance_pro')) return true;

      // Multiple tenants creation is strictly restricted to enterprise (or root platform admin)
      if (moduleKey === 'multiple_tenants') {
        return (
          packageTier === 'enterprise' ||
          Boolean(user?.isPlatformUser || user?.platformRole === 'super_admin')
        );
      }

      // Subscription package tier rank check
      const requiredTier = MODULE_REQUIRED_TIERS[moduleKey] || 'basic';
      const currentRank = TIER_RANK[packageTier] || 1;
      const requiredRank = TIER_RANK[requiredTier] || 1;
      return currentRank >= requiredRank;
    },
    [packageTier, enabledAddons, user?.isPlatformUser, user?.platformRole]
  );

  const changeTenantPackage = useCallback(
    async (tenantId: string, newTier: PackageTier, addons?: AddonKey[]) => {
      const effectiveAddons = addons !== undefined ? addons : (tenant.id === tenantId ? enabledAddons : []);
      const pkgDef = PACKAGES[newTier] || PACKAGES.standard;

      await platformApi.upgradeTenantPackage(tenantId, newTier, effectiveAddons);

      // If updating active tenant, update context & localStorage immediately
      if (tenant.id === tenantId || !tenantId) {
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
      if (MODULE_REQUIRED_TIERS[featureName]) {
        return isModuleAllowedByPlan(featureName);
      }
      const lower = featureName.toLowerCase();
      return enabledFeatures.some((f) => f.toLowerCase() === lower || f.toLowerCase().includes(lower));
    },
    [isModuleAllowedByPlan, enabledFeatures]
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

  const isVerticalEnabled = useCallback(
    (vertical: VerticalType | VerticalType[]): boolean => {
      if (!user) return false;
      // OmniCore Project Admin has unrestricted access to all verticals
      if (
        user.isPlatformUser ||
        user.platformRole === 'omnicore_admin' ||
        user.platformRole === 'super_admin'
      ) {
        return true;
      }
      const currentVerticals = tenant?.verticals || [];
      if (currentVerticals.includes('all_verticals')) return true;

      if (Array.isArray(vertical)) {
        return vertical.some((v) => currentVerticals.includes(v));
      }
      return currentVerticals.includes(vertical);
    },
    [user, tenant?.verticals]
  );

  const isModuleAllowedByVertical = useCallback(
    (moduleKey: string): boolean => {
      if (!user) return false;
      if (
        user.isPlatformUser ||
        user.platformRole === 'omnicore_admin' ||
        user.platformRole === 'super_admin'
      ) {
        return true;
      }
      const currentVerticals = tenant?.verticals || [];
      if (currentVerticals.includes('all_verticals')) return true;

      switch (moduleKey) {
        case 'courier':
          return currentVerticals.includes('courier_express');
        case 'shuttle':
          return currentVerticals.includes('corporate_shuttle');
        case 'cold_chain':
          return currentVerticals.includes('cold_chain');
        case 'warehouse':
          return (
            currentVerticals.includes('freight_logistics') ||
            currentVerticals.includes('bulk_fleet') ||
            currentVerticals.includes('b2b_contract') ||
            enabledAddons.includes('addon_warehouse')
          );
        case 'contracts':
          return (
            currentVerticals.includes('b2b_contract') ||
            currentVerticals.includes('project_logistics') ||
            enabledAddons.includes('addon_contracts')
          );
        default:
          return true;
      }
    },
    [user, tenant?.verticals, enabledAddons]
  );

  const updateTenantVerticals = useCallback(
    async (tenantId: string, newVerticals: VerticalType[]): Promise<void> => {
      const savedTenant = await platformApi.updateTenantVerticals(tenantId, newVerticals);
      setTenant((prev) => {
        const updated: Tenant = {
          ...prev,
          verticals: savedTenant.verticals,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        try {
          localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
        } catch {
          // safe
        }
        return updated;
      });
    },
    []
  );

  const updateTenantProfile = useCallback(async (payload: { company_name: string; email: string; phone: string; address: string }) => {
    const savedTenant = await platformApi.updateTenantProfile(payload);
    setTenant((current) => {
      if (current.id !== savedTenant.id) return current;
      const updated = {
        ...current,
        name: savedTenant.name,
        primaryContactEmail: savedTenant.primaryContactEmail,
        primaryContactPhone: savedTenant.primaryContactPhone,
        address: savedTenant.address,
      };
      localStorage.setItem('omni_active_tenant', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
        isVerticalEnabled,
        isModuleAllowedByVertical,
        updateTenantVerticals,
        updateTenantProfile,
        isModuleAllowedByPlan,
        getRequiredTierForModule,
        canCreateMultipleTenants,
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
