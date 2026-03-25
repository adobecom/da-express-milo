/**
 * /source routes — thin proxy over the DA Source API.
 *
 * GET    /source/*path            read raw file content
 * POST   /source/*path            create / overwrite a file
 * DELETE /source/*path            delete a file or folder
 * POST   /source/folder/*path     create a folder (no extension, no body)
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as da from '../da/client.js';
import { getRequestToken } from '../lib/auth.js';

export const source = new Hono();

source.get('/*', async (c) => {
  const path = `/${c.req.param('*')}`;
  const token = getRequestToken(c);
  const content = await da.getSource(path, token);
  // Preserve original content-type for the caller
  const isHtml = path.endsWith('.html') || !path.includes('.');
  return isHtml ? c.html(content) : c.text(content);
});

const writeSchema = z.object({
  content: z.string(),
  contentType: z.string().optional().default('text/html'),
});

source.post('/folder/*', async (c) => {
  const path = `/${c.req.param('*')}`;
  const token = getRequestToken(c);
  const result = await da.createFolder(path, token);
  return c.json(result, 201);
});

source.post('/*', zValidator('json', writeSchema), async (c) => {
  const path = `/${c.req.param('*')}`;
  const { content, contentType } = c.req.valid('json');
  const token = getRequestToken(c);
  const result = await da.postSource(path, content, contentType, token);
  return c.json(result, 201);
});

source.delete('/*', async (c) => {
  const path = `/${c.req.param('*')}`;
  const token = getRequestToken(c);
  await da.deleteSource(path, token);
  return c.body(null, 204);
});
