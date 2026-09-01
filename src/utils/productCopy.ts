import { MenuItem } from '../types';

/**
 * Generates a unique copied product name following the pattern:
 * "Original Name (Copy)" -> "Original Name (Copy 2)" -> "Original Name (Copy 3)"
 */
export function generateCopiedProductName(
  sourceName: string,
  existingItems: (string | { name: string })[]
): string {
  const cleanSource = (sourceName || '').trim() || 'Menu Item';
  const existingSet = new Set(
    existingItems.map((item) =>
      typeof item === 'string' ? item.trim().toLowerCase() : (item.name || '').trim().toLowerCase()
    )
  );

  const baseCopyName = `${cleanSource} (Copy)`;
  if (!existingSet.has(baseCopyName.toLowerCase())) {
    return baseCopyName;
  }

  let index = 2;
  while (existingSet.has(`${cleanSource} (Copy ${index})`.toLowerCase())) {
    index++;
  }
  return `${cleanSource} (Copy ${index})`;
}

/**
 * Creates an independent deep-clone of all existing product configuration fields
 * for pasting as a completely new product.
 */
export function cloneProductForPaste(
  source: MenuItem,
  newName: string
): Omit<MenuItem, 'id'> {
  return {
    name: newName,
    category: source.category || 'Coffee',
    price: Number(source.price) || 0,
    image: source.image || '',
    description: source.description || '',
    tags: Array.isArray(source.tags) ? [...source.tags] : [],
    popular: Boolean(source.popular),
    available: source.available !== false,
    temperature: source.temperature || 'Hot',
    sizes: Array.isArray(source.sizes)
      ? source.sizes.map((s) => ({
          name: s.name,
          volume: s.volume,
          priceDelta: Number(s.priceDelta) || 0,
          availableTemperatures: Array.isArray(s.availableTemperatures)
            ? [...s.availableTemperatures]
            : undefined,
          applicableTemperature: s.applicableTemperature,
        }))
      : [],
    addons: Array.isArray(source.addons) ? [...source.addons] : [],
    modifierCategoryIds: Array.isArray(source.modifierCategoryIds)
      ? [...source.modifierCategoryIds]
      : [],
    allergens: Array.isArray(source.allergens) ? [...source.allergens] : [],
    calories: source.calories != null ? Number(source.calories) : undefined,
  };
}
