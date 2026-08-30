import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialAddonDraft,
  isAddonDraftDirty,
  createInitialModifierCategoryDraft,
  isModifierCategoryDraftDirty,
  AddonFormDraft,
  ModifierCategoryDraft,
} from '../src/utils/addonDraft';
import { ProductAddon, ModifierCategory } from '../src/types';

const mockModifierCategories: ModifierCategory[] = [
  {
    id: 'cat-syrup',
    name: 'Syrup & Sweetener',
    itemType: 'addon',
    required: false,
    selectionType: 'multiple',
    applicableTemperature: 'Both',
  },
  {
    id: 'cat-sweetness',
    name: 'Sweetness Level',
    itemType: 'modifier',
    required: true,
    selectionType: 'single',
    applicableTemperature: 'Both',
  },
];

const mockAddon: ProductAddon = {
  id: 'addon-oat-01',
  name: 'Oat Milk Sub',
  category: 'Milk',
  itemType: 'addon',
  price: 40.0,
  applicableTemperature: 'Both',
  available: true,
  required: false,
  selectionType: 'single',
  applicableCategories: ['Coffee', 'Non-Coffee'],
};

const mockModCategory: ModifierCategory = {
  id: 'cat-sweetness',
  name: 'Sweetness Level',
  itemType: 'modifier',
  required: true,
  selectionType: 'single',
  applicableTemperature: 'Both',
  applicableCategories: ['Coffee', 'Milk Tea'],
};

test('Addon Draft: creates initial clean draft for Add New Addon / Modifier', () => {
  const draft = createInitialAddonDraft(null, mockModifierCategories);
  assert.equal(draft.name, '');
  assert.equal(draft.category, 'Syrup & Sweetener');
  assert.equal(draft.customCategory, '');
  assert.equal(draft.isCustomCategory, false);
  assert.equal(draft.itemType, 'addon');
  assert.equal(draft.price, 25.0);
  assert.equal(draft.available, true);
  assert.equal(draft.required, false);
  assert.equal(draft.selectionType, 'single');
  assert.deepEqual(draft.applicableCategories, []);

  // Untouched draft is not dirty
  assert.equal(isAddonDraftDirty(draft, draft), false);
});

test('Addon Draft: creates initial clean draft for Edit Addon from existing data', () => {
  const draft = createInitialAddonDraft(mockAddon, mockModifierCategories);
  assert.equal(draft.name, 'Oat Milk Sub');
  assert.equal(draft.category, 'Milk');
  assert.equal(draft.itemType, 'addon');
  assert.equal(draft.price, 40.0);
  assert.equal(draft.applicableTemperature, 'Both');
  assert.equal(draft.available, true);
  assert.deepEqual(draft.applicableCategories, ['Coffee', 'Non-Coffee']);

  // Untouched draft is not dirty
  assert.equal(isAddonDraftDirty(draft, draft), false);
});

test('Addon Draft: detects dirty state when typing name or changing fields', () => {
  const baseDraft = createInitialAddonDraft(mockAddon, mockModifierCategories);

  // Modifying name
  const draftWithNameChange: AddonFormDraft = {
    ...baseDraft,
    name: 'Almond Milk Sub',
  };
  assert.equal(isAddonDraftDirty(draftWithNameChange, baseDraft), true);

  // Modifying price
  const draftWithPriceChange: AddonFormDraft = {
    ...baseDraft,
    price: 45.0,
  };
  assert.equal(isAddonDraftDirty(draftWithPriceChange, baseDraft), true);

  // Modifying category
  const draftWithCatChange: AddonFormDraft = {
    ...baseDraft,
    category: 'Syrup & Sweetener',
  };
  assert.equal(isAddonDraftDirty(draftWithCatChange, baseDraft), true);

  // Modifying applicable categories
  const draftWithCategoriesChange: AddonFormDraft = {
    ...baseDraft,
    applicableCategories: ['Coffee', 'Non-Coffee', 'Pastries'],
  };
  assert.equal(isAddonDraftDirty(draftWithCategoriesChange, baseDraft), true);
});

test('Addon Draft: background synchronization protection logic', () => {
  const baseDraft = createInitialAddonDraft(mockAddon, mockModifierCategories);

  // User is actively editing price
  const activeUserDraft: AddonFormDraft = {
    ...baseDraft,
    price: 55.0,
  };
  assert.equal(isAddonDraftDirty(activeUserDraft, baseDraft), true);

  // Simulated background sync returns modified server data (e.g. from another device)
  const incomingServerAddon: ProductAddon = {
    ...mockAddon,
    price: 42.0,
  };

  // If form is dirty, user draft must NOT be overwritten
  let formState = { ...activeUserDraft };
  const isDirty = isAddonDraftDirty(formState, baseDraft);

  if (!isDirty) {
    formState = createInitialAddonDraft(incomingServerAddon, mockModifierCategories);
  }

  // Active user draft was protected
  assert.equal(formState.price, 55.0);

  // Once saved successfully, baseline updates and dirty state is cleared
  const newBaseDraft = { ...formState };
  assert.equal(isAddonDraftDirty(formState, newBaseDraft), false);
});

test('Modifier Category Draft: creates initial clean draft and detects dirty state', () => {
  const newCategoryDraft = createInitialModifierCategoryDraft(null);
  assert.equal(newCategoryDraft.name, '');
  assert.equal(newCategoryDraft.itemType, 'modifier');
  assert.equal(newCategoryDraft.required, false);
  assert.equal(newCategoryDraft.selectionType, 'single');
  assert.equal(isModifierCategoryDraftDirty(newCategoryDraft, newCategoryDraft), false);

  const editCategoryDraft = createInitialModifierCategoryDraft(mockModCategory);
  assert.equal(editCategoryDraft.name, 'Sweetness Level');
  assert.equal(editCategoryDraft.required, true);
  assert.deepEqual(editCategoryDraft.selectedProductCategories, ['Coffee', 'Milk Tea']);
  assert.equal(isModifierCategoryDraftDirty(editCategoryDraft, editCategoryDraft), false);

  // Modify category name
  const modifiedDraft: ModifierCategoryDraft = {
    ...editCategoryDraft,
    name: 'Sugar Level',
  };
  assert.equal(isModifierCategoryDraftDirty(modifiedDraft, editCategoryDraft), true);

  // Modify selection type
  const multiSelectDraft: ModifierCategoryDraft = {
    ...editCategoryDraft,
    selectionType: 'multiple',
  };
  assert.equal(isModifierCategoryDraftDirty(multiSelectDraft, editCategoryDraft), true);
});
