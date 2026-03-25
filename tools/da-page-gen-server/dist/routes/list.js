/**
 * /list routes — directory listing.
 *
 * GET /list/*path               list immediate children
 * GET /list/*path?recursive=1   list all descendants
 */
import { Hono } from 'hono';
import * as da from '../da/client.js';
export const list = new Hono();
list.get('/*', async (c) => {
    const path = `/${c.req.param('*')}`;
    const recursive = c.req.query('recursive') === '1' || c.req.query('recursive') === 'true';
    const entries = recursive ? await da.listRecursive(path) : await da.listDir(path);
    return c.json(entries);
});
