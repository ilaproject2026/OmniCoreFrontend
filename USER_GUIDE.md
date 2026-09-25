# OmniCore Logistics & Fleet Ecosystem
## Super Admin Operations & Architecture Guide (USER_GUIDE.md)

---

## 1. Executive Summary & Philosophy

**OmniCore** is a multi-tenant enterprise Logistics, Fleet, and Transport Ecosystem engineered to support diverse transportation modalities under a single unified platform. 

Unlike traditional fleet software that treats all vehicles the same, OmniCore is built around **Industry Verticals**. A passenger taxi firm operates under completely different business logic, billing models, and telemetry requirements than a refrigerated cold-chain pharmaceutical hauler, an intercity tourist luxury coach operator, or an urban courier express network.

### The Role of the OmniCore Project Admin (Main Super Admin)
As the **OmniCore Project Admin**, you hold the master keys to the entire ecosystem:
1. **Tenant Provisioning**: You onboard new customer organizations (transport agencies, courier companies, bus lines, 3PL giants).
2. **Vertical Entitlement Control**: When a client approaches your team (e.g., *"We run an express courier network and intercity tourist shuttles"*), you grant their organization access **strictly to those contracted service verticals**.
3. **Subscription & Addon Governance**: You assign their subscription tier (`Basic Starter`, `Standard Fleet`, `Corporate Enterprise`, or `OmniCore Enterprise`) and configure high-value add-ons (IoT Cold-Chain Telemetry, Last-Mile Dispatching, AI Predictive Maintenance).
4. **Global Data Isolation & Compliance**: You supervise cross-tenant telemetry, platform audit logs, and security compliance while guaranteeing strict logical data isolation between competing organizations.

---

## 2. Core Concept: Vertical-Driven Access & RBAC

### What is a "Vertical"?
In OmniCore, a **Vertical** is a dedicated, self-contained business domain representing a specific transport industry segment. Each vertical comes with:
- **Dedicated Operational Workflows**: Tailored manifest generators, dispatch boards, and tariff calculators.
- **Specialized Telemetry & Sensors**: e.g., reefer temperature probes for Cold-Chain, gross-tare weighbridges for Bulk Cargo, or barcode scanners for Courier hubs.
- **Targeted Compliance Records**: e.g., e-Way bills, passenger manifests, hazardous material permits, or proof of delivery (e-PoD) OTPs.

