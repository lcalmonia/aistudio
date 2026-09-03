import type { Config } from '@netlify/functions';
import { fetchStoreSettingsFromDatabase } from './_shared/settings.mts';

function getImageMimeType(logoUrl: string): string {
  if (logoUrl.startsWith('data:')) {
    const match = logoUrl.match(/^data:([^;,]+)/);
    return match?.[1] || 'image/webp';
  }

  try {
    const pathname = new URL(logoUrl).pathname.toLowerCase();
    if (pathname.endsWith('.svg')) return 'image/svg+xml';
    if (pathname.endsWith('.png')) return 'image/png';
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
    if (pathname.endsWith('.gif')) return 'image/gif';
    if (pathname.endsWith('.webp')) return 'image/webp';
  } catch {
    // Fall through to the browser-friendly default.
  }

  return 'image/webp';
}

export default async function handler(): Promise<Response> {
  try {
    const settings = await fetchStoreSettingsFromDatabase();
    const version = encodeURIComponent(settings.updatedAt || 'current');
    const appName = settings.storeName?.trim() || 'iLuvKeyks Coffee & Tea';
    const shortName = appName.length > 12 ? appName.slice(0, 12).trim() : appName;
    const iconType = getImageMimeType(settings.logoUrl?.trim() || '');

    const manifest = {
      name: appName,
      short_name: shortName,
      description: settings.tagline || 'Coffee, tea, pastries and more.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fff8f5',
      theme_color: '#26170c',
      icons: [
        {
          src: `/api/app-icon?size=192&v=${version}`,
          sizes: 'any',
          type: iconType,
          purpose: 'any',
        },
        {
          src: `/api/app-icon?size=512&v=${version}`,
          sizes: 'any',
          type: iconType,
          purpose: 'any',
        },
      ],
    };

    return new Response(JSON.stringify(manifest), {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Manifest] Failed to build PWA manifest:', error);
    return new Response(JSON.stringify({
      name: 'iLuvKeyks Coffee & Tea',
      short_name: 'iLuvKeyks',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fff8f5',
      theme_color: '#26170c',
      icons: [],
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
  path: '/manifest.webmanifest',
  method: 'GET',
};
