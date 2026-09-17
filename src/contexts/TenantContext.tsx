import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Tenant, VerticalType, PackageTier, AddonKey, User } from '../types';
import { useAuth } from './AuthContext';
import { MOCK_TENANTS } from '../api/mockData';
import { PACKAGES } from '../config/constants';

interface TenantContextType {
  tenant: Tenant;
  verticals: VerticalType[];
  packageTier: PackageTier;
  enabledAddons: AddonKey[];
  enabledFeatures: string[];
  permissions: string[];
  currentUser: User | null;
  can: (permission: string) => boolean;
  hasFeature: (featureName: string) => boolean;
  hasAddon: (addonKey: AddonKey) => boolean;
  hasVertical: (verticalKey: VerticalType) => boolean;
  switchTenant: (newTenant: Tenant) => void;
  setPackageTier: (tier: PackageTier) => void;
  toggleAddon: (addonKey: AddonKey) => void;
  upgradePackage: (newTier: PackageTier, addons: AddonKey[]) => Promise<void>;
  reactivateTenant: () => void;
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
        return MOCK_TENANTS[0];
      }
    }
    return MOCK_TENANTS[0]; // Apex Global Logistics & Cold Chain
  });

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
      const found = MOCK_TENANTS.find((t) => t.id === prev.id);
      if (found) {
        found.status = 'active';
        if (found.subscription) found.subscription.status = 'active';
      }
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

  // Centralized permission evaluator: can("vehicle.create"), can("finance.view"), etc.
  const can = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.isPlatformUser) return true; // Super admins have platform-wide access
      if (permissions.includes('*')) return true;
      if (permissions.includes(permission)) return true;

      // Role shorthand fallbacks
      if (user.tenantRole === 'tenant_admin') return true;

      // Domain-level permission prefix matching (e.g. "finance.*")
      const [domain] = permission.split('.');
      if (permissions.includes(`${domain}.*`)) return true;

      return false;
    },
    [user, permissions]
  );

  const hasFeature = useCallback(
    (featureName: string): boolean => {
      const lower = featureName.toLowerCase();
      return enabledFeatures.some((f) => f.toLowerCase() === lower || f.toLowerCase().includes(lower));
    },
    [enabledFeatures]
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
        currentUser: user,
        can,
        hasFeature,
        hasAddon,
        hasVertical,
        switchTenant,
        setPackageTier,
        toggleAddon,
        upgradePackage,
        reactivateTenant,
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
