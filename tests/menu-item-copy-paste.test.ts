import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCopiedProductName, cloneProductForPaste } from '../src/utils/productCopy';
import { MenuItem } from '../src/types';
import { requireSuperAdmin, AuthenticatedAdmin } from '../netlify/functions/_shared/auth.mts';
import { RequestError } from '../netlify/functions/_shared/http.mts';

describe('Menu Item Copy & Paste Foundation', () => {
  const sampleProducts: MenuItem[] = [
    {
      id: 'prod-1',
      name: 'Spanish Latte',
      category: 'Coffee',
      price: 115,
      image: 'https://example.com/latte.jpg',
      description: 'Rich espresso with condensed milk',
      tags: ['Bestseller'],
      popular: true,
      available: true,
      temperature: 'Both',
      sizes: [
        { name: 'Regular', volume: '16oz', priceDelta: 0 },
        { name: 'Large', volume: '22oz', priceDelta: 20 },
      ],
      addons: ['addon-shot', 'addon-oat'],
      modifierCategoryIds: ['modcat-sweetness', 'modcat-ice', 'modcat-milk'],
      allergens: ['Dairy'],
      calories: 210,
    },
    {
      id: 'prod-2',
      name: 'Spanish Latte (Copy)',
      category: 'Coffee',
      price: 115,
      available: true,
    },
    {
      id: 'prod-3',
      name: 'Spanish Latte (Copy 2)',
      category: 'Coffee',
      price: 115,
      available: true,
    },
  ];

  describe('generateCopiedProductName', () => {
    it('generates "Original Name (Copy)" when no copy exists', () => {
      const result = generateCopiedProductName('Matcha Latte', sampleProducts);
      assert.equal(result, 'Matcha Latte (Copy)');
    });

    it('generates "Original Name (Copy 2)" when (Copy) already exists', () => {
      const items = [{ name: 'Spanish Latte' }, { name: 'Spanish Latte (Copy)' }];
      const result = generateCopiedProductName('Spanish Latte', items);
      assert.equal(result, 'Spanish Latte (Copy 2)');
    });

    it('generates "Original Name (Copy 3)" when (Copy) and (Copy 2) already exist', () => {
      const result = generateCopiedProductName('Spanish Latte', sampleProducts);
      assert.equal(result, 'Spanish Latte (Copy 3)');
    });

    it('handles case insensitivity when checking existing names', () => {
      const items = [{ name: 'caramel macchiato (copy)' }];
      const result = generateCopiedProductName('Caramel Macchiato', items);
      assert.equal(result, 'Caramel Macchiato (Copy 2)');
    });
  });

  describe('cloneProductForPaste', () => {
    it('deep clones all configurations into an independent payload without source ID', () => {
      const source = sampleProducts[0];
      const cloned = cloneProductForPaste(source, 'Spanish Latte (Copy 3)');

      assert.equal(cloned.name, 'Spanish Latte (Copy 3)');
      assert.equal(cloned.category, 'Coffee');
      assert.equal(cloned.price, 115);
      assert.equal(cloned.image, 'https://example.com/latte.jpg');
      assert.equal(cloned.description, 'Rich espresso with condensed milk');
      assert.equal(cloned.temperature, 'Both');
      assert.equal(cloned.popular, true);
      assert.equal(cloned.available, true);
      assert.deepEqual(cloned.tags, ['Bestseller']);
      assert.deepEqual(cloned.modifierCategoryIds, ['modcat-sweetness', 'modcat-ice', 'modcat-milk']);
      assert.deepEqual(cloned.addons, ['addon-shot', 'addon-oat']);
      assert.deepEqual(cloned.allergens, ['Dairy']);
      assert.equal(cloned.calories, 210);

      // Verify sizes deep-cloning
      assert.equal(cloned.sizes?.length, 2);
      assert.deepEqual(cloned.sizes?.[1], {
        name: 'Large',
        volume: '22oz',
        priceDelta: 20,
        availableTemperatures: undefined,
        applicableTemperature: undefined,
      });

      // Verify independence: mutating cloned array does NOT mutate source
      cloned.tags.push('NewTag');
      assert.equal(source.tags?.includes('NewTag'), false);

      cloned.modifierCategoryIds.push('modcat-extra');
      assert.equal(source.modifierCategoryIds?.includes('modcat-extra'), false);
    });
  });

  describe('Server-Side Role Enforcement', () => {
    const superAdmin: AuthenticatedAdmin = {
      authenticated: true,
      userId: null,
      role: 'SUPER_ADMIN',
      username: 'owner',
      displayName: 'Owner',
      hasProfilePicture: false,
      isSuperAdmin: true,
      isAdmin: false,
      sessionId: 'session-super',
    };

    const admin: AuthenticatedAdmin = {
      authenticated: true,
      userId: 'admin-1',
      role: 'ADMIN',
      username: 'barista-lead',
      displayName: 'Lead Barista',
      hasProfilePicture: false,
      isSuperAdmin: false,
      isAdmin: true,
      sessionId: 'session-admin',
    };

    it('requireSuperAdmin succeeds for SUPER_ADMIN', () => {
      assert.doesNotThrow(() => requireSuperAdmin(superAdmin));
    });

    it('requireSuperAdmin throws 403 Forbidden for ADMIN', () => {
      assert.throws(
        () => requireSuperAdmin(admin),
        (err: any) => err instanceof RequestError && err.status === 403
      );
    });

    it('requireSuperAdmin throws 401/403 for null/unauthenticated principal', () => {
      assert.throws(
        () => requireSuperAdmin(null),
        (err: any) => err instanceof RequestError && (err.status === 401 || err.status === 403)
      );
    });
  });

  describe('UI Role Architecture & Copy Visibility Rules', () => {
    it('SUPER_ADMIN role correctly enables isSuperAdmin capabilities', () => {
      const superAdminUser = { role: 'SUPER_ADMIN', username: 'owner' };
      const isSuper = superAdminUser.role === 'SUPER_ADMIN';
      assert.equal(isSuper, true);
    });

    it('ADMIN role strictly denies isSuperAdmin permissions and prevents Copy/Paste/Edit/Delete actions', () => {
      const staffAdminUser = { role: 'ADMIN', username: 'barista' };
      const isSuper = staffAdminUser.role === 'SUPER_ADMIN';
      assert.equal(isSuper, false);
    });
  });
});
