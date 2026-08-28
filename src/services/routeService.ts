/**
 * Application Route & URL Synchronization Service
 * 
 * Provides deep-linking, browser history management, URL-to-state parsing,
 * and state-to-URL synchronization for Public, Customer, and Admin/Super Admin portals.
 */

export type PortalMode = 'public' | 'customer' | 'admin';

export interface AppRouteState {
  portalMode: PortalMode;
  adminTab: string;
  pathname: string;
}

export const ADMIN_TAB_ROUTES: Record<string, string> = {
  'home': '/admin/dashboard',
  'dashboard': '/admin/dashboard',
  'admin-menu': '/admin/menu',
  'menu': '/admin/menu',
  'orders': '/admin/orders',
  'active-orders': '/admin/orders',
  'customers': '/admin/customers',
  'accounts': '/admin/accounts',
  'admin-accounts': '/admin/admin-accounts',
  'inventory': '/admin/inventory',
  'stock': '/admin/inventory',
  'stats': '/admin/stats',
  'analytics': '/admin/stats',
  'reports': '/admin/stats',
  'settings': '/admin/settings',
  'rewards': '/admin/rewards',
  'loyalty': '/admin/rewards',
  'profile': '/admin/profile',
};

/**
 * Maps an admin tab identifier to its clean browser URL path.
 */
export function getAdminPathForTab(tab: string): string {
  if (tab === 'home' || tab === 'dashboard') return '/admin/dashboard';
  if (tab === 'admin-menu' || tab === 'menu') return '/admin/menu';
  if (tab === 'orders') return '/admin/orders';
  if (tab === 'customers') return '/admin/customers';
  if (tab === 'accounts') return '/admin/accounts';
  if (tab === 'admin-accounts') return '/admin/admin-accounts';
  if (tab === 'inventory' || tab === 'stock') return '/admin/inventory';
  if (tab === 'stats' || tab === 'analytics') return '/admin/stats';
  if (tab === 'settings') return '/admin/settings';
  if (tab === 'rewards' || tab === 'loyalty') return '/admin/rewards';
  if (tab === 'profile') return '/admin/profile';
  return `/admin/${tab}`;
}

/**
 * Parses the current browser URL pathname into portalMode and adminTab.
 */
export function parseRouteFromPath(rawPathname?: string): AppRouteState {
  const path = (rawPathname !== undefined ? rawPathname : (typeof window !== 'undefined' ? window.location.pathname : '/'))
    .trim()
    .toLowerCase();

  // Normalize path by removing trailing slash if not root
  const cleanPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  // 1. Customer portal routes
  if (cleanPath === '/customer' || cleanPath === '/order' || cleanPath === '/ordering' || cleanPath.startsWith('/customer/')) {
    return {
      portalMode: 'customer',
      adminTab: 'admin-menu',
      pathname: cleanPath,
    };
  }

  // 2. Admin & Super Admin routes
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
    const subRoute = cleanPath.replace(/^\/admin\/?/, '').trim();

    let resolvedTab = 'admin-menu'; // sensible default if just /admin

    if (!subRoute || subRoute === 'home' || subRoute === 'dashboard') {
      resolvedTab = subRoute ? 'home' : 'admin-menu';
    } else if (subRoute === 'menu' || subRoute === 'admin-menu' || subRoute === 'products') {
      resolvedTab = 'admin-menu';
    } else if (subRoute === 'orders' || subRoute === 'active-orders' || subRoute === 'kds' || subRoute === 'queue') {
      resolvedTab = 'orders';
    } else if (subRoute === 'customers' || subRoute === 'directory') {
      resolvedTab = 'customers';
    } else if (subRoute === 'accounts' || subRoute === 'staff' || subRoute === 'admin-accounts') {
      resolvedTab = 'accounts';
    } else if (subRoute === 'inventory' || subRoute === 'stock') {
      resolvedTab = 'inventory';
    } else if (subRoute === 'stats' || subRoute === 'analytics' || subRoute === 'reports') {
      resolvedTab = 'stats';
    } else if (subRoute === 'settings' || subRoute === 'store-settings') {
      resolvedTab = 'settings';
    } else if (subRoute === 'rewards' || subRoute === 'loyalty') {
      resolvedTab = 'rewards';
    } else if (subRoute === 'profile' || subRoute === 'equipment' || subRoute === 'machine') {
      resolvedTab = 'profile';
    } else {
      // Fallback for custom or direct subroutes
      resolvedTab = subRoute;
    }

    return {
      portalMode: 'admin',
      adminTab: resolvedTab,
      pathname: cleanPath,
    };
  }

  // 3. Public landing page route
  return {
    portalMode: 'public',
    adminTab: 'admin-menu',
    pathname: '/',
  };
}

/**
 * Updates the browser address bar without a full page reload.
 */
export function syncBrowserUrl(portalMode: PortalMode, adminTab?: string, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  let targetUrl = '/';
  if (portalMode === 'customer') {
    targetUrl = '/customer';
  } else if (portalMode === 'admin') {
    targetUrl = getAdminPathForTab(adminTab || 'admin-menu');
  }

  const currentPath = window.location.pathname;
  if (currentPath !== targetUrl) {
    if (replace) {
      window.history.replaceState({ portalMode, adminTab, targetUrl }, '', targetUrl);
    } else {
      window.history.pushState({ portalMode, adminTab, targetUrl }, '', targetUrl);
    }
  }
}
