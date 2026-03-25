/**
 * /generate routes — template-based page generation.
 *
 * POST /generate
 *   Fetch a template HTML from DA, fill fields via [[placeholder]] and/or
 *   data-daas-key attributes, then POST the result to a new DA path.
 *
 * POST /generate/pdp
 *   PDP-specific shortcut: fetch product data from Zazzle by templateId,
 *   fill the PDP template, and save the page to DA.
 *
 * POST /generate/daas
 *   DAAS-style generation: reads a template, stamps data-daas-template-path
 *   onto the body, fills data-daas-key fields, and saves to DA.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import * as da from '../da/client.js';
import { fillTemplate, fillPlaceholders, applyDAASFields } from '../lib/html.js';
import { toSourcePath, ensureHtml } from '../lib/paths.js';
import { resolveFields, resolveDestPattern } from '../lib/bindings.js';
import { config } from '../config.js';
export const generate = new Hono();
const DEFAULT_PDP_TEMPLATE = '/adobecom/da-express-milo/drafts/jingle/pdp-page-gen/template';
// ---------------------------------------------------------------------------
// POST /generate — generic template fill
// ---------------------------------------------------------------------------
const generateSchema = z.object({
    /** Full DA source path to the template (org/repo/path) */
    templateSourcePath: z.string(),
    /** Web path for the output document — org/repo will be prepended */
    destPath: z.string(),
    /** Key→value map applied as [[key]] placeholders AND data-daas-key elements */
    fields: z.record(z.string()),
});
generate.post('/', zValidator('json', generateSchema), async (c) => {
    const { templateSourcePath, destPath, fields } = c.req.valid('json');
    const templateHtml = await da.getSource(ensureHtml(templateSourcePath));
    const populated = fillTemplate(templateHtml, fields);
    const sourceDest = toSourcePath(destPath);
    const result = await da.postSource(sourceDest, populated);
    return c.json({
        destPath,
        editUrl: result.source?.editUrl,
        previewUrl: result.aem?.previewUrl,
        liveUrl: result.aem?.liveUrl,
    }, 201);
});
// ---------------------------------------------------------------------------
// POST /generate/pdp — Zazzle PDP page generation
// ---------------------------------------------------------------------------
const pdpSchema = z.object({
    /** Zazzle template ID */
    templateId: z.string(),
    /** Override the default PDP template source path */
    templateSourcePath: z.string().optional(),
    /** Web path for the output doc */
    destPath: z.string(),
});
generate.post('/pdp', zValidator('json', pdpSchema), async (c) => {
    const { templateId, templateSourcePath, destPath } = c.req.valid('json');
    // Fetch product metadata from Zazzle via proxy (avoids CORS)
    const zazzleUrl = `https://www.zazzle.com/svc/partner/adobeexpress/v1/getproductfromtemplate?templateId=${encodeURIComponent(templateId)}`;
    const proxyUrl = `${config.zazzleProxy}?url=${encodeURIComponent(zazzleUrl)}`;
    const productRes = await fetch(proxyUrl);
    if (!productRes.ok)
        throw new Error(`Zazzle API error: HTTP ${productRes.status}`);
    const productData = (await productRes.json());
    const title = productData.product?.title ?? '';
    const description = productData.product?.description ?? '';
    const tplPath = templateSourcePath ?? DEFAULT_PDP_TEMPLATE;
    const templateHtml = await da.getSource(ensureHtml(tplPath));
    const populated = fillPlaceholders(templateHtml, {
        title,
        description,
        'template-id': templateId,
    });
    const sourceDest = toSourcePath(destPath);
    const result = await da.postSource(sourceDest, populated);
    return c.json({
        destPath,
        title,
        description,
        editUrl: result.source?.editUrl,
        previewUrl: result.aem?.previewUrl,
        liveUrl: result.aem?.liveUrl,
    }, 201);
});
// ---------------------------------------------------------------------------
// POST /generate/daas — DAAS-style page generation
// ---------------------------------------------------------------------------
const daasSchema = z.object({
    /** Full DA source path to the template */
    templateSourcePath: z.string(),
    /** Web path for the output doc */
    destPath: z.string(),
    /** DAAS field values keyed by data-daas-key */
    fields: z.record(z.string()),
});
generate.post('/daas', zValidator('json', daasSchema), async (c) => {
    const { templateSourcePath, destPath, fields } = c.req.valid('json');
    const templateHtml = await da.getSource(ensureHtml(templateSourcePath));
    // Stamp the template origin onto the body so DAAS dashboard can identify it
    const dom = new JSDOM(templateHtml);
    dom.window.document.body.setAttribute('data-daas-template-path', templateSourcePath);
    // Apply field values to data-daas-key elements
    const withMeta = dom.serialize();
    const populated = applyDAASFields(withMeta, fields);
    const sourceDest = toSourcePath(destPath);
    const result = await da.postSource(sourceDest, populated);
    return c.json({
        destPath,
        templatePath: templateSourcePath,
        editUrl: result.source?.editUrl,
        previewUrl: result.aem?.previewUrl,
        liveUrl: result.aem?.liveUrl,
    }, 201);
});
// ---------------------------------------------------------------------------
// POST /generate/batch — bulk page generation from a pre-fetched template
// ---------------------------------------------------------------------------
/**
 * Each item supplies:
 *  - `destPath`: web path (org/repo prepended by server)
 *  - `fields`: token→value map where keys are the EXACT tokens in the HTML
 *    e.g. `{ "[[title]]": "My Product", "[[description]]": "Great item" }`
 *
 * The server fetches the template ONCE, then fills + posts each item.
 * Results are returned in the same order as `items`.
 */
