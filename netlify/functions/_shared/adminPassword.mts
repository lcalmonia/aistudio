import { RequestError } from './http.mts';

export function validateAdminPassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    throw new RequestError(400, 'Admin password must be between 6 and 128 characters.');
  }
  return password;
}
