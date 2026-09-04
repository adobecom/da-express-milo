#!/usr/bin/env node
/**
 * lcp-compare.mjs
 *
 * Automates a manual Chrome DevTools performance-comparison workflow: measure
 * Largest Contentful Paint (LCP) for a "test" URL and a "control" URL under
 * standardized mobile throttling, repeat N times each, and report whether the
 * test improved or regressed LCP versus the control.
 *
 * Reproduces PageSpeed Insights (PSI) / Lighthouse mobile conditions:
 *   - Device emulation: Moto G Power (412x823 CSS px, DPR 1.75, mobile UA)
 *   - CPU throttling: 4x slowdown          (CDP Emulation.setCPUThrottlingRate)
 *   - Network throttling: "Slow 4G" preset  (CDP Network.emulateNetworkConditions)
 *
 * LCP is captured in-page via PerformanceObserver ('largest-contentful-paint'),
 * which is what the DevTools Performance panel and web-vitals report.
 *
 * Each run uses a FRESH browser context (cold cache / no shared storage) so
 * results are not skewed by caching between runs — this mirrors a PSI "first
 * view" load.
 *
 * Usage:
 *   node lcp-compare.mjs --test <url> --control <url> [options]
 *   node lcp-compare.mjs <testUrl> <controlUrl> [options]
 *
 * Run `node lcp-compare.mjs --help` for the full option list.
 *
 * Requires: playwright + a Chromium build
 *   npm install playwright && npx playwright install chromium
 */

import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// Throttling & device profiles (verbatim from Chrome DevTools + Lighthouse
// source so the numbers match "pick the preset from the dropdown" exactly).
// ---------------------------------------------------------------------------

// Network presets. `download`/`upload` are BYTES/second, `latency` is ms.
// Values are the exact expressions from Chrome DevTools NetworkManager.ts.
// NOTE ON NAMING: Chrome renamed these presets in May 2024. The profile PSI /
// Lighthouse uses for mobile is what DevTools now labels "Slow 4G" (formerly
// "Fast 3G"): ~150ms target RTT, 1.6 Mbps down, 750 Kbps up. DevTools' current
// "Fast 4G" is a *faster* profile (9 Mbps down). The default here is slow-4g
// because that is the true PSI mobile profile.
const NETWORK_PROFILES = {
  'slow-3g': {
    label: 'Slow 3G (Chrome DevTools)',
    download: (500 * 1000) / 8 * 0.8, // 50,000 B/s (400 kbps)
    upload: (500 * 1000) / 8 * 0.8, //   50,000 B/s
    latency: 400 * 5, //                 2000 ms
  },
  'slow-4g': {
    label: 'Slow 4G (Chrome DevTools) — PSI / Lighthouse mobile default',
    download: (1.6 * 1000 * 1000) / 8 * 0.9, // 180,000 B/s (~1.6 Mbps)
    upload: (750 * 1000) / 8 * 0.9, //           84,375 B/s (~750 Kbps)
    latency: 150 * 3.75, //                      562.5 ms (150ms target RTT x 3.75)
  },
  'fast-4g': {
    label: 'Fast 4G (Chrome DevTools)',
    download: (9 * 1000 * 1000) / 8 * 0.9, //  1,012,500 B/s (~9 Mbps)
    upload: (1.5 * 1000 * 1000) / 8 * 0.9, //    168,750 B/s (~1.5 Mbps)
    latency: 60 * 2.75, //                       165 ms
  },
  none: {
    label: 'No network throttling',
    download: -1, // -1 disables throttling in CDP
    upload: -1,
    latency: 0,
  },
};

