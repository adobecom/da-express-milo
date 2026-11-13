const { createHash } = require('node:crypto');
const { writeFileSync } = require('node:fs');
const { chromium } = require('@playwright/test');

const PAGE_URL = 'https://stage--da-express-milo--adobecom.aem.live/express/';
const ASSETS = [
  'https://stage.adobeccstatic.com/unav/1.6/UniversalNav.js',
  'https://stage.adobeccstatic.com/unav/1.6/UniversalNav.css',
];
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.18 Safari/537.36 NALA-Acom';
const REQUEST_HEADERS = [
  'accept', 'accept-encoding', 'accept-language', 'user-agent', 'referer',
  'origin', 'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site',
  'sec-ch-ua', 'sec-ch-ua-platform', 'sec-ch-ua-mobile',
];

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requestHeaders(headers) {
  return Object.fromEntries(Object.entries(headers)
    .filter(([name]) => REQUEST_HEADERS.includes(name.toLowerCase())));
}

function requestMetadata(headers) {
  return Object.fromEntries(Object.entries(requestHeaders(headers))
    .map(([name, value]) => [name.toLowerCase(), hash(String(value))]));
}

function responseMetadata(headers) {
  const normalized = Object.fromEntries(Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), String(value)]));
  const mimeType = normalized['content-type']?.split(';')[0].trim().toLowerCase();
  const knownTypes = [
    'application/javascript', 'application/x-javascript', 'text/javascript',
    'text/css', 'text/html', 'application/json', 'text/plain',
    'application/octet-stream',
  ];
  const allowOrigin = normalized['access-control-allow-origin'];
  const contentEncoding = normalized['content-encoding'];
  return {
    contentType: knownTypes.includes(mimeType) ? mimeType : (mimeType ? 'other' : null),
    contentTypeHash: normalized['content-type'] ? hash(normalized['content-type']) : null,
    contentLength: /^\d+$/.test(normalized['content-length'] || '') ? Number(normalized['content-length']) : null,
    contentEncoding: ['gzip', 'deflate', 'br', 'zstd', 'identity'].includes(contentEncoding) ? contentEncoding : (contentEncoding ? 'other' : null),
    nosniff: normalized['x-content-type-options']?.toLowerCase() === 'nosniff',
    allowOrigin: ['*', new URL(PAGE_URL).origin].includes(allowOrigin) ? allowOrigin : (allowOrigin ? 'other' : null),
    redirect: Boolean(normalized.location),
  };
}

function errorCode(error) {
  const code = error.cause?.code || error.code;
  return typeof code === 'string' && /^[A-Z_]{1,80}$/.test(code) ? code : 'UNCLASSIFIED_ERROR';
}

