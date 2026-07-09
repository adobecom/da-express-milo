/**
 * Shared DA crawl + block-detection helpers.
 * Used by scripts/crawl-affected.mjs, scripts/select-affected.mjs, and the
 * integration test. Keeping these in one place means the test exercises the
 * exact functions production uses.
 */

// Special containers that are not renderable blocks.
export const EXCLUDE_BLOCKS = new Set(['section-metadata', 'metadata']);

/**
 * Extract the set of block names authored on a DA page.
 * Blocks are `<div class="block-name variant...">`; the first class token is the
 * block name. Handles both raw HTML and JSON-string-escaped content (as some
 * DA endpoints return).
 * @param {string} rawContent
 * @returns {Set<string>}
 */
export function extractBlocks(rawContent) {
  let html = rawContent;
  if (html.trimStart().startsWith('"')) {
    try { html = JSON.parse(html); } catch { /* fall through, use raw */ }
  }
  const blocks = new Set();
  const re = /<div\s+class="([^"]+)"/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html)) !== null) {
    const first = m[1].trim().split(/\s+/)[0];
    if (first && !EXCLUDE_BLOCKS.has(first)) blocks.add(first);
  }
  return blocks;
}

/**
 * DA admin client (list + source) backed by admin.da.live, with call counters.
 * @param {string} token bearer token (from `da-auth-helper token`)
 */
export function createDaClient(token) {
  const stats = { listCalls: 0, fetchCalls: 0 };
  const headers = { Authorization: `Bearer ${token}` };
  async function list(path) {
    stats.listCalls += 1;
    const res = await fetch(`https://admin.da.live/list${path}`, { headers });
    return res.ok ? res.json() : [];
  }
  async function getSource(path) {
    stats.fetchCalls += 1;
    const res = await fetch(`https://admin.da.live/source${path}`, { headers });
    return res.ok ? res.text() : null;
  }
  return { list, getSource, stats };
}

const LOCALE_RE = /^[a-z]{2}([-_][a-z]{2})?$/;

/**
 * Recursively collect .html source paths under a DA repo (or a subtree).
 * @param {ReturnType<typeof createDaClient>} client
 * @param {object} opts
 * @param {string} opts.org
 * @param {string} opts.repo
 * @param {string} [opts.startPath] absolute DA path to start from (default repo root)
 * @param {boolean} [opts.skipLocales] skip top-level locale dirs
 * @param {Set<string>} [opts.excludeSegments] dir/file names to skip
 * @param {number} [opts.maxPages] safety cap
 * @returns {Promise<string[]>}
 */
export async function crawlHtmlPaths(client, {
  org, repo, startPath, skipLocales = false, excludeSegments = new Set(), maxPages = 5000,
}) {
  const prefix = `/${org}/${repo}`;
  const start = startPath || prefix;
  const htmlPaths = [];
  const queue = [start];
  while (queue.length) {
    const dir = queue.shift();
    // eslint-disable-next-line no-await-in-loop
    const entries = await client.list(dir);
    for (const e of entries) {
      if (!e.path || e.path === `${prefix}/` || e.path === `${start}/`) continue;
      if (excludeSegments.has(e.name || '')) continue;
      if (e.ext === 'html') {
        htmlPaths.push(e.path);
      } else if (!e.ext) {
        if (skipLocales && dir === prefix && LOCALE_RE.test(e.name || '')) continue;
        queue.push(e.path);
      }
    }
    if (htmlPaths.length > maxPages) break;
  }
  return htmlPaths;
}

/** Convert a DA source path to its EDS path. */
export function edsOf(org, repo, srcPath) {
  const prefix = `/${org}/${repo}`;
  let p = srcPath.slice(prefix.length).replace(/\.html$/, '');
  if (p.endsWith('/index')) p = p.slice(0, -('/index'.length)) || '/';
  return p || '/';
}

/** Run `fn` over `items` with a fixed concurrency `n`, preserving order. */
export async function mapPool(items, n, fn) {
  const out = [];
  let idx = 0;
  const workers = Array.from({ length: n }, async () => {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      // eslint-disable-next-line no-await-in-loop
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
