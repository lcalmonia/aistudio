import { Order, MenuItem, InventoryItem, ProductAddon, PromoBundle, StoreSettings, CustomerUser, StaffUser } from '../types';

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'super_admin_1',
    name: 'Super Admin',
    email: 'owner@iluvkeyks.ph',
    role: 'super_admin',
    active: true,
    phone: '+63 (917) 823-4567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    title: 'Store Owner & Founder',
    shiftSchedule: 'Executive / All Hours',
  },
  {
    id: 'admin_1',
    name: 'Store Manager',
    email: 'manager@iluvkeyks.ph',
    role: 'admin',
    active: true,
    phone: '+63 (917) 111-2233',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    title: 'Operations Manager',
    shiftSchedule: '06:00 - 14:00 (Morning Shift)',
  },
  {
    id: 'staff_1',
    name: 'Lead Barista',
    email: 'barista@iluvkeyks.ph',
    role: 'staff',
    active: true,
    phone: '+63 (917) 555-8899',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    title: 'Senior Barista & QA',
    shiftSchedule: '14:00 - 22:00 (Closing Shift)',
  },
];

// Clean initial data: No fake/demo customers in production dataset
export const INITIAL_CUSTOMERS: CustomerUser[] = [];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'iLuvKeyks',
  tagline: 'Coffee, Tea & Tub Cakes',
  logoUrl: '',
  branchName: 'Main St. Branch',
  phoneNumber: '+63 (917) 823-4567',
  email: 'orders@iluvkeyks.ph',
  address: '128 Mahogany Ave, Sampaloc, Manila',
  currencySymbol: '₱',
  deliveryFee: 49,
  freeDeliveryThreshold: 500,
  openHours: '7:00 AM - 10:00 PM Daily',
  receiptFooter: 'Thank you for supporting your local cafe! ☕🍰 Tag us @iluvkeyks.ph',
  wifiSsid: 'iLuvKeyks_Guest_5G',
  wifiPassword: 'coffeeandcakes',
  socialFb: 'facebook.com/iluvkeyks',
  socialIg: '@iluvkeyks.ph',
};

export const DEFAULT_CATEGORIES: string[] = [
  'Coffee',
  'Non-Coffee',
  'Coolers/Mocktails',
  'Matcha Series',
  'Frappe Based',
  'Frappuccino',
  'Pastries',
  'Cakes on Tub',
  'Pasta',
  'Pika-Pika',
  'Cakes',
  'Rice Meals',
];

