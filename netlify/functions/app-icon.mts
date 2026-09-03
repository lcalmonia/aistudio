import type { Config } from '@netlify/functions';
import { fetchStoreSettingsFromDatabase } from './_shared/settings.mts';

function parseDataUrl(value: string): { contentType: string; bytes: Buffer } | null {
  const match = value.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/s);
  if (!match) return null;

  try {
    return {
      contentType: match[1] || 'image/png',
      bytes: Buffer.from(match[2], 'base64'),
    };
  } catch {
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed.', { status: 405 });
  }

  try {
    const settings = await fetchStoreSettingsFromDatabase();
    const logoUrl = settings.logoUrl?.trim();

    if (!logoUrl) {
      return new Response(null, { status: 404 });
    }

    const dataImage = parseDataUrl(logoUrl);
    if (dataImage) {
      return new Response(dataImage.bytes, {
        headers: {
          'Content-Type': dataImage.contentType,
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Support an existing uploaded logo that is already stored as a normal URL.
    const upstream = await fetch(logoUrl, { redirect: 'follow' });
    if (!upstream.ok || !upstream.body) {
      return new Response(null, { status: 404 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[AppIcon] Failed to load store logo:', error);
    return new Response(null, { status: 500 });
  }
}

export const config: Config = {
  path: '/api/app-icon',
};
