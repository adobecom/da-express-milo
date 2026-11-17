const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { EventEmitter } = require('node:events');
const { request } = require('@playwright/test');
const sinon = require('sinon');
const {
  safeHeaders, safeRedirect, probeAsset, startDiagnostic,
} = require('../../nala/utils/unav-diagnostic.cjs');
const DiagnosticReporter = require('../../nala/utils/unav-diagnostic.reporter.cjs');

const ASSET = 'https://cdn.example.test/unav/1.6/UniversalNav.js';

function fakeResponse(status, headers, body = '') {
  return {
    status: () => status,
    headers: () => headers,
    body: sinon.stub().resolves(Buffer.from(body)),
    dispose: sinon.stub().resolves(),
  };
}

test('diagnostic metadata drops credentials, cookies and arbitrary headers', () => {
  assert.deepEqual(safeHeaders({
    'Content-Type': 'text/javascript',
    Authorization: 'secret',
    'Set-Cookie': 'session=secret',
    Location: 'https://auth.example.test/?token=secret',
    'X-Private': 'secret',
    Server: 's'.repeat(300),
  }), { 'content-type': 'text/javascript', server: 's'.repeat(256) });
});

test('redirect policy accepts only the same exact asset without query or credentials', () => {
  assert.equal(safeRedirect(ASSET, ASSET), true);
  for (const target of [
    'https://other.example.test/unav/1.6/UniversalNav.js',
    `${ASSET}?token=secret`,
    `${ASSET}#fragment`,
    'https://user:secret@cdn.example.test/unav/1.6/UniversalNav.js',
    '/challenge',
    'https://[',
    undefined,
  ]) {
    assert.equal(safeRedirect(ASSET, target), false);
  }
});

test('API probe records digest and classification, never body text', async () => {
  const body = 'window.example = true;';
  const response = fakeResponse(200, { 'content-type': 'text/javascript' }, body);
  const api = { get: sinon.stub().resolves(response) };
  const result = await probeAsset(api, ASSET);
  assert.equal(result.ok, true);
  assert.equal(result.classification, 'non-markup');
  assert.equal(result.sha256, createHash('sha256').update(body).digest('hex'));
  assert.equal(JSON.stringify(result).includes(body), false);
  assert.equal(api.get.firstCall.args[1].maxRedirects, 0);
  sinon.assert.calledOnce(response.dispose);
});

test('API probe refuses off-origin redirects before making another request', async () => {
  const response = fakeResponse(302, { location: 'https://auth.example.test/?token=secret' });
  const api = { get: sinon.stub().resolves(response) };
  const result = await probeAsset(api, ASSET);
  assert.equal(result.ok, false);
  assert.equal(result.responses[0].redirectClassification, 'different-origin');
  assert.equal(JSON.stringify(result).includes('secret'), false);
  sinon.assert.calledOnce(api.get);
  sinon.assert.notCalled(response.body);
  sinon.assert.calledOnce(response.dispose);
});

test('API probe bounds allowed redirect loops to three requests', async () => {
  const response = fakeResponse(302, { location: ASSET });
  const api = { get: sinon.stub().resolves(response) };
  const result = await probeAsset(api, ASSET);
  assert.equal(result.ok, false);
  sinon.assert.calledThrice(api.get);
  sinon.assert.calledThrice(response.dispose);
});

test('API probe fails on challenges, empty bodies, wrong MIME and HTTP errors', async () => {
  for (const [status, mime, body] of [
    [200, 'text/javascript', '<html>challenge</html>'],
    [200, 'text/javascript', '{"error":"challenge"}'],
    [200, 'text/javascript', ''],
    [200, 'text/html', 'not javascript'],
    [403, 'text/javascript', 'window.denied = true;'],
  ]) {
    const api = { get: sinon.stub().resolves(fakeResponse(status, { 'content-type': mime }, body)) };
    assert.equal((await probeAsset(api, ASSET)).ok, false);
  }
});

test('diagnostic reporter never emits raw test output or error URLs', () => {
  const info = sinon.stub(console, 'info');
  const error = sinon.stub(console, 'error');
  try {
    const reporter = new DiagnosticReporter();
    reporter.onTestEnd({}, {
      status: 'failed',
      errors: [{ message: 'https://auth.example.test/?token=secret' }],
      stdout: ['secret'],
      attachments: [{ name: 'screenshot', body: Buffer.from('secret') }],
    });
    reporter.onError(new Error('secret'));
    assert.equal(JSON.stringify([...info.args, ...error.args]).includes('secret'), false);
    assert.equal(reporter.onStdOut, undefined);
    assert.equal(reporter.onStdErr, undefined);
  } finally {
    info.restore();
    error.restore();
  }
});

test('CDP diagnostic ignores unrelated URLs and fails closed on an API error', async () => {
  const session = new EventEmitter();
  session.send = sinon.stub().resolves();
  session.detach = sinon.stub().resolves();
  const page = {
    context: () => ({
      newCDPSession: async () => session,
      browser: () => ({ version: () => 'test-browser' }),
    }),
  };
  const api = {
    get: sinon.stub().rejects(new Error('https://auth.example.test/?token=secret')),
    dispose: sinon.stub().resolves(),
  };
  const newContext = sinon.stub(request, 'newContext').resolves(api);
  const testInfo = {
    project: { use: { userAgent: 'test-user-agent' } },
    attach: sinon.stub().resolves(),
  };
  try {
    const finish = await startDiagnostic(page);
    session.emit('Network.requestWillBeSent', {
      requestId: 'private',
      request: { url: 'https://auth.example.test/?token=secret' },
    });
    session.emit('Network.responseReceivedExtraInfo', {
      requestId: 'private',
      statusCode: 403,
      headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'secret' },
    });
    await assert.rejects(finish(testInfo), /diagnostic incomplete or API probe failed/);
    const report = JSON.parse(testInfo.attach.firstCall.args[1].body);
    assert.deepEqual(report.browser, []);
    assert.equal(report.browserObservedBothAssets, false);
    assert.equal(report.api.length, 2);
    assert.ok(report.api.every((entry) => entry.ok === false));
    assert.equal(JSON.stringify(report).includes('secret'), false);
    assert.deepEqual(newContext.firstCall.args[0].storageState, { cookies: [], origins: [] });
    sinon.assert.calledOnce(api.dispose);
    sinon.assert.calledOnce(session.detach);
  } finally {
    newContext.restore();
  }
});
