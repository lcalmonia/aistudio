# iLuvKeyks Architecture Documentation

## Overview

The iLuvKeyks application follows a clean, decoupled layered architecture designed for maintainability and seamless future transition from local development storage to cloud/API endpoints (such as Netlify Functions, serverless APIs, or backend databases).

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 UI / React Components                   │
│   (App.tsx, Admin Views, Customer Portal, Modals, etc.) │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     Service Layer                       │
│  (authService, customerService, orderService,           │
│   menuService, inventoryService, settingsService,       │
│   categoryService, addonService, promoService,          │
│   loyaltyService, reportingService, roleService)        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Storage Adapter                      │
│                  (storageAdapter.ts)                    │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 Temporary Dev Storage                   │
│               (Isolated Local Storage)                  │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. UI Layer (`src/components/`, `src/App.tsx`)
- **Strictly UI and User Interaction**: Renders views, handles forms, triggers validation feedback, and dispatches actions to services.
- **Zero Direct Storage Access**: No component directly reads from or writes to `localStorage` or browser storage APIs.
- **Asynchronous Data Handling**: Uses Promise-based service calls (`async/await`) so that replacing local adapters with remote network APIs requires zero UI changes.

### 2. Service Layer (`src/services/`)
- **Business Logic & Entity Operations**:
  - `authService`: Customer registration, customer login/logout, staff authentication session handling.
  - `customerService`: Customer CRUD, directory querying, profile updates, account deactivation.
  - `orderService`: POS tickets and online customer orders, status tracking, cancellations.
  - `menuService`: Product catalog CRUD, availability toggling.
  - `inventoryService`: Stock items, threshold tracking, stock movements.
  - `settingsService`: Cafe branding, hero announcements, ordering enablement.
  - `categoryService`: Menu categories management.
  - `addonService`: Modifiers/addons CRUD and availability.
  - `promoService`: Value combo bundles management.
  - `loyaltyService`: Stamp cards calculation, point accumulation, and rewards redemption.
  - `reportingService`: Sales analytics, cups served, active ticket calculations.
  - `roleService`: Role-based access control (RBAC) permission resolution.

### 3. Storage Adapter (`src/services/storageAdapter.ts`)
- **Centralized Persistence Abstraction**: Encapsulates raw key-value serialization/deserialization.
- **Single Point of Evolution**: When migrating to serverless APIs or cloud databases in future phases, only this adapter/service interface needs to be connected to HTTP fetch clients, leaving all application business logic and presentation layers intact.

---

## Production Readiness Rules Enforced
- All hardcoded demo logins, demo quick-fill accounts, and shortcut buttons removed.
- Production validation rules enforced on both customer and staff login interfaces.
- Legacy `data/storage.ts` proxy removed.
- Clean TypeScript types defined across all entities in `src/types.ts`.