// Device metrics verbatim from Lighthouse core/config/constants.js
// (screenEmulationMetrics.mobile + MOTOG4_USERAGENT). PSI uses DPR 1.75 for
// its emulation, not the raw hardware DPR.
const DEVICE = {
  name: 'Moto G Power (Lighthouse / PSI mobile emulation)',
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCli() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      test: { type: 'string' },
      control: { type: 'string' },
      runs: { type: 'string', default: '10' },
      network: { type: 'string', default: 'slow-4g' },
      cpu: { type: 'string', default: '4' },
      settle: { type: 'string', default: '2000' },
      'max-wait': { type: 'string', default: '20000' },
      warmup: { type: 'string', default: '0' },
      confidence: { type: 'string', default: '0.95' },
      'min-delta-ms': { type: 'string', default: '50' },
      'min-pct': { type: 'string', default: '5' },
      timeout: { type: 'string', default: '90000' },
      headed: { type: 'boolean', default: false },
      json: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const testUrl = values.test || positionals[0];
  const controlUrl = values.control || positionals[1];

  if (!testUrl || !controlUrl) {
    console.error('Error: both a test URL and a control URL are required.\n');
    printHelp();
    process.exit(1);
  }

  const network = String(values.network).toLowerCase();
  if (!NETWORK_PROFILES[network]) {
    console.error(
      `Error: unknown --network "${network}". Choose one of: ${Object.keys(NETWORK_PROFILES).join(', ')}`,
    );
    process.exit(1);
  }

  return {
    testUrl,
    controlUrl,
    runs: toInt(values.runs, 10),
    network,
    cpu: toNum(values.cpu, 4),
    settle: toInt(values.settle, 2000),
    maxWait: toInt(values['max-wait'], 20000),
    warmup: toInt(values.warmup, 0),
    confidence: clamp(toNum(values.confidence, 0.95), 0.5, 0.999),
    minDeltaMs: toNum(values['min-delta-ms'], 50),
    minPct: toNum(values['min-pct'], 5),
    timeout: toInt(values.timeout, 90000),
    headed: values.headed,
    jsonOut: values.json || null,
  };
}

function printHelp() {
  console.log(`
LCP performance comparison (test URL vs control URL)

Usage:
  node lcp-compare.mjs --test <url> --control <url> [options]
  node lcp-compare.mjs <testUrl> <controlUrl> [options]

Required:
  --test <url>          Test URL (e.g. a preview / branch deploy)
  --control <url>       Control URL (e.g. prod / main)
                        (may also be given as the first two positional args)

Options (defaults reproduce PSI mobile testing):
  --runs <n>            Measured iterations per URL           (default 10)
  --network <profile>   slow-4g | fast-4g | slow-3g | none    (default slow-4g)
  --cpu <rate>          CPU slowdown multiplier               (default 4)
  --settle <ms>         Quiet period with no new LCP candidate
                        before treating it as final           (default 2000)
  --max-wait <ms>       Cap on total time spent waiting for
                        LCP to settle (safety valve)          (default 20000)
  --warmup <n>          Discarded warm-up runs per URL        (default 0)
  --confidence <p>      Confidence level for the delta CI     (default 0.95)
  --min-delta-ms <ms>   Practical-significance floor, ms      (default 50)
  --min-pct <pct>       Practical-significance floor, percent (default 5)
  --timeout <ms>        Per-navigation timeout                (default 90000)
  --headed              Show the browser window (default headless)
  --json <path>         Also write full results as JSON
  --help                Show this help

Network profiles (Chrome DevTools values; slow-4g == PSI/Lighthouse mobile):
${Object.entries(NETWORK_PROFILES)
  .map(([k, v]) => `  ${k.padEnd(8)} ${v.label}`)
  .join('\n')}
`);
}

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const toNum = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

// Injected before any page script runs. Records the running LCP candidate so we
// can read it back after the page settles. `startTime` on an LCP entry already
// resolves to renderTime (or loadTime for cross-origin resources without a
// Timing-Allow-Origin header), so it is the canonical reported LCP value.
function lcpInitScript() {
  window.__lcp = 0;
  window.__lcpDetail = null;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;
      window.__lcp = last.startTime;
      window.__lcpDetail = {
        time: Math.round(last.startTime),
        size: last.size,
        url: last.url || null,
        tag: last.element ? last.element.tagName : null,
        id: last.element ? last.element.id || null : null,
      };
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // largest-contentful-paint not supported in this browser build.
  }
}

