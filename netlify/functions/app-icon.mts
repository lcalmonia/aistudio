import type { Config } from '@netlify/functions';
import { fetchStoreSettingsFromDatabase } from './_shared/settings.mts';

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function dataUrlToResponse(dataUrl: string): Response {
  const match = dataUrl.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
  if (!match) {
    return new Response('Invalid image data.', { status: 500 });
  }

  const [, mimeType, encoding, payload] = match;
  const bytes = encoding
    ? decodeBase64(payload)
    : new TextEncoder().encode(decodeURIComponent(payload));

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': mimeType || 'image/png',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export default async function handler(): Promise<Response> {
  try {
    const settings = await fetchStoreSettingsFromDatabase();
    const logoUrl = settings.logoUrl?.trim();

    if (!logoUrl) {
      return new Response(null, {
        status: 204,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    // The Store Logo is already controlled by Super Admin. For data URLs,
    // serve the bytes directly. For normal URLs, redirect so this endpoint
    // never performs an arbitrary server-side fetch.
    if (logoUrl.startsWith('data:')) {
      return dataUrlToResponse(logoUrl);
    }

    try {
      const target = new URL(logoUrl);
      if (!['http:', 'https:'].includes(target.protocol)) {
        return new Response('Unsupported logo URL.', { status: 400 });
      }
    } catch {
      return new Response('Invalid logo URL.', { status: 400 });
    }

    return Response.redirect(logoUrl, 302);
  } catch (error) {
    console.error('[AppIcon] Failed to resolve store logo:', error);
    return new Response('Unable to resolve store logo.', { status: 500 });
  }
}

export const config: Config = {
  path: '/api/app-icon',
  method: 'GET',
};
