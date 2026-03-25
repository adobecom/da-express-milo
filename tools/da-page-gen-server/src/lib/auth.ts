import type { Context } from 'hono';

/**
 * Extract the DA bearer token from the incoming request's Authorization header.
 * Falls back to undefined, letting the DA client use the env DA_TOKEN.
 *
 * UIs that get their token dynamically (e.g. from da.live SDK) should pass it as:
 *   Authorization: Bearer <token>
 */
export function getRequestToken(c: Context): string | undefined {
  const header = c.req.header('authorization');
  if (header?.toLowerCase().startsWith('bearer ')) {
    const tok = header.slice(7).trim();
    if (tok) return tok;
  }
  return undefined;
}