const batchSchema = z.object({
    templateSourcePath: z.string(),
    items: z.array(z.object({
        destPath: z.string(),
        fields: z.record(z.string()),
    })),
});
generate.post('/batch', zValidator('json', batchSchema), async (c) => {
    const { templateSourcePath, items } = c.req.valid('json');
    const templateHtml = await da.getSource(ensureHtml(templateSourcePath));
    const settled = await Promise.allSettled(items.map(async ({ destPath, fields }) => {
        const populated = fillTemplate(templateHtml, fields);
        const sourceDest = toSourcePath(destPath);
        const result = await da.postSource(sourceDest, populated);
        return {
            destPath,
            editUrl: result.source?.editUrl,
            previewUrl: result.aem?.previewUrl,
            liveUrl: result.aem?.liveUrl,
        };
    }));
    const results = settled.map((r, i) => r.status === 'fulfilled'
        ? { ...r.value, success: true }
        : { destPath: items[i].destPath, success: false, error: r.reason?.message });
    return c.json(results, 207);
});
// ---------------------------------------------------------------------------
// POST /generate/from-bindings — full pipeline: raw records → generated pages
// ---------------------------------------------------------------------------
/**
 * Accepts raw data records + binding definition + dest pattern.
 * The server resolves every record, fills the template, and posts each page.
 * No pre-processing needed from the caller.
 */
const fromBindingsSchema = z.object({
    templateSourcePath: z.string(),
    records: z.array(z.unknown()),
    bindings: z.array(z.object({
        token: z.string(),
        dataPath: z.string(),
        transform: z.enum(['none', 'slug', 'uppercase', 'lowercase']).default('none'),
    })),
    destPathPattern: z.string(),
});
generate.post('/from-bindings', zValidator('json', fromBindingsSchema), async (c) => {
    const { templateSourcePath, records, bindings, destPathPattern } = c.req.valid('json');
    const templateHtml = await da.getSource(ensureHtml(templateSourcePath));
    const settled = await Promise.allSettled(records.map(async (record) => {
        const destPath = resolveDestPattern(destPathPattern, record);
        const fields = resolveFields(bindings, record);
        const populated = fillTemplate(templateHtml, fields);
        const result = await da.postSource(toSourcePath(destPath), populated);
        return { destPath, editUrl: result.source?.editUrl, liveUrl: result.aem?.liveUrl };
    }));
    return c.json(settled.map((r, i) => r.status === 'fulfilled'
        ? { ...r.value, success: true }
        : {
            destPath: resolveDestPattern(destPathPattern, records[i]),
            success: false,
            error: r.reason?.message,
        }), 207);
});
