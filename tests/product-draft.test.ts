import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialProductDraft,
  isProductDraftDirty,
  ProductFormDraft,
} from '../src/utils/productDraft';
import { MenuItem } from '../src/types';

const mockProduct: MenuItem = {
  id: 'prod-001',
  name: 'Spanish Latte',
  category: 'Coffee',
  price: 145.00,
  image: 'https://example.com/latte.jpg',
  description: 'Rich espresso with condensed milk',
  available: true,
  temperature: 'Both',
  popular: true,
  calories: 210,
  tags: ['Best Seller', 'Signature'],
  allergens: ['Milk'],
  addons: ['addon-oat', 'addon-shot'],
  sizes: [
    { name: 'Regular', volume: '16oz', priceDelta: 0.00, availableTemperatures: ['Hot', 'Cold', 'Both'] },
    { name: 'Large', volume: '22oz', priceDelta: 20.00, availableTemperatures: ['Hot', 'Cold', 'Both'] },
  ],
};

test('Product Draft: creates clean initial draft for Add New Product', () => {
  const draft = createInitialProductDraft(null, 'Coffee');
  assert.equal(draft.name, '');
  assert.equal(draft.category, 'Coffee');
  assert.equal(draft.price, 145);
  assert.equal(draft.available, true);
  assert.equal(draft.temperature, 'Both');

  // Clean form has no changes against itself
  assert.equal(isProductDraftDirty(draft, draft), false);
});

test('Product Draft: creates clean initial draft for Edit Product from existing MenuItem', () => {
  const draft = createInitialProductDraft(mockProduct, 'Coffee');
  assert.equal(draft.name, 'Spanish Latte');
  assert.equal(draft.category, 'Coffee');
  assert.equal(draft.price, 145.00);
  assert.equal(draft.description, 'Rich espresso with condensed milk');
  assert.equal(draft.popular, true);
  assert.equal(draft.available, true);
  assert.equal(draft.calories, 210);
  assert.equal(draft.sizes.length, 2);

  // Clean form has no changes against itself
  assert.equal(isProductDraftDirty(draft, draft), false);
});

test('Product Draft: detects dirty state when typing product name', () => {
  const baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  const userEditingDraft: ProductFormDraft = {
    ...baseDraft,
    name: 'Spanish Latte Reserve',
  };

  assert.equal(isProductDraftDirty(userEditingDraft, baseDraft), true);
});

test('Product Draft: detects dirty state when changing price or category', () => {
  const baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  const userEditingDraft: ProductFormDraft = {
    ...baseDraft,
    price: 165.00,
    category: 'Specialty Coffee',
  };

  assert.equal(isProductDraftDirty(userEditingDraft, baseDraft), true);
});

test('Product Draft: detects dirty state when modifying sizes or temperatures', () => {
  const baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  const userEditingDraft: ProductFormDraft = {
    ...baseDraft,
    sizes: [
      ...baseDraft.sizes,
      { name: 'Extra Large', volume: '24oz', priceDelta: 35.00, availableTemperatures: ['Both'] },
    ],
  };

  assert.equal(isProductDraftDirty(userEditingDraft, baseDraft), true);
});

test('Product Draft: background sync protection pattern preserves dirty edits', () => {
  const baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  let currentDraft: ProductFormDraft = {
    ...baseDraft,
    name: 'Spanish Latte In-Progress Typing',
    price: 155.00,
  };

  const isDirty = isProductDraftDirty(currentDraft, baseDraft);
  assert.equal(isDirty, true);

  // Simulate background synchronization polling
  const incomingServerProduct: MenuItem = {
    ...mockProduct,
    name: 'Spanish Latte (Server Polled)',
    price: 145.00,
  };

  // When form is dirty, synchronization MUST NOT overwrite current draft
  if (!isDirty) {
    currentDraft = createInitialProductDraft(incomingServerProduct, 'Coffee');
  }

  assert.equal(currentDraft.name, 'Spanish Latte In-Progress Typing');
  assert.equal(currentDraft.price, 155.00);
});

test('Product Draft: clean form allows background synchronization to update data', () => {
  let baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  let currentDraft = { ...baseDraft };

  const isDirty = isProductDraftDirty(currentDraft, baseDraft);
  assert.equal(isDirty, false);

  // Background sync arrives with updated price from another terminal
  const incomingServerProduct: MenuItem = {
    ...mockProduct,
    price: 150.00,
  };

  if (!isDirty) {
    baseDraft = createInitialProductDraft(incomingServerProduct, 'Coffee');
    currentDraft = { ...baseDraft };
  }

  assert.equal(currentDraft.price, 150.00);
});

test('Product Draft: successful save clears dirty state while preserving saved values', () => {
  let baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  const currentDraft: ProductFormDraft = {
    ...baseDraft,
    name: 'Spanish Latte Premium Edition',
    price: 175.00,
  };

  assert.equal(isProductDraftDirty(currentDraft, baseDraft), true);

  // Emulate successful save
  baseDraft = { ...currentDraft };

  assert.equal(isProductDraftDirty(currentDraft, baseDraft), false);
  assert.equal(currentDraft.name, 'Spanish Latte Premium Edition');
  assert.equal(currentDraft.price, 175.00);
});

test('Product Draft: failed save preserves draft without resetting for retry', () => {
  const baseDraft = createInitialProductDraft(mockProduct, 'Coffee');
  const currentDraft: ProductFormDraft = {
    ...baseDraft,
    name: 'Spanish Latte (Network Failed to Save)',
    price: 180.00,
  };

  // Emulate save failure
  let saveFailed = false;
  try {
    throw new Error('500 Internal Server Error');
  } catch {
    saveFailed = true;
    // Base draft is NOT updated, form draft is preserved
  }

  assert.equal(saveFailed, true);
  assert.equal(isProductDraftDirty(currentDraft, baseDraft), true);
  assert.equal(currentDraft.name, 'Spanish Latte (Network Failed to Save)');
  assert.equal(currentDraft.price, 180.00);
});
