import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBundleOriginalPrice, calculateBundleSavings } from '../src/utils/bundlePricing';
import { MenuItem } from '../src/types';

const mockMenuItems: MenuItem[] = [
  {
    id: 'prod-001',
    name: 'Spanish Latte',
    category: 'Specialty Coffee',
    price: 120.00,
    image: '',
    description: 'Espresso with textured milk and sweet condensed milk',
    available: true,
    temperature: 'Both',
    sizes: [
      { name: 'Regular (12oz)', volume: '12oz', priceDelta: 0 },
      { name: 'Large (16oz)', volume: '16oz', priceDelta: 20 },
    ],
  },
  {
    id: 'prod-002',
    name: 'Butter Croissant',
    category: 'Pastries',
    price: 80.00,
    image: '',
    description: 'Flaky buttery pastry',
    available: true,
    temperature: 'N/A',
  },
  {
    id: 'prod-003',
    name: 'Avocado Toast',
    category: 'Pastries',
    price: 150.00,
    image: '',
    description: 'Sourdough toast with mashed avocado and poached egg',
    available: true,
    temperature: 'N/A',
  },
];

test('Combo Pricing: automatically calculates sum of two selected products', () => {
  const selected = ['Spanish Latte', 'Butter Croissant'];
  const origPrice = calculateBundleOriginalPrice(selected, mockMenuItems);
  assert.equal(origPrice, 200.00);

  const { savingsAmount, savingsPercentage } = calculateBundleSavings(origPrice, 170.00);
  assert.equal(savingsAmount, 30.00);
  assert.equal(savingsPercentage, 15);
});

test('Combo Pricing: adding another product increases Orig. Price accordingly', () => {
  const selected = ['Spanish Latte', 'Butter Croissant', 'Avocado Toast'];
  const origPrice = calculateBundleOriginalPrice(selected, mockMenuItems);
  assert.equal(origPrice, 350.00); // 120 + 80 + 150

  const { savingsAmount, savingsPercentage } = calculateBundleSavings(origPrice, 299.00);
  assert.equal(savingsAmount, 51.00);
  assert.equal(savingsPercentage, 15);
});

test('Combo Pricing: removing a product decreases Orig. Price accordingly', () => {
  const selected = ['Spanish Latte'];
  const origPrice = calculateBundleOriginalPrice(selected, mockMenuItems);
  assert.equal(origPrice, 120.00);

  const { savingsAmount } = calculateBundleSavings(origPrice, 100.00);
  assert.equal(savingsAmount, 20.00);
});

test('Combo Pricing: changing bundle promo price updates savings while Orig. Price stays fixed', () => {
  const selected = ['Spanish Latte', 'Butter Croissant'];
  const origPrice = calculateBundleOriginalPrice(selected, mockMenuItems);
  assert.equal(origPrice, 200.00);

  // Promo price = 170 -> Savings = 30
  const savings1 = calculateBundleSavings(origPrice, 170.00);
  assert.equal(savings1.savingsAmount, 30.00);

  // Promo price changed to 150 -> Savings = 50, Orig Price stays 200
  const savings2 = calculateBundleSavings(origPrice, 150.00);
  assert.equal(savings2.savingsAmount, 50.00);
  assert.equal(savings2.savingsPercentage, 25);
});

test('Combo Pricing: supports matching by item ID as well as item Name', () => {
  const selected = ['prod-001', 'prod-002'];
  const origPrice = calculateBundleOriginalPrice(selected, mockMenuItems);
  assert.equal(origPrice, 200.00);
});

test('Combo Pricing: handles empty or unknown items safely without throwing', () => {
  assert.equal(calculateBundleOriginalPrice([], mockMenuItems), 0);
  assert.equal(calculateBundleOriginalPrice(['Non-existent item'], mockMenuItems), 0);
  assert.equal(calculateBundleOriginalPrice(['Spanish Latte', 'Ghost Item'], mockMenuItems), 120.00);

  const savings = calculateBundleSavings(0, 100);
  assert.equal(savings.savingsAmount, 0);
  assert.equal(savings.savingsPercentage, 0);
});
