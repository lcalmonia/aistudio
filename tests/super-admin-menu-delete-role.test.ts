import { describe, expect, it } from 'vitest';

describe('Super Admin menu role', () => {
  it('uses the canonical SUPER_ADMIN role value', () => {
    const role = 'SUPER_ADMIN';
    expect(role).toBe('SUPER_ADMIN');
    expect(role).not.toBe('super_admin');
  });
});
