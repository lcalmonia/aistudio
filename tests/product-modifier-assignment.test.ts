import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapMenuItemRecord } from '../netlify/functions/_shared/catalog.mjs';
import { createInitialProductDraft, isProductDraftDirty, ProductFormDraft } from '../src/utils/productDraft';
import { MenuItem, ModifierCategory } from '../src/types';
import { DEFAULT_MODIFIER_CATEGORIES } from '../src/data/initialData';

describe('Phase 7A: Product Modifier Group Assignment', () => {
  const sampleCategories: ModifierCategory[] = [
    { id: 'modcat-temp', name: 'Temperature', itemType: 'modifier', required: true, selectionType: 'single', active: true },
    { id: 'modcat-sweetness', name: 'Sweetness Level', itemType: 'modifier', required: true, selectionType: 'single', active: true },
    { id: 'modcat-ice', name: 'Ice Preference', itemType: 'modifier', required: true, selectionType: 'single', active: true },
    { id: 'modcat-shot', name: 'Espresso Shots & Roasts', itemType: 'addon', required: false, selectionType: 'multiple', active: true },
    { id: 'modcat-syrup', name: 'Syrups & Sweeteners', itemType: 'addon', required: false, selectionType: 'multiple', active: true },
    { id: 'modcat-topping', name: 'Toppings & Creams', itemType: 'addon', required: false, selectionType: 'multiple', active: true },
  ];

  it('correctly maps modifier_category_ids from database row in mapMenuItemRecord', () => {
    const dbRow = {
      id: 'menu-spanish-latte',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: '145.00',
      image: 'https://example.com/latte.jpg',
      description: 'Rich espresso with condensed milk',
      tags: ['Bestseller'],
      popular: true,
      available: true,
      temperature: 'Both' as const,
      sizes: null,
      add_on_ids: ['addon-shot', 'addon-oat'],
      modifier_category_ids: ['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot'],
      allergens: ['Dairy'],
      calories: 210,
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-02'),
    };

    const mapped = mapMenuItemRecord(dbRow);
    assert.deepEqual(mapped.modifierCategoryIds, ['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot']);
    assert.equal(mapped.name, 'Spanish Latte');
    assert.deepEqual(mapped.addons, ['addon-shot', 'addon-oat']);
  });

  it('handles products without modifier_category_ids or empty array', () => {
    const dbRowNoMod = {
      id: 'menu-croissant',
      name: 'Flaky Butter Croissant',
      category: 'Pastries',
      price: '85.00',
      image: 'https://example.com/croissant.jpg',
      description: 'Buttery pastry',
      tags: [],
      popular: false,
      available: true,
      temperature: 'N/A' as const,
      sizes: null,
      add_on_ids: [],
      modifier_category_ids: [],
      allergens: ['Wheat'],
      calories: 240,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mapped = mapMenuItemRecord(dbRowNoMod);
    assert.deepEqual(mapped.modifierCategoryIds, []);
  });

  it('initializes product form draft with explicit modifierCategoryIds when present', () => {
    const product: MenuItem = {
      id: 'prod-1',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: 145,
      image: 'https://example.com/img.jpg',
      description: 'Signature drink',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot'],
    };

    const draft = createInitialProductDraft(product, 'Coffee', sampleCategories);
    assert.deepEqual(draft.selectedModifierCategoryIds, ['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot']);
  });

  it('allows different products to have completely distinct modifier assignments', () => {
    const productA: MenuItem = {
      id: 'prod-a',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: 145,
      image: '',
      description: '',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot'],
    };

    const productB: MenuItem = {
      id: 'prod-b',
      name: 'Americano',
      category: 'Coffee',
      price: 120,
      image: '',
      description: '',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp', 'modcat-shot'], // Sweetness and Ice disabled
    };

    const productC: MenuItem = {
      id: 'prod-c',
      name: 'Banana Cake',
      category: 'Pastries',
      price: 90,
      image: '',
      description: '',
      temperature: 'N/A',
      available: true,
      modifierCategoryIds: [], // All disabled
    };

    const draftA = createInitialProductDraft(productA, 'Coffee', sampleCategories);
    const draftB = createInitialProductDraft(productB, 'Coffee', sampleCategories);
    const draftC = createInitialProductDraft(productC, 'Pastries', sampleCategories);

    assert.ok(draftA.selectedModifierCategoryIds.includes('modcat-temp'));
    assert.ok(draftA.selectedModifierCategoryIds.includes('modcat-sweetness'));
    assert.ok(draftA.selectedModifierCategoryIds.includes('modcat-ice'));

    assert.ok(draftB.selectedModifierCategoryIds.includes('modcat-temp'));
    assert.ok(!draftB.selectedModifierCategoryIds.includes('modcat-sweetness'));
    assert.ok(!draftB.selectedModifierCategoryIds.includes('modcat-ice'));

    assert.deepEqual(draftC.selectedModifierCategoryIds, []);
  });

  it('marks draft as dirty when user modifies modifier category assignment', () => {
    const product: MenuItem = {
      id: 'prod-1',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: 145,
      image: 'https://example.com/img.jpg',
      description: 'Signature drink',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp', 'modcat-sweetness'],
    };

    const baseDraft = createInitialProductDraft(product, 'Coffee', sampleCategories);
    
    // Unchanged draft is clean
    const unchangedDraft: ProductFormDraft = { ...baseDraft };
    assert.equal(isProductDraftDirty(unchangedDraft, baseDraft), false);

    // User toggles Ice preference ON
    const editedDraft: ProductFormDraft = {
      ...baseDraft,
      selectedModifierCategoryIds: ['modcat-temp', 'modcat-sweetness', 'modcat-ice'],
    };
    assert.equal(isProductDraftDirty(editedDraft, baseDraft), true);

    // User clears all modifier categories
    const clearedDraft: ProductFormDraft = {
      ...baseDraft,
      selectedModifierCategoryIds: [],
    };
    assert.equal(isProductDraftDirty(clearedDraft, baseDraft), true);
  });
});
