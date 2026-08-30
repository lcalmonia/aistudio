import { InventoryItem } from '../types';

export interface InventoryFormDraft {
  name: string;
  category: string;
  stock: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier: string;
  notes: string;
}

export function createInitialInventoryDraft(
  item?: InventoryItem | null,
  defaultCategory: string = 'Beans'
): InventoryFormDraft {
  if (item) {
    return {
      name: item.name ?? '',
      category: item.category || defaultCategory,
      stock: item.stock ?? 10,
      unit: item.unit ?? 'kg',
      minThreshold: item.minThreshold ?? 5,
      costPerUnit: item.costPerUnit ?? 0,
      supplier: item.supplier ?? '',
      notes: item.notes ?? '',
    };
  }

  return {
    name: '',
    category: defaultCategory,
    stock: 10,
    unit: 'kg',
    minThreshold: 5,
    costPerUnit: 0,
    supplier: '',
    notes: '',
  };
}

export function isInventoryDraftDirty(
  current: InventoryFormDraft,
  base: InventoryFormDraft
): boolean {
  return JSON.stringify(current) !== JSON.stringify(base);
}
