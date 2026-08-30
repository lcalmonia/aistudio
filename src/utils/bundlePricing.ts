import { MenuItem } from '../types';

/**
 * Calculates the combined original/base price of selected products for a combo or bundle.
 * Uses the authoritative base price of each matching MenuItem in the PostgreSQL/Menu catalog.
 *
 * @param selectedItems - Array of item names or IDs included in the bundle.
 * @param menuItems - Authoritative list of menu items.
 * @returns Total original price (sum of base prices of matching items).
 */
export function calculateBundleOriginalPrice(
  selectedItems: string[],
  menuItems: MenuItem[]
): number {
  if (!Array.isArray(selectedItems) || selectedItems.length === 0 || !Array.isArray(menuItems) || menuItems.length === 0) {
    return 0;
  }

  const total = selectedItems.reduce((sum, itemIdentifier) => {
    if (!itemIdentifier) return sum;
    const matchedItem = menuItems.find(
      (m) => m.name === itemIdentifier || m.id === itemIdentifier
    );
    const itemPrice = matchedItem ? Number(matchedItem.price) || 0 : 0;
    return sum + itemPrice;
  }, 0);

  // Return clean rounded value to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Calculates savings between the combined original price and the bundle promotional price.
 *
 * @param originalPrice - Combined base price of the selected products.
 * @param bundlePrice - Promotional selling price configured by the Admin.
 * @returns Object with savingsAmount and savingsPercentage.
 */
export function calculateBundleSavings(
  originalPrice: number,
  bundlePrice: number
): {
  savingsAmount: number;
  savingsPercentage: number;
} {
  const orig = Math.max(0, Number(originalPrice) || 0);
  const promo = Math.max(0, Number(bundlePrice) || 0);
  const savingsAmount = Math.max(0, Math.round((orig - promo) * 100) / 100);
  const savingsPercentage = orig > 0 ? Math.round((savingsAmount / orig) * 100) : 0;

  return {
    savingsAmount,
    savingsPercentage,
  };
}
