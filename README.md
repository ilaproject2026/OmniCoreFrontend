# OmniCore Logistics & Fleet Ecosystem

OmniCore is an enterprise-grade, multi-tenant SaaS platform engineered for fleet telemetry, long-haul freight logistics, courier & express operations, passenger shuttle routing, warehouse cross-docking, and financial billing.

## 📚 Master Documentation & Operations Guides
* **[User & Operational Workflow Guide](USER_WORKFLOW_GUIDE.md)**: End-to-end user guide covering registration, plan selection, Super User setup, role assignment (RBAC), and plan-based feature entitlements (Fleet, Drivers, Dispatch, etc.).
* **[Master Operations & Workflow Guide](docs/OMNICORE_MASTER_OPERATIONS_GUIDE.md)**: Exhaustive manual covering user roles, granular permissions, multi-branch scoping, trip dispatching, fleet management, courier/shuttle workflows, and platform administration.
* **[Vertical Differentiation & Architecture Specification](docs/vertical_differentiation.md)**: Technical architecture specification of the 10 specialized industry transport verticals, AWB lifecycle state machines, and multi-tenant telemetry polymorphism.

---

## 🚀 Key System Features
* **Multi-Tenant & Multi-Branch Architecture**: Seamless isolation with `X-Tenant-ID` scoping and regional depot filtering via the `BranchSwitcher`.
* **RBAC & Authorization Matrix**: Dual-tier security (Platform Super Admins vs. Tenant Operators) with fine-grained capability tokens (`can('domain.action')`).
* **Interactive Role Simulation**: Fast persona switching via `RoleSwitcher` on the top navbar to inspect dynamic UI adaptations in real time.
* **End-to-End Operational Lifecycle**: Consignment booking, anti-conflict driver/vehicle allocation, live dispatching, expense auditing, and automated net profit margin calculation.

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
