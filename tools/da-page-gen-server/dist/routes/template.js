/**
 * /template routes — template inspection helpers.
 *
 * POST /template/resolve
 *   Given a DA page URL or source path, fetch its HTML and return it alongside
 *   all detected [[...]] placeholder tokens.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as da from '../da/client.js';
import { detectPlaceholders } from '../lib/html.js';
import { config } from '../config.js';
export const template = new Hono();
/**
 * Convert a full DA page URL (aem.page / aem.live / da.live) to a DA source path.
 * If the input already looks like a source path (/org/repo/...) it is returned as-is.
 */
function urlToSourcePath(input) {
    if (input.startsWith('/'))
        return input; // already a source path
    try {
        const u = new URL(input);
        let pathname = u.pathname.replace(/\/$/, '') || '/';
        if (!pathname.startsWith('/'))
            pathname = `/${pathname}`;
        const sourcePath = `/${config.org}/${config.repo}${pathname}`;
        return sourcePath.endsWith('.html') ? sourcePath : `${sourcePath}.html`;
    }
    catch {
        throw new Error(`Invalid template URL: ${input}`);
    }
}
const resolveSchema = z.object({
    /** DA page URL (aem.page/aem.live) or full DA source path */
    url: z.string(),
});
template.post('/resolve', zValidator('json', resolveSchema), async (c) => {
    const { url } = c.req.valid('json');
    const sourcePath = urlToSourcePath(url);
    const html = await da.getSource(sourcePath);
    const placeholders = detectPlaceholders(html);
    return c.json({ sourcePath, html, placeholders });
});
