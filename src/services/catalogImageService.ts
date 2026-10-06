export type CatalogImageEntityType = 'menu' | 'bundle';

const IMAGEKIT_UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload';

type ImageKitAuthResponse = {
  token?: string;
  expire?: number;
  signature?: string;
  publicKey?: string;
  error?: string;
  code?: string;
};

export class CatalogImageError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'CatalogImageError';
  }
}

async function apiUploadLegacy(
  dataUrl: string,
  entityType: CatalogImageEntityType,
  entityId: string,
): Promise<string> {
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

async function getImageKitAuth(): Promise<ImageKitAuthResponse | null> {
  let response: Response;
  try {
    response = await fetch('/api/imagekit-upload-auth', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error: any) {
    throw new CatalogImageError(error?.message || 'Network error while authenticating the image upload.');
  }

  const data = (await response.json().catch(() => ({}))) as ImageKitAuthResponse;

  // Keep the existing Netlify/PostgreSQL upload path available until ImageKit
  // environment variables are configured. Once configured, real ImageKit errors
  // are surfaced instead of silently falling back to database storage.
  if (response.status === 503 && data.code === 'IMAGEKIT_NOT_CONFIGURED') {
    return null;
  }

  if (!response.ok || !data.token || !data.signature || !data.expire || !data.publicKey) {
    throw new CatalogImageError(
      data.error || 'ImageKit upload authentication failed.',
      response.status,
    );
  }

  return data;
}

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Uint8Array } {
  const match = dataUrl.match(/^data:(image\/(?:webp|png|jpe?g|gif|svg\+xml));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    throw new CatalogImageError('Please provide a supported prepared image.');
  }

  const mimeType = match[1].toLowerCase();
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  if (!bytes.length) {
    throw new CatalogImageError('The uploaded image is empty.');
  }

  return { mimeType, bytes };
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'webp';
  }
}

function folderForEntityType(entityType: CatalogImageEntityType): string {
  return entityType === 'menu'
    ? '/aistudio/catalog/menu-items'
    : '/aistudio/catalog/promo-bundles';
}

async function uploadToImageKit(
  dataUrl: string,
  entityType: CatalogImageEntityType,
  entityId: string,
  auth: Required<Pick<ImageKitAuthResponse, 'token' | 'expire' | 'signature' | 'publicKey'>>,
): Promise<string> {
  const { mimeType, bytes } = parseDataUrl(dataUrl);
  const extension = extensionForMimeType(mimeType);
  const form = new FormData();

  form.append('file', new Blob([bytes], { type: mimeType }), `${entityId}.${extension}`);
  form.append('fileName', `${entityId}.${extension}`);
  form.append('publicKey', auth.publicKey);
  form.append('token', auth.token);
  form.append('expire', String(auth.expire));
  form.append('signature', auth.signature);
  form.append('folder', folderForEntityType(entityType));
  form.append('useUniqueFileName', 'false');
  form.append('overwriteFile', 'true');
  form.append('isPrivateFile', 'false');

  let response: Response;
  try {
    response = await fetch(IMAGEKIT_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: form,
    });
  } catch (error: any) {
    throw new CatalogImageError(error?.message || 'Network error while uploading the image to ImageKit.');
  }

  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string; url?: string };

  if (!response.ok || !data.url) {
    throw new CatalogImageError(
      data.message || data.error || 'ImageKit could not upload the image.',
      response.status,
    );
  }

  // Version the stored URL so replacing an existing catalog image cannot leave
  // an older browser-cached copy visible after a successful overwrite.
  const separator = data.url.includes('?') ? '&' : '?';
  return `${data.url}${separator}v=${Date.now()}`;
}

export const catalogImageService = {
  async persistImage(
    image: string | undefined,
    entityType: CatalogImageEntityType,
    entityId: string,
  ): Promise<string> {
    const value = String(image || '').trim();
    if (!value || !value.startsWith('data:image/')) return value;

    const auth = await getImageKitAuth();
    if (!auth) {
      return apiUploadLegacy(value, entityType, entityId);
    }

    return uploadToImageKit(value, entityType, entityId, {
      token: auth.token!,
      expire: auth.expire!,
      signature: auth.signature!,
      publicKey: auth.publicKey!,
    });
  },
};
