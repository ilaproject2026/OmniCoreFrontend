import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { PlatformLayout } from '../layouts/PlatformLayout';
import { AppLayout } from '../layouts/AppLayout';

// Guards
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { TenantGuard } from '../components/guards/TenantGuard';
import { PermissionGuard } from '../components/guards/PermissionGuard';
import { FeatureGuard } from '../components/guards/FeatureGuard';
import { RoleAccessRestricted } from '../components/feedback/RoleAccessRestricted';
import { PlanFeatureRestricted } from '../components/feedback/PlanFeatureRestricted';
import { VerticalAccessRestricted } from '../components/feedback/VerticalAccessRestricted';

// Auth Pages
import { Login } from '../features/auth/Login';
import { AcceptEmployeeInvitation } from '../features/auth/AcceptEmployeeInvitation';
import { Register } from '../features/auth/Register';
import { PlanSelectionPage } from '../features/auth/PlanSelectionPage';
import { MfaVerification } from '../features/auth/MfaVerification';
import { ForgotPassword } from '../features/auth/ForgotPassword';
import { ResetPassword } from '../features/auth/ResetPassword';
import { SessionExpired } from '../features/auth/SessionExpired';
import { Unauthorized } from '../features/auth/Unauthorized';
import { NotFound } from '../features/auth/NotFound';

// Platform Super Admin Pages
import { PlatformDashboard } from '../features/platform/PlatformDashboard';
import { TenantList } from '../features/platform/TenantList';
import { PackageManagement } from '../features/platform/PackageManagement';
import { FeaturesAndAddons } from '../features/platform/FeaturesAndAddons';
import { SubscriptionsList } from '../features/platform/SubscriptionsList';
import { SalesAndGrowth } from '../features/platform/SalesAndGrowth';
import { SupportTickets } from '../features/platform/SupportTickets';
import { PlatformAudit } from '../features/platform/PlatformAudit';

// Tenant Operations Pages
import { TenantDashboard } from '../features/dashboard/TenantDashboard';
import { FleetList } from '../features/fleet/FleetList';
import { DriverList } from '../features/drivers/DriverList';
import { TripsHub } from '../features/trips/TripsHub';
import { ContractsHub } from '../features/contracts/ContractsHub';
import { MaintenanceHub } from '../features/maintenance/MaintenanceHub';
import { WarehouseHub } from '../features/warehouse/WarehouseHub';
import { FinanceHub } from '../features/finance/FinanceHub';
import { CrmHub } from '../features/crm/CrmHub';
import { HrHub } from '../features/hr/HrHub';
import { InsuranceHub } from '../features/insurance/InsuranceHub';
import { MarketingHub } from '../features/marketing/MarketingHub';
import { ReportsHub } from '../features/reports/ReportsHub';
import { NotificationCenter } from '../features/notifications/NotificationCenter';
import { TenantSettings } from '../features/settings/TenantSettings';

