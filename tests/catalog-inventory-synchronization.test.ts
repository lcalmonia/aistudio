import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCategoryRecord,
  mapMenuItemRecord,
  mapAddonRecord,
  mapBundleRecord,
  mapPromoRecord,
} from '../netlify/functions/_shared/catalog.mts';
import {
  mapInventoryItemRecord,
  mapInventoryMovementRecord,
} from '../netlify/functions/_shared/inventory.mts';
import {
  mapStoreSettingsRecord,
} from '../netlify/functions/_shared/settings.mts';
import { inventoryService, InventoryApiError } from '../src/services/inventoryService';
import { menuService, MenuApiError } from '../src/services/menuService';
import { categoryService, CategoryApiError } from '../src/services/categoryService';
import { addonService, AddonApiError } from '../src/services/addonService';
import { promoService, PromoApiError } from '../src/services/promoService';
import { settingsService, SettingsApiError } from '../src/services/settingsService';

test('Catalog: mapCategoryRecord formats categories properly', () => {
  assert.equal(mapCategoryRecord({ name: 'Specialty Coffee' }), 'Specialty Coffee');
  assert.equal(mapCategoryRecord({ category_name: 'Pastries' }), 'Pastries');
});

test('Catalog: mapMenuItemRecord correctly parses database types into frontend MenuItem shape', () => {
  const dbRecord = {
    id: 'prod-001',
    name: 'Spanish Latte',
    category: 'Coffee',
    price: '160.00',
    description: 'Espresso with condensed and fresh milk',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
    tags: ['Best Seller'],
    popular: true,
    available: true,
    temperature: 'Both' as const,
    sizes: [{ name: 'Regular', volume: '16oz', priceDelta: 0 }, { name: 'Large', volume: '22oz', priceDelta: 20 }],
    add_on_ids: ['addon-001'],
    allergens: ['Dairy'],
    calories: 220,
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  };

  const item = mapMenuItemRecord(dbRecord);
  assert.equal(item.id, 'prod-001');
  assert.equal(item.name, 'Spanish Latte');
  assert.equal(item.price, 160);
  assert.equal(item.available, true);
  assert.equal(item.popular, true);
  assert.equal(item.calories, 220);
  assert.equal(item.temperature, 'Both');
  assert.equal(item.sizes?.length, 2);
  assert.deepEqual(item.tags, ['Best Seller']);
});

test('Catalog: mapAddonRecord converts add-on record with valid pricing', () => {
  const dbRecord = {
    id: 'addon-001',
    name: 'Extra Espresso Shot',
    category: 'Shot' as const,
    price: '35.00',
    applicable_temperature: 'Both' as const,
    available: true,
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  };

  const addon = mapAddonRecord(dbRecord);
  assert.equal(addon.id, 'addon-001');
  assert.equal(addon.name, 'Extra Espresso Shot');
  assert.equal(addon.price, 35);
  assert.equal(addon.category, 'Shot');
  assert.equal(addon.available, true);
  assert.equal(addon.applicableTemperature, 'Both');
});

test('Catalog: mapBundleRecord correctly processes bundle and items array', () => {
  const dbRecord = {
    id: 'bundle-001',
    name: 'Morning Starter Duo',
    description: 'Your favorite coffee with a freshly baked pastry',
    bundle_items: ['Spanish Latte', 'Butter Croissant'],
    price: '210.00',
    original_price: '240.00',
    discount_badge: '12% OFF',
    image: 'https://images.unsplash.com/photo-combo',
    available: true,
    temperature_option: 'Both',
    time_slot: 'Morning',
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  };

  const bundle = mapBundleRecord(dbRecord);
  assert.equal(bundle.id, 'bundle-001');
  assert.equal(bundle.name, 'Morning Starter Duo');
  assert.equal(bundle.price, 210);
  assert.equal(bundle.originalPrice, 240);
  assert.equal(bundle.discountBadge, '12% OFF');
  assert.deepEqual(bundle.bundleItems, ['Spanish Latte', 'Butter Croissant']);
  assert.equal(bundle.available, true);
});

