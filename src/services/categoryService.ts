import { storageAdapter } from './storageAdapter';

class CategoryApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new CategoryApiError(data.error || 'The category request could not be completed.', response.status);
  }
  return data;
}

export const categoryService = {
  async listCategories(): Promise<string[]> {
    try {
      const response = await api<{ categories: string[] }>('/api/categories', { method: 'GET' });
      if (response && Array.isArray(response.categories) && response.categories.length > 0) {
        storageAdapter.setCategories(response.categories);
        return response.categories;
      }
    } catch (err) {
      console.warn('[CategoryService] Server listCategories failed, using local storage fallback:', err);
    }
    return storageAdapter.getCategories();
  },

  async saveCategories(categories: string[]): Promise<string[]> {
    storageAdapter.setCategories(categories);
    return categories;
  },

  async addCategory(categoryName: string): Promise<string[]> {
    const clean = categoryName.trim();
    if (!clean) return storageAdapter.getCategories();

    try {
      const response = await api<{ categories: string[] }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: clean }),
      });
      if (response && Array.isArray(response.categories)) {
        storageAdapter.setCategories(response.categories);
        return response.categories;
      }
    } catch (err) {
      console.warn('[CategoryService] Server addCategory failed, using local fallback:', err);
    }

    const categories = storageAdapter.getCategories();
    if (!categories.includes(clean)) {
      const updated = [...categories, clean];
      storageAdapter.setCategories(updated);
      return updated;
    }
    return categories;
  },

  async renameCategory(oldName: string, newName: string): Promise<string[]> {
    const clean = newName.trim();
    if (!clean) return storageAdapter.getCategories();

    try {
      const response = await api<{ categories: string[] }>(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PATCH',
        body: JSON.stringify({ newName: clean }),
      });
      if (response && Array.isArray(response.categories)) {
        storageAdapter.setCategories(response.categories);
        return response.categories;
      }
    } catch (err) {
      console.warn('[CategoryService] Server renameCategory failed, using local fallback:', err);
    }

    const categories = storageAdapter.getCategories();
    const updated = categories.map((c) => (c === oldName ? clean : c));
    storageAdapter.setCategories(updated);
    return updated;
  },

  async deleteCategory(categoryToDelete: string, fallbackCategory?: string): Promise<string[]> {
    try {
      const query = fallbackCategory ? `?fallback=${encodeURIComponent(fallbackCategory)}` : '';
      const response = await api<{ categories: string[] }>(`/api/categories/${encodeURIComponent(categoryToDelete)}${query}`, {
        method: 'DELETE',
      });
      if (response && Array.isArray(response.categories)) {
        storageAdapter.setCategories(response.categories);
        return response.categories;
      }
    } catch (err) {
      console.warn('[CategoryService] Server deleteCategory failed, using local fallback:', err);
    }

    const categories = storageAdapter.getCategories();
    const updated = categories.filter((c) => c !== categoryToDelete);
    storageAdapter.setCategories(updated);
    return updated;
  },
};