// New Add-on & Vertical Pages
import { CourierDashboard } from '../features/courier/CourierDashboard';
import { ShuttleDashboard } from '../features/shuttle/ShuttleDashboard';
import { CustomFeatureOverrides } from '../features/platform/CustomFeatureOverrides';
import { RolePermissionsMatrix } from '../features/platform/RolePermissionsMatrix';
import { PublicPortalLayout } from '../features/public/PublicPortalLayout';
import { PublicHome } from '../features/public/PublicHome';
import { PublicTracking } from '../features/public/PublicTracking';
import { PublicBooking } from '../features/public/PublicBooking';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Route: Directly routed to registration with subscription plans displayed initially */}
      <Route path="/" element={<Navigate to="/auth/register" replace />} />

      {/* Standalone Full-Page Plan Selection & Upgrade */}
      <Route path="/auth/select-plan" element={<PlanSelectionPage />} />

      {/* A. Authentication Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Navigate to="/auth/register" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="accept-invitation" element={<AcceptEmployeeInvitation />} />
        <Route path="register" element={<Register />} />
        <Route path="mfa" element={<MfaVerification />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="session-expired" element={<SessionExpired />} />
      </Route>

      {/* Error Screens */}
      <Route path="/auth/unauthorized" element={<Unauthorized />} />
      <Route path="/auth/404" element={<NotFound />} />

      {/* B. Platform / Super Admin Portal */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute requirePlatformAdmin={true}>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/platform/dashboard" replace />} />
        <Route path="dashboard" element={<PlatformDashboard />} />
        <Route path="tenants" element={<TenantList />} />
        <Route path="tenants/:id/features" element={<CustomFeatureOverrides />} />
        <Route path="roles" element={<RolePermissionsMatrix />} />
        <Route path="packages" element={<PackageManagement />} />
        <Route path="features" element={<FeaturesAndAddons />} />
        <Route path="subscriptions" element={<SubscriptionsList />} />
        <Route path="sales" element={<SalesAndGrowth />} />
        <Route path="support" element={<SupportTickets />} />
        <Route path="audit" element={<PlatformAudit />} />
      </Route>

      {/* C. Tenant Application Workspace */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <TenantGuard>
              <AppLayout />
            </TenantGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<TenantDashboard />} />
        <Route path="fleet" element={<FleetList />} />
        <Route path="drivers" element={<DriverList />} />
        <Route path="trips" element={<TripsHub />} />
        <Route
          path="courier"
          element={
            <FeatureGuard
              module="courier"
              vertical="courier_express"
              serviceTitle="Courier & Express Delivery"
              fallback={<VerticalAccessRestricted verticalKey="courier_express" serviceTitle="Courier & Express Delivery" />}
            >
              <CourierDashboard />
            </FeatureGuard>
          }
        />
        <Route
          path="shuttle"
          element={
            <FeatureGuard
              module="shuttle"
              vertical="corporate_shuttle"
              serviceTitle="Corporate Commuter Shuttle"
              fallback={<VerticalAccessRestricted verticalKey="corporate_shuttle" serviceTitle="Corporate Commuter Shuttle" />}
            >
              <ShuttleDashboard />
            </FeatureGuard>
          }
        />

        {/* Entitlement & Permission Protected Routes */}
        <Route
          path="contracts"
          element={
            <FeatureGuard
              module="contracts"
              fallback={<PlanFeatureRestricted moduleName="Contracts & Tenders" requiredTier="standard" />}
            >
              <PermissionGuard
                permission="contract.view"
                fallback={<RoleAccessRestricted moduleName="Contracts & Tenders" requiredPermission="contract.view" />}
              >
                <ContractsHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />
        <Route
          path="maintenance"
          element={
            <FeatureGuard
              module="maintenance"
              fallback={<PlanFeatureRestricted moduleName="Workshop & Maintenance" requiredTier="basic" />}
            >
              <MaintenanceHub />
            </FeatureGuard>
          }
        />
        <Route
          path="warehouse"
          element={
            <FeatureGuard
              module="warehouse"
              fallback={<PlanFeatureRestricted moduleName="Warehouse & Spare Parts" requiredTier="basic" />}
            >
              <PermissionGuard
                permission="warehouse.view"
                fallback={<RoleAccessRestricted moduleName="Warehouse & Spare Parts" requiredPermission="warehouse.view" />}
              >
                <WarehouseHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />
        <Route
          path="crm"
          element={
            <FeatureGuard
              module="crm"
              fallback={<PlanFeatureRestricted moduleName="CRM & Sales Pipeline" requiredTier="enterprise" />}
            >
              <PermissionGuard
                permission="crm.view"
                fallback={<RoleAccessRestricted moduleName="CRM & Pipeline" requiredPermission="crm.view" />}
              >
                <CrmHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />

        <Route
          path="finance"
          element={
            <FeatureGuard
              module="finance"
              fallback={<PlanFeatureRestricted moduleName="Finance & Invoicing" requiredTier="basic" />}
            >
              <PermissionGuard
                permission="finance.view"
                fallback={<RoleAccessRestricted moduleName="Finance & Invoicing" requiredPermission="finance.view" />}
              >
                <FinanceHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />
        <Route
          path="hr"
          element={
            <FeatureGuard
              module="hr"
              fallback={<PlanFeatureRestricted moduleName="HR & Personnel Directory" requiredTier="standard" />}
            >
              <PermissionGuard
                permission="hr.view"
                fallback={<RoleAccessRestricted moduleName="HR & Personnel" requiredPermission="hr.view" />}
              >
                <HrHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />

        <Route
          path="insurance"
          element={
            <FeatureGuard
              module="insurance"
              fallback={<PlanFeatureRestricted moduleName="Insurance & Claims" requiredTier="corporate" />}
            >
              <PermissionGuard
                permission="insurance.view"
                fallback={<RoleAccessRestricted moduleName="Insurance & Claims" requiredPermission="insurance.view" />}
              >
                <InsuranceHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />
        <Route
          path="marketing"
          element={
            <FeatureGuard
              module="marketing"
              fallback={<PlanFeatureRestricted moduleName="Marketing Campaigns" requiredTier="standard" />}
            >
              <PermissionGuard
                permission="marketing.view"
                fallback={<RoleAccessRestricted moduleName="Marketing Campaigns" requiredPermission="marketing.view" />}
              >
                <MarketingHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />
        <Route
          path="reports"
          element={
            <FeatureGuard
              module="reports"
              fallback={<PlanFeatureRestricted moduleName="Reports & Analytics" requiredTier="standard" />}
            >
              <PermissionGuard
                permission="reports.view"
                fallback={<RoleAccessRestricted moduleName="Reports & Analytics" requiredPermission="reports.view" />}
              >
                <ReportsHub />
              </PermissionGuard>
            </FeatureGuard>
          }
        />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route
          path="settings"
          element={
            <PermissionGuard
              permission="tenant.manage"
              fallback={<RoleAccessRestricted moduleName="Tenant Settings" requiredPermission="tenant.manage" />}
            >
              <TenantSettings />
            </PermissionGuard>
          }
        />
      </Route>

      {/* D. Tenant Public Mini-Website & Booking Portal */}
      <Route path="/public/:tenantSlug" element={<PublicPortalLayout />}>
        <Route index element={<PublicHome />} />
        <Route path="track" element={<PublicTracking />} />
        <Route path="book" element={<PublicBooking />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/auth/404" replace />} />
    </Routes>
  );
};
