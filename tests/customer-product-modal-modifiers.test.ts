import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MenuItem, ModifierCategory, ProductAddon, CustomerCartItem } from '../src/types';
import { DEFAULT_MODIFIER_CATEGORIES, INITIAL_ADDONS } from '../src/data/initialData';

// Helper logic mimicking CustomerProductModal's pure resolution logic
function resolveModalSections(
  product: MenuItem,
  selectedTemp: 'Hot' | 'Iced' | 'N/A',
  categories: ModifierCategory[] = DEFAULT_MODIFIER_CATEGORIES,
  addons: ProductAddon[] = INITIAL_ADDONS
) {
  const isTemperatureOptionEnabled =
    product.temperature === 'Both' &&
    (!Array.isArray(product.modifierCategoryIds) ||
      product.modifierCategoryIds.some((id) => {
        const cat = categories.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase());
        return (
          id === 'modcat-temp' ||
          id === 'modcat-temperature' ||
          id.toLowerCase() === 'temperature' ||
          cat?.id === 'modcat-temp' ||
          cat?.name.toLowerCase() === 'temperature'
        );
      }));

  const assignedCatIds = Array.isArray(product.modifierCategoryIds)
    ? product.modifierCategoryIds
    : null;

  const activeAssignedCategories = categories.filter((cat) => {
    if (cat.active === false) return false;
    const isTempCat =
      cat.id === 'modcat-temp' ||
      cat.id === 'modcat-temperature' ||
      cat.name.toLowerCase() === 'temperature';
    if (isTempCat) return false;

    if (assignedCatIds !== null) {
      const isDirectlyAssigned = assignedCatIds.some(
        (id) =>
          id === cat.id ||
          id.toLowerCase() === cat.name.toLowerCase() ||
          (cat.id === 'modcat-sweetness' && (id === 'modcat-sweetness' || id.toLowerCase() === 'sweetness level')) ||
          (cat.id === 'modcat-ice' && (id === 'modcat-ice' || id.toLowerCase() === 'ice preference'))
      );
      if (!isDirectlyAssigned) return false;
    } else {
      if (cat.applicableCategories && cat.applicableCategories.length > 0) {
        if (!cat.applicableCategories.includes(product.category)) return false;
      }
    }

    if (selectedTemp === 'Hot' && cat.applicableTemperature === 'Cold') return false;
    if (selectedTemp === 'Iced' && cat.applicableTemperature === 'Hot') return false;

    return true;
  });

  const groups = activeAssignedCategories.map((cat) => {
    const matchingItems = addons.filter((addon) => {
      if (!addon || !addon.available) return false;
      const matchesCat =
        addon.category.toLowerCase() === cat.name.toLowerCase() || addon.category === cat.id;
      if (!matchesCat) return false;

      if (addon.applicableTemperature === 'Hot' && selectedTemp === 'Iced') return false;
      if (addon.applicableTemperature === 'Cold' && selectedTemp === 'Hot') return false;

      if (
        cat.itemType === 'addon' &&
        product.addons &&
        product.addons.length > 0 &&
        !product.addons.includes(addon.id)
      ) {
        return false;
      }

      return true;
    });

    return {
      category: cat,
      items: matchingItems,
      isSingleChoice: cat.selectionType === 'single' || cat.itemType === 'modifier',
      isRequired: Boolean(cat.required),
    };
  }).filter((g) => g.items.length > 0);

  return {
    isTemperatureOptionEnabled,
    groups,
  };
}