export const INITIAL_ADDONS: ProductAddon[] = [
  { id: 'addon-oat', name: 'Oatly Barista Oat Milk Sub', category: 'Milk', price: 40.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-almond', name: 'Almond Milk Sub', category: 'Milk', price: 35.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-shot', name: 'Extra Espresso Shot', category: 'Shot', price: 30.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-decaf', name: 'Decaf Espresso Option', category: 'Shot', price: 20.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-honey', name: 'Raw Honey Drizzle', category: 'Syrup', price: 25.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-vanilla-cream', name: 'Sweet Vanilla Cold Foam', category: 'Syrup', price: 35.00, applicableTemperature: 'Cold', available: true },
  { id: 'addon-caramel', name: 'Salted Caramel Sauce', category: 'Syrup', price: 25.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-whip', name: 'Whipped Cream Topping', category: 'Topping', price: 25.00, applicableTemperature: 'Both', available: true },
  { id: 'addon-nata', name: 'Nata de Coco Jelly', category: 'Topping', price: 25.00, applicableTemperature: 'Cold', available: true },
  { id: 'addon-pearls', name: 'Chewy Tapioca Pearls', category: 'Topping', price: 25.00, applicableTemperature: 'Cold', available: true },
  { id: 'addon-cream-cheese', name: 'Cream Cheese Wall', category: 'Topping', price: 35.00, applicableTemperature: 'Cold', available: true },
  { id: 'addon-extra-hot', name: 'Extra Hot (70°C+)', category: 'Prep', price: 0.00, applicableTemperature: 'Hot', available: true },
  { id: 'addon-light-ice', name: 'Less Ice / Light Ice', category: 'Prep', price: 0.00, applicableTemperature: 'Cold', available: true },
];

export const INITIAL_PROMO_BUNDLES: PromoBundle[] = [
  {
    id: 'bundle-1',
    name: 'Coffee & Pasta Solo Feast',
    description: 'Creamy Truffle Bacon Pasta paired with your choice of Iced Spanish Latte or Hot Americano.',
    bundleItems: ['Creamy Truffle Bacon Pasta', 'Spanish Latte'],
    price: 295.00,
    originalPrice: 355.00,
    discountBadge: 'Save ₱60',
    image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=600&q=80',
    available: true,
    temperatureOption: 'Hot or Iced Coffee',
    timeSlot: 'Lunch & Merienda (11:00 AM - 5:00 PM)'
  },
  {
    id: 'bundle-2',
    name: 'Sweet Cake on Tub & Frappe Pair',
    description: 'Signature Ube Halaya Tub Cake with a rich Dark Chocolate Java Chip Frappe.',
    bundleItems: ['Signature Ube Tub Cake', 'Java Chip Frappe'],
    price: 330.00,
    originalPrice: 380.00,
    discountBadge: 'Bestseller Combo',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    available: true,
    temperatureOption: 'Iced / Blended',
    timeSlot: 'All Day Dessert Combo'
  },
  {
    id: 'bundle-3',
    name: 'Pika-Pika Barkada Platter + 2 Coolers',
    description: 'Loaded Cheesy Nachos & Fries platter accompanied by 2 Sparkling Berry Coolers.',
    bundleItems: ['Loaded Nachos & Fries Platter', 'Berry Hibiscus Cooler (x2)'],
    price: 420.00,
    originalPrice: 490.00,
    discountBadge: 'Save ₱70',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
    available: true,
    temperatureOption: 'Chilled Coolers',
    timeSlot: 'Merienda & Evening'
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. Coffee
  {
    id: 'menu-1',
    name: 'Spanish Latte (Signature)',
    category: 'Coffee',
    price: 145.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEPK9an39rFEkfnp4LRaMqlPguV-s_RqdDV3FcNMZJuxAA2NG3s4Vj1YCqZGozzqYBUaORRDaOp1QySWD3zavJSY4WfpCoG_tOmX6LnCt7kbG-aSamCO4-gV_vKuAsnEqCQcBJQV1oJXYCXqiAz0xdScWn3LHH2FL9FY8Os11FNYgSA8OYNMaTpGUSs6lVsJ4RLjDLzmTHawjWGN39KIROIBlVnGpeNKU6y-nW8S2RGne8Y87fgfSG',
    description: 'Rich espresso blended with condensed and fresh milk for a delightfully velvety, sweet finish.',
    tags: ['Bestseller', 'House Favorite'],
    popular: true,
    available: true,
    temperature: 'Both',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 20.00 },
    ],
    addons: ['addon-shot', 'addon-oat', 'addon-vanilla-cream', 'addon-light-ice'],
    allergens: ['Dairy'],
    calories: 210
  },
  {
    id: 'menu-2',
    name: 'Caramel Macchiato',
    category: 'Coffee',
    price: 155.00,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly steamed milk with vanilla syrup, marked with espresso and drizzled with luscious caramel sauce.',
    tags: ['Classic', 'Popular'],
    popular: true,
    available: true,
    temperature: 'Both',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 20.00 },
    ],
    addons: ['addon-shot', 'addon-oat', 'addon-caramel', 'addon-whip'],
    allergens: ['Dairy'],
    calories: 240
  },
  // 2. Non-Coffee
  {
    id: 'menu-3',
    name: 'Strawberry Milk Cloud',
    category: 'Non-Coffee',
    price: 135.00,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
    description: 'Real strawberry purée compote layered with cold whole milk and topped with sweet cream cloud foam.',
    tags: ['Refreshing', 'Kids Favorite'],
    popular: true,
    available: true,
    temperature: 'Cold',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 20.00 },
    ],
    addons: ['addon-nata', 'addon-pearls', 'addon-cream-cheese'],
    allergens: ['Dairy'],
    calories: 180
  },
  // 3. Coolers/Mocktails
  {
    id: 'menu-4',
    name: 'Blue Lagoon Sparkling Cooler',
    category: 'Coolers/Mocktails',
    price: 125.00,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    description: 'Fizzy citrus curaçao cooler with calamansi zest, sparkling soda water, and mint leaves.',
    tags: ['Thirst Quencher', 'Mocktail'],
    available: true,
    temperature: 'Cold',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 15.00 },
    ],
    addons: ['addon-nata', 'addon-light-ice'],
    allergens: [],
    calories: 90
  },
  // 4. Matcha Series
  {
    id: 'menu-5',
    name: 'Ceremonial Matcha Latte',
    category: 'Matcha Series',
    price: 160.00,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    description: '100% pure stone-ground Japanese Uji matcha whisked to order with velvety fresh milk.',
    tags: ['Premium Matcha', 'Antioxidants'],
    popular: true,
    available: true,
    temperature: 'Both',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 25.00 },
    ],
    addons: ['addon-oat', 'addon-vanilla-cream', 'addon-cream-cheese'],
    allergens: ['Dairy'],
    calories: 160
  },
  // 5. Frappe Based
  {
    id: 'menu-6',
    name: 'Cookies & Cream Frappe',
    category: 'Frappe Based',
    price: 165.00,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    description: 'Blended milk base loaded with crushed Oreo cookies, rich chocolate sauce, and fluffy whipped cream.',
    tags: ['Dessert Drink', 'Non-Caffeine'],
    popular: true,
    available: true,
    temperature: 'Cold',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 25.00 },
    ],
    addons: ['addon-whip', 'addon-pearls'],
    allergens: ['Dairy', 'Gluten'],
    calories: 340
  },
  // 6. Frappuccino
  {
    id: 'menu-7',
    name: 'Dark Chocolate Java Chip Frappuccino',
    category: 'Frappuccino',
    price: 175.00,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    description: 'Blended roast espresso, dark chocolate chips, milk, and ice topped with whipped cream and mocha swirl.',
    tags: ['Coffee Frappe', 'Indulgent'],
    available: true,
    temperature: 'Cold',
    sizes: [
      { name: 'Regular 16oz', volume: '16oz', priceDelta: 0.00 },
      { name: 'Large 22oz', volume: '22oz', priceDelta: 25.00 },
    ],
    addons: ['addon-shot', 'addon-whip'],
    allergens: ['Dairy'],
    calories: 380
  },
  // 7. Pastries
  {
    id: 'menu-8',
    name: 'Flaky Butter Croissant',
    category: 'Pastries',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    description: 'French style golden-baked croissant made with 100% pure butter layers.',
    tags: ['Freshly Baked'],
    available: true,
    temperature: 'N/A',
    allergens: ['Wheat', 'Dairy', 'Eggs'],
    calories: 240
  },
  // 8. Cakes on Tub
  {
    id: 'menu-9',
    name: 'Signature Ube Leche Flan Tub Cake',
    category: 'Cakes on Tub',
    price: 195.00,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    description: 'Layered soft ube sponge cake, real halaya filling, and creamy homemade caramel leche flan on top.',
    tags: ['iLuvKeyks Signature', 'Must Try'],
    popular: true,
    available: true,
    temperature: 'N/A',
    allergens: ['Dairy', 'Eggs', 'Wheat'],
    calories: 420
  },
  // 9. Pasta
  {
    id: 'menu-10',
    name: 'Creamy Truffle Bacon Carbonara',
    category: 'Pasta',
    price: 210.00,
    image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=600&q=80',
    description: 'Al dente fettuccine with crispy bacon bits, rich parmesan cream sauce, and aromatic truffle oil drizzle.',
    tags: ['Chef Special', 'Savory'],
    popular: true,
    available: true,
    temperature: 'N/A',
    allergens: ['Wheat', 'Dairy', 'Pork'],
    calories: 520
  },
  // 10. Pika-Pika
  {
    id: 'menu-11',
    name: 'Loaded Cheesy Beef Nachos',
    category: 'Pika-Pika',
    price: 165.00,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
    description: 'Crispy corn tortilla chips topped with seasoned minced beef, warm cheddar cheese sauce, tomato salsa, and jalapeños.',
    tags: ['Great for Sharing', 'Snacks'],
    available: true,
    temperature: 'N/A',
    allergens: ['Dairy', 'Beef'],
    calories: 460
  },
  // 11. Cakes
  {
    id: 'menu-12',
    name: 'Dark Chocolate Ganache Cake Slice',
    category: 'Cakes',
    price: 140.00,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    description: 'Moist fudgy chocolate cake layered and coated with 65% Belgian dark chocolate ganache.',
    tags: ['Decadent'],
    available: true,
    temperature: 'N/A',
    allergens: ['Wheat', 'Dairy', 'Eggs'],
    calories: 380
  },
  // 12. Rice Meals
  {
    id: 'menu-13',
    name: 'Classic Beef Tapa Rice Bowl',
    category: 'Rice Meals',
    price: 195.00,
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80',
    description: 'Tender marinated beef tapa slices served with garlic fried rice, sunny-side-up egg, and atchara on the side.',
    tags: ['All Day Breakfast', 'Hearty'],
    popular: true,
    available: true,
    temperature: 'N/A',
    allergens: ['Soy', 'Eggs', 'Beef'],
    calories: 580
  }
];

