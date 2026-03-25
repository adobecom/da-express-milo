/**
 * /bindings routes — resolve data records against a binding definition.
 *
 * POST /bindings/resolve
 *   Given records + bindings + destPathPattern, return a display-ready
 *   preview item (destPath + resolved field values) for each record.
 *   No DA calls are made — pure data transformation.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { resolvePreviewItems } from '../lib/bindings.js';
export const bindings = new Hono();
const bindingSchema = z.object({
    token: z.string(),
    dataPath: z.string(),
    transform: z.enum(['none', 'slug', 'uppercase', 'lowercase']).default('none'),
});
const resolveSchema = z.object({
    records: z.array(z.unknown()),
    bindings: z.array(bindingSchema),
    destPathPattern: z.string(),
});
bindings.post('/resolve', zValidator('json', resolveSchema), (c) => {
    const { records, bindings: b, destPathPattern } = c.req.valid('json');
    return c.json(resolvePreviewItems(records, b, destPathPattern));
});
