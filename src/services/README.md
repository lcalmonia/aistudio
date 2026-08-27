# iLuvKeyks Backend Service Contract & API Specification

This document defines the architectural contract, API endpoints, data models, and authentication workflows for the future server-side backend (e.g., Netlify Functions, serverless REST API, and persistent cloud database).

---

## 1. Architecture Overview

```
Frontend (React + TypeScript)
       ↓  (HTTPS / JSON API with Bearer JWT)
Backend API Layer (Netlify Functions / Serverless Endpoints)
       ↓  (Server-side validation, password hashing, RBAC)
Persistent Database (PostgreSQL / Supabase / Netlify DB)
```

---

## 2. API Endpoints Specification

### 2.1 Authentication (`/api/auth`)

| Endpoint | Method | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Registers a new customer account | `{ name, email, mobile, password, address }` | `{ success: true, customer, token }` |
| `/api/auth/login` | `POST` | Authenticates customer with password | `{ identifier, password }` | `{ success: true, customer, token }` |
| `/api/auth/staff-login` | `POST` | Authenticates staff or manager PIN | `{ passcode, role }` | `{ success: true, staff, token }` |
| `/api/auth/me` | `GET` | Validates session & returns current user | Headers: `Authorization: Bearer <token>` | `{ user, role, permissions }` |
| `/api/auth/logout` | `POST` | Invalidates session / clears cookie | None | `{ success: true }` |

### 2.2 Customers (`/api/customers`)

| Endpoint | Method | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `/api/customers` | `GET` | Paginated customer list with search query | `staff`, `admin`, `super_admin` |
| `/api/customers/:id` | `GET` | Retrieves full customer profile | `admin`, or customer owner |
| `/api/customers/:id` | `PUT` | Updates customer contact or delivery details | `admin`, or customer owner |
| `/api/customers/:id/status` | `PATCH` | Deactivates or reactivates customer account | `admin`, `super_admin` |

### 2.3 Orders (`/api/orders`)

| Endpoint | Method | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `/api/orders` | `GET` | List orders with status and date filters | `staff`, `admin` |
| `/api/orders` | `POST` | Creates a new order (customer or POS) | Public / Customer / Staff |
| `/api/orders/:id` | `GET` | Retrieves order details by ID | Public tracking / Staff |
| `/api/orders/:id/status` | `PATCH` | Updates order lifecycle status (`Brewing`, `Ready`, etc.) | `staff`, `admin` |
| `/api/orders/:id/cancel` | `POST` | Cancels order with reason | `staff`, `admin` |

### 2.4 Menu & Catalog (`/api/menu`)

| Endpoint | Method | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `/api/menu` | `GET` | Retrieves all active menu items and categories | Public |
| `/api/menu` | `POST` | Creates a new menu product | `admin`, `super_admin` |
| `/api/menu/:id` | `PUT` | Updates menu product details or pricing | `admin`, `super_admin` |
| `/api/menu/:id` | `DELETE` | Removes menu item from catalog | `admin`, `super_admin` |
| `/api/categories` | `GET` / `PUT` | Manages active product category list | Public (GET) / Admin (PUT) |
| `/api/addons` | `GET` / `POST` / `PUT` | Manages modifiers, syrups & dairy add-ons | Public (GET) / Admin |
| `/api/promotions` | `GET` / `POST` / `PUT` | Manages combo bundles and promotional deals | Public (GET) / Admin |

### 2.5 Inventory (`/api/inventory`)

| Endpoint | Method | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `/api/inventory` | `GET` | Lists all ingredients and packaging stock levels | `staff`, `admin` |
| `/api/inventory/:id` | `PUT` | Updates stock quantity, unit cost or supplier info | `admin`, `super_admin` |
| `/api/inventory/:id/stock` | `POST` | Logs stock increment or waste adjustment | `staff`, `admin` |

### 2.6 Loyalty & Rewards (`/api/loyalty`)

| Endpoint | Method | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `/api/loyalty/:customerId` | `GET` | Returns stamp cards and reward point balance | Customer / Staff |
| `/api/loyalty/add-stamp` | `POST` | Increments customer stamp card on eligible purchase | `staff`, `admin` |
| `/api/loyalty/redeem` | `POST` | Deducts points to apply a reward voucher | Customer / Staff |

### 2.7 Reports & Analytics (`/api/reports`)

| Endpoint | Method | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `/api/reports/sales-summary` | `GET` | Aggregates daily/weekly revenue and order counts | `admin`, `super_admin` |
| `/api/reports/hourly-throughput` | `GET` | Groups transactions by hourly peak windows | `admin`, `super_admin` |
| `/api/reports/top-products` | `GET` | Calculates bestselling items by volume and revenue | `admin`, `super_admin` |

---

## 3. Database Schema Models

```sql
-- Customers Table
CREATE TABLE customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  stamps INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff Users Table
CREATE TABLE staff_users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL, -- 'staff' | 'admin' | 'super_admin'
  passcode_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  customer_id VARCHAR(64) REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(64),
  order_type VARCHAR(32) NOT NULL, -- 'Dine-In' | 'Takeout' | 'Delivery'
  table_number VARCHAR(32),
  delivery_address TEXT,
  payment_method VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL, -- 'New' | 'Brewing' | 'Ready' | 'Completed' | 'Cancelled'
  subtotal NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) DEFAULT 0,
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  customization TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  temperature VARCHAR(16)
);
```
