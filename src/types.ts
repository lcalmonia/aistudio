export type OrderStatus = 'New' | 'Brewing' | 'Ready' | 'Completed' | 'Pending' | 'Preparing';

export type ProductTemperature = 'Hot' | 'Cold' | 'Both' | 'N/A';

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
  customerId?: string; // Unique customer ID e.g. "CUST-00001"
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
  id: string; // e.g. "CUST-00001"
  name: string;
  email: string;
  mobile: string;
  password?: string;
  address: string;
  createdAt: string;
  status: 'active' | 'inactive';
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