test('Catalog: mapPromoRecord correctly processes discounts and dates', () => {
  const dbRecord = {
    id: 'promo-001',
    code: 'WELCOME10',
    name: 'First Order Discount',
    description: 'Get 10% off your first coffee order',
    discount_type: 'percentage' as const,
    discount_value: '10.00',
    minimum_order_amount: '150.00',
    active: true,
    starts_at: null,
    ends_at: null,
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  };

  const promo = mapPromoRecord(dbRecord);
  assert.equal(promo.id, 'promo-001');
  assert.equal(promo.code, 'WELCOME10');
  assert.equal(promo.discountType, 'percentage');
  assert.equal(promo.discountValue, 10);
  assert.equal(promo.minimumOrderAmount, 150);
  assert.equal(promo.active, true);
});

test('Inventory: mapInventoryItemRecord calculates dynamic statuses and thresholds', () => {
  const inStockItem = mapInventoryItemRecord({
    id: 'inv-001',
    name: 'Arabica Coffee Beans',
    category: 'Coffee Beans',
    stock: '25.5',
    unit: 'kg',
    status: 'In Stock',
    min_threshold: '5.0',
    cost_per_unit: '650.00',
    supplier: 'Batangas Highlands',
    notes: 'Premium single-origin beans',
    active: true,
    sku: 'BEANS-ARA-01',
    description: 'Arabica coffee beans',
    last_restocked: '2026-08-28T00:00:00.000Z',
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  });

  assert.equal(inStockItem.id, 'inv-001');
  assert.equal(inStockItem.stock, 25.5);
  assert.equal(inStockItem.minThreshold, 5);
  assert.equal(inStockItem.costPerUnit, 650);
  assert.equal(inStockItem.status, 'In Stock');
  assert.equal(inStockItem.active, true);

  const lowStockItem = mapInventoryItemRecord({
    id: 'inv-002',
    name: 'Oat Milk Barista Edition',
    category: 'Dairy & Milks',
    stock: '4.0',
    unit: 'L',
    status: 'Low Stock',
    min_threshold: '10.0',
    cost_per_unit: '180.00',
    supplier: 'Oatly Distributor',
    notes: null,
    active: true,
    sku: null,
    description: null,
    last_restocked: null,
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  });
  assert.equal(lowStockItem.status, 'Low Stock');

  const criticalItem = mapInventoryItemRecord({
    id: 'inv-003',
    name: 'Vanilla Syrup',
    category: 'Syrups',
    stock: '0',
    unit: 'bottles',
    status: 'Critical',
    min_threshold: '5.0',
    cost_per_unit: '420.00',
    supplier: 'Monin',
    notes: null,
    active: true,
    sku: null,
    description: null,
    last_restocked: null,
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  });
  assert.equal(criticalItem.status, 'Critical');
});

test('Inventory: inventoryService calculateDynamicStatus behaves consistently', () => {
  assert.equal(inventoryService.calculateDynamicStatus(0, 10), 'Critical');
  assert.equal(inventoryService.calculateDynamicStatus(2, 10), 'Critical');
  assert.equal(inventoryService.calculateDynamicStatus(8, 10), 'Low Stock');
  assert.equal(inventoryService.calculateDynamicStatus(25, 10), 'In Stock');
});

test('Inventory: mapInventoryMovementRecord parses stock movement audit trail correctly', () => {
  const dbRecord = {
    id: 'mov-001',
    inventory_item_id: 'inv-001',
    item_name: 'Arabica Coffee Beans',
    type: 'addition',
    quantity: '10.0',
    previous_quantity: '15.5',
    resulting_quantity: '25.5',
    reason: 'Weekly supplier delivery',
    staff_name: 'Super Admin',
    timestamp: Date.now(),
    created_at: '2026-08-28T08:00:00.000Z',
  };

  const movement = mapInventoryMovementRecord(dbRecord);
  assert.equal(movement.id, 'mov-001');
  assert.equal(movement.inventoryItemId, 'inv-001');
  assert.equal(movement.type, 'addition');
  assert.equal(movement.quantity, 10);
  assert.equal(movement.previousQuantity, 15.5);
  assert.equal(movement.resultingQuantity, 25.5);
  assert.equal(movement.staffName, 'Super Admin');
});

