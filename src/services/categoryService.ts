import { storageAdapter } from './storageAdapter';

export const categoryService = {
  async listCategories(): Promise<string[]> {
    return storageAdapter.getCategories();
  },

  async saveCategories(categories: string[]): Promise<string[]> {
    storageAdapter.setCategories(categories);
    return categories;
  },

  async addCategory(categoryName: string): Promise<string[]> {
    const categories = storageAdapter.getCategories();
    const clean = categoryName.trim();
    if (!clean || categories.includes(clean)) return categories;
    const updated = [...categories, clean];
    storageAdapter.setCategories(updated);
    return updated;
  },

  async renameCategory(oldName: string, newName: string): Promise<string[]> {
    const categories = storageAdapter.getCategories();
    const clean = newName.trim();
    if (!clean) return categories;
    const updated = categories.map((c) => (c === oldName ? clean : c));
    storageAdapter.setCategories(updated);
    return updated;
  },

  async deleteCategory(categoryToDelete: string): Promise<string[]> {
    const categories = storageAdapter.getCategories();
    const updated = categories.filter((c) => c !== categoryToDelete);
    storageAdapter.setCategories(updated);
    return updated;
  },
};
