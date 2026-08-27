const MAX_JSON_BYTES = 64 * 1024;

export class RequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new RequestError(415, 'Content-Type must be application/json.');
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_JSON_BYTES) {
    throw new RequestError(413, 'Request body is too large.');
  }

  const body = await request.text();
  if (Buffer.byteLength(body, 'utf8') > MAX_JSON_BYTES) {
    throw new RequestError(413, 'Request body is too large.');
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new RequestError(400, 'A JSON object is required.');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, 'Invalid JSON request body.');
  }
}

export function enforceSameOrigin(request: Request): void {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') {
    throw new RequestError(403, 'Cross-site request rejected.');
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    throw new RequestError(403, 'Cross-site request rejected.');
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof RequestError) {
    return json({ error: error.message }, error.status);
  }

  console.error('Admin authentication request failed.');
  return json({ error: 'The request could not be completed.' }, 500);
}

export function requireString(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; trim?: boolean } = {},
): string {
  if (typeof value !== 'string') {
    throw new RequestError(400, `${field} is required.`);
  }

  const result = options.trim === false ? value : value.trim();
  const min = options.min ?? 1;
  const max = options.max ?? 255;
  if (result.length < min || result.length > max) {
    throw new RequestError(400, `${field} must be between ${min} and ${max} characters.`);
  }
  return result;
}
