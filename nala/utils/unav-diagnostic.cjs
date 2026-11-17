const { createHash } = require('crypto');
const { request } = require('@playwright/test');
const { version: playwrightVersion } = require('@playwright/test/package.json');

const BASE_URL = 'https://stage--da-express-milo--adobecom.aem.live';
const ASSET_URLS = [
  'https://stage.adobeccstatic.com/unav/1.6/UniversalNav.js',
  'https://stage.adobeccstatic.com/unav/1.6/UniversalNav.css',
];
const HEADER_NAMES = new Set([
  'content-type', 'content-length', 'server', 'x-content-type-options',
  'cross-origin-resource-policy', 'access-control-allow-origin',
]);
const MAX_EVENTS = 64;

function safeHeaders(headers) {
  return Object.fromEntries(Object.entries(headers)
    .filter(([name]) => HEADER_NAMES.has(name.toLowerCase()))
    .map(([name, value]) => [name.toLowerCase(), String(value).slice(0, 256)]));
}

function classifyBody(body) {
  const prefix = body.subarray(0, 2048).toString('utf8').trimStart();
  if (prefix.startsWith('<')) return 'markup';
  if (prefix.startsWith('{') || prefix.startsWith('[')) {
    try {
      JSON.parse(body.toString('utf8'));
      return 'json';
    } catch {
      return 'non-markup';
    }
  }
  return 'non-markup';
}

function classifyRedirect(from, location) {
  if (!location) return 'missing-location';
  let target;
  try {
    target = new URL(location, from);
  } catch {
    return 'invalid-location';
  }
  const source = new URL(from);
  if (target.origin !== source.origin) return 'different-origin';
  if (target.username || target.password) return 'credentials-in-location';
  if (target.search || target.hash) return 'query-or-fragment';
  return target.pathname === source.pathname ? 'same-asset' : 'different-path';
}

function safeRedirect(from, location) {
  return classifyRedirect(from, location) === 'same-asset';
}

async function probeAsset(api, url) {
  const responses = [];
  for (let hop = 0; hop <= 2; hop += 1) {
    const response = await api.get(url, {
      maxRedirects: 0,
      failOnStatusCode: false,
      timeout: 10000,
      headers: {
        Referer: `${BASE_URL}/`,
        Accept: url.endsWith('.css') ? 'text/css,*/*;q=0.1' : '*/*',
      },
    });
    try {
      const status = response.status();
      const headers = response.headers();
      const metadata = { status, headers: safeHeaders(headers) };
      responses.push(metadata);
      if ([301, 302, 303, 307, 308].includes(status)) {
        metadata.redirectClassification = classifyRedirect(url, headers.location);
        metadata.redirectAllowed = safeRedirect(url, headers.location);
        if (!metadata.redirectAllowed || hop === 2) {
          return { ok: false, reason: 'redirect-rejected-or-limit', responses };
        }
      } else {
        const body = await response.body();
        const classification = classifyBody(body);
        const mime = (headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        const expectedMime = url.endsWith('.css')
          ? mime === 'text/css'
          : ['text/javascript', 'application/javascript'].includes(mime);
        return {
          ok: status === 200 && expectedMime && classification === 'non-markup' && body.length > 0,
          responses,
          bytes: body.length,
          classification,
          sha256: createHash('sha256').update(body).digest('hex'),
        };
      }
    } finally {
      await response.dispose();
    }
  }
  throw new Error('Unreachable redirect state.');
}

async function startDiagnostic(page) {
  if (process.env.IMS_EMAIL || process.env.IMS_PASS) {
    throw new Error('The UniversalNav diagnostic must run without IMS credentials.');
  }
  const session = await page.context().newCDPSession(page);
  const targets = new Map();
  const events = [];
  let truncated = false;
  const record = (event) => {
    if (events.length < MAX_EVENTS) events.push(event);
    else truncated = true;
  };
  session.on('Network.requestWillBeSent', (event) => {
    if (ASSET_URLS.includes(event.redirectResponse?.url)) {
      record({
        type: 'redirect',
        url: event.redirectResponse.url,
        status: event.redirectResponse.status,
        headers: safeHeaders(event.redirectResponse.headers),
        redirectClassification: classifyRedirect(event.redirectResponse.url, event.request.url),
      });
    }
    if (ASSET_URLS.includes(event.request.url)) targets.set(event.requestId, event.request.url);
    else targets.delete(event.requestId);
  });
  session.on('Network.responseReceived', (event) => {
    if (!targets.has(event.requestId)) return;
    record({
      type: 'response',
      url: targets.get(event.requestId),
      status: event.response.status,
      mimeType: event.response.mimeType,
      protocol: event.response.protocol,
      headers: safeHeaders(event.response.headers),
    });
  });
  session.on('Network.responseReceivedExtraInfo', (event) => {
    if (!targets.has(event.requestId)) return;
    record({
      type: 'response-extra-info',
      url: targets.get(event.requestId),
      status: event.statusCode,
      headers: safeHeaders(event.headers),
    });
  });
  session.on('Network.loadingFailed', (event) => {
    if (!targets.has(event.requestId)) return;
    record({
      type: 'loading-failed',
      url: targets.get(event.requestId),
      error: /^net::ERR_[A-Z0-9_]+$/.test(event.errorText) ? event.errorText : 'network-error',
      blockedReason: event.blockedReason,
    });
  });
  await session.send('Network.enable');

  return async (testInfo) => {
    const report = {
      node: process.version,
      platform: process.platform,
      playwright: playwrightVersion,
      chromium: page.context().browser().version(),
      codeSha: /^[a-f0-9]{40}$/.test(process.env.NALA_DIAGNOSTIC_SHA || '')
        ? process.env.NALA_DIAGNOSTIC_SHA : 'local',
      browser: events,
      api: [],
    };
    // Separate, empty HTTP client: never reuse the browser's IMS cookies or intercept its assets.
    const api = await request.newContext({
      storageState: { cookies: [], origins: [] },
      userAgent: testInfo.project.use.userAgent,
      ignoreHTTPSErrors: false,
    });
    try {
      for (const url of ASSET_URLS) {
        try {
          report.api.push({ url, ...await probeAsset(api, url) });
        } catch {
          // Playwright errors can include headers, bodies and redirect URLs. Never emit them.
          report.api.push({ url, ok: false, reason: 'request-or-body-read-failed' });
        }
      }
    } finally {
      await api.dispose();
      await session.detach();
    }
    report.truncated = truncated;
    report.browserObservedBothAssets = ASSET_URLS.every((url) => events.some((event) => event.url === url));
    await testInfo.attach('unav-diagnostic', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
    if (truncated || !report.browserObservedBothAssets || report.api.some((entry) => !entry.ok)) {
      throw new Error('UniversalNav diagnostic incomplete or API probe failed; see sanitized diagnostic attachment.');
    }
  };
}

module.exports = {
  BASE_URL, safeHeaders, safeRedirect, classifyBody, probeAsset, startDiagnostic,
};
