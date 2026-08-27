/**
 * Cryptographically random, collision-resistant ID and reference number generators.
 * Prevents reliance on array lengths or predictable sequence counters.
 */

export function generateRandomHex(length: number = 8): string {
  const chars = '0123456789abcdef';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateCustomerId(): string {
  const timestamp = Date.now().toString(36).slice(-4);
  const randomHex = generateRandomHex(4);
  return `CUST-${timestamp.toUpperCase()}${randomHex.toUpperCase()}`;
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomHex = generateRandomHex(4);
  return `ord_${timestamp}_${randomHex}`;
}

export function generateOrderNumber(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `ILK-${randomDigits}`;
}

export function generateEntityId(prefix: string = 'ent'): string {
  const timestamp = Date.now().toString(36);
  const randomHex = generateRandomHex(4);
  return `${prefix}_${timestamp}_${randomHex}`;
}
