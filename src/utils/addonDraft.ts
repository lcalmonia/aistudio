import { ProductAddon, ModifierCategory, ModifierCategoryType } from '../types';

export interface AddonFormDraft {
  name: string;
  category: string;
  customCategory: string;
  isCustomCategory: boolean;
  itemType: ModifierCategoryType;
  price: number;
  applicableTemperature: 'Hot' | 'Cold' | 'Both' | 'All';
  available: boolean;
  required: boolean;
  selectionType: 'single' | 'multiple';
  applicableCategories: string[];
}

export function createInitialAddonDraft(
  addonToEdit?: ProductAddon | null,
  modifierCategories: ModifierCategory[] = []
): AddonFormDraft {
  if (addonToEdit) {
    const existingInList = modifierCategories.some(
      (mc) => mc.name.toLowerCase() === addonToEdit.category.toLowerCase()
    );
    const isBuiltin = ['Milk', 'Shot', 'Syrup', 'Topping', 'Prep'].includes(addonToEdit.category);
    const isCustom = !existingInList && !isBuiltin;

    return {
      name: addonToEdit.name || '',
      category: isCustom ? '__custom__' : addonToEdit.category,
      customCategory: isCustom ? addonToEdit.category : '',
      isCustomCategory: isCustom,
      itemType: addonToEdit.itemType || 'addon',
      price: addonToEdit.price ?? 25.0,
      applicableTemperature: addonToEdit.applicableTemperature || 'Both',
      available: addonToEdit.available ?? true,
      required: addonToEdit.required ?? false,
      selectionType: addonToEdit.selectionType || 'single',
      applicableCategories: addonToEdit.applicableCategories ? [...addonToEdit.applicableCategories] : [],
    };
  }

  const defaultCategory = modifierCategories[0]?.name || 'Syrup & Sweetener';
  return {
    name: '',
    category: defaultCategory,
    customCategory: '',
    isCustomCategory: false,
    itemType: 'addon',
    price: 25.0,
    applicableTemperature: 'Both',
    available: true,
    required: false,
    selectionType: 'single',
    applicableCategories: [],
  };
}

export function isAddonDraftDirty(
  current: AddonFormDraft,
  base: AddonFormDraft
): boolean {
  return JSON.stringify(current) !== JSON.stringify(base);
}

export interface ModifierCategoryDraft {
  name: string;
  itemType: ModifierCategoryType;
  required: boolean;
  selectionType: 'single' | 'multiple';
  applicableTemperature: 'Hot' | 'Cold' | 'Both' | 'All';
  selectedProductCategories: string[];
}

export function createInitialModifierCategoryDraft(
  categoryToEdit?: ModifierCategory | null
): ModifierCategoryDraft {
  if (categoryToEdit) {
    return {
      name: categoryToEdit.name || '',
      itemType: categoryToEdit.itemType || 'modifier',
      required: categoryToEdit.required ?? false,
      selectionType: categoryToEdit.selectionType || 'single',
      applicableTemperature: categoryToEdit.applicableTemperature || 'Both',
      selectedProductCategories: categoryToEdit.applicableCategories
        ? [...categoryToEdit.applicableCategories]
        : [],
    };
  }

  return {
    name: '',
    itemType: 'modifier',
    required: false,
    selectionType: 'single',
    applicableTemperature: 'Both',
    selectedProductCategories: [],
  };
}

export function isModifierCategoryDraftDirty(
  current: ModifierCategoryDraft,
  base: ModifierCategoryDraft
): boolean {
  return JSON.stringify(current) !== JSON.stringify(base);
}
