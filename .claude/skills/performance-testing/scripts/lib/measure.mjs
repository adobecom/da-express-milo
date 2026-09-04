/**
 * Device emulation, throttling profiles, and single-page measurement.
 *
 * This module knows how to load ONE url under given conditions and return a
 * metrics object. It has no notion of "test vs control" or of runs/averages —
 * that comparison logic lives in compare.mjs and reuses lib/stats.mjs, so this
 * module can also back a future single-page report mode without duplication.
 *
 * Reproduces PageSpeed Insights (PSI) / Lighthouse mobile conditions:
 *   - Device emulation: Moto G Power (412x823 CSS px, DPR 1.75, mobile UA)
 *   - CPU throttling: Nx slowdown          (CDP Emulation.setCPUThrottlingRate)
 *   - Network throttling: preset profile   (CDP Network.emulateNetworkConditions)
 *
 * LCP is captured in-page via PerformanceObserver ('largest-contentful-paint'),
 * which is what the DevTools Performance panel and web-vitals report.
 */

// Network presets. `download`/`upload` are BYTES/second, `latency` is ms.
// Values are the exact expressions from Chrome DevTools NetworkManager.ts.
// NOTE ON NAMING: Chrome renamed these presets in May 2024. The profile PSI /
// Lighthouse uses for mobile is what DevTools now labels "Slow 4G" (formerly
// "Fast 3G"): ~150ms target RTT, 1.6 Mbps down, 750 Kbps up. DevTools' current
// "Fast 4G" is a *faster* profile (9 Mbps down). The default here is slow-4g
// because that is the true PSI mobile profile.
export const NETWORK_PROFILES = {
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
export const DEVICE = {
  name: 'Moto G Power (Lighthouse / PSI mobile emulation)',
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
};

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

// Load one URL under the given throttling/device conditions and return a
// metrics object: { lcp, detail, fcp, ttfb, error, timedOutWaitingForLcp }.
// `opts` needs: network, cpu, timeout, settle, maxWait (see compare.mjs's CLI
// parsing for definitions).
export async function measureRun(browser, url, opts) {
  const profile = NETWORK_PROFILES[opts.network];
  const context = await browser.newContext({
    viewport: DEVICE.viewport,
    deviceScaleFactor: DEVICE.deviceScaleFactor,
    isMobile: DEVICE.isMobile,
    hasTouch: DEVICE.hasTouch,
    userAgent: DEVICE.userAgent,
    ignoreHTTPSErrors: true, // branch/preview deploys may use non-trusted certs
    // AEM Admin API auth: an `authorization: token $API_KEY` header is a
    // documented alternative to the interactive cookie login for the Admin
    // API (https://www.aem.live/docs/admin.html#tag/authentication). This is
    // NOT confirmed to also authenticate raw .aem.page/.hlx.page page-view
    // requests (as opposed to admin.hlx.page API calls) — it's included here
    // as a testable option, not a guaranteed fix. See SKILL.md for how to
    // obtain a key and why .aem.page's real auth (the Sidekick browser
    // extension) can't be driven directly by this tool.
    extraHTTPHeaders: opts.apiKey ? { authorization: `token ${opts.apiKey}` } : undefined,
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
  let httpStatus = null;
  let metrics = { lcp: null, detail: null, fcp: null, ttfb: null };
  let settle = { settled: false, timedOut: false };

  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: opts.timeout });
    // A non-2xx/3xx main-document response (auth walls, 404s, 500s) means
    // there's no real page to measure — surface that plainly instead of
    // silently measuring whatever error page happened to render (which can
    // still produce a small, misleadingly "valid-looking" LCP number).
    // Tagged with the numeric status (not just baked into the message) so
    // the caller can tell "this will never succeed, stop retrying" apart
    // from a transient/flaky error worth retrying.
    if (response && !response.ok()) {
      httpStatus = response.status();
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

  return { ...metrics, error, httpStatus, timedOutWaitingForLcp: settle.timedOut };
}
