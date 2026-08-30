import { describe, it, expect } from 'vitest';
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
    expect(mapped.modifierCategoryIds).toEqual(['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot']);
    expect(mapped.name).toBe('Spanish Latte');
    expect(mapped.addons).toEqual(['addon-shot', 'addon-oat']);
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
    expect(mapped.modifierCategoryIds).toEqual([]);
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
    expect(draft.selectedModifierCategoryIds).toEqual(['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot']);
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

    expect(draftA.selectedModifierCategoryIds).toContain('modcat-temp');
    expect(draftA.selectedModifierCategoryIds).toContain('modcat-sweetness');
    expect(draftA.selectedModifierCategoryIds).toContain('modcat-ice');

    expect(draftB.selectedModifierCategoryIds).toContain('modcat-temp');
    expect(draftB.selectedModifierCategoryIds).not.toContain('modcat-sweetness');
    expect(draftB.selectedModifierCategoryIds).not.toContain('modcat-ice');

    expect(draftC.selectedModifierCategoryIds).toEqual([]);
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
    expect(isProductDraftDirty(unchangedDraft, baseDraft)).toBe(false);

    // User toggles Ice preference ON
    const editedDraft: ProductFormDraft = {
      ...baseDraft,
      selectedModifierCategoryIds: ['modcat-temp', 'modcat-sweetness', 'modcat-ice'],
    };
    expect(isProductDraftDirty(editedDraft, baseDraft)).toBe(true);

    // User clears all modifier categories
    const clearedDraft: ProductFormDraft = {
      ...baseDraft,
      selectedModifierCategoryIds: [],
    };
    expect(isProductDraftDirty(clearedDraft, baseDraft)).toBe(true);
  });
});