// Wait until the page looks truly done: no in-flight network requests AND the
// LCP candidate hasn't changed, both held for `quietMs`, or give up after
// `maxMs` total. This — not a fixed post-load delay — is what protects against
// the DevTools Performance-panel failure mode: that panel auto-stops its trace
// recording once the page looks "quiet," and under heavy throttling the real
// LCP can fire after that cutoff, so it's silently missed.
//
// A time-based "LCP value hasn't changed in N ms" check alone isn't sufficient:
// a single slow request (e.g. a hero image crawling in over throttled Fast/Slow
// 4G) produces no new events while it's in flight, so a naive quiet-timer can
// elapse and falsely declare "settled" while that image is still downloading.
// Gating on `pendingRequests === 0` closes that gap — we refuse to settle while
// anything is still in flight, no matter how long since the last state change.
function trackPendingRequests(page) {
  let pending = 0;
  let lastActivityAt = Date.now();
  const onStart = () => {
    pending += 1;
    lastActivityAt = Date.now();
  };
  const onEnd = () => {
    pending = Math.max(0, pending - 1);
    lastActivityAt = Date.now();
  };
  page.on('request', onStart);
  page.on('requestfinished', onEnd);
  page.on('requestfailed', onEnd);
  return {
    getPending: () => pending,
    getLastActivityAt: () => lastActivityAt,
    dispose: () => {
      page.off('request', onStart);
      page.off('requestfinished', onEnd);
      page.off('requestfailed', onEnd);
    },
  };
}

async function waitForPageToSettle(page, tracker, quietMs, maxMs) {
  const start = Date.now();
  let lastLcp = -1;
  let lastActivityAt = tracker.getLastActivityAt();
  for (;;) {
    let currentLcp;
    try {
      currentLcp = await page.evaluate(() => window.__lcp || 0);
    } catch {
      return { settled: false, timedOut: false }; // page/context gone
    }
    const now = Date.now();
    if (currentLcp !== lastLcp) {
      lastLcp = currentLcp;
      lastActivityAt = now;
    }
    const trackerActivityAt = tracker.getLastActivityAt();
    if (trackerActivityAt > lastActivityAt) lastActivityAt = trackerActivityAt;

    const quiet = tracker.getPending() === 0 && now - lastActivityAt >= quietMs;
    if (quiet) return { settled: true, timedOut: false };
    if (now - start >= maxMs) return { settled: false, timedOut: true };
    await page.waitForTimeout(200);
  }
}

async function measureRun(browser, url, opts) {
  const profile = NETWORK_PROFILES[opts.network];
  const context = await browser.newContext({
    viewport: DEVICE.viewport,
    deviceScaleFactor: DEVICE.deviceScaleFactor,
    isMobile: DEVICE.isMobile,
    hasTouch: DEVICE.hasTouch,
    userAgent: DEVICE.userAgent,
    ignoreHTTPSErrors: true, // branch/preview deploys may use non-trusted certs
  });
  await context.addInitScript(lcpInitScript);

  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  const tracker = trackPendingRequests(page);

  // Apply throttling exactly like the DevTools Performance panel does.
  await client.send('Network.enable');
  if (opts.network !== 'none') {
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: profile.latency,
      downloadThroughput: profile.download,
      uploadThroughput: profile.upload,
    });
  }
  await client.send('Emulation.setCPUThrottlingRate', { rate: opts.cpu });

  let error = null;
  let metrics = { lcp: null, detail: null, fcp: null, ttfb: null };
  let settle = { settled: false, timedOut: false };

  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: opts.timeout });
    // A non-2xx/3xx main-document response (auth walls, 404s, 500s) means
    // there's no real page to measure — surface that plainly instead of
    // silently measuring whatever error page happened to render (which can
    // still produce a small, misleadingly "valid-looking" LCP number).
    if (response && !response.ok()) {
      throw new Error(`server returned ${response.status()} ${response.statusText()}`.trim());
    }
    settle = await waitForPageToSettle(page, tracker, opts.settle, opts.maxWait);

    metrics = await page.evaluate(() => {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lastLcp = lcpEntries[lcpEntries.length - 1];
      const nav = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
      return {
        // Prefer the directly-read buffered entry; fall back to observer value.
        lcp: lastLcp ? lastLcp.startTime : window.__lcp || null,
        detail: window.__lcpDetail,
        fcp: fcp ? fcp.startTime : null,
        ttfb: nav ? nav.responseStart : null,
      };
    });
  } catch (e) {
    error = e.message;
  } finally {
    tracker.dispose();
    await context.close();
  }

  return { ...metrics, error, timedOutWaitingForLcp: settle.timedOut };
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const stdev = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