async function httpProbe(url, headers) {
  try {
    const response = await fetch(url, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
    const body = Buffer.from(await response.arrayBuffer());
    const prefix = body.subarray(0, 4096).toString('utf8');
    const html = /^\s*(?:<!doctype html|<html|<head|<body)/i.test(prefix);
    return {
      request: requestMetadata(headers),
      status: response.status,
      headers: responseMetadata(Object.fromEntries(response.headers)),
      bodySize: body.length,
      bodyHash: hash(body),
      bodyLooksLikeHtml: html,
      htmlMentionsAccessDenied: html && /access denied|request blocked|forbidden/i.test(prefix),
      htmlMentionsChallenge: html && /captcha|challenge|verify.{0,30}human/i.test(prefix),
    };
  } catch (error) {
    return { request: requestMetadata(headers), transportError: errorCode(error) };
  }
}

async function browserProbe() {
  const browser = await chromium.launch({ headless: true });
  let timer;
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: USER_AGENT,
    });
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    const records = ASSETS.map((url) => ({ url, responses: [], loading: null }));
    const requests = new Map();
    const pendingRequests = new Map();
    const pendingResponses = new Map();
    const capturedHeaders = new Map();
    let complete;
    const finished = new Promise((resolve) => { complete = resolve; });
    timer = setTimeout(() => complete(false), 30000);

    session.on('Network.requestWillBeSent', (event) => {
      const previous = requests.get(event.requestId);
      if (previous && event.redirectResponse) {
        previous.responses.push({
          source: 'redirectResponse',
          status: event.redirectResponse.status,
          headers: responseMetadata(event.redirectResponse.headers),
        });
      }
      const record = records.find((candidate) => candidate.url === event.request.url);
      if (!record) return;
      requests.set(event.requestId, record);
      record.request = requestMetadata(event.request.headers);
      capturedHeaders.set(record.url, requestHeaders(event.request.headers));
      if (pendingRequests.has(event.requestId)) {
        const headers = pendingRequests.get(event.requestId);
        record.networkRequest = requestMetadata(headers);
        capturedHeaders.set(record.url, headers);
      }
      if (pendingResponses.has(event.requestId)) {
        record.responses.push(pendingResponses.get(event.requestId));
      }
    });
    session.on('Network.requestWillBeSentExtraInfo', (event) => {
      const headers = requestHeaders(event.headers);
      const record = requests.get(event.requestId);
      if (record) {
        record.networkRequest = requestMetadata(headers);
        capturedHeaders.set(record.url, headers);
      } else {
        pendingRequests.set(event.requestId, headers);
      }
    });
    session.on('Network.responseReceivedExtraInfo', (event) => {
      const response = {
        source: 'responseReceivedExtraInfo',
        status: event.statusCode,
        headers: responseMetadata(event.headers),
      };
      const record = requests.get(event.requestId);
      if (record) record.responses.push(response);
      else pendingResponses.set(event.requestId, response);
    });
    session.on('Network.responseReceived', (event) => {
      const record = requests.get(event.requestId);
      if (record) {
        record.responses.push({
          source: 'responseReceived',
          status: event.response.status,
          headers: responseMetadata(event.response.headers),
          fromDiskCache: event.response.fromDiskCache,
          fromServiceWorker: event.response.fromServiceWorker,
        });
      }
    });
    const finishRequest = (event, failed) => {
      const record = requests.get(event.requestId);
      if (!record) return;
      record.loading = {
        failed,
        errorCode: /^net::ERR_[A-Z_.]+$/.test(event.errorText || '') ? event.errorText : null,
        blockedReasonHash: event.blockedReason ? hash(event.blockedReason) : null,
      };
      if (records.every((candidate) => candidate.loading)) complete(true);
    };
    session.on('Network.loadingFailed', (event) => finishRequest(event, true));
    session.on('Network.loadingFinished', (event) => finishRequest(event, false));
    await session.send('Network.enable');
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const assetRequestsComplete = await finished;
    clearTimeout(timer);
    const report = {
      browserVersion: browser.version(),
      assetRequestsComplete,
      assets: records,
    };
    return { report, capturedHeaders };
  } finally {
    clearTimeout(timer);
    await browser.close();
  }
}

async function main() {
  const { report, capturedHeaders } = await browserProbe();
  const http = await Promise.all(ASSETS.map(async (url) => ({
    url,
    plain: await httpProbe(url, {}),
    browserHeaders: capturedHeaders.has(url)
      ? await httpProbe(url, capturedHeaders.get(url))
      : { requestNotCaptured: true },
  })));
  const output = JSON.stringify({
    diagnosticOnly: true,
    nodeVersion: process.version,
    uid: process.getuid?.(),
    browser: report,
    http,
  }, null, 2);
  if (process.env.UNAV_DIAGNOSTIC_REPORT) {
    writeFileSync(process.env.UNAV_DIAGNOSTIC_REPORT, output);
  }
  console.log(output);
  if (!report.assetRequestsComplete) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ diagnosticError: errorCode(error) }));
  process.exitCode = 1;
});
