/**
 * /data routes — fetch structured records from external data sources.
 *
 * These endpoints decouple "fetch data" from "generate pages", so UIs can
 * preview records before committing to generation.
 *
 * POST /data/zazzle
 *   Fetch product records from the Zazzle partner API by template ID.
 *   Returns an array of records ready to pass to /bindings/resolve or
 *   /generate/from-bindings.
 *
 * POST /data/fetch
 *   Generic JSON fetch: fetch any URL that returns a JSON array or object
 *   and return it as an array of records. Useful for fetching from a CMS,
 *   spreadsheet endpoint, or any REST API the caller can reach.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { config } from '../config.js';

export const data = new Hono();

// ---------------------------------------------------------------------------
// POST /data/zazzle — fetch Zazzle product records by template ID
// ---------------------------------------------------------------------------

/**
 * Input: array of Zazzle template IDs.
 * Output: array of records with { templateId, title, description }.
 *
 * Each record is suitable for use with /generate/from-bindings using bindings:
 *   [[title]]        → title
 *   [[description]]  → description
 *   [[template-id]]  → templateId
 */
const zazzleSchema = z.object({
  templateIds: z.array(z.string()).min(1),
});

data.post('/zazzle', zValidator('json', zazzleSchema), async (c) => {
  const { templateIds } = c.req.valid('json');

  const settled = await Promise.allSettled(
    templateIds.map(async (templateId) => {
      const zazzleUrl = `https://www.zazzle.com/svc/partner/adobeexpress/v1/getproductfromtemplate?templateId=${encodeURIComponent(templateId)}`;
      const proxyUrl = `${config.zazzleProxy}?url=${encodeURIComponent(zazzleUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Zazzle API error for ${templateId}: HTTP ${res.status}`);
      const json = (await res.json()) as { product?: { title?: string; description?: string } };
      return {
        templateId,
        title: json.product?.title ?? '',
        description: json.product?.description ?? '',
      };
    }),
  );

  const records = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? { ...r.value, _error: undefined }
      : { templateId: templateIds[i]!, title: '', description: '', _error: (r as PromiseRejectedResult).reason?.message as string },
  );

  return c.json({ records }, 207);
});

// ---------------------------------------------------------------------------
// POST /data/fetch — generic JSON array fetch
// ---------------------------------------------------------------------------

/**
 * Fetches any URL that returns a JSON array (or wraps a single object in an array).
 * Useful for CMS JSON endpoints, AEM content APIs, spreadsheet exports, etc.
 *
 * Input:  { url: string, arrayPath?: string }
 *   arrayPath — optional dot-notation path into the response to find the array,
 *               e.g. "data" for { data: [...] } or "items.results" for nested.
 * Output: { records: unknown[] }
 */
const fetchSchema = z.object({
  url: z.string().url(),
  /** Dot-notation path into the JSON response to find the records array. */
  arrayPath: z.string().optional(),
});

data.post('/fetch', zValidator('json', fetchSchema), async (c) => {
  const { url, arrayPath } = c.req.valid('json');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status} — ${url}`);

  let json: unknown = await res.json();

  // Navigate to the nested array if arrayPath is specified
  if (arrayPath) {
    for (const part of arrayPath.split('.')) {
      if (json == null || typeof json !== 'object') break;
      json = (json as Record<string, unknown>)[part];
    }
  }

  const records = Array.isArray(json) ? json : [json];
  return c.json({ records });
});
