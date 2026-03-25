import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(optional('PORT', '3001')),
  /** DA IMS token — required for all DA / HLX admin calls */
  daToken: optional('DA_TOKEN', ''),
  org: optional('DA_ORG', 'adobecom'),
  repo: optional('DA_REPO', 'da-express-milo'),
  daAdminBase: 'https://admin.da.live',
  hlxAdminBase: 'https://admin.hlx.page',
  /** Proxy used to bypass Zazzle CORS from server-side */
  zazzleProxy: optional('ZAZZLE_PROXY', 'https://proxy-worker.jingleh12345.workers.dev/proxy'),
} as const;

export type Config = typeof config;
