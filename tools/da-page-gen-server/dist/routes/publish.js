/**
 * /publish & /status routes — HLX Admin publish lifecycle.
 *
 * GET    /status?path=/drafts/foo      check preview/live status
 * POST   /publish                      publish a page  { path }
 * DELETE /publish                      unpublish a page  { path }
 * POST   /publish/bulk                 bulk publish  { paths }
 * DELETE /publish/bulk                 bulk unpublish  { paths }
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as da from '../da/client.js';
export const publish = new Hono();
function resolveStatus(s) {
    if (s.live?.status === 200)
        return 'Published';
    if (s.preview?.status === 200)
        return 'Previewed';
    return 'Draft';
}
// ---------------------------------------------------------------------------
// GET /status?path=/drafts/foo
// ---------------------------------------------------------------------------
publish.get('/status', async (c) => {
    const path = c.req.query('path');
    if (!path)
        return c.json({ error: 'Missing ?path query parameter' }, 400);
    const raw = await da.getPageStatus(path);
    return c.json({ path, status: resolveStatus(raw), live: raw.live, preview: raw.preview });
});
// ---------------------------------------------------------------------------
// POST /publish  { path }
// ---------------------------------------------------------------------------
const singlePathSchema = z.object({ path: z.string() });
publish.post('/', zValidator('json', singlePathSchema), async (c) => {
    const { path } = c.req.valid('json');
    const liveUrl = await da.publishPage(path);
    return c.json({ path, liveUrl });
});
// ---------------------------------------------------------------------------
// DELETE /publish  { path }
// ---------------------------------------------------------------------------
publish.delete('/', zValidator('json', singlePathSchema), async (c) => {
    const { path } = c.req.valid('json');
    await da.unpublishPage(path);
    return c.body(null, 204);
});
// ---------------------------------------------------------------------------
// POST /publish/bulk  { paths }
// ---------------------------------------------------------------------------
const bulkSchema = z.object({ paths: z.array(z.string()) });
publish.post('/bulk', zValidator('json', bulkSchema), async (c) => {
    const { paths } = c.req.valid('json');
    const settled = await Promise.allSettled(paths.map((p) => da.publishPage(p)));
    const results = paths.map((path, i) => {
        const r = settled[i];
        return r.status === 'fulfilled'
            ? { path, success: true, url: r.value }
            : { path, success: false, error: r.reason?.message };
    });
    return c.json(results);
});
// ---------------------------------------------------------------------------
// DELETE /publish/bulk  { paths }
// ---------------------------------------------------------------------------
publish.delete('/bulk', zValidator('json', bulkSchema), async (c) => {
    const { paths } = c.req.valid('json');
    const settled = await Promise.allSettled(paths.map((p) => da.unpublishPage(p)));
    const results = paths.map((path, i) => {
        const r = settled[i];
        return r.status === 'fulfilled'
            ? { path, success: true }
            : { path, success: false, error: r.reason?.message };
    });
    return c.json(results);
});
