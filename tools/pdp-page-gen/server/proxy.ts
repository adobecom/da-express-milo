import Koa, { type Context, type Middleware } from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';

const PROXY_PORT = 3002;
const ZAZZLE_BASE = 'https://www.zazzle.com/svc/partner/adobeexpress/v1';

const app = new Koa();
const router = new Router() as InstanceType<typeof Router> & {
  get(path: string, handler: (ctx: Context) => Promise<void>): InstanceType<typeof Router>;
  routes(): Middleware;
  allowedMethods(): Middleware;
};

router.get('/api/product-from-template', async (ctx: Context): Promise<void> => {
  const templateId = ctx.query.templateId;
  if (!templateId || typeof templateId !== 'string') {
    ctx.status = 400;
    ctx.body = { error: 'Missing or invalid templateId query parameter' };
    return;
  }
  const url = `${ZAZZLE_BASE}/getproductfromtemplate?templateId=${encodeURIComponent(templateId)}`;
  try {
    const res = await fetch(url);
    const json = (await res.json()) as { data?: unknown };
    ctx.status = res.status;
    ctx.body = json;
  } catch (err) {
    ctx.status = 502;
    ctx.body = { error: 'Proxy request failed', details: String(err) };
  }
});

app.use(cors({ origin: '*' }) as Middleware);
app.use(router.routes() as Middleware);
app.use(router.allowedMethods() as Middleware);

app.listen(PROXY_PORT, () => {
  console.log(`Proxy server running at http://localhost:${PROXY_PORT}`);
  console.log(`  GET /api/product-from-template?templateId=<id>`);
});
