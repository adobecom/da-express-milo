/**
 * /pages routes — DAAS page management.
 *
 * GET  /pages?root=/drafts/hackathon   list all DAAS pages under a root path
 * GET  /pages/file?path=/drafts/foo    read a single page with extracted DAAS fields
 * PUT  /pages/field                    update a single DAAS field on a page
 * POST /pages/fields/bulk              bulk-update a field across multiple pages
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as da from '../da/client.js';
import { extractDAASFields, getTemplatePath, updateDAASField } from '../lib/html.js';
import { toSourcePath, toWebPath, stripHtml, ensureHtml } from '../lib/paths.js';
export const pages = new Hono();
// ---------------------------------------------------------------------------
// GET /pages — list DAAS pages
// ---------------------------------------------------------------------------
pages.get('/', async (c) => {
    const rootWebPath = c.req.query('root') ?? '/drafts/hackathon';
    const rootSourcePath = toSourcePath(rootWebPath);
    const files = await da.listRecursive(rootSourcePath);
    const htmlFiles = files.filter((f) => f.ext === 'html');
    const settled = await Promise.allSettled(htmlFiles.map(async (f) => {
        const html = await da.getSource(f.path);
        const templatePath = getTemplatePath(html);
        if (!templatePath)
            return null; // not a DAAS-generated page
        const fields = extractDAASFields(html);
        const webPath = stripHtml(toWebPath(f.path));
        return { path: webPath, templatePath, fields, status: 'Draft' };
    }));
    const result = settled
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter((p) => p !== null);
    return c.json(result);
});
// ---------------------------------------------------------------------------
// GET /pages/file?path=/drafts/foo — single page
// ---------------------------------------------------------------------------
pages.get('/file', async (c) => {
    const webPath = c.req.query('path');
    if (!webPath)
        return c.json({ error: 'Missing ?path query parameter' }, 400);
    const sourcePath = ensureHtml(toSourcePath(webPath));
    const html = await da.getSource(sourcePath);
    const templatePath = getTemplatePath(html);
    const fields = extractDAASFields(html);
    return c.json({ path: webPath, templatePath, fields });
});
// ---------------------------------------------------------------------------
// PUT /pages/field — update one field
// ---------------------------------------------------------------------------
const fieldUpdateSchema = z.object({
    path: z.string().describe('Web path of the page, e.g. /drafts/hackathon/my-page'),
    fieldKey: z.string(),
    value: z.string(),
});
pages.put('/field', zValidator('json', fieldUpdateSchema), async (c) => {
    const { path: webPath, fieldKey, value } = c.req.valid('json');
    const sourcePath = ensureHtml(toSourcePath(webPath));
    const html = await da.getSource(sourcePath);
    const updated = updateDAASField(html, fieldKey, value);
    const result = await da.postSource(toSourcePath(webPath), updated);
    return c.json(result);
});
// ---------------------------------------------------------------------------
// POST /pages/fields/bulk — bulk field update
// ---------------------------------------------------------------------------
const bulkFieldSchema = z.object({
    paths: z.array(z.string()),
    fieldKey: z.string(),
    value: z.string(),
});
pages.post('/fields/bulk', zValidator('json', bulkFieldSchema), async (c) => {
    const { paths: webPaths, fieldKey, value } = c.req.valid('json');
    const settled = await Promise.allSettled(webPaths.map(async (webPath) => {
        const sourcePath = ensureHtml(toSourcePath(webPath));
        const html = await da.getSource(sourcePath);
        const updated = updateDAASField(html, fieldKey, value);
        return da.postSource(toSourcePath(webPath), updated);
    }));
    return c.json({
        success: settled.filter((r) => r.status === 'fulfilled').length,
        failed: settled.filter((r) => r.status === 'rejected').length,
        errors: settled
            .map((r, i) => r.status === 'rejected'
            ? { path: webPaths[i], error: r.reason?.message }
            : null)
            .filter(Boolean),
    });
});
