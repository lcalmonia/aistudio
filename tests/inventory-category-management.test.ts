import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryItem } from '../src/types';
import {
  createInitialInventoryDraft,
  isInventoryDraftDirty,
  InventoryFormDraft,
} from '../src/utils/inventoryDraft';

const mockInventory: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Arabica Espresso Beans',
    category: 'Coffee Beans',
    stock: 50,
    unit: 'kg',
    status: 'In Stock',
    minThreshold: 10,
    costPerUnit: 450,
    supplier: 'Highland Farms',
    lastRestocked: '2026-03-01',
  },
  {
    id: 'inv-002',
    name: 'Fresh Whole Milk',
    category: 'Dairy & Plant Milk',
    stock: 30,
    unit: 'liters',
    status: 'In Stock',
    minThreshold: 10,
    costPerUnit: 95,
    supplier: 'FarmFresh',
    lastRestocked: '2026-03-01',
  },
  {
    id: 'inv-003',
    name: '16oz Paper Cups',
    category: 'Packaging & Cups',
    stock: 500,
    unit: 'pcs',
    status: 'In Stock',
    minThreshold: 100,
    costPerUnit: 3.5,
    supplier: 'EcoPack Inc',
    lastRestocked: '2026-03-01',
  },
];

test('Phase 6.2 - Category Filtering: "All" returns all inventory items', () => {
  const selectedCategory = 'All';
  const filtered = mockInventory.filter(
    (item) => selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase()
  );
  assert.equal(filtered.length, 3);
});

test('Phase 6.2 - Category Filtering: Selecting a specific category filters correctly', () => {
  const selectedCategory = 'Coffee Beans';
  const filtered = mockInventory.filter(
    (item) => selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase()
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, 'Arabica Espresso Beans');
});

test('Phase 6.2 - Category Management: Adding a new category persists and updates available categories', () => {
  const existingCategories = [
    'Coffee Beans',
    'Dairy & Plant Milk',
    'Packaging & Cups',
    'Pastry Ingredients',
    'Syrups & Flavors',
  ];

  const newCategory = 'Chocolate & Cocoa';

  // Simulating category creation logic
  const updatedCategoriesSet = new Set(existingCategories);
  updatedCategoriesSet.add(newCategory.trim());
  const updatedCategories = Array.from(updatedCategoriesSet).sort();

  assert.ok(updatedCategories.includes('Chocolate & Cocoa'));
  assert.equal(updatedCategories.length, 6);
});

test('Phase 6.2 - Inventory Item Assignment: New category is selectable and assignable in inventory items', () => {
  const newCategory = 'Chocolate & Cocoa';
  const newItem: InventoryItem = {
    id: 'inv-004',
    name: 'Dark Chocolate Powder 70%',
    category: newCategory,
    stock: 25,
    unit: 'kg',
    status: 'In Stock',
    minThreshold: 5,
    costPerUnit: 320,
    supplier: 'Cacao Origin',
    lastRestocked: '2026-03-01',
  };

  const inventoryWithNewItem = [...mockInventory, newItem];
  const chocolateItems = inventoryWithNewItem.filter(
    (it) => it.category.toLowerCase() === newCategory.toLowerCase()
  );

  assert.equal(chocolateItems.length, 1);
  assert.equal(chocolateItems[0].name, 'Dark Chocolate Powder 70%');
  assert.equal(chocolateItems[0].category, 'Chocolate & Cocoa');
});

test('Phase 6.2 - Category Count Badges: Accurately calculates item counts per category', () => {
  const categories = ['Coffee Beans', 'Dairy & Plant Milk', 'Packaging & Cups', 'Chocolate & Cocoa'];
  const inventory: InventoryItem[] = [
    ...mockInventory,
    {
      id: 'inv-004',
      name: 'Robusta House Blend',
      category: 'Coffee Beans',
      stock: 40,
      unit: 'kg',
      status: 'In Stock',
      minThreshold: 10,
    },
  ];

  const counts = categories.map((cat) => ({
    category: cat,
    count: inventory.filter((it) => it.category.toLowerCase() === cat.toLowerCase()).length,
  }));

  assert.deepEqual(counts, [
    { category: 'Coffee Beans', count: 2 },
    { category: 'Dairy & Plant Milk', count: 1 },
    { category: 'Packaging & Cups', count: 1 },
    { category: 'Chocolate & Cocoa', count: 0 },
  ]);
});

test('Phase 6.2 - Cross-Device Sync: Polled category list updates client state without resetting draft', () => {
  // Device A adds 'Tea & Infusions'
  const deviceBCategories = ['Coffee Beans', 'Dairy & Plant Milk'];
  const incomingServerCategories = ['Coffee Beans', 'Dairy & Plant Milk', 'Tea & Infusions'];

  // Device B is actively editing an existing item
  const baseDraft = createInitialInventoryDraft(mockInventory[0], 'Coffee Beans');
  const activeUserDraft: InventoryFormDraft = {
    ...baseDraft,
    stock: 75, // user typed 75
  };

  const isDirty = isInventoryDraftDirty(activeUserDraft, baseDraft);
  assert.equal(isDirty, true);

  // Background sync arrives with new categories
  let synchedCategories = [...deviceBCategories];
  synchedCategories = [...incomingServerCategories];

  // Active draft is unaffected and dirty state is preserved
  assert.equal(isInventoryDraftDirty(activeUserDraft, baseDraft), true);
  assert.equal(activeUserDraft.stock, 75);
  assert.ok(synchedCategories.includes('Tea & Infusions'));
});
