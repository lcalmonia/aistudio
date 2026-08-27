# iLuvKeyks Security Audit & Production Migration Notes

This document outlines the security architecture of the frontend application and provides guidance for deploying the server-side backend on Netlify.

---

## 1. Security Fixes Implemented in this Phase

1. **Complete Removal of Hardcoded Credentials**:
   - Removed all hardcoded credentials (`password123`, `1234`, `admin123`, `0000`, `keyks2026`, default PIN buttons) from all source files and components.
   - Removed the "Quick 1-Click Demo Accounts" and "Quick Fill Staff PIN" bypass controls.

2. **Removal of Seeded Demo Customer Records**:
   - Eradicated all seeded fake customer records, demo email addresses, fake physical addresses, and demo loyalty balances from the client bundle.
   - Customer creation now dynamically creates authentic data records.

3. **Data Access Isolation & Abstraction Layer**:
   - Decoupled UI components from direct browser `localStorage` calls.
   - All data flows through a dedicated Service / Repository layer (`/src/services/*`).
   - Prepared the application for drop-in server-side API connectors (Netlify Functions).

4. **Cryptographic Collision-Resistant Identifiers**:
   - Replaced fragile array length index identifiers (e.g. `customers.length + 1`) with collision-resistant UUID / timestamp hex identifiers (`generateCustomerId()`, `generateOrderId()`, `generateOrderNumber()`).

5. **Role-Based Access Control (RBAC)**:
   - Defined centralized permissions for `Customer`, `Staff`, `Admin`, and `Super Admin` roles.

---

## 2. Temporary Development Limitations (To be addressed in Netlify Phase)

During the current pre-Netlify phase in Google AI Studio, a temporary local development storage adapter (`storageAdapter.ts`) is used for previewing UI interactions. When deploying to Netlify:

1. **Server-Side Authentication**:
   - The development adapter verifies credentials in the browser storage sandbox.
   - In production, Netlify Functions must verify passwords using secure server-side bcrypt / Argon2 hashing, and issue HTTP-only Secure JWT cookies or Bearer tokens.

2. **Server-Side Authorization & RBAC Enforcement**:
   - The frontend RBAC helper (`hasPermission`) controls UI visibility.
   - In production, every Netlify Function endpoint must validate the caller's JWT role before performing database mutations.

3. **Input Sanitization & Server Validation**:
   - Netlify Functions must validate request bodies (e.g., ensuring prices are not manipulated client-side before creating orders).

4. **Payment Gateway Integration**:
   - In production, GCash, Maya, and Card payments must use server-side webhook validation rather than client-only state transitions.