function summarize(runs) {
  const values = runs.filter((r) => r.error == null && r.lcp != null).map((r) => r.lcp);
  if (!values.length) return null;
  return {
    n: values.length,
    values,
    mean: mean(values),
    median: median(values),
    stdev: stdev(values),
    variance: values.length > 1 ? stdev(values) ** 2 : 0,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// --- Student's t-distribution (pure JS, no deps) --------------------------
// Used to put a confidence interval on the difference of two means and to get
// a p-value, so the verdict reflects whether the observed delta is
// statistically distinguishable from zero rather than just clearing a fixed
// threshold. Implemented via the regularized incomplete beta function
// (Numerical Recipes betacf/betai + Lanczos gammaln).

function gammaln(x) {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(x, a, b) {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta I_x(a, b).
function betai(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

// Two-sided p-value for a t statistic: P(|T| > |t|) with `df` degrees of freedom.
function tTwoSidedP(t, df) {
  if (!Number.isFinite(t)) return 0;
  const x = df / (df + t * t);
  return betai(x, df / 2, 0.5);
}

// Critical t value t* such that P(-t* < T < t*) = confidence, via bisection on
// the (monotonic) two-sided p-value.
function tCritical(df, confidence) {
  const target = 1 - confidence; // desired two-sided tail mass
  let lo = 0;
  let hi = 1e6;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoSidedP(mid, df) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Welch's two-sample t-test (unequal variances) on test vs control means.
// delta = test.mean - control.mean (negative => test is faster => improvement).
function welch(test, control, confidence) {
  const a = test;
  const b = control;
  if (!a || !b || a.n < 2 || b.n < 2) return null;
  const delta = a.mean - b.mean;
  const se = Math.sqrt(a.variance / a.n + b.variance / b.n);
  if (se === 0) {
    // No within-group variance at all: CI collapses to the point estimate.
    return { delta, se, t: delta === 0 ? 0 : Infinity, df: a.n + b.n - 2, p: delta === 0 ? 1 : 0, ci: [delta, delta], confidence };
  }
  const t = delta / se;
  const df =
    (a.variance / a.n + b.variance / b.n) ** 2 /
    ((a.variance / a.n) ** 2 / (a.n - 1) + (b.variance / b.n) ** 2 / (b.n - 1));
  const p = tTwoSidedP(t, df);
  const tCrit = tCritical(df, confidence);
  const ci = [delta - tCrit * se, delta + tCrit * se];
  return { delta, se, t, df, p, ci, confidence };
}

// Rough runs-per-URL needed to detect a true difference of |delta| at the given
// confidence and 80% power, using the observed variances. Normal-approximation
// power formula: n = (z_alpha/2 + z_beta)^2 (var_t + var_c) / delta^2, with a +1
// bump to partly offset the t-vs-normal small-sample gap. Answers "how many runs
// would I have needed?" when a result comes back inconclusive.
function suggestRuns(test, control, delta, confidence) {
  if (!delta || !Number.isFinite(delta)) return null;
  const zAlpha = tCritical(1e7, confidence); // ~= normal quantile at large df
  const zBeta80 = 0.8416;
  const n = ((zAlpha + zBeta80) ** 2 * (test.variance + control.variance)) / delta ** 2;
  return Math.ceil(n) + 1;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const ms = (v) => (v == null ? '   —  ' : `${Math.round(v)}ms`.padStart(7));
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function printPerUrl(title, url, runs, summary) {
  console.log(`\n${bold(title)}  ${dim(url)}`);
  runs.forEach((r, i) => {
    if (r.error) {
      console.log(`  run ${i + 1}: ${red('FAILED')} ${dim(r.error)}`);
    } else if (r.lcp == null) {
      console.log(`  run ${i + 1}: ${red('no LCP entry')} ${dim('(page fired no largest-contentful-paint)')}`);
    } else {
      const d = r.detail;
      const what = d ? dim(`  (${d.tag || '?'}${d.id ? '#' + d.id : ''}${d.url ? ' ' + shortUrl(d.url) : ''})`) : '';
      const warn = r.timedOutWaitingForLcp
        ? red('  ⚠ hit --max-wait before LCP went quiet — may be non-final')
        : '';
      console.log(`  run ${i + 1}: LCP ${ms(r.lcp)}   ${dim(`FCP ${ms(r.fcp)}  TTFB ${ms(r.ttfb)}`)}${what}${warn}`);
    }
  });
  const timedOutCount = runs.filter((r) => r.timedOutWaitingForLcp).length;
  if (timedOutCount > 0) {
    console.log(
      red(
        `  ⚠ ${timedOutCount}/${runs.length} run(s) hit --max-wait before the LCP candidate stopped changing — those values may understate the true LCP. Consider raising --max-wait.`,
      ),
    );
  }
  if (summary) {
    console.log(
      `  ${bold('avg')} ${ms(summary.mean)}   ${dim(
        `median ${ms(summary.median)}  min ${ms(summary.min)}  max ${ms(summary.max)}  stdev ${ms(summary.stdev)}  (n=${summary.n})`,
      )}`,
    );
  } else {
    console.log(`  ${red('no valid runs — cannot compute average')}`);
  }
}

function shortUrl(u) {
  try {
    const url = new URL(u);
    const parts = url.pathname.split('/');
    return parts[parts.length - 1] || url.hostname;
  } catch {
    return u.slice(0, 40);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseCli();

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      '\nError: playwright is not installed.\n' +
        'Install it in an environment with network access:\n\n' +
        '  npm install playwright && npx playwright install chromium\n',
    );
    process.exit(1);
  }

  const profile = NETWORK_PROFILES[opts.network];
  console.log(bold('\nLCP performance comparison'));
  console.log(`  Device:   ${DEVICE.name}  ${DEVICE.viewport.width}x${DEVICE.viewport.height} @ ${DEVICE.deviceScaleFactor}x`);
  console.log(`  CPU:      ${opts.cpu}x slowdown`);
  console.log(`  Network:  ${profile.label}`);
  if (opts.network !== 'none') {
    console.log(
      dim(
        `            ${Math.round((profile.download * 8) / 1000)} kbps down / ${Math.round(
          (profile.upload * 8) / 1000,
        )} kbps up / ${profile.latency}ms latency`,
      ),
    );
  }
  console.log(`  Runs:     ${opts.runs} per URL${opts.warmup ? ` (+${opts.warmup} warm-up discarded)` : ''}`);

  const browser = await chromium.launch({
    headless: !opts.headed,
    args: ['--disable-dev-shm-usage'],
  });

  const targets = [
    { key: 'test', title: 'TEST   ', url: opts.testUrl },
    { key: 'control', title: 'CONTROL', url: opts.controlUrl },
  ];
  const results = {};

  try {
    for (const t of targets) {
      process.stdout.write(dim(`\nMeasuring ${t.title.trim()} (${t.url}) `));
      // Warm-up runs are executed and discarded to prime any cross-request state.
      for (let w = 0; w < opts.warmup; w++) {
        await measureRun(browser, t.url, opts);
        process.stdout.write(dim('·'));
      }
      const runs = [];
      for (let i = 0; i < opts.runs; i++) {
        const r = await measureRun(browser, t.url, opts);
        runs.push(r);
        process.stdout.write(r.error || r.lcp == null ? red('x') : green('•'));
      }
      results[t.key] = { url: t.url, runs, summary: summarize(runs) };
    }
  } finally {
    await browser.close();
  }
  console.log('');

  printPerUrl('TEST   ', results.test.url, results.test.runs, results.test.summary);
  printPerUrl('CONTROL', results.control.url, results.control.runs, results.control.summary);

  // Verdict — based on a confidence interval for the difference of means.
  console.log(`\n${bold('─'.repeat(60))}`);
  const ts = results.test.summary;
  const cs = results.control.summary;
  const confPct = Math.round(opts.confidence * 100);

  let verdictPayload = null;
  if (!ts || !cs) {
    console.log(red('Cannot produce a verdict: one or both URLs had no valid runs.'));
  } else {
    const delta = ts.mean - cs.mean; // negative = test is faster = improvement
    const pct = (delta / cs.mean) * 100;
    const dir = delta < 0 ? 'faster' : 'slower';

    console.log(
      `${bold('Test avg')} ${Math.round(ts.mean)}ms   ${bold('Control avg')} ${Math.round(
        cs.mean,
      )}ms   ${dim(`(n=${ts.n} / ${cs.n})`)}`,
    );
    console.log(
      `${bold('Delta')} ${delta >= 0 ? '+' : ''}${Math.round(delta)}ms (${pct >= 0 ? '+' : ''}${pct.toFixed(
        1,
      )}%) — test is ${Math.abs(Math.round(delta))}ms ${dir} than control`,
    );

    const stats = welch(ts, cs, opts.confidence);
    if (!stats) {
      console.log(dim('  Need ≥ 2 valid runs per URL for a confidence interval.'));
      console.log(`\n${bold('Verdict:')} ${dim(bold('INSUFFICIENT DATA'))}`);
      verdictPayload = { testMean: ts.mean, controlMean: cs.mean, deltaMs: delta, pctChange: pct, verdict: 'INSUFFICIENT DATA' };
    } else {
      const [lo, hi] = stats.ci;
      console.log(
        dim(
          `${confPct}% CI on delta: [${lo >= 0 ? '+' : ''}${Math.round(lo)}, ${hi >= 0 ? '+' : ''}${Math.round(
            hi,
          )}] ms   Welch t=${stats.t.toFixed(2)}, df=${stats.df.toFixed(1)}, p=${stats.p.toFixed(3)}`,
        ),
      );

      const significant = lo > 0 || hi < 0; // whole interval on one side of zero
      let verdict;
      let color;
      if (!significant) {
        verdict = 'NO SIGNIFICANT DIFFERENCE';
        color = dim;
      } else if (delta < 0) {
        verdict = 'IMPROVED';
        color = green;
      } else {
        verdict = 'REGRESSED';
        color = red;
      }
      console.log(`\n${bold('Verdict:')} ${color(bold(verdict))}`);

      const practicallyMeaningful = Math.abs(delta) >= opts.minDeltaMs && Math.abs(pct) >= opts.minPct;
      if (!significant) {
        console.log(
          dim(
            `  The ${confPct}% CI includes 0 — this delta is not distinguishable from run-to-run noise at n=${ts.n}.`,
          ),
        );
        const need = suggestRuns(ts, cs, delta, opts.confidence);
        if (need && need > ts.n) {
          console.log(
            dim(
              `  To resolve a difference this size (~${Math.abs(pct).toFixed(
                1,
              )}%) you'd need roughly ${need} runs per URL (80% power). Re-run with --runs ${need}.`,
            ),
          );
        }
      } else if (!practicallyMeaningful) {
        console.log(
          dim(
            `  Statistically real, but small (< ${opts.minDeltaMs}ms and < ${opts.minPct}%) — may not be user-perceptible.`,
          ),
        );
      }

      verdictPayload = {
        testMean: ts.mean,
        controlMean: cs.mean,
        deltaMs: delta,
        pctChange: pct,
        confidence: opts.confidence,
        ci: stats.ci,
        welchT: stats.t,
        df: stats.df,
        pValue: stats.p,
        significant,
        practicallyMeaningful,
        verdict,
      };
    }
  }
  console.log(bold('─'.repeat(60)));

  if (opts.jsonOut) {
    const fs = await import('node:fs');
    const payload = {
      config: {
        device: DEVICE.name,
        viewport: DEVICE.viewport,
        deviceScaleFactor: DEVICE.deviceScaleFactor,
        cpuThrottling: opts.cpu,
        network: opts.network,
        networkProfile: profile,
        runs: opts.runs,
        warmup: opts.warmup,
        settleMs: opts.settle,
      },
      test: results.test,
      control: results.control,
      verdict: verdictPayload,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(opts.jsonOut, JSON.stringify(payload, null, 2));
    console.log(dim(`\nFull results written to ${opts.jsonOut}`));
  }

  // Exit non-zero on regression so this is usable as a CI gate.
  if (verdictPayload && verdictPayload.verdict === 'REGRESSED') process.exit(2);
}

// Only run when invoked directly (so the stats helpers can be imported in tests).
import { fileURLToPath } from 'node:url';
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((e) => {
    console.error('\nUnexpected error:', e);
    process.exit(1);
  });
}

export { welch, tCritical, tTwoSidedP, betai, summarize };
