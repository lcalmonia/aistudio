import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { RequestError } from './http.mts';

const KEY_LENGTH = 64;
const COST = 32768;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(
  password: string,
  salt: Uint8Array,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new RequestError(400, 'Password must be between 12 and 128 characters.');
  }
  return password;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });

  return [
    'scrypt',
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, costValue, blockSizeValue, parallelizationValue, saltValue, hashValue] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;

  const cost = Number(costValue);
  const blockSize = Number(blockSizeValue);
  const parallelization = Number(parallelizationValue);
  if (!Number.isSafeInteger(cost) || !Number.isSafeInteger(blockSize) || !Number.isSafeInteger(parallelization)) {
    return false;
  }

  try {
    const storedHash = Buffer.from(hashValue, 'base64url');
    const derivedKey = await deriveKey(password, Buffer.from(saltValue, 'base64url'), storedHash.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: MAX_MEMORY,
    });
    return storedHash.length === derivedKey.length && timingSafeEqual(storedHash, derivedKey);
  } catch {
    return false;
  }
}
