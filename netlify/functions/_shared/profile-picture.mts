import { RequestError } from './http.mts';

export const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024;

const IMAGE_SIGNATURES = {
  'image/jpeg': (data: Uint8Array) =>
    data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data: Uint8Array) =>
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a,
  'image/webp': (data: Uint8Array) =>
    data.length >= 12 &&
    String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...data.slice(8, 12)) === 'WEBP',
} as const;

export type AllowedProfilePictureType = keyof typeof IMAGE_SIGNATURES;

export function validateProfilePicture(contentType: string | null, data: Uint8Array): AllowedProfilePictureType {
  const normalizedType = contentType?.split(';', 1)[0].trim().toLowerCase();
  if (!normalizedType || !(normalizedType in IMAGE_SIGNATURES)) {
    throw new RequestError(415, 'Profile pictures must be JPEG, PNG, or WebP images.');
  }
  if (data.length === 0 || data.length > MAX_PROFILE_PICTURE_BYTES) {
    throw new RequestError(413, 'Profile pictures must be no larger than 2 MB.');
  }

  const validator = IMAGE_SIGNATURES[normalizedType as AllowedProfilePictureType];
  if (!validator(data)) {
    throw new RequestError(400, 'The uploaded file does not match its declared image format.');
  }
  return normalizedType as AllowedProfilePictureType;
}
