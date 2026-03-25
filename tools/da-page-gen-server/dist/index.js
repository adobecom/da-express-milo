import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { source } from './routes/source.js';
import { list } from './routes/list.js';
import { pages } from './routes/pages.js';
import { publish } from './routes/publish.js';
import { generate } from './routes/generate.js';
import { template } from './routes/template.js';
import { bindings } from './routes/bindings.js';
import { config } from './config.js';
const app = new Hono();
// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());
// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (c) => c.json({
    status: 'ok',
    org: config.org,
    repo: config.repo,
    tokenConfigured: Boolean(config.daToken),
}));
// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.route('/source', source);
app.route('/list', list);
app.route('/pages', pages);
app.route('/publish', publish);
app.route('/generate', generate);
app.route('/template', template);
app.route('/bindings', bindings);
// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
app.onError((err, c) => {
    console.error('[error]', err.message);
    return c.json({ error: err.message }, 500);
});
app.notFound((c) => c.json({ error: `Not found: ${c.req.method} ${c.req.path}` }, 404));
// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
serve({ fetch: app.fetch, port: config.port }, () => {
    console.log(`da-page-gen-server listening on http://localhost:${config.port}`);
    if (!config.daToken) {
        console.warn('[warn] DA_TOKEN is not set — requests will fail until it is configured in .env');
    }
});
export default app;
