import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialInventoryDraft,
  isInventoryDraftDirty,
  InventoryFormDraft,
} from '../src/utils/inventoryDraft';
import { InventoryItem } from '../src/types';

const mockItem: InventoryItem = {
  id: 'inv-001',
  name: 'Arabica Espresso Beans',
  category: 'Beans',
  stock: 100,
  unit: 'kg',
  status: 'In Stock',
  minThreshold: 20,
  costPerUnit: 450,
  supplier: 'Highland Coffee Farms',
  notes: 'Storage rack B2',
  lastRestocked: '2026-03-01',
};

test('Inventory Draft: creates clean initial draft for Add New Item', () => {
  const draft = createInitialInventoryDraft(null, 'Beans');
  assert.equal(draft.name, '');
  assert.equal(draft.category, 'Beans');
  assert.equal(draft.stock, 10);
  assert.equal(draft.unit, 'kg');
  assert.equal(draft.minThreshold, 5);
  assert.equal(draft.costPerUnit, 0);
  assert.equal(draft.supplier, '');
  assert.equal(draft.notes, '');

  // Clean form has no changes against itself
  assert.equal(isInventoryDraftDirty(draft, draft), false);
});

test('Inventory Draft: creates clean initial draft for Edit Item from existing item', () => {
  const draft = createInitialInventoryDraft(mockItem, 'Beans');
  assert.equal(draft.name, 'Arabica Espresso Beans');
  assert.equal(draft.category, 'Beans');
  assert.equal(draft.stock, 100);
  assert.equal(draft.unit, 'kg');
  assert.equal(draft.minThreshold, 20);
  assert.equal(draft.costPerUnit, 450);
  assert.equal(draft.supplier, 'Highland Coffee Farms');
  assert.equal(draft.notes, 'Storage rack B2');

  // Clean form has no changes against itself
  assert.equal(isInventoryDraftDirty(draft, draft), false);
});

test('Inventory Draft: detects dirty state when typing new stock amount (e.g. 100 -> 125)', () => {
  const baseDraft = createInitialInventoryDraft(mockItem, 'Beans');
  const userEditingDraft: InventoryFormDraft = {
    ...baseDraft,
    stock: 125,
  };

  assert.equal(isInventoryDraftDirty(userEditingDraft, baseDraft), true);
});

test('Inventory Draft: detects dirty state when changing name, supplier, or notes', () => {
  const baseDraft = createInitialInventoryDraft(mockItem, 'Beans');
  const userEditingDraft: InventoryFormDraft = {
    ...baseDraft,
    name: 'Arabica Espresso Beans (Dark Roast)',
    supplier: 'Local Direct Roastery',
  };

  assert.equal(isInventoryDraftDirty(userEditingDraft, baseDraft), true);
});

test('Inventory Draft: background sync protection pattern preserves dirty edits', () => {
  const baseDraft = createInitialInventoryDraft(mockItem, 'Beans');
  let currentDraft: InventoryFormDraft = {
    ...baseDraft,
    stock: 125,
  };

  const isDirty = isInventoryDraftDirty(currentDraft, baseDraft);
  assert.equal(isDirty, true);

  // Background sync arrives with updated server stock (e.g. stock consumed down to 98)
  const incomingServerItem: InventoryItem = {
    ...mockItem,
    stock: 98,
  };

  // When dirty (isDirty === true), the form MUST NOT be overwritten
  if (!isDirty) {
    currentDraft = createInitialInventoryDraft(incomingServerItem, 'Beans');
  }

  // Active draft still holds the user's typed 125
  assert.equal(currentDraft.stock, 125);
  assert.equal(currentDraft.name, 'Arabica Espresso Beans');
});

test('Inventory Draft: clean form safely accepts incoming background sync updates', () => {
  let baseDraft = createInitialInventoryDraft(mockItem, 'Beans');
  let currentDraft = { ...baseDraft };

  // Form is clean (user has not made edits)
  const isDirty = isInventoryDraftDirty(currentDraft, baseDraft);
  assert.equal(isDirty, false);

  // Background sync arrives with new stock value from POS sale (100 -> 95)
  const incomingServerItem: InventoryItem = {
    ...mockItem,
    stock: 95,
  };

  // Clean form accepts incoming updates
  if (!isDirty) {
    baseDraft = createInitialInventoryDraft(incomingServerItem, 'Beans');
    currentDraft = { ...baseDraft };
  }

  assert.equal(currentDraft.stock, 95);
  assert.equal(isInventoryDraftDirty(currentDraft, baseDraft), false);
});

test('Inventory Draft: successful save updates baseline and clears dirty state', () => {
  let baseDraft = createInitialInventoryDraft(mockItem, 'Beans');
  const userDraft: InventoryFormDraft = {
    ...baseDraft,
    stock: 150,
    costPerUnit: 480,
  };

  assert.equal(isInventoryDraftDirty(userDraft, baseDraft), true);

  // Save occurs
  const savedItem: InventoryItem = {
    ...mockItem,
    stock: userDraft.stock,
    costPerUnit: userDraft.costPerUnit,
  };

  // On save success: update baseline
  baseDraft = createInitialInventoryDraft(savedItem, 'Beans');

  // Form is now clean
  assert.equal(isInventoryDraftDirty(userDraft, baseDraft), false);
});

test('Inventory Draft: save failure preserves active draft for retry', () => {
  let baseDraft = createInitialInventoryDraft(mockItem, 'Beans');
  const userDraft: InventoryFormDraft = {
    ...baseDraft,
    stock: 200,
    supplier: 'New Premium Supplier',
  };

  assert.equal(isInventoryDraftDirty(userDraft, baseDraft), true);

  // Simulated save failure
  let saveFailed = false;
  try {
    throw new Error('Network error during inventory save');
  } catch {
    saveFailed = true;
    // On failure: do NOT update baseDraft, keep userDraft intact
  }

  assert.equal(saveFailed, true);
  // Active user draft is preserved exactly
  assert.equal(userDraft.stock, 200);
  assert.equal(userDraft.supplier, 'New Premium Supplier');
  // Still dirty, so user can retry
  assert.equal(isInventoryDraftDirty(userDraft, baseDraft), true);
});
