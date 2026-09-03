export type CatalogImageEntityType = 'menu' | 'bundle';

export class CatalogImageError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'CatalogImageError';
  }
}

async function apiUpload(dataUrl: string, entityType: CatalogImageEntityType, entityId: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/catalog-image-upload', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, entityType, entityId }),
    });
  } catch (error: any) {
    throw new CatalogImageError(error?.message || 'Network error while uploading the image.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string };
  if (!response.ok || !data.url) {
    throw new CatalogImageError(data.error || 'The image could not be uploaded.', response.status);
  }
  return data.url;
}

export const catalogImageService = {
  async persistImage(
    image: string | undefined,
    entityType: CatalogImageEntityType,
    entityId: string,
  ): Promise<string> {
    const value = String(image || '').trim();
    if (!value || !value.startsWith('data:image/')) return value;
    return apiUpload(value, entityType, entityId);
  },
};
