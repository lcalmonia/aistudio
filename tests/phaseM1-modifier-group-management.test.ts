import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ModifierCategory, ProductAddon } from '../src/types';
import { requireSuperAdmin, AuthenticatedAdmin } from '../netlify/functions/_shared/auth.mts';
import { RequestError } from '../netlify/functions/_shared/http.mts';
import {
  mapModifierCategoryRecord,
  mapAddonRecord,
} from '../netlify/functions/_shared/catalog.mts';

describe('Phase M-1: Modifier Group & Category Management', () => {
  const superAdminUser: AuthenticatedAdmin = {
    id: 'admin-super-1',
    username: 'superadmin',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    isAdmin: true,
    isSuperAdmin: true,
  };

  const regularAdminUser: AuthenticatedAdmin = {
    id: 'admin-staff-1',
    username: 'barista_admin',
    name: 'Shift Admin',
    role: 'ADMIN',
    isAdmin: true,
    isSuperAdmin: false,
  };

  describe('1. Role Authorization Enforcement', () => {
    it('allows SUPER_ADMIN to perform modifier group mutations', () => {
      assert.doesNotThrow(() => {
        requireSuperAdmin(superAdminUser);
      });
    });

    it('rejects ADMIN from modifying modifier groups with 403 Forbidden', () => {
      assert.throws(
        () => {
          requireSuperAdmin(regularAdminUser);
        },
        (err: any) => {
          assert.equal(err instanceof RequestError, true);
          assert.equal(err.status, 403);
          assert.match(err.message, /Super Admin access required/i);
          return true;
        }
      );
    });

    it('rejects unauthenticated requests with 403 Forbidden', () => {
      assert.throws(
        () => {
          requireSuperAdmin(null);
        },
        (err: any) => {
          assert.equal(err instanceof RequestError, true);
          assert.equal(err.status, 403);
          return true;
        }
      );
    });
  });

  describe('2. Modifier Category Record Mapping & Schema Structure', () => {
    it('correctly maps a database row into a ModifierCategory model', () => {
      const dbRow = {
        id: 'modcat-sweetness',
        name: 'Sweetness Level',
        item_type: 'modifier',
        required: true,
        selection_type: 'single',
        applicable_categories: ['Coffee', 'Milk Tea', 'Matcha'],
        applicable_temperature: 'Both',
        sort_order: 1,
        active: true,
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-02'),
      };

      const mapped = mapModifierCategoryRecord(dbRow);
      assert.equal(mapped.id, 'modcat-sweetness');
      assert.equal(mapped.name, 'Sweetness Level');
      assert.equal(mapped.itemType, 'modifier');
      assert.equal(mapped.required, true);
      assert.equal(mapped.selectionType, 'single');
      assert.deepEqual(mapped.applicableCategories, ['Coffee', 'Milk Tea', 'Matcha']);
      assert.equal(mapped.applicableTemperature, 'Both');
      assert.equal(mapped.sortOrder, 1);
      assert.equal(mapped.active, true);
    });

    it('handles legacy category records gracefully with sensible defaults', () => {
      const legacyRow = {
        id: 'modcat-legacy',
        name: 'Syrups',
        item_type: null,
        required: null,
        selection_type: null,
        applicable_categories: null,
        applicable_temperature: null,
        sort_order: 0,
        active: true,
      };

      const mapped = mapModifierCategoryRecord(legacyRow);
      assert.equal(mapped.itemType, 'modifier');
      assert.equal(mapped.required, false);
      assert.equal(mapped.selectionType, 'single');
      assert.deepEqual(mapped.applicableCategories, []);
      assert.equal(mapped.applicableTemperature, 'Both');
    });
  });

  describe('3. Category Deletion Dependency Safety Logic', () => {
    const existingCategories: ModifierCategory[] = [
      {
        id: 'modcat-sweetness',
        name: 'Sweetness Level',
        itemType: 'modifier',
        required: true,
        selectionType: 'single',
        active: true,
      },
      {
        id: 'modcat-empty-group',
        name: 'Empty Modifier Group',
        itemType: 'modifier',
        required: false,
        selectionType: 'single',
        active: true,
      },
    ];

    const sampleAddons: ProductAddon[] = [
      {
        id: 'opt-sweet-100',
        name: '100% Regular Sweet',
        category: 'Sweetness Level',
        itemType: 'modifier',
        price: 0,
        available: true,
      },
      {
        id: 'opt-sweet-50',
        name: '50% Less Sweet',
        category: 'Sweetness Level',
        itemType: 'modifier',
        price: 0,
        available: true,
      },
    ];

    it('identifies dependent options when trying to delete an in-use category', () => {
      const targetCat = existingCategories[0]; // Sweetness Level
      const catKey = targetCat.name.trim().toLowerCase();
      const dependentOptions = sampleAddons.filter(
        (a) => (a.category || '').trim().toLowerCase() === catKey
      );

      assert.equal(dependentOptions.length, 2);
      assert.equal(dependentOptions[0].name, '100% Regular Sweet');
    });

    it('identifies 0 dependent options for an unassigned category, allowing safe deletion', () => {
      const targetCat = existingCategories[1]; // Empty Modifier Group
      const catKey = targetCat.name.trim().toLowerCase();
      const dependentOptions = sampleAddons.filter(
        (a) => (a.category || '').trim().toLowerCase() === catKey
      );

      assert.equal(dependentOptions.length, 0);
    });
  });

  describe('4. Add-on & Modifier Option Record Mapping', () => {
    it('correctly maps an Addon record with modifier properties', () => {
      const dbRow = {
        id: 'addon-vanilla',
        name: 'Vanilla Syrup (2 pumps)',
        category: 'Syrups & Sweeteners',
        item_type: 'addon',
        price: '25.00',
        available: true,
        required: false,
        selection_type: 'multiple',
        applicable_temperature: 'Both',
        applicable_categories: ['Coffee', 'Non-Coffee'],
        sort_order: 2,
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-02'),
      };

      const mapped = mapAddonRecord(dbRow);
      assert.equal(mapped.id, 'addon-vanilla');
      assert.equal(mapped.name, 'Vanilla Syrup (2 pumps)');
      assert.equal(mapped.category, 'Syrups & Sweeteners');
      assert.equal(mapped.itemType, 'addon');
      assert.equal(mapped.price, 25);
      assert.equal(mapped.available, true);
      assert.deepEqual(mapped.applicableCategories, ['Coffee', 'Non-Coffee']);
    });
  });
});
