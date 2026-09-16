import { storageAdapter } from './storageAdapter';

export class CategoryApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'CategoryApiError';
  }
}

const CATEGORY_CACHE_TTL_MS = 30_000;
let categoryCache: { categories: string[]; expiresAt: number } | null = null;
let categoryRequest: Promise<string[]> | null = null;

function invalidateCategoryCache() {
  categoryCache = null;
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
    throw new CategoryApiError(netErr?.message || 'Network error communicating with server.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new CategoryApiError(data.error || 'The category request could not be completed.', response.status);
  }
  return data;
}

export const categoryService = {
  async listCategories(): Promise<string[]> {
    const now = Date.now();
    if (categoryCache && categoryCache.expiresAt > now) {
      return categoryCache.categories;
    }
    if (categoryRequest) {
      return categoryRequest;
    }

    categoryRequest = (async () => {
      try {
        const response = await api<{ categories: string[] }>('/api/categories', { method: 'GET' });
        if (response && Array.isArray(response.categories)) {
          storageAdapter.setCategories(response.categories);
          categoryCache = {
            categories: response.categories,
            expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
          };
          return response.categories;
        }
      } catch (err) {
        if (err instanceof CategoryApiError) {
          console.warn(`[CategoryService] Server listCategories error (${err.status}):`, err.message);
        } else {
          console.warn('[CategoryService] Server listCategories network failure, using local storage fallback:', err);
        }
      }
      return storageAdapter.getCategories();
    })();

    try {
      return await categoryRequest;
    } finally {
      categoryRequest = null;
    }
  },

  async saveCategories(categories: string[]): Promise<string[]> {
    storageAdapter.setCategories(categories);
    invalidateCategoryCache();
    return categories;
  },

  async addCategory(categoryName: string): Promise<string[]> {
    const clean = categoryName.trim();
    if (!clean) return this.listCategories();

    const response = await api<{ categories: string[] }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: clean }),
    });
    if (response && Array.isArray(response.categories)) {
      storageAdapter.setCategories(response.categories);
      invalidateCategoryCache();
      return response.categories;
    }

    throw new CategoryApiError('Failed to add category on server.');
  },

  async renameCategory(oldName: string, newName: string): Promise<string[]> {
    const clean = newName.trim();
    if (!clean) return this.listCategories();

    const response = await api<{ categories: string[] }>(`/api/categories/${encodeURIComponent(oldName)}`, {
      method: 'PATCH',
      body: JSON.stringify({ newName: clean }),
    });
    if (response && Array.isArray(response.categories)) {
      storageAdapter.setCategories(response.categories);
      invalidateCategoryCache();
      return response.categories;
    }

    throw new CategoryApiError('Failed to rename category on server.');
  },

  async deleteCategory(categoryToDelete: string, fallbackCategory?: string): Promise<string[]> {
    const query = fallbackCategory ? `?fallback=${encodeURIComponent(fallbackCategory)}` : '';
    const response = await api<{ categories: string[] }>(`/api/categories/${encodeURIComponent(categoryToDelete)}${query}`, {
      method: 'DELETE',
    });
    if (response && Array.isArray(response.categories)) {
      storageAdapter.setCategories(response.categories);
      invalidateCategoryCache();
      return response.categories;
    }

    throw new CategoryApiError('Failed to delete category on server.');
  },
};
