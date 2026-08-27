export type OrderStatus = 'New' | 'Brewing' | 'Ready' | 'Completed' | 'Pending' | 'Preparing' | 'Cancelled';

export type ProductTemperature = 'Hot' | 'Cold' | 'Both' | 'N/A';

export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';

export type Permission =
  | 'manage_customers'
  | 'manage_orders'
  | 'manage_menu'
  | 'manage_pricing'
  | 'manage_promotions'
  | 'manage_inventory'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_staff'
  | 'delete_records'
  | 'configure_system';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: string;
}

export interface ProductSize {
  name: string;
  volume: string;
  priceDelta: number;
}

export interface ProductAddon {
  id: string;
  name: string;
  category: 'Milk' | 'Shot' | 'Syrup' | 'Topping' | 'Prep';
  price: number;
  applicableTemperature: 'Hot' | 'Cold' | 'Both' | 'All';
  available: boolean;
}

export interface PromoBundle {
  id: string;
  name: string;
  description: string;
  bundleItems: string[];
  price: number;
  originalPrice: number;
  discountBadge: string;
  image: string;
  available: boolean;
  temperatureOption?: string;
  timeSlot?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string; // Dynamic cafe category: Coffee, Non-Coffee, Pastries, Pasta, Rice Meals, etc.
  price: number;
  image: string;
  description: string;
  tags?: string[];
  popular?: boolean;
  available: boolean;
  temperature: ProductTemperature;
  sizes?: ProductSize[];
  addons?: string[]; // IDs of applicable add-ons
  allergens?: string[];
  calories?: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  customization?: string;
  price: number;
  completed?: boolean;
  temperature?: 'Hot' | 'Iced';
  size?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string; // Stable customer ID
  customerName: string;
  customerEmail?: string;
  timeAgo: string;
  timestamp: number;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  image?: string;
  notes?: string;
  customerPhone?: string;
  orderType?: 'Dine-In' | 'Takeout' | 'Delivery';
  tableNumber?: string;
  deliveryAddress?: string;
  paymentMethod?: 'GCash' | 'Maya' | 'Cash' | 'Card';
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  isCustomerOrder?: boolean;
}

export interface CustomerUser {
  id: string; // e.g. "cust_8f293b"
  name: string;
  email: string;
  mobile: string;
  address: string;
  createdAt: string;
  status: 'active' | 'inactive';
  role?: 'customer';
  stamps?: number;
  points?: number;
}

export interface CustomerCartItem {
  id: string;
  menuItem: MenuItem;
  selectedTemperature?: 'Hot' | 'Iced' | 'N/A';
  selectedSize?: ProductSize | null;
  sweetnessLevel?: string;
  iceLevel?: string;
  selectedAddons?: ProductAddon[];
  specialInstructions?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isBundle?: boolean;
  bundleData?: PromoBundle;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Critical';
  minThreshold: number;
  costPerUnit?: number;
  supplier?: string;
  notes?: string;
  lastRestocked?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoUrl: string;
  branchName: string;
  phoneNumber: string;
  email: string;
  address: string;
  currencySymbol: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  openHours: string;
  receiptFooter: string;
  wifiSsid?: string;
  wifiPassword?: string;
  socialFb?: string;
  socialIg?: string;
}

export interface SalesSummary {
  totalSales: number;
  cupsServed: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
}

export interface HourlySalesPoint {
  time: string;
  hour: number;
  cups: number;
  sales: number;
}

export interface TopSellingProduct {
  name: string;
  count: number;
  percentage: number;
  revenue: number;
  formattedRevenue: string;
}

