/**
 * /template routes — template inspection helpers.
 *
 * POST /template/resolve
 *   Given a DA page URL or source path, fetch its HTML and return it alongside
 *   all detected [[...]] placeholder tokens.
 *
 *   Accepts AEM CDN URLs (branch--repo--org.aem.page), da.live URLs,
 *   or bare source paths (/org/repo/...). Org/repo is extracted from the URL
 *   when possible; falls back to DA_ORG / DA_REPO env vars.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as da from '../da/client.js';
import { detectPlaceholders } from '../lib/html.js';
import { parseAemUrl, ensureHtml } from '../lib/paths.js';
import { config } from '../config.js';
import { getRequestToken } from '../lib/auth.js';

export const template = new Hono();

/**
 * Convert a URL or path to a DA source path.
 *
 * - Already a source path (/org/repo/...) → returned as-is
 * - AEM CDN URL (branch--repo--org.aem.page) → org+repo extracted from subdomain
 * - Any other URL → org/repo taken from config, pathname appended
 */
function urlToSourcePath(input: string): string {
  if (input.startsWith('/')) return ensureHtml(input);

  try {
    const aem = parseAemUrl(input);
    if (aem) {
      return ensureHtml(`/${aem.org}/${aem.repo}${aem.pathname}`);
    }
    // Non-AEM URL (e.g. da.live/#/… or a plain https domain): use config org/repo
    const u = new URL(input);
    const pathname = u.pathname.replace(/\/$/, '') || '/';
    return ensureHtml(`/${config.org}/${config.repo}${pathname}`);
  } catch {
    throw new Error(`Invalid template URL: ${input}`);
  }
}

const resolveSchema = z.object({
  /** DA page URL (aem.page / aem.live / da.live) or full DA source path */
  url: z.string(),
});

template.post('/resolve', zValidator('json', resolveSchema), async (c) => {
  const { url } = c.req.valid('json');
  const token = getRequestToken(c);
  const sourcePath = urlToSourcePath(url);
  const html = await da.getSource(sourcePath, token);
  const placeholders = detectPlaceholders(html);
  return c.json({ sourcePath, html, placeholders });
});
