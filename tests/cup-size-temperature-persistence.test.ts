import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapMenuItemRecord } from '../netlify/functions/_shared/catalog.mts';
import { createInitialProductDraft, isProductDraftDirty, ProductFormDraft } from '../src/utils/productDraft';
import { MenuItem, ProductSize } from '../src/types';

describe('Phase 7C-1: Cup Size & Temperature Persistence', () => {
  it('mapMenuItemRecord correctly parses sizes with availableTemperatures and applicableTemperature', () => {
    const dbRow = {
      id: 'menu-artisan-coffee',
      name: 'Artisan Latte',
      category: 'Coffee',
      price: '150.00',
      image: 'https://example.com/latte.jpg',
      description: 'Handcrafted latte with custom cup temperatures',
      tags: ['Specialty'],
      popular: true,
      available: true,
      temperature: 'Both' as const,
      sizes: [
        {
          name: 'Small 12oz',
          volume: '12oz',
          priceDelta: -15.0,
          availableTemperatures: ['Hot'],
          applicableTemperature: 'Hot',
        },
        {
          name: 'Medium 16oz',
          volume: '16oz',
          priceDelta: 0.0,
          availableTemperatures: ['Hot', 'Cold', 'Both'],
          applicableTemperature: 'Both',
        },
        {
          name: 'Large 22oz',
          volume: '22oz',
          priceDelta: 25.0,
          availableTemperatures: ['Cold'],
          applicableTemperature: 'Cold',
        },
      ],
      add_on_ids: ['addon-shot'],
      modifier_category_ids: ['modcat-temp', 'modcat-sweetness'],
      allergens: ['Dairy'],
      calories: 200,
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-02'),
    };

    const mapped = mapMenuItemRecord(dbRow);
    assert.ok(mapped.sizes);
    assert.equal(mapped.sizes.length, 3);

    // Size 1: Hot only
    assert.equal(mapped.sizes[0].name, 'Small 12oz');
    assert.deepEqual(mapped.sizes[0].availableTemperatures, ['Hot']);
    assert.equal(mapped.sizes[0].applicableTemperature, 'Hot');

    // Size 2: Both Hot & Iced
    assert.equal(mapped.sizes[1].name, 'Medium 16oz');
    assert.deepEqual(mapped.sizes[1].availableTemperatures, ['Hot', 'Cold', 'Both']);
    assert.equal(mapped.sizes[1].applicableTemperature, 'Both');

    // Size 3: Cold / Iced only
    assert.equal(mapped.sizes[2].name, 'Large 22oz');
    assert.deepEqual(mapped.sizes[2].availableTemperatures, ['Cold']);
    assert.equal(mapped.sizes[2].applicableTemperature, 'Cold');
  });

  it('mapMenuItemRecord handles JSON string serialized sizes column from PostgreSQL', () => {
    const rawSizesJson = JSON.stringify([
      { name: '12oz Hot Cup', volume: '12oz', priceDelta: 0, availableTemperatures: ['Hot'], applicableTemperature: 'Hot' },
      { name: '22oz Iced Cup', volume: '22oz', priceDelta: 20, availableTemperatures: ['Cold'], applicableTemperature: 'Cold' },
    ]);

    const dbRow = {
      id: 'menu-matcha-brew',
      name: 'Ceremonial Matcha',
      category: 'Matcha Series',
      price: '165.00',
      image: '',
      description: '',
      tags: [],
      popular: false,
      available: true,
      temperature: 'Both' as const,
      sizes: rawSizesJson,
      add_on_ids: [],
      modifier_category_ids: [],
      allergens: [],
      calories: 140,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mapped = mapMenuItemRecord(dbRow);
    assert.ok(mapped.sizes);
    assert.equal(mapped.sizes.length, 2);
    assert.deepEqual(mapped.sizes[0].availableTemperatures, ['Hot']);
    assert.deepEqual(mapped.sizes[1].availableTemperatures, ['Cold']);
  });

  it('reopening a saved product into draft preserves distinct temperature settings per size', () => {
    const savedProduct: MenuItem = {
      id: 'menu-custom-mocha',
      name: 'Dark Chocolate Mocha',
      category: 'Coffee',
      price: 155.0,
      image: 'https://example.com/mocha.jpg',
      description: 'Rich dark cocoa and espresso',
      temperature: 'Both',
      available: true,
      popular: true,
      sizes: [
        { name: 'Size A (Hot Cup)', volume: '12oz', priceDelta: -10, availableTemperatures: ['Hot'], applicableTemperature: 'Hot' },
        { name: 'Size B (Iced Cup)', volume: '22oz', priceDelta: 20, availableTemperatures: ['Cold'], applicableTemperature: 'Cold' },
        { name: 'Size C (Universal)', volume: '16oz', priceDelta: 0, availableTemperatures: ['Hot', 'Cold', 'Both'], applicableTemperature: 'Both' },
      ],
    };

    const draft = createInitialProductDraft(savedProduct, 'Coffee');
    assert.equal(draft.sizes.length, 3);
    assert.deepEqual(draft.sizes[0].availableTemperatures, ['Hot']);
    assert.deepEqual(draft.sizes[1].availableTemperatures, ['Cold']);
    assert.deepEqual(draft.sizes[2].availableTemperatures, ['Hot', 'Cold', 'Both']);
  });

  it('detects draft dirty state when user switches size temperature mode', () => {
    const originalProduct: MenuItem = {
      id: 'menu-test-latte',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: 145.0,
      image: '',
      description: '',
      temperature: 'Both',
      available: true,
      sizes: [
        { name: 'Regular', volume: '16oz', priceDelta: 0, availableTemperatures: ['Hot', 'Cold', 'Both'], applicableTemperature: 'Both' },
        { name: 'Large', volume: '22oz', priceDelta: 20, availableTemperatures: ['Hot', 'Cold', 'Both'], applicableTemperature: 'Both' },
      ],
    };

    const baseDraft = createInitialProductDraft(originalProduct, 'Coffee');

    // Simulate Admin changing Large size from Both to Cold (Iced only)
    const modifiedDraft: ProductFormDraft = {
      ...baseDraft,
      sizes: baseDraft.sizes.map((s, i) =>
        i === 1
          ? { ...s, availableTemperatures: ['Cold'], applicableTemperature: 'Cold' }
          : s
      ),
    };

    assert.equal(isProductDraftDirty(modifiedDraft, baseDraft), true);
  });
});