// Clean initial data: No fake orders or mock transactions in production dataset
export const INITIAL_ORDERS: Order[] = [];

export const DEFAULT_INVENTORY_CATEGORIES: string[] = [
  'Beans',
  'Powders',
  'Syrup',
  'Juice',
  'Pasta Products',
  'Utensils & Packaging',
  'Dairy & Milks',
  'Bakery & Sweets',
  'Savory & Meats',
];

export const INVENTORY_ITEMS: InventoryItem[] = [
  // Beans
  { id: 'inv-1', name: 'iLuvKeyks Espresso House Blend Beans', category: 'Beans', stock: 24.5, unit: 'kg', status: 'In Stock', minThreshold: 10, costPerUnit: 680, supplier: 'Allegro Coffee Co.', notes: 'Dark roast signature espresso' },
  { id: 'inv-2', name: 'Benguet Arabica Single Origin Beans', category: 'Beans', stock: 8.0, unit: 'kg', status: 'Low Stock', minThreshold: 10, costPerUnit: 820, supplier: 'Cordillera Roasters', notes: 'Medium roast drip & pour-over' },
  
  // Powders
  { id: 'inv-3', name: 'Uji Ceremonial Japanese Matcha Powder', category: 'Powders', stock: 2.2, unit: 'kg', status: 'In Stock', minThreshold: 1.0, costPerUnit: 1450, supplier: 'Kyoto Tea Importers', notes: 'Keep refrigerated in airtight tin' },
  { id: 'inv-4', name: 'Dutch Dark Cocoa Beverage Powder', category: 'Powders', stock: 12.0, unit: 'kg', status: 'In Stock', minThreshold: 5.0, costPerUnit: 420, supplier: 'Baking Essentials PH' },
  { id: 'inv-5', name: 'Premium Frappe Base & Creamer Powder', category: 'Powders', stock: 4.5, unit: 'kg', status: 'Low Stock', minThreshold: 8.0, costPerUnit: 340, supplier: 'Beverage Solutions PH' },
  { id: 'inv-6', name: 'Taro Milk Tea Flavor Powder', category: 'Powders', stock: 9.0, unit: 'kg', status: 'In Stock', minThreshold: 4.0, costPerUnit: 360, supplier: 'Taiwan Tea Supply' },

  // Syrup
  { id: 'inv-7', name: 'Salted Caramel Gourmet Syrup (750ml)', category: 'Syrup', stock: 14, unit: 'bottles', status: 'In Stock', minThreshold: 6, costPerUnit: 450, supplier: 'Monin PH' },
  { id: 'inv-8', name: 'French Vanilla Flavor Syrup (750ml)', category: 'Syrup', stock: 3, unit: 'bottles', status: 'Low Stock', minThreshold: 5, costPerUnit: 450, supplier: 'Monin PH' },
  { id: 'inv-9', name: 'Roasted Hazelnut Cafe Syrup (750ml)', category: 'Syrup', stock: 8, unit: 'bottles', status: 'In Stock', minThreshold: 4, costPerUnit: 450, supplier: 'Torani PH' },
  { id: 'inv-10', name: 'Brown Sugar Tiger Boba Syrup (1L)', category: 'Syrup', stock: 11, unit: 'bottles', status: 'In Stock', minThreshold: 5, costPerUnit: 380, supplier: 'Tea Hub Direct' },

  // Juice & Purees
  { id: 'inv-11', name: 'Blue Lagoon Curacao Mixer (1L)', category: 'Juice', stock: 7, unit: 'bottles', status: 'In Stock', minThreshold: 4, costPerUnit: 390, supplier: 'Mixology Depot PH' },
  { id: 'inv-12', name: 'Strawberry Fruit Puree Concentrate (1L)', category: 'Juice', stock: 2, unit: 'bottles', status: 'Low Stock', minThreshold: 5, costPerUnit: 520, supplier: 'Monin PH' },
  { id: 'inv-13', name: 'Passionfruit Sparkler Cordial (1L)', category: 'Juice', stock: 6, unit: 'bottles', status: 'In Stock', minThreshold: 3, costPerUnit: 480, supplier: 'Mixology Depot PH' },
  { id: 'inv-14', name: 'Hibiscus Wildflower Cooler Base', category: 'Juice', stock: 5, unit: 'bottles', status: 'In Stock', minThreshold: 3, costPerUnit: 460, supplier: 'Beverage Artisan PH' },

  // Pasta Products
  { id: 'inv-15', name: 'Fettuccine Italian Durum Wheat Pasta', category: 'Pasta Products', stock: 18.0, unit: 'kg', status: 'In Stock', minThreshold: 8.0, costPerUnit: 220, supplier: 'ItalFood Wholesale' },
  { id: 'inv-16', name: 'Penne Rigate Pasta 1kg Packs', category: 'Pasta Products', stock: 15, unit: 'packs', status: 'In Stock', minThreshold: 6, costPerUnit: 180, supplier: 'ItalFood Wholesale' },
  { id: 'inv-17', name: 'Black Truffle Sauce & Cream Base', category: 'Pasta Products', stock: 4, unit: 'jars', status: 'Low Stock', minThreshold: 6, costPerUnit: 650, supplier: 'Gourmet Imports' },
  { id: 'inv-18', name: 'Shaved Aged Parmesan Cheese', category: 'Pasta Products', stock: 5.5, unit: 'kg', status: 'In Stock', minThreshold: 3.0, costPerUnit: 780, supplier: 'Dairy Gold PH' },

  // Utensils & Packaging
  { id: 'inv-19', name: '16oz Iced Cups & Dome Lids', category: 'Utensils & Packaging', stock: 450, unit: 'pcs', status: 'In Stock', minThreshold: 200, costPerUnit: 3.5, supplier: 'EcoPack Manila' },
  { id: 'inv-20', name: '22oz Large Iced Cups with Flat Lids', category: 'Utensils & Packaging', stock: 120, unit: 'pcs', status: 'Low Stock', minThreshold: 150, costPerUnit: 4.2, supplier: 'EcoPack Manila' },
  { id: 'inv-21', name: 'Hot Cup 12oz Double-Walled with Sip Lids', category: 'Utensils & Packaging', stock: 300, unit: 'pcs', status: 'In Stock', minThreshold: 150, costPerUnit: 3.8, supplier: 'EcoPack Manila' },
  { id: 'inv-22', name: 'Cake Tub Containers with Clear Lids (500ml)', category: 'Utensils & Packaging', stock: 65, unit: 'pcs', status: 'Low Stock', minThreshold: 100, costPerUnit: 12.0, supplier: 'BakePro Containers' },
  { id: 'inv-23', name: 'Biodegradable Straws & Wooden Utensils Set', category: 'Utensils & Packaging', stock: 600, unit: 'pcs', status: 'In Stock', minThreshold: 300, costPerUnit: 1.5, supplier: 'GreenEarth Supplies' },
  { id: 'inv-24', name: 'POS Thermal Receipt Paper Rolls (80mm)', category: 'Utensils & Packaging', stock: 18, unit: 'rolls', status: 'In Stock', minThreshold: 10, costPerUnit: 35, supplier: 'OfficeTech Manila' },

  // Dairy & Milks
  { id: 'inv-25', name: 'Oatly Barista Edition Oat Milk (1L)', category: 'Dairy & Milks', stock: 24, unit: 'cartons', status: 'In Stock', minThreshold: 12, costPerUnit: 185, supplier: 'Nordic Plant Milks' },
  { id: 'inv-26', name: 'Fresh Full Cream Cow Milk (1L)', category: 'Dairy & Milks', stock: 32, unit: 'cartons', status: 'In Stock', minThreshold: 15, costPerUnit: 98, supplier: 'Local Dairy Farm' },
  { id: 'inv-27', name: 'Sweetened Condensed Milk (390g)', category: 'Dairy & Milks', stock: 45, unit: 'cans', status: 'In Stock', minThreshold: 20, costPerUnit: 48, supplier: 'Alaska Milk PH' },

  // Bakery & Sweets
  { id: 'inv-28', name: 'Authentic Ube Halaya Tub Filling', category: 'Bakery & Sweets', stock: 16.0, unit: 'kg', status: 'In Stock', minThreshold: 6.0, costPerUnit: 320, supplier: 'Baguio Ube House' },
  { id: 'inv-29', name: 'Leche Flan Caramelized Custard Base', category: 'Bakery & Sweets', stock: 8.5, unit: 'kg', status: 'In Stock', minThreshold: 4.0, costPerUnit: 290, supplier: 'Pastry Chefs Kitchen' },

  // Savory & Meats
  { id: 'inv-30', name: 'iLuvKeyks Special Marinated Beef Tapa', category: 'Savory & Meats', stock: 14.0, unit: 'kg', status: 'In Stock', minThreshold: 6.0, costPerUnit: 480, supplier: 'Prime Meat Cuts' },
  { id: 'inv-31', name: 'Thick-Cut Smoked Bacon Rashers', category: 'Savory & Meats', stock: 9.0, unit: 'kg', status: 'In Stock', minThreshold: 4.0, costPerUnit: 420, supplier: 'Prime Meat Cuts' },
];
