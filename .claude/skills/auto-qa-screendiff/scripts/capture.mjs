#!/usr/bin/env node
/**
 * C7 (capture + pixel diff) + C8 (broken-block probe).
 *
 * Reads worklist.json, and for each page × viewport captures the stable (A) and
 * branch (B) URLs with Playwright, computes a size-tolerant pixel diff, and
 * probes each render for blocks that failed to load. Writes screenshots + a diff
 * image per cell and a results.json for the report step.
 *
 * Playwright resolves from the repo root; pixelmatch/pngjs from the skill dir.
 *
 * Usage:
 *   node capture.mjs --worklist .qa-screendiff/worklist.json \
 *     --out-dir .qa-screendiff/report [--concurrency 3] [--limit N] \
 *     [--viewports chrome,ipad] [--self] [--timeout 45000]
 *
 *   --self  captures B from the SAME url as A (branch ignored) — for smoke tests
 *           and for validating the machinery when no branch preview exists yet.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

function arg(name, fb) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fb;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const worklistPath = arg('--worklist', '.qa-screendiff/worklist.json');
const outDir = arg('--out-dir', '.qa-screendiff/report');
const concurrency = Number(arg('--concurrency', '3'));
const limit = Number(arg('--limit', '0')) || Infinity;
const selfCheck = arg('--self', false) === true;
const timeout = Number(arg('--timeout', '45000'));
const viewportFilter = arg('--viewports', null);

// Viewport presets — Chromium engine with Playwright device presets.
const VIEWPORTS = {
  chrome: { device: 'Desktop Chrome', viewport: { width: 1920, height: 1080 } },
  ipad: { device: 'iPad Mini', viewport: null },
  iphone: { device: 'iPhone 13', viewport: null },
};

const worklist = JSON.parse(readFileSync(worklistPath, 'utf8'));
let pages = worklist.pages.slice(0, limit);
const wantViewports = viewportFilter && viewportFilter !== true
  ? new Set(viewportFilter.split(',').map((s) => s.trim()))
  : null;

const slug = (s) => s.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '_') || 'root';

// ---- size-tolerant PNG diff (pads both to a common canvas so height/width
// changes register as differences instead of being silently ignored) ----
function padded(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(255); // white background
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}
function diffImages(bufA, bufB) {
  const a = PNG.sync.read(bufA);
  const b = PNG.sync.read(bufB);
  const w = Math.max(a.width, b.width);
  const h = Math.max(a.height, b.height);
  const pa = padded(a, w, h);
  const pb = padded(b, w, h);
  const out = new PNG({ width: w, height: h });
  const diffPixels = pixelmatch(pa.data, pb.data, out.data, w, h, { threshold: 0.1 });
  return {
    width: w, height: h, sizeChanged: a.width !== b.width || a.height !== b.height,
    diffPixels, ratio: diffPixels / (w * h), buf: PNG.sync.write(out),
  };
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = 600;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y >= document.body.scrollHeight) { clearInterval(timer); window.scrollTo(0, 0); resolve(); }
      }, 60);
    });
  });
  await page.waitForTimeout(400);
}

// C8 — probe blocks that did not reach data-block-status="loaded", plus console
// errors and failed block resources.
async function captureOne(context, url) {
  const consoleErrors = [];
  const failedResources = [];
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e.message || e)));
  page.on('response', (r) => {
    const u = r.url();
    if (r.status() >= 400 && /\/blocks\/.*\.(js|css)(\?|$)/.test(u)) failedResources.push(`${r.status()} ${u}`);
  });

  const result = { url, ok: false };
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    // page.goto() only throws on navigation failures (DNS, timeout, aborted) —
    // an unpreviewed branch or a dead page returns a normal 404/500 response
    // that would otherwise get screenshotted and reported as ok/diff.
    if (response && response.status() >= 400) {
      throw new Error(`HTTP ${response.status()}`);
    }
    await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
    await autoScroll(page);
    const probe = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('[data-block-status]')];
      const unloaded = blocks
        .filter((b) => b.dataset.blockStatus !== 'loaded')
        .map((b) => ({ name: (b.className || '').split(' ')[0] || '(unnamed)', status: b.dataset.blockStatus }));
      return { totalBlocks: blocks.length, unloaded };
    });
    result.buf = await page.screenshot({ fullPage: true, animations: 'disabled' });
    result.ok = true;
    result.probe = probe;
    result.consoleErrors = consoleErrors.slice(0, 20);
    result.failedResources = failedResources.slice(0, 20);
    result.brokenBlocks = [
      ...probe.unloaded.map((u) => `${u.name} (${u.status})`),
      ...consoleErrors.filter((e) => /Failed loading/i.test(e)),
      ...failedResources,
    ];
  } catch (e) {
    result.error = String(e.message || e).split('\n')[0];
  } finally {
    await page.close();
  }
  return result;
}

// Normalize a brokenBlocks entry to an identity for A/B comparison — e.g.
// "cta-carousel (unloaded)" and "429 https://…/blocks/cta-carousel/….js" both
// key on "cta-carousel", so a like-for-like failure isn't mistaken for a new one.
function brokenKey(entry) {
  const resourceMatch = entry.match(/\/blocks\/([^/]+)\//);
  if (resourceMatch) return resourceMatch[1];
  const nameMatch = entry.match(/^(.*?) \(/);
  if (nameMatch) return nameMatch[1];
  return entry;
}

async function mapPool(items, n, fn) {
  const out = [];
  let idx = 0;
  const workers = Array.from({ length: n }, async () => {
    while (idx < items.length) {
      const i = idx; idx += 1;
      // eslint-disable-next-line no-await-in-loop
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// Expand pages × viewports into capture cells.
const cells = [];
for (const p of pages) {
  for (const vp of p.viewports) {
    if (wantViewports && !wantViewports.has(vp)) continue;
    if (!VIEWPORTS[vp]) continue;
    cells.push({ page: p, vp });
  }
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

const t0 = Date.now();
let done = 0;
const results = await mapPool(cells, concurrency, async ({ page: p, vp }) => {
  const preset = VIEWPORTS[vp];
  const ctxOpts = devices[preset.device] ? { ...devices[preset.device] } : {};
  if (preset.viewport) ctxOpts.viewport = preset.viewport;
  ctxOpts.reducedMotion = 'reduce';
  const context = await browser.newContext(ctxOpts);

  const bUrl = selfCheck ? p.a : p.b;
  const a = await captureOne(context, p.a);
  const b = await captureOne(context, bUrl);
  await context.close();

  const cellDir = path.join(outDir, 'assets', p.project, slug(p.edsPath), vp);
  mkdirSync(cellDir, { recursive: true });
  const rel = (f) => path.relative(outDir, path.join(cellDir, f));

  const cell = {
    project: p.project,
    edsPath: p.edsPath,
    source: p.source,
    matchedBlocks: p.matchedBlocks,
    viewport: vp,
    a: {
      url: a.url, ok: a.ok, error: a.error || null, brokenBlocks: a.brokenBlocks || [], screenshot: null,
    },
    b: {
      url: b.url, ok: b.ok, error: b.error || null, brokenBlocks: b.brokenBlocks || [], screenshot: null,
    },
    diff: null,
    status: 'ok',
  };

  if (a.ok) { writeFileSync(path.join(cellDir, 'a.png'), a.buf); cell.a.screenshot = rel('a.png'); }
  if (b.ok) { writeFileSync(path.join(cellDir, 'b.png'), b.buf); cell.b.screenshot = rel('b.png'); }

  if (a.ok && b.ok) {
    const d = diffImages(a.buf, b.buf);
    writeFileSync(path.join(cellDir, 'diff.png'), d.buf);
    cell.diff = {
      ratio: d.ratio, diffPixels: d.diffPixels, sizeChanged: d.sizeChanged, image: rel('diff.png'),
    };
  }

  const brokenAKeys = new Set(cell.a.brokenBlocks.map(brokenKey));
  const newBroken = cell.b.brokenBlocks.filter((entry) => !brokenAKeys.has(brokenKey(entry)));
  if (!a.ok) cell.status = 'a-failed';
  else if (!b.ok) cell.status = 'b-failed';
  else if (newBroken.length) { cell.status = 'broken'; cell.newBroken = newBroken; } // breakage new to B, by identity
  else if (cell.diff && cell.diff.ratio > 0) cell.status = 'diff';

  done += 1;
  process.stderr.write(`  [${done}/${cells.length}] ${p.project}${p.edsPath} @${vp} — ${cell.status}`
    + `${cell.diff ? ` (${(cell.diff.ratio * 100).toFixed(2)}%)` : ''}\n`);
  return cell;
});

await browser.close();

const out = {
  branch: worklist.branch,
  base: worklist.base,
  generatedAt: new Date().toISOString(),
  selfCheck,
  elapsedMs: Date.now() - t0,
  cellCount: results.length,
  results,
};
const resultsPath = path.join(outDir, 'results.json');
writeFileSync(resultsPath, `${JSON.stringify(out, null, 2)}\n`);
process.stdout.write(`\ncaptured ${results.length} cells in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${resultsPath}\n`);
