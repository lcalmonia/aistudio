import { ModifierCategory } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export class ModifierCategoryApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ModifierCategoryApiError';
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch (netErr: any) {
    throw new ModifierCategoryApiError(netErr?.message || 'Network error communicating with server.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new ModifierCategoryApiError(data.error || 'The modifier category request could not be completed.', response.status);
  }
  return data;
}

export const modifierCategoryService = {
  async listCategories(): Promise<ModifierCategory[]> {
    try {
      const response = await api<{ modifierCategories: ModifierCategory[] }>('/api/modifier-categories', { method: 'GET' });
      if (response && Array.isArray(response.modifierCategories) && response.modifierCategories.length > 0) {
        storageAdapter.setModifierCategories(response.modifierCategories);
        return response.modifierCategories;
      }
    } catch (err) {
      if (err instanceof ModifierCategoryApiError) {
        console.warn(`[ModifierCategoryService] Server list error (${err.status}):`, err.message);
      } else {
        console.warn('[ModifierCategoryService] Server network failure, using local storage fallback:', err);
      }
    }
    return storageAdapter.getModifierCategories();
  },

  async createCategory(cat: Omit<ModifierCategory, 'id'> & { id?: string }): Promise<ModifierCategory> {
    const newCat: ModifierCategory = {
      ...cat,
      id: cat.id || generateEntityId('modcat'),
    };

    try {
      const response = await api<{ modifierCategory: ModifierCategory }>('/api/modifier-categories', {
        method: 'POST',
        body: JSON.stringify(newCat),
      });
      if (response && response.modifierCategory) {
        const cats = storageAdapter.getModifierCategories().filter((c) => c.id !== response.modifierCategory.id);
        storageAdapter.setModifierCategories([...cats, response.modifierCategory]);
        return response.modifierCategory;
      }
    } catch (err) {
      console.warn('[ModifierCategoryService] Failed to create on server, persisting locally:', err);
    }

    const current = storageAdapter.getModifierCategories();
    storageAdapter.setModifierCategories([...current, newCat]);
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<ModifierCategory>): Promise<ModifierCategory | null> {
    try {
      const response = await api<{ category: ModifierCategory }>(`/api/modifier-categories/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (response && response.category) {
        const cats = storageAdapter.getModifierCategories();
        const index = cats.findIndex((c) => c.id === id);
        if (index !== -1) {
          cats[index] = response.category;
          storageAdapter.setModifierCategories(cats);
        }
        return response.category;
      }
    } catch (err) {
      console.warn(`[ModifierCategoryService] Failed to update category ${id} on server, saving locally:`, err);
    }

    const cats = storageAdapter.getModifierCategories();
    const index = cats.findIndex((c) => c.id === id);
    if (index !== -1) {
      cats[index] = { ...cats[index], ...updates, updatedAt: new Date().toISOString() };
      storageAdapter.setModifierCategories(cats);
      return cats[index];
    }
    return null;
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await api<{ success: boolean }>(`/api/modifier-categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn(`[ModifierCategoryService] Failed to delete category ${id} on server, removing locally:`, err);
    }

    const cats = storageAdapter.getModifierCategories();
    storageAdapter.setModifierCategories(cats.filter((c) => c.id !== id));
    return true;
  },
};
