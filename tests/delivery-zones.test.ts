import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { matchDeliveryZone } from '../netlify/functions/_shared/deliveryZones.mts';

describe('iLuvKeyks delivery-zone matching', () => {
  const zones = [
    { id: 'a', name: 'Broad Tugbok', keywords: ['tugbok'], deliveryFee: 80, freeDeliveryThreshold: 700, priority: 20, active: true },
    { id: 'b', name: 'Deca Homes Tacunan', keywords: ['deca homes', 'tacunan'], deliveryFee: 49, freeDeliveryThreshold: 500, priority: 1, active: true },
    { id: 'c', name: 'Inactive Mintal', keywords: ['mintal'], deliveryFee: 60, freeDeliveryThreshold: 600, priority: 2, active: false },
  ];

  test('normalizes address text and matches a configured keyword', () => {
    const result = matchDeliveryZone(zones, 'Blk 8 Lot 78, DECA HOMES, Tacunan');
    assert.equal(result.zone?.id, 'b');
    assert.equal(result.matchedKeyword, 'deca homes');
  });

  test('uses priority when multiple active zones match', () => {
    const overlapping = [
      { ...zones[0], priority: 10 },
      { ...zones[1], priority: 2 },
    ];
    assert.equal(matchDeliveryZone(overlapping, 'Tacunan / Tugbok').zone?.id, 'b');
  });

  test('ignores inactive zones and returns no match when none apply', () => {
    assert.equal(matchDeliveryZone(zones, 'Mintal').zone, null);
    assert.equal(matchDeliveryZone(zones, 'Buhangin').zone, null);
  });
});
