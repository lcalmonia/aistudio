import type { Config } from '@netlify/functions';
import { fetchStoreSettingsFromDatabase } from './_shared/settings.mts';

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed.', { status: 405 });
  }

  try {
    const settings = await fetchStoreSettingsFromDatabase();
    const storeName = settings.storeName?.trim() || 'iLuvKeyks Coffee & Tea';
    const iconVersion = encodeURIComponent(settings.updatedAt || 'current');
    const iconUrl = `/api/app-icon?v=${iconVersion}`;

    const manifest = {
      id: '/',
      name: storeName,
      short_name: storeName.length > 20 ? 'iLuvKeyks' : storeName,
      description: settings.tagline?.trim() || 'iLuvKeyks Coffee & Tea',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fff8f5',
      theme_color: '#26170c',
      icons: [
        {
          src: iconUrl,
          sizes: '192x192',
          purpose: 'any',
        },
        {
          src: iconUrl,
          sizes: '512x512',
          purpose: 'any',
        },
        {
          src: iconUrl,
          sizes: 'any',
          purpose: 'any',
        },
      ],
    };

    return new Response(JSON.stringify(manifest), {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[AppManifest] Failed to build manifest:', error);
    return new Response(JSON.stringify({
      name: 'iLuvKeyks Coffee & Tea',
      short_name: 'iLuvKeyks',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fff8f5',
      theme_color: '#26170c',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}

export const config: Config = {
  path: '/api/app-manifest',
};
