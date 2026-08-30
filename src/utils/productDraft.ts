import { MenuItem, ProductSize, ProductTemperature } from '../types';

export const PRESET_CAFE_PHOTOS = [
  {
    name: 'Spanish Latte Art',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEPK9an39rFEkfnp4LRaMqlPguV-s_RqdDV3FcNMZJuxAA2NG3s4Vj1YCqZGozzqYBUaORRDaOp1QySWD3zavJSY4WfpCoG_tOmX6LnCt7kbG-aSamCO4-gV_vKuAsnEqCQcBJQV1oJXYCXqiAz0xdScWn3LHH2FL9FY8Os11FNYgSA8OYNMaTpGUSs6lVsJ4RLjDLzmTHawjWGN39KIROIBlVnGpeNKU6y-nW8S2RGne8Y87fgfSG',
  },
  {
    name: 'Cold Brew / Mocktail Cascade',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmh1VJlNrtaKb9bbtKPTLK4IphKvCgpGc1kJMjlcZ4qzTW0_7t-9hcffyNkhWQyBKjbnMBs1uepxo43ktt9u0jFkTPpZV84m34YO0G4HFZsoIUlmJatcfLBJQlG2nxudO94hIvWms1qlw4R6EluIGUP6WzrHLppvfZVDk0dW2mc3j0niFNR7upTXtEOGW0BX5aRUxW_VRi9nckzxIcfBVxhPHMIMZBglRRwaxwPqZM7RTlWgYVfsnJ',
  },
  {
    name: 'Ube Leche Flan Tub Cake',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Truffle Carbonara Pasta',
    url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Beef Tapa Rice Meal',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Ceremonial Matcha Green',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Avocado Sourdough Toast',
    url: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sea Salt Dark Brownie',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Golden Butter Croissant',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Strawberry Hibiscus Cooler',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mango Frappuccino Over Cream',
    url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cheesy Nacho & Pika Platter',
    url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80',
  },
];

export interface ProductFormDraft {
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  temperature: ProductTemperature;
  popular: boolean;
  available: boolean;
  calories: number;
  tagInput: string;
  allergenInput: string;
  selectedAddonIds: string[];
  sizes: ProductSize[];
}

export function createInitialProductDraft(
  product?: MenuItem | null,
  defaultCategory: string = 'Coffee'
): ProductFormDraft {
  if (product) {
    return {
      name: product.name || '',
      category: product.category || defaultCategory,
      price: product.price ?? 145,
      description: product.description || '',
      image: product.image || PRESET_CAFE_PHOTOS[0].url,
      temperature: product.temperature || 'Both',
      popular: product.popular ?? false,
      available: product.available ?? true,
      calories: product.calories ?? 180,
      tagInput: product.tags?.join(', ') || '',
      allergenInput: product.allergens?.join(', ') || '',
      selectedAddonIds: product.addons || ['addon-oat', 'addon-shot', 'addon-vanilla-cream'],
      sizes:
        product.sizes && product.sizes.length > 0
          ? product.sizes
          : [
              { name: 'Regular', volume: '16oz', priceDelta: 0.0, availableTemperatures: ['Hot', 'Cold', 'Both'] },
              { name: 'Large', volume: '22oz', priceDelta: 20.0, availableTemperatures: ['Hot', 'Cold', 'Both'] },
            ],
    };
  }

  return {
    name: '',
    category: defaultCategory,
    price: 145,
    description: '',
    image: PRESET_CAFE_PHOTOS[0].url,
    temperature: 'Both',
    popular: false,
    available: true,
    calories: 180,
    tagInput: 'Best Seller',
    allergenInput: '',
    selectedAddonIds: ['addon-oat', 'addon-shot', 'addon-vanilla-cream'],
    sizes: [
      { name: 'Regular', volume: '16oz', priceDelta: 0.0, availableTemperatures: ['Hot', 'Cold', 'Both'] },
      { name: 'Large', volume: '22oz', priceDelta: 20.0, availableTemperatures: ['Hot', 'Cold', 'Both'] },
    ],
  };
}

export function isProductDraftDirty(
  current: ProductFormDraft,
  base: ProductFormDraft
): boolean {
  return JSON.stringify(current) !== JSON.stringify(base);
}
