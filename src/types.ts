export type OrderStatus = 'New' | 'Brewing' | 'Ready' | 'Completed' | 'Pending' | 'Preparing' | 'Cancelled';

export type ProductTemperature = 'Hot' | 'Cold' | 'Both' | 'N/A';

export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export interface AdminPrincipal {
  authenticated: true;
  userId: string | null;
  role: AdminRole;
  username: string;
  displayName: string;
  hasProfilePicture: boolean;
  profilePictureUrl: string | null;
}

export interface AdminAccount {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN';
  active: boolean;
  hasProfilePicture: boolean;
  createdAt: string;
  updatedAt: string;
  canResetPassword: boolean;
  canChangeStatus: boolean;
}

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
  avatar?: string;
  phone?: string;
  shiftSchedule?: string;
  title?: string;
}

export type ModifierCategoryType = 'modifier' | 'addon';

export interface ModifierCategory {
  id: string;
  name: string;
  itemType: ModifierCategoryType;
  required?: boolean;
  selectionType?: 'single' | 'multiple';
  applicableCategories?: string[];
  applicableTemperature?: 'Hot' | 'Cold' | 'Both' | 'All';
  sortOrder?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSize {
  name: string;
  volume: string;
  priceDelta: number;
  availableTemperatures?: ('Hot' | 'Cold' | 'Both')[];
  applicableTemperature?: 'Hot' | 'Cold' | 'Both' | 'All';
}

export interface ProductAddon {
  id: string;
  name: string;
  category: string;
  itemType?: ModifierCategoryType;
  price: number;
  applicableTemperature: 'Hot' | 'Cold' | 'Both' | 'All';
  available: boolean;
  required?: boolean;
  selectionType?: 'single' | 'multiple';
  applicableCategories?: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
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
  modifierCategoryIds?: string[]; // IDs of enabled modifier categories for this product
  allergens?: string[];
  calories?: number;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
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
  updatedAt?: string;
  status: 'active' | 'inactive';
  accountType?: 'Personal' | 'Business';
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
  selectedModifiers?: Record<string, string | string[]>;
  selectedModifierItems?: ProductAddon[];
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
  description?: string;
  sku?: string;
  notes?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastRestocked?: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: 'addition' | 'deduction' | 'adjustment' | 'restock' | 'waste';
  quantity: number;
  previousQuantity: number;
  resultingQuantity: number;
  reason?: string;
  timestamp: number;
  createdAt: string;
  staffName?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn_stamps' | 'earn_points' | 'redeem_stamps' | 'redeem_points' | 'welcome_bonus' | 'adjustment';
  amount: number;
  referenceOrderId?: string;
  reason: string;
  timestamp: number;
  createdAt: string;
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