### Why Verticals are the Foundation of RBAC
In standard SaaS platforms, RBAC is often limited to generic titles like "Admin", "Manager", or "Viewer". In OmniCore, RBAC is **service-contract driven**:
- If a customer only pays for **Courier & Express Delivery**, their users (even their company's internal administrators) **cannot** view or access the Tourist Bus or Cold-Chain modules.
- Access to specialized business modules is governed primarily by **Vertical Entitlement**, secondarily by **Subscription Tier**, and tertiarily by **Individual User Permission**.

```
                   ┌────────────────────────────────────────┐
                   │       OmniCore Project Admin           │
                   │    (Main Super Admin - Master Key)     │
                   └──────────────────┬─────────────────────┘
                                      │
            ┌─────────────────────────┴────────────────────────┐
            │ Provisions Customer Org & Grants Service Verticals │
            └─────────────────────────┬────────────────────────┘
                                      │
                 ┌────────────────────┴──────────────────┐
                 ▼                                       ▼
    ┌──────────────────────────┐            ┌──────────────────────────┐
    │  Customer A (Courier)    │            │  Customer B (Tourism)    │
    │  Granted: courier_express│            │  Granted: tourist_taxi   │
    │           last_mile      │            │           tourist_bus    │
    └────────────┬─────────────┘            └────────────┬─────────────┘
                 │                                       │
     ┌───────────┴───────────┐               ┌───────────┴───────────┐
     ▼                       ▼               ▼                       ▼
Customer Admin          Operations Staff Customer Admin          Operations Staff
(Restricted to          (Field Dispatch  (Restricted to          (Chauffeurs, Bus
Courier & Last-Mile)     & Hub Scanning)  Tourism Verticals)      Roster Dispatch)
```

---

## 3. The 3-Tier Ecosystem Role Hierarchy

| Tier | Role Code | Role Title | Scope of Authority |
| :--- | :--- | :--- | :--- |
| **Tier 1** | `omnicore_admin` / `super_admin` | **OmniCore Project Admin** (Main Super Admin) | **Global Platform Scope**: Governs all client organizations, creates plans, assigns database schemas, controls cross-tenant verticals, and reviews global telemetry. |
| **Tier 2** | `customer_admin` / `tenant_admin` | **Customer Admin** (Organization Manager) | **Tenant Executive Scope**: Manages staff, vehicles, drivers, and branches within their client workspace. Authority is strictly bounded by the service verticals granted by OmniCore. |
| **Tier 3A**| `vertical_operator` | **Vertical Operations Staff** | **Workflow Execution Scope**: Dispatchers, parcel hub supervisors, route planners, and maintenance staff executing daily tasks in active verticals. |
| **Tier 3B**| `customer_staff` | **Customer Staff Member** | **Operational Viewer Scope**: Field assistants, drivers, and support personnel with task-specific permissions (e.g., viewing assigned trips, logging fuel). |

---

## 4. The 14 Industry Verticals (Complete Directory)

OmniCore defines **14 specialized service verticals** (plus 1 unified multi-vertical conglomerate hub):

```
                                  OMNICORE INDUSTRY VERTICALS
  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                                  │
  │   PASSENGER & MOBILITY          EXPRESS & URBAN             HEAVY FREIGHT & SPECIALIZED          │
  │   ─────────────────────         ─────────────────           ───────────────────────────          │
  │   1. Taxi & Cab Operations      6. Courier & Express Hub    8. Goods & Freight Logistics (FTL/LTL)│
  │   2. Tourist Taxi Operations    7. E-commerce Last-Mile     9. Packers & Movers Relocations      │
  │   3. Tourist & Luxury Coach                                 10. Cold Chain & Reefer Fleet        │
  │   4. Corporate Fleet Mobility                               11. Bulk Haulage & Tanker Fleet      │
  │   5. Commuter & School Shuttle                              12. Specialized Heavy Machinery (ODC)│
  │                                                             13. Project Turnkey EPC Logistics    │
  │                                                             14. B2B Dedicated Contract Logistics │
  │                                                                                                  │
  │   15. Enterprise Multi-Vertical Hub (Conglomerate Consolidated Multi-Modal Control)              │
  └──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Breakdown of Verticals

#### 1. Taxi & Cab Operations (`taxi_cab`)
* **Industry Focus**: Urban on-demand and metered point-to-point passenger transport.
* **Key Features**: Surge pricing algorithm, shift driver rosters, digital meter calibration, passenger emergency SOS tracking.
* **Primary Telemetry**: Real-time GPS pinging, meter start/stop status, idle time monitoring.

#### 2. Tourist Taxi Operations (`tourist_taxi`)
* **Industry Focus**: Intercity tourism, airport premium transfers, and multi-day outstation chauffeur trips.
* **Key Features**: Multi-day itinerary builder, airport flight schedule synchronization, chauffeur daily allowances, multi-currency guest billing.
* **Primary Telemetry**: Toll plaza tracking, state border permit checkpoints, outstation mileage logs.

#### 3. Tourist & Commercial Bus (`tourist_bus`)
* **Industry Focus**: Scheduled intercity luxury coaches, sleeper buses, and chartered tourist excursions.
* **Key Features**: Visual seat layout & allocation matrix, passenger manifest generator, scheduled route timetable editor, bus charter quote builder.
* **Primary Telemetry**: Door open/close sensors, onboard WiFi telemetry, speed limit enforcement.

#### 4. Corporate Fleet Operations (`corporate_fleet`)
* **Industry Focus**: Executive corporate mobility, dedicated enterprise pool cars, and VIP airport protocols.
* **Key Features**: Cost center billing, executive priority scheduling, VIP chauffeur dress code compliance checklists, department expense allocation.
* **Primary Telemetry**: Cabin noise telemetry, trip start/end geofences at corporate campuses.

#### 5. School & Corporate Shuttle / Bus Pooling (`corporate_shuttle`)
* **Industry Focus**: Fixed-route recurring passenger transit, campus commuter shuttles, and school bus routes.
* **Key Features**: Sequential stop ETA calculations, employee/student passenger rosters, QR boarding verification, automated shift timetable synchronization.
* **Primary Telemetry**: Stop dwell-time counters, passenger count sensors, geofenced route adherence alerts.

#### 6. Courier & Express Delivery (`courier_express`)
* **Industry Focus**: High-speed parcel logistics, express documents, and air-waybill (AWB) freight.
* **Key Features**: Full AWB lifecycle tracking, barcode batch scanning, cross-dock sorting hubs, multi-point pickup runs, digital proof of delivery (e-PoD via OTP/Signature), agent commission tiers.
* **Primary Telemetry**: Handheld barcode scanner sync, bag seal integrity monitoring.

#### 7. E-commerce Last-Mile Delivery (`last_mile`)
* **Industry Focus**: High-density urban parcel delivery, e-commerce fulfillment, and grocery logistics.
* **Key Features**: Street-level route clustering, Cash-on-Delivery (COD) cash collection reconciliation, customer SMS ETA links, automated failed-delivery re-routing.
* **Primary Telemetry**: Driver smartphone GPS, battery level telemetry, delivery attempt timestamps.

#### 8. Goods & Freight Logistics (`freight_logistics`)
* **Industry Focus**: Cross-country long-haul freight, Full Truckload (FTL), and Less-than-Truckload (LTL) cargo.
* **Key Features**: Multi-drop linehaul planning, gross-tare weighbridge API synchronization, digital e-Way bills, multi-leg consignment handovers.
* **Primary Telemetry**: Axle load sensors, hub arrival geofences, tyre pressure monitoring systems (TPMS).

#### 9. Packers & Movers (`packers_movers`)
* **Industry Focus**: Residential home shifting, corporate office relocation, and fine-art handling.
* **Key Features**: Room-by-room itemized packing inventory, loading crew roster assignments, transit insurance policy riders, digital damage claim photo inspection.
* **Primary Telemetry**: Cargo box shock/tilt sensors, moving truck tail-lift activity tracking.

#### 10. Cold Chain & Reefer Fleet (`cold_chain`)
* **Industry Focus**: Temperature-controlled logistics for pharmaceuticals, vaccines, perishable foods, meat, and dairy.
* **Key Features**: Multi-zone temperature telemetry (-25°C to +15°C), instant audible/SMS breach alarms, automated FDA/GDocP pharma compliance logs, reefer engine hours tracking.
* **Primary Telemetry**: Dual-probe IoT temperature & humidity data loggers, reefer compressor fuel consumption.

#### 11. Bulk Haulage & Tanker Fleet (`bulk_fleet`)
* **Industry Focus**: Petroleum fuels, liquefied chemicals, bulk cement, edible oils, and agricultural foodgrains.
* **Key Features**: Tanker multi-compartment allocation, gross-tare weighbridge calibration, hazardous materials (Hazmat) route compliance, dip-chart volume calculations.
* **Primary Telemetry**: Tanker lid tamper switches, bottom discharge valve sensors, emergency shut-off monitoring.

#### 12. Specialized Heavy Machinery (`heavy_machinery`)
* **Industry Focus**: Over-dimensional cargo (ODC), project super-loads, hydraulic multi-axle trailers, and cranes.
* **Key Features**: ODC route gradient & bridge feasibility permits, hydraulic axle weight distribution calculators, police escort convoy coordination, civil utility clearance permits.
* **Primary Telemetry**: Hydraulic suspension pressure gauges, convoy lead/tail escort GPS synchronization.

#### 13. Project-Based Logistics (`project_logistics`)
* **Industry Focus**: Turnkey EPC engineering, power plant construction, wind farm logistics, and industrial infrastructure.
* **Key Features**: Construction project milestone logistics, job site marshaling yards, multi-modal barge-to-rail-to-road transshipment, task force resource pooling.
* **Primary Telemetry**: Crane lift telemetry, laydown yard RFID asset tagging.

#### 14. B2B Dedicated Contracts & Tenders (`b2b_contract`)
* **Industry Focus**: Long-term dedicated enterprise client contracts, government freight tenders, and 3PL SLAs.
* **Key Features**: SLA performance tracker, monthly minimum guarantee penalty gauges, tender cost estimator, milestone-based corporate billing.
* **Primary Telemetry**: Monthly committed kilometers vs. actual billed kilometers telemetry.

#### 15. Enterprise Multi-Vertical Hub (`all_verticals`)
* **Industry Focus**: Global 3PL/4PL conglomerates and logistics holding groups operating fleets across passenger, freight, and urban delivery simultaneously.
* **Key Features**: Cross-vertical executive dashboards, shared resource pooling (mechanics, fuel depots, dispatchers), consolidated enterprise P&L.

---

## 5. Subscription Plans & Tiers

OmniCore implements a **4-tier subscription structure**. While Verticals dictate *which operational workflows* an organization can run, Subscription Plans dictate *platform scale, vehicle capacity, and enterprise management tools*:

| Package Tier | Monthly / Annual Price | Fleet Capacity | Operator Seats | Core Features Included |
| :--- | :--- | :--- | :--- | :--- |
| **Basic Starter** | **$149 / mo**<br>($1,490 / yr) | Up to 25 Vehicles | 5 Seats | Vehicle & Driver Registry, Trip Dispatch, Workshop & Maintenance, Finance & Billing, Warehouse Spare Parts, Single Tenant Context. |
| **Standard Fleet** | **$399 / mo**<br>($3,990 / yr) | Up to 100 Vehicles | 25 Seats | *All Basic features*, plus: Custom Role Permissions Matrix, Platform Audit Log, Contracts & Tenders with SLA Tracking, HR Department Directory, Marketing Campaigns, Advanced Reporting. |
| **Corporate Enterprise** | **$899 / mo**<br>($8,990 / yr) | Up to 500 Vehicles | 50 Seats | *All Standard features*, plus: CRM Sales Pipeline, Insurance & Claims Management, Courier & Express Delivery Hub, Corporate Shuttle Pooling, Public Booking Portal & Tracking. |
| **OmniCore Enterprise** | **$1,899 / mo**<br>($18,990 / yr) | Unlimited Fleet | Unlimited | *All Corporate features*, plus: Multiple Tenant Provisioning & Orchestration, IoT Cold Chain Telemetry, AI Predictive Maintenance, 24/7 Dedicated Account Engineer. |

### Module Requirement Matrix
The application gates routes and features using `MODULE_REQUIRED_TIERS`:
* **Level 1 (Basic)**: `dashboard`, `fleet`, `drivers`, `trips`, `maintenance`, `finance`, `warehouse`, `settings`, `notifications`.
* **Level 2 (Standard)**: `roles`, `audit`, `contracts`, `hr`, `marketing`, `reports`, `insurance`.
* **Level 3 (Enterprise / Corporate)**: `courier`, `shuttle`, `crm`, `public_portal`, `multiple_tenants`.

---

## 6. Specialized Featured Add-Ons

Add-ons can be bolted onto any active subscription to provide specialized hardware connectivity, specialized algorithms, or enterprise integration:

| Add-on Key | Add-on Name | Monthly Price | Category | Relationship to Verticals |
| :--- | :--- | :--- | :--- | :--- |
| `addon_cold_chain` | **Cold Chain & Reefer Telemetry** | $249 / mo | Specialized IoT | **Mandatory requirement** for live IoT temperature streaming in `cold_chain`. |
| `addon_last_mile` | **Last-Mile Route Optimization** | $179 / mo | Specialized AI | **Mandatory requirement** for clustered street routing in `last_mile`. |
| `addon_telematics` | **GPS & Live Telematics Pack** | $219 / mo | Connectivity | Unlocks OBD-II / CAN-bus streaming, overspeed detection, and harsh braking alerts. |
| `addon_warehouse` | **Warehouse & Spare Parts Pro** | $149 / mo | Operations | Unlocks multi-bin spare part inventory, tyre retread wear gauges, and PO workflows. |
| `addon_contracts` | **Contract & Tender Management** | $199 / mo | Operations | Unlocks government tender estimators and client minimum-guarantee penalty counters. |
| `addon_maintenance_pro` | **Predictive Maintenance Pro** | $129 / mo | Intelligence | AI failure prediction for alternators, brake pads, and transmission fluid. |
| `addon_analytics` | **Advanced BI & Analytics Suite** | $199 / mo | Intelligence | Custom cohort analysis, fuel theft anomaly algorithms, and interactive pivot tables. |
| `addon_integrations` | **Open API & Webhooks Engine** | $299 / mo | Connectivity | High-throughput webhooks, SAP / Oracle NetSuite ERP synchronization. |
| `addon_partner_portal` | **Investor & Vehicle Leasing Portal** | $149 / mo | Intelligence | Secure read-only financial portal for third-party vehicle owners and banks. |

---

## 7. How the Frontend Enforces Vertical Security

The OmniCore frontend enforces vertical and plan restrictions across three distinct layers:

### Layer 1: Component & Route Guarding (`FeatureGuard`)
Every vertical module route in `src/routes/index.tsx` is wrapped in a `FeatureGuard`:
```tsx
<FeatureGuard
  module="courier"
  vertical="courier_express"
  serviceTitle="Courier & Express Delivery"
  fallback={<VerticalAccessRestricted verticalKey="courier_express" serviceTitle="Courier & Express Delivery" />}
>
  <CourierDashboard />
</FeatureGuard>
```

### Layer 2: Graceful Access Fallback (`VerticalAccessRestricted`)
If a customer attempts to access an uncontracted vertical (e.g. typing `/app/courier` in the browser URL bar):
- **For Customer Users**: Displays an informative screen explaining that the vertical is governed by contract, with a button to *"Request Vertical Activation from OmniCore"*.
- **For OmniCore Project Admin**: Detects that the current viewer is the Super Admin and displays a direct **1-Click Instant Activation Button**: *"Grant Vertical Access Now"*.

### Layer 3: Dynamic Adaptive Sidebar (`Sidebar.tsx`)
The sidebar automatically checks `isVerticalEnabled(verticalKey)`:
- If a vertical is enabled for the tenant, it shows a green badge (`AWB Hub`, `Route Pool`) and provides instant access.
- If not contracted, it displays a amber warning badge (`Vertical Req`), and clicking it opens the informative `VerticalAccessRestricted` screen.

---

## 8. Step-by-Step Playbooks for OmniCore Super Admin

### Playbook 1: Onboarding a New Customer Organization
1. Sign in as OmniCore Project Admin (`admin@omnicore.io`).
2. Navigate to **Tenants & Provisioning** (`/platform/tenants`).
3. Click **+ Create New Tenant**.
4. In the Tenant Provisioning Wizard:
   - Enter Company Name (e.g., `Apex Express Logistics`).
   - Define Organization Slug (e.g., `apex-express`). This configures their dedicated workspace URL (`apex-express.omnicore.io`).
   - Select Subscription Tier (`Standard Fleet` or `Corporate Enterprise`).
   - Select the contracted **Service Verticals** (e.g., check `Courier & Express Delivery` and `E-commerce Last-Mile Delivery`).
   - Assign initial Primary Contact Admin email and temporary password.
5. Click **Provision Tenant Workspace**. The backend creates the isolated database schema, provisions the user account, and binds their vertical entitlements.

### Playbook 2: Granting New Verticals to an Existing Client
*Scenario: An existing client operating freight trucks approaches you wanting to add Corporate Commuter Shuttles for their local factory.*
1. Go to **Vertical Access & RBAC Hub** (`/platform/roles`).
2. Ensure you are on the **Customer Vertical Entitlements** tab.
3. Select the customer's organization from the tenant dropdown.
4. Locate the **School & Corporate Shuttle / Bus Pooling** card.
5. Click **Grant Vertical Access**.
6. The entitlement updates instantly in the database; the client's sidebar immediately activates the shuttle routes without requiring them to re-register or deploy new software.

### Playbook 3: Managing Roles and Staff within a Customer Workspace
1. In `/platform/roles`, click on the **Customer Accounts & Staff** tab.
2. Filter users by the customer's tenant name.
3. To assign a new operator, click **+ Assign Customer User**:
   - Enter name, email, and phone.
   - Choose their role:
     - `Customer Admin`: For the client's internal executive director.
     - `Vertical Operations Staff`: For daily dispatchers, parcel sorters, or route supervisors.
     - `Customer Staff Member`: For drivers and field assistants.
4. Click **Confirm Assignment**.

### Playbook 4: Switching Between Tenants (Super Admin Perspective)
As the OmniCore Project Admin, you have global visibility:
1. In the top navigation bar, locate the **Tenant Switcher** (`TenantSwitcher.tsx`).
2. When logged in as Super Admin, it displays **Platform Cross-Tenant Control**.
3. Click the dropdown to switch your active operational lens to any client tenant (e.g. `BlueDart Express`, `GreenLine Shuttles`, or `National Freight`).
4. The dashboard, vehicle counts, active trips, and telemetry instantly re-scope to that specific tenant's isolated data.
5. To return to global platform governance, click **Go to Super Admin Portal** or navigate to `/platform/dashboard`.

---

## 9. Security, Isolation & Multi-Tenancy Architecture

| Security Domain | Implementation in OmniCore |
| :--- | :--- |
| **Data Isolation** | Strict tenant scoping via `tenant_id` on all database models. Customer users can never read, query, or enumerate records belonging to other tenants. |
| **Authentication & Tokens** | High-security JWT (JSON Web Tokens) with a 15-minute access token lifespan and automated refresh rotation via Axios interceptors. |
| **Multi-Factor Authentication (MFA)** | TOTP token enforcement for all administrative roles (`omnicore_admin`, `customer_admin`). |
| **Session Expiry & Revocation** | Dedicated event listener `omni_auth_expired` clears session data and wipes local caches instantly upon logout or token revocation. |
| **Regional Operating Hubs** | The `BranchSwitcher` component allows multi-branch organizations to scope their operational telemetry by city, regional hub, or maintenance depot. |

---

## 10. Summary Reference for Developers & Admins

* **Platform Root Route**: Routed directly to registration/login (`/auth/register` and `/auth/login`).
* **Platform Super Admin Hub**: Accessible at `/platform/dashboard` and `/platform/roles`.
* **Tenant Operations Hub**: Accessible at `/app/dashboard`, `/app/fleet`, `/app/trips`, `/app/courier`.
* **Public Booking & Tracking Portals**: Self-service tracking at `/public/:tenantSlug/track` and guest booking at `/public/:tenantSlug/book`.
* **Role Matrix Definition**: Defined in `src/types/index.ts` and configured dynamically in `src/features/platform/RolePermissionsMatrix.tsx`.
* **Industry Verticals Definition**: Defined in `src/config/constants.ts` under `VERTICALS`.