test('Settings: mapStoreSettingsRecord preserves store configuration with safe defaults', () => {
  const settings = mapStoreSettingsRecord({
    id: 'default',
    store_name: 'iLuvKeyks Coffee & Bakery',
    tagline: 'Freshly Baked. Expertly Brewed.',
    logo_url: 'https://iluvkeyks.ph/logo.png',
    branch_name: 'Main Flagship',
    phone_number: '+63 917 123 4567',
    email: 'hello@iluvkeyks.ph',
    address: '123 Sweet Street, BGC, Taguig City',
    currency_symbol: '₱',
    delivery_fee: '49.00',
    free_delivery_threshold: '500.00',
    open_hours: 'Mon-Sun 7am-10pm',
    receipt_footer: 'Thank you!',
    wifi_ssid: 'iLuvKeyks',
    wifi_password: 'secretpassword',
    social_fb: 'facebook.com/iluvkeyks',
    social_ig: '@iluvkeyks',
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
  });

  assert.equal(settings.storeName, 'iLuvKeyks Coffee & Bakery');
  assert.equal(settings.currencySymbol, '₱');
  assert.equal(settings.phoneNumber, '+63 917 123 4567');
  assert.equal(settings.socialIg, '@iluvkeyks');
  assert.equal(settings.deliveryFee, 49);
});

test('Error Handling: menuService throws MenuApiError on 500 server error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Database connection failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    await assert.rejects(
      async () => {
        await menuService.createMenuItem({
          id: 'test-item',
          name: 'Test Coffee',
          price: 150,
          category: 'Coffee',
          description: 'A rich espresso roast',
          image: 'https://example.com/test.jpg',
          available: true,
          temperature: 'Hot',
        });
      },
      (err: any) => {
        assert.ok(err instanceof MenuApiError);
        assert.equal(err.status, 500);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Error Handling: categoryService throws CategoryApiError on 401 unauthorized', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Admin session required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    await assert.rejects(
      async () => {
        await categoryService.addCategory('New Seasonal');
      },
      (err: any) => {
        assert.ok(err instanceof CategoryApiError);
        assert.equal(err.status, 401);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Error Handling: addonService throws AddonApiError on network failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  try {
    await assert.rejects(
      async () => {
        await addonService.updateAddon('addon-1', {
          id: 'addon-1',
          name: 'Oat Milk',
          price: 40,
          category: 'Milk',
        });
      },
      (err: any) => {
        assert.ok(err instanceof AddonApiError);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Error Handling: promoService throws PromoApiError on API error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Promo not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    await assert.rejects(
      async () => {
        await promoService.deletePromoBundle('bundle-nonexistent');
      },
      (err: any) => {
        assert.ok(err instanceof PromoApiError);
        assert.equal(err.status, 404);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Error Handling: inventoryService throws InventoryApiError on API failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Stock validation failed' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    await assert.rejects(
      async () => {
        await inventoryService.updateInventoryItem('inv-1', {
          id: 'inv-1',
          name: 'Beans',
          category: 'Coffee',
          stock: -5,
          unit: 'kg',
          status: 'Critical',
          minThreshold: 5,
        });
      },
      (err: any) => {
        assert.ok(err instanceof InventoryApiError);
        assert.equal(err.status, 422);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Error Handling: settingsService throws SettingsApiError on API failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Settings update forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    await assert.rejects(
      async () => {
        await settingsService.updateStoreSettings({
          storeName: 'Updated Name',
          tagline: 'Freshly Baked',
          logoUrl: 'https://example.com/logo.png',
          branchName: 'Main',
          phoneNumber: '+63 917 123 4567',
          email: 'test@example.com',
          address: '123 Test St',
          currencySymbol: '₱',
          deliveryFee: 50,
          freeDeliveryThreshold: 500,
          openHours: '8am-8pm',
          receiptFooter: 'Thank you',
        });
      },
      (err: any) => {
        assert.ok(err instanceof SettingsApiError);
        assert.equal(err.status, 403);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