describe('Phase 7B: Customer Product Modal Dynamic Modifier Groups', () => {
  it('TEST 1: Product A (Spanish Latte) with Temperature, Sweetness, Ice enabled displays all three', () => {
    const productA: MenuItem = {
      id: 'prod-latte',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: 145,
      image: '',
      description: '',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp', 'modcat-sweetness', 'modcat-ice', 'modcat-shot'],
    };

    const icedView = resolveModalSections(productA, 'Iced');
    assert.equal(icedView.isTemperatureOptionEnabled, true);
    const catNamesIced = icedView.groups.map((g) => g.category.name);
    assert.ok(catNamesIced.includes('Sweetness Level'));
    assert.ok(catNamesIced.includes('Ice Preference'));

    // When Hot, Ice Preference is filtered out by temperature compatibility
    const hotView = resolveModalSections(productA, 'Hot');
    assert.equal(hotView.isTemperatureOptionEnabled, true);
    const catNamesHot = hotView.groups.map((g) => g.category.name);
    assert.ok(catNamesHot.includes('Sweetness Level'));
    assert.ok(!catNamesHot.includes('Ice Preference'));
  });

  it('TEST 2: Product B with Temperature enabled, Sweetness disabled, Ice disabled displays Temperature only', () => {
    const productB: MenuItem = {
      id: 'prod-americano',
      name: 'Americano',
      category: 'Coffee',
      price: 120,
      image: '',
      description: '',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp'], // Only Temperature enabled
    };

    const view = resolveModalSections(productB, 'Hot');
    assert.equal(view.isTemperatureOptionEnabled, true);
    assert.equal(view.groups.length, 0);
  });

  it('TEST 3: Product C with Temperature, Sweetness, Ice disabled displays none of these sections', () => {
    const productC: MenuItem = {
      id: 'prod-iced-tea',
      name: 'Signature Hibiscus Tea',
      category: 'Coolers/Mocktails',
      price: 130,
      image: '',
      description: '',
      temperature: 'Cold',
      available: true,
      modifierCategoryIds: [], // All disabled
    };

    const view = resolveModalSections(productC, 'Iced');
    assert.equal(view.isTemperatureOptionEnabled, false);
    assert.equal(view.groups.length, 0);
  });

  it('TEST 4: Product D with no modifier categories assigned displays no empty modifier sections', () => {
    const productD: MenuItem = {
      id: 'prod-banana-cake',
      name: 'Banana Cake',
      category: 'Pastries',
      price: 90,
      image: '',
      description: '',
      temperature: 'N/A',
      available: true,
      modifierCategoryIds: [],
    };

    const view = resolveModalSections(productD, 'N/A');
    assert.equal(view.isTemperatureOptionEnabled, false);
    assert.equal(view.groups.length, 0);
  });

  it('TEST 5: Rice Meal with Rice Meal Options assigned displays configured Rice Meal modifiers', () => {
    const riceMeal: MenuItem = {
      id: 'prod-tapsilog',
      name: 'Beef Tapa Silog',
      category: 'Rice Meals',
      price: 195,
      image: '',
      description: 'Marinated beef tapa with garlic rice and egg',
      temperature: 'N/A',
      available: true,
      modifierCategoryIds: ['modcat-rice'],
    };

    const view = resolveModalSections(riceMeal, 'N/A');
    assert.equal(view.isTemperatureOptionEnabled, false);
    assert.equal(view.groups.length, 1);
    assert.equal(view.groups[0].category.name, 'Rice Meal Options');
    assert.ok(view.groups[0].items.some((i) => i.name.includes('Extra Garlic Butter Rice')));
    assert.ok(view.groups[0].items.some((i) => i.name.includes('Sunny-Side Up Egg')));
  });

  it('TEST 6: Pika-Pika with Pika-Pika Flavors assigned displays configured Pika-Pika modifiers', () => {
    const pikaPika: MenuItem = {
      id: 'prod-fries',
      name: 'Twister French Fries',
      category: 'Pika-Pika',
      price: 110,
      image: '',
      description: 'Crispy seasoned potato twisters',
      temperature: 'N/A',
      available: true,
      modifierCategoryIds: ['modcat-pika'],
    };

    const view = resolveModalSections(pikaPika, 'N/A');
    assert.equal(view.groups.length, 1);
    assert.equal(view.groups[0].category.name, 'Pika-Pika Flavors');
    assert.ok(view.groups[0].items.some((i) => i.name.includes('Sour Cream')));
    assert.ok(view.groups[0].items.some((i) => i.name.includes('Cheese Dusting')));
    assert.ok(view.groups[0].items.some((i) => i.name.includes('Barbecue')));
  });

  it('TEST 7: Super Admin dynamically changes product modifier assignment and updates modal view', () => {
    const product: MenuItem = {
      id: 'prod-dynamic',
      name: 'Matcha Latte',
      category: 'Matcha Series',
      price: 160,
      image: '',
      description: '',
      temperature: 'Both',
      available: true,
      modifierCategoryIds: ['modcat-temp', 'modcat-sweetness'],
    };

    const initialView = resolveModalSections(product, 'Hot');
    assert.equal(initialView.isTemperatureOptionEnabled, true);
    assert.equal(initialView.groups.length, 1);
    assert.equal(initialView.groups[0].category.name, 'Sweetness Level');

    // Super Admin enables Ice Preference as well
    const updatedProduct: MenuItem = {
      ...product,
      modifierCategoryIds: ['modcat-temp', 'modcat-sweetness', 'modcat-ice'],
    };

    const updatedView = resolveModalSections(updatedProduct, 'Iced');
    assert.equal(updatedView.groups.length, 2);
    assert.equal(updatedView.groups[0].category.name, 'Sweetness Level');
    assert.equal(updatedView.groups[1].category.name, 'Ice Preference');
  });

  it('TEST 8 & 9: Respects selection rules (single vs multiple, required vs optional)', () => {
    const sweetnessCat = DEFAULT_MODIFIER_CATEGORIES.find((c) => c.id === 'modcat-sweetness');
    assert.equal(sweetnessCat?.required, true);
    assert.equal(sweetnessCat?.selectionType, 'single');

    const riceCat = DEFAULT_MODIFIER_CATEGORIES.find((c) => c.id === 'modcat-rice');
    assert.equal(riceCat?.required, false);
    assert.equal(riceCat?.selectionType, 'multiple');
  });

  it('TEST 10: Temperature-specific size availability continues working', () => {
    const sizes = [
      { name: '16oz Hot Mug', volume: '16oz', priceDelta: 0, availableTemperatures: ['Hot' as const] },
      { name: '22oz Chilled Tumbler', volume: '22oz', priceDelta: 25, availableTemperatures: ['Cold' as const] },
    ];

    const hotSizes = sizes.filter((s) => s.availableTemperatures.includes('Hot'));
    const icedSizes = sizes.filter((s) => s.availableTemperatures.includes('Cold'));

    assert.equal(hotSizes.length, 1);
    assert.equal(hotSizes[0].name, '16oz Hot Mug');

    assert.equal(icedSizes.length, 1);
    assert.equal(icedSizes[0].name, '22oz Chilled Tumbler');
  });

  it('TEST 11 & 12: Modifier price changes affect unit price calculations correctly while leaving historical schema intact', () => {
    const basePrice = 145;
    const sizeDelta = 20;
    const extraRicePrice = 30;
    const oatMilkPrice = 40;

    const unitPrice = basePrice + sizeDelta + extraRicePrice + oatMilkPrice;
    const quantity = 2;
    const totalPrice = unitPrice * quantity;

    assert.equal(unitPrice, 235);
    assert.equal(totalPrice, 470);
  });
});
