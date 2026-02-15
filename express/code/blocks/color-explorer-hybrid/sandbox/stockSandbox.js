/**
 * Stock API Sandbox — Isolated test harness for StockProvider
 *
 * Mounts an interactive UI inside the color-explorer-hybrid block that lets you
 * invoke every StockProvider method, visualize results, and measure performance.
 *
 * Activation:  ?stocksandbox=true
 * Cleanup:     Delete the sandbox/ folder and the 4-line gate in the block entry.
 */

import { serviceManager, initApiService } from '../../../libs/services/index.js';

/* ================================================================
   State
   ================================================================ */

const state = {
  /** @type {import('../../../libs/services/providers/StockProvider.js').default|null} */
  provider: null,
  /** @type {Array<{id:number, method:string, params:string, elapsed:number, status:string, payloadSize:number, timestamp:string}>} */
  log: [],
  callCount: 0,
  totalTime: 0,
  totalPayload: 0,
};

/* ================================================================
   Helpers
   ================================================================ */

/** Approximate byte-length of a JSON-serialisable value. */
function byteSize(value) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

/** Human-readable byte string. */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Shorthand element builder. */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') node.className = v;
    else if (k === 'textContent') node.textContent = v;
    else if (k === 'innerHTML') { node.innerHTML = v; } else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  });
  children.forEach((c) => {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  });
  return node;
}

/* ================================================================
   Dashboard — live metrics
   ================================================================ */

const dashEls = {};

function createDashboard() {
  function metric(id, label, initial) {
    const valueEl = el('span', { className: 'stock-sandbox-metric-value', textContent: initial });
    const container = el('div', { className: 'stock-sandbox-metric' }, [
      valueEl,
      el('span', { className: 'stock-sandbox-metric-label', textContent: label }),
    ]);
    dashEls[id] = valueEl;
    return container;
  }
  return el('div', { className: 'stock-sandbox-dashboard' }, [
    metric('calls', 'Total Calls', '0'),
    metric('avg', 'Avg Latency', '0 ms'),
    metric('total', 'Total Time', '0 ms'),
    metric('payload', 'Total Payload', '0 B'),
  ]);
}

function refreshDashboard() {
  dashEls.calls.textContent = String(state.callCount);
  const avg = state.callCount ? Math.round(state.totalTime / state.callCount) : 0;
  dashEls.avg.textContent = `${avg} ms`;
  dashEls.total.textContent = `${Math.round(state.totalTime)} ms`;
  dashEls.payload.textContent = formatBytes(state.totalPayload);
}

/* ================================================================
   Call History Log
   ================================================================ */

let logTbody = null;
let logEmptyRow = null;

function createLogSection() {
  logTbody = el('tbody');
  logEmptyRow = el('tr', {}, [
    el('td', { colSpan: '6', className: 'stock-sandbox-log-empty', textContent: 'No calls yet — run a test above.' }),
  ]);
  logTbody.appendChild(logEmptyRow);

  const table = el('table', { className: 'stock-sandbox-log-table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', { textContent: '#' }),
        el('th', { textContent: 'Method' }),
        el('th', { textContent: 'Params' }),
        el('th', { textContent: 'Time' }),
        el('th', { textContent: 'Size' }),
        el('th', { textContent: 'Status' }),
      ]),
    ]),
    logTbody,
  ]);

  const exportBtn = el('button', {
    className: 'stock-sandbox-secondary-btn',
    textContent: 'Export JSON',
    onClick: () => {
      const blob = new Blob([JSON.stringify(state.log, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `stock-sandbox-log-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  });

  const clearBtn = el('button', {
    className: 'stock-sandbox-secondary-btn',
    textContent: 'Clear Log',
    onClick: () => {
      state.log = [];
      state.callCount = 0;
      state.totalTime = 0;
      state.totalPayload = 0;
      logTbody.innerHTML = '';
      logTbody.appendChild(logEmptyRow);
      refreshDashboard();
    },
  });

  return el('div', { className: 'stock-sandbox-log-section' }, [
    el('div', { className: 'stock-sandbox-log-header' }, [
      el('h4', { className: 'stock-sandbox-log-title', textContent: 'Call History' }),
      el('div', { className: 'stock-sandbox-log-actions' }, [exportBtn, clearBtn]),
    ]),
    el('div', { className: 'stock-sandbox-log-table-wrap' }, [table]),
  ]);
}

function addLogRow(entry) {
  if (logEmptyRow?.parentNode) logEmptyRow.remove();
  const row = el('tr', {}, [
    el('td', { textContent: String(entry.id) }),
    el('td', { textContent: entry.method }),
    el('td', { textContent: entry.params }),
    el('td', { textContent: `${Math.round(entry.elapsed)} ms` }),
    el('td', { textContent: formatBytes(entry.payloadSize) }),
    el('td', { innerHTML: entry.status === 'ok' ? '<span style="color:#2d9d78">&#10003; ok</span>' : '<span style="color:#e34850">&#10007; error</span>' }),
  ]);
  logTbody.prepend(row);
}

/* ================================================================
   Timed call wrapper
   ================================================================ */

/**
 * Wraps a provider call with performance measurement.
 *
 * @param {string} method - Method name
 * @param {string} paramSummary - Human-readable params
 * @param {Function} fn - Async function to execute
 * @param {Function} onResult - Callback receiving { result|error, elapsed, status }
 */
async function timedCall(method, paramSummary, fn, onResult) {
  const start = performance.now();
  try {
    const result = await fn();
    const elapsed = performance.now() - start;
    const payloadSize = byteSize(result);
    state.callCount += 1;
    state.totalTime += elapsed;
    state.totalPayload += payloadSize;
    const entry = {
      id: state.callCount,
      method,
      params: paramSummary,
      elapsed,
      status: 'ok',
      payloadSize,
      timestamp: new Date().toISOString(),
    };
    state.log.push(entry);
    addLogRow(entry);
    refreshDashboard();
    onResult({ result, elapsed, status: 'ok', payloadSize });
  } catch (error) {
    const elapsed = performance.now() - start;
    state.callCount += 1;
    state.totalTime += elapsed;
    const entry = {
      id: state.callCount,
      method,
      params: paramSummary,
      elapsed,
      status: 'error',
      payloadSize: 0,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
    state.log.push(entry);
    addLogRow(entry);
    refreshDashboard();
    onResult({ error, elapsed, status: 'error', payloadSize: 0 });
  }
}

/* ================================================================
   Result Renderers
   ================================================================ */

function renderStatusBar(container, { status, elapsed, payloadSize, count }) {
  container.innerHTML = '';
  const cls = status === 'ok' ? 'is-ok' : 'is-error';
  const tags = [
    el('span', {
      className: `stock-sandbox-tag ${status === 'ok' ? 'stock-sandbox-tag--ok' : 'stock-sandbox-tag--error'}`,
      textContent: status === 'ok' ? '✓ OK' : '✗ Error',
    }),
    el('span', { className: 'stock-sandbox-tag stock-sandbox-tag--time', textContent: `${Math.round(elapsed)} ms` }),
  ];
  if (payloadSize) {
    tags.push(el('span', { className: 'stock-sandbox-tag stock-sandbox-tag--size', textContent: formatBytes(payloadSize) }));
  }
  if (count !== undefined) {
    tags.push(el('span', { className: 'stock-sandbox-tag stock-sandbox-tag--count', textContent: `${count} results` }));
  }
  container.appendChild(el('div', { className: `stock-sandbox-result-status ${cls}` }, tags));
}

function renderThumbnails(container, themes) {
  container.innerHTML = '';
  if (!themes?.length) return;
  const grid = el('div', { className: 'stock-sandbox-thumbs' });
  themes.slice(0, 36).forEach((item) => {
    const url = item.thumbnail_url || item.thumbnail_240_url || item.thumbnail_110_url || '';
    const label = item.title || item.id || '';
    const thumb = el('div', { className: 'stock-sandbox-thumb' }, [
      url ? el('img', { src: url, alt: label, loading: 'lazy' }) : el('div', { textContent: 'No img', style: 'display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:#999' }),
      el('div', { className: 'stock-sandbox-thumb-overlay', textContent: String(label).slice(0, 60) }),
    ]);
    grid.appendChild(thumb);
  });
  container.appendChild(grid);
}

function renderJsonToggle(container, data) {
  container.innerHTML = '';
  const viewer = el('pre', { className: 'stock-sandbox-json-viewer' });
  try {
    viewer.textContent = JSON.stringify(data, null, 2);
  } catch {
    viewer.textContent = String(data);
  }
  const toggle = el('button', {
    className: 'stock-sandbox-json-toggle',
    textContent: '▸ Show raw JSON',
    onClick: () => {
      const open = viewer.classList.toggle('is-open');
      toggle.textContent = open ? '▾ Hide raw JSON' : '▸ Show raw JSON';
    },
  });
  container.append(toggle, viewer);
}

function renderError(container, error) {
  container.innerHTML = '';
  container.appendChild(el('div', {
    className: 'stock-sandbox-init-error',
    textContent: `Error: ${error?.message || error}`,
  }));
}

/* ================================================================
   Panel Builders — one per StockProvider method
   ================================================================ */

function createPanel(title, typeLabel, buildBody) {
  const body = el('div', { className: 'stock-sandbox-panel-body' });
  buildBody(body);
  const chevron = el('span', { className: 'stock-sandbox-panel-chevron', textContent: '▾' });
  const panel = el('div', { className: 'stock-sandbox-panel is-open' }, [
    el('div', {
      className: 'stock-sandbox-panel-header',
      onClick: () => panel.classList.toggle('is-open'),
    }, [
      el('span', {}, [
        el('span', { className: 'stock-sandbox-panel-title', textContent: title }),
        el('span', { className: 'stock-sandbox-panel-type', textContent: typeLabel }),
      ]),
      chevron,
    ]),
    body,
  ]);
  return panel;
}

/* ---------- 1. searchThemes ---------- */
function panelSearchThemes() {
  return createPanel('searchThemes', 'async — Search/Files API', (body) => {
    const queryInput = el('input', { className: 'stock-sandbox-input stock-sandbox-input--wide', placeholder: 'e.g. sunset, ocean, mountains…', value: 'sunset' });
    const pageInput = el('input', { className: 'stock-sandbox-input stock-sandbox-input--narrow', type: 'number', value: '1', min: '1' });
    const statusContainer = el('div');
    const thumbsContainer = el('div');
    const jsonContainer = el('div');

    const runBtn = el('button', {
      className: 'stock-sandbox-run-btn',
      textContent: 'Run',
      onClick: async () => {
        runBtn.disabled = true;
        runBtn.textContent = 'Running…';
        statusContainer.innerHTML = '<div class="stock-sandbox-result-status is-loading"><span>Loading…</span></div>';
        thumbsContainer.innerHTML = '';
        jsonContainer.innerHTML = '';
        const q = queryInput.value.trim() || 'sunset';
        const p = Number.parseInt(pageInput.value, 10) || 1;
        await timedCall('searchThemes', `query="${q}", page=${p}`, () => state.provider.searchThemes(q, { page: p }), (res) => {
          if (res.status === 'ok') {
            const themes = res.result?.themes || [];
            renderStatusBar(statusContainer, { ...res, count: res.result?.nb_results ?? themes.length });
            renderThumbnails(thumbsContainer, themes);
            renderJsonToggle(jsonContainer, res.result);
          } else {
            renderStatusBar(statusContainer, res);
            renderError(jsonContainer, res.error);
          }
        });
        runBtn.disabled = false;
        runBtn.textContent = 'Run';
      },
    });

    body.append(
      el('div', { className: 'stock-sandbox-form' }, [
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'Query' }), queryInput]),
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'Page' }), pageInput]),
        runBtn,
      ]),
      el('div', { className: 'stock-sandbox-result' }, [statusContainer, thumbsContainer, jsonContainer]),
    );
  });
}

/* ---------- 2. getCuratedGalleries ---------- */
function panelGetCuratedGalleries() {
  return createPanel('getCuratedGalleries', 'async — static list', (body) => {
    const statusContainer = el('div');
    const jsonContainer = el('div');

    const runBtn = el('button', {
      className: 'stock-sandbox-run-btn',
      textContent: 'Run',
      onClick: async () => {
        runBtn.disabled = true;
        runBtn.textContent = 'Running…';
        statusContainer.innerHTML = '<div class="stock-sandbox-result-status is-loading"><span>Loading…</span></div>';
        jsonContainer.innerHTML = '';
        await timedCall('getCuratedGalleries', '(none)', () => state.provider.getCuratedGalleries(), (res) => {
          if (res.status === 'ok') {
            const count = res.result?.themes?.length || 0;
            renderStatusBar(statusContainer, { ...res, count });
            renderJsonToggle(jsonContainer, res.result);
          } else {
            renderStatusBar(statusContainer, res);
            renderError(jsonContainer, res.error);
          }
        });
        runBtn.disabled = false;
        runBtn.textContent = 'Run';
      },
    });

    body.append(
      el('div', { className: 'stock-sandbox-form' }, [runBtn]),
      el('div', { className: 'stock-sandbox-result' }, [statusContainer, jsonContainer]),
    );
  });
}

/* ---------- 3. getGalleryByName ---------- */
function panelGetGalleryByName() {
  return createPanel('getGalleryByName', 'async — gallery search', (body) => {
    const nameSelect = el('select', { className: 'stock-sandbox-select' }, [
      el('option', { value: 'Wilderness', textContent: 'Wilderness' }),
      el('option', { value: 'Flavour', textContent: 'Flavour' }),
      el('option', { value: 'Travel', textContent: 'Travel' }),
    ]);
    const pageInput = el('input', { className: 'stock-sandbox-input stock-sandbox-input--narrow', type: 'number', value: '1', min: '1' });
    const statusContainer = el('div');
    const thumbsContainer = el('div');
    const jsonContainer = el('div');

    const runBtn = el('button', {
      className: 'stock-sandbox-run-btn',
      textContent: 'Run',
      onClick: async () => {
        runBtn.disabled = true;
        runBtn.textContent = 'Running…';
        statusContainer.innerHTML = '<div class="stock-sandbox-result-status is-loading"><span>Loading…</span></div>';
        thumbsContainer.innerHTML = '';
        jsonContainer.innerHTML = '';
        const name = nameSelect.value;
        const p = Number.parseInt(pageInput.value, 10) || 1;
        await timedCall('getGalleryByName', `name="${name}", page=${p}`, () => state.provider.getGalleryByName(name, { page: p }), (res) => {
          if (res.status === 'ok') {
            const themes = res.result?.themes || [];
            renderStatusBar(statusContainer, { ...res, count: res.result?.nb_results ?? themes.length });
            renderThumbnails(thumbsContainer, themes);
            renderJsonToggle(jsonContainer, res.result);
          } else {
            renderStatusBar(statusContainer, res);
            renderError(jsonContainer, res.error);
          }
        });
        runBtn.disabled = false;
        runBtn.textContent = 'Run';
      },
    });

    body.append(
      el('div', { className: 'stock-sandbox-form' }, [
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'Gallery' }), nameSelect]),
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'Page' }), pageInput]),
        runBtn,
      ]),
      el('div', { className: 'stock-sandbox-result' }, [statusContainer, thumbsContainer, jsonContainer]),
    );
  });
}

/* ---------- 4. checkDataAvailability ---------- */
function panelCheckDataAvailability() {
  return createPanel('checkDataAvailability', 'async — endpoint probe', (body) => {
    const endpointInput = el('input', { className: 'stock-sandbox-input stock-sandbox-input--wide', placeholder: 'Full endpoint URL…' });
    const statusContainer = el('div');
    const jsonContainer = el('div');

    const runBtn = el('button', {
      className: 'stock-sandbox-run-btn',
      textContent: 'Run',
      onClick: async () => {
        const endpoint = endpointInput.value.trim();
        if (!endpoint) {
          renderError(statusContainer, { message: 'Enter an endpoint URL' });
          return;
        }
        runBtn.disabled = true;
        runBtn.textContent = 'Running…';
        statusContainer.innerHTML = '<div class="stock-sandbox-result-status is-loading"><span>Loading…</span></div>';
        jsonContainer.innerHTML = '';
        await timedCall('checkDataAvailability', `url="${endpoint.slice(0, 80)}…"`, () => state.provider.checkDataAvailability(endpoint), (res) => {
          if (res.status === 'ok') {
            renderStatusBar(statusContainer, res);
            renderJsonToggle(jsonContainer, { available: res.result });
          } else {
            renderStatusBar(statusContainer, res);
            renderError(jsonContainer, res.error);
          }
        });
        runBtn.disabled = false;
        runBtn.textContent = 'Run';
      },
    });

    body.append(
      el('div', { className: 'stock-sandbox-form' }, [
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'Endpoint URL' }), endpointInput]),
        runBtn,
      ]),
      el('div', { className: 'stock-sandbox-result' }, [statusContainer, jsonContainer]),
    );
  });
}

/* ---------- 5. getFileRedirectUrl ---------- */
function panelGetFileRedirectUrl() {
  return createPanel('getFileRedirectUrl', 'sync — URL builder', (body) => {
    const idInput = el('input', { className: 'stock-sandbox-input', placeholder: 'File ID, e.g. 123456789', type: 'text' });
    const statusContainer = el('div');
    const urlContainer = el('div');

    const runBtn = el('button', {
      className: 'stock-sandbox-run-btn',
      textContent: 'Run',
      onClick: () => {
        const fileId = idInput.value.trim();
        if (!fileId) {
          renderError(statusContainer, { message: 'Enter a file ID' });
          return;
        }
        const start = performance.now();
        try {
          const url = state.provider.getFileRedirectUrl(fileId);
          const elapsed = performance.now() - start;
          const payloadSize = byteSize(url);
          state.callCount += 1;
          state.totalTime += elapsed;
          state.totalPayload += payloadSize;
          const entry = {
            id: state.callCount,
            method: 'getFileRedirectUrl',
            params: `fileId="${fileId}"`,
            elapsed,
            status: 'ok',
            payloadSize,
            timestamp: new Date().toISOString(),
          };
          state.log.push(entry);
          addLogRow(entry);
          refreshDashboard();
          renderStatusBar(statusContainer, { status: 'ok', elapsed, payloadSize });
          urlContainer.innerHTML = '';
          urlContainer.appendChild(el('div', { className: 'stock-sandbox-url-result' }, [
            el('a', { href: url, target: '_blank', rel: 'noopener', textContent: url }),
          ]));
        } catch (error) {
          const elapsed = performance.now() - start;
          state.callCount += 1;
          state.totalTime += elapsed;
          const entry = {
            id: state.callCount,
            method: 'getFileRedirectUrl',
            params: `fileId="${fileId}"`,
            elapsed,
            status: 'error',
            payloadSize: 0,
            timestamp: new Date().toISOString(),
            error: error.message,
          };
          state.log.push(entry);
          addLogRow(entry);
          refreshDashboard();
          renderStatusBar(statusContainer, { status: 'error', elapsed, payloadSize: 0 });
          renderError(urlContainer, error);
        }
      },
    });

    body.append(
      el('div', { className: 'stock-sandbox-form' }, [
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'File ID' }), idInput]),
        runBtn,
      ]),
      el('div', { className: 'stock-sandbox-result' }, [statusContainer, urlContainer]),
    );
  });
}

/* ---------- 6. getContributorUrl ---------- */
function panelGetContributorUrl() {
  return createPanel('getContributorUrl', 'sync — URL builder', (body) => {
    const idInput = el('input', { className: 'stock-sandbox-input', placeholder: 'Creator ID, e.g. 200123456', type: 'text' });
    const statusContainer = el('div');
    const urlContainer = el('div');

    const runBtn = el('button', {
      className: 'stock-sandbox-run-btn',
      textContent: 'Run',
      onClick: () => {
        const creatorId = idInput.value.trim();
        if (!creatorId) {
          renderError(statusContainer, { message: 'Enter a creator ID' });
          return;
        }
        const start = performance.now();
        try {
          const url = state.provider.getContributorUrl(creatorId);
          const elapsed = performance.now() - start;
          const payloadSize = byteSize(url);
          state.callCount += 1;
          state.totalTime += elapsed;
          state.totalPayload += payloadSize;
          const entry = {
            id: state.callCount,
            method: 'getContributorUrl',
            params: `creatorId="${creatorId}"`,
            elapsed,
            status: 'ok',
            payloadSize,
            timestamp: new Date().toISOString(),
          };
          state.log.push(entry);
          addLogRow(entry);
          refreshDashboard();
          renderStatusBar(statusContainer, { status: 'ok', elapsed, payloadSize });
          urlContainer.innerHTML = '';
          urlContainer.appendChild(el('div', { className: 'stock-sandbox-url-result' }, [
            el('a', { href: url, target: '_blank', rel: 'noopener', textContent: url }),
          ]));
        } catch (error) {
          const elapsed = performance.now() - start;
          state.callCount += 1;
          state.totalTime += elapsed;
          const entry = {
            id: state.callCount,
            method: 'getContributorUrl',
            params: `creatorId="${creatorId}"`,
            elapsed,
            status: 'error',
            payloadSize: 0,
            timestamp: new Date().toISOString(),
            error: error.message,
          };
          state.log.push(entry);
          addLogRow(entry);
          refreshDashboard();
          renderStatusBar(statusContainer, { status: 'error', elapsed, payloadSize });
          renderError(urlContainer, error);
        }
      },
    });

    body.append(
      el('div', { className: 'stock-sandbox-form' }, [
        el('div', { className: 'stock-sandbox-field' }, [el('label', { className: 'stock-sandbox-label', textContent: 'Creator ID' }), idInput]),
        runBtn,
      ]),
      el('div', { className: 'stock-sandbox-result' }, [statusContainer, urlContainer]),
    );
  });
}

/* ================================================================
   Resource Timing Observer
   ================================================================ */

let resTimingContainer = null;

function createResourceTimingPanel() {
  resTimingContainer = el('div');
  const clearBtn = el('button', {
    className: 'stock-sandbox-secondary-btn',
    textContent: 'Refresh',
    onClick: () => renderResourceTimings(),
  });

  return createPanel('Resource Timing (PerformanceObserver)', 'browser-level fetch metrics', (body) => {
    body.append(
      el('div', { className: 'stock-sandbox-form' }, [clearBtn]),
      resTimingContainer,
    );
  });
}

function renderResourceTimings() {
  if (!resTimingContainer) return;
  resTimingContainer.innerHTML = '';

  const entries = performance.getEntriesByType('resource')
    .filter((e) => e.name.includes('stock') || e.name.includes('Stock'))
    .slice(-20);

  if (!entries.length) {
    resTimingContainer.appendChild(el('div', {
      className: 'stock-sandbox-log-empty',
      textContent: 'No Stock-related resource timing entries yet.',
    }));
    return;
  }

  const thead = el('thead', {}, [
    el('tr', {}, [
      el('th', { textContent: 'URL' }),
      el('th', { textContent: 'DNS' }),
      el('th', { textContent: 'TCP' }),
      el('th', { textContent: 'TTFB' }),
      el('th', { textContent: 'Download' }),
      el('th', { textContent: 'Total' }),
    ]),
  ]);

  const tbody = el('tbody');
  entries.forEach((e) => {
    const dns = Math.round(e.domainLookupEnd - e.domainLookupStart);
    const tcp = Math.round(e.connectEnd - e.connectStart);
    const ttfb = Math.round(e.responseStart - e.requestStart);
    const dl = Math.round(e.responseEnd - e.responseStart);
    const total = Math.round(e.responseEnd - e.startTime);
    const shortUrl = e.name.length > 80 ? `${e.name.slice(0, 77)}…` : e.name;
    tbody.appendChild(el('tr', {}, [
      el('td', { textContent: shortUrl, title: e.name }),
      el('td', { textContent: `${dns}ms` }),
      el('td', { textContent: `${tcp}ms` }),
      el('td', { textContent: `${ttfb}ms` }),
      el('td', { textContent: `${dl}ms` }),
      el('td', { textContent: `${total}ms` }),
    ]));
  });

  const table = el('table', { className: 'stock-sandbox-log-table' }, [thead, tbody]);
  resTimingContainer.appendChild(el('div', { className: 'stock-sandbox-log-table-wrap' }, [table]));
}

/* ================================================================
   Mount
   ================================================================ */

/**
 * Mount the Stock API Sandbox into the given block element.
 * @param {HTMLElement} block
 */
export async function mountStockSandbox(block) {
  /* Load isolated styles */
  const cssPath = new URL('./stockSandbox.css', import.meta.url).href;
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }

  /* Build shell */
  const root = el('div', { className: 'stock-sandbox-root' });

  const closeBtn = el('button', {
    className: 'stock-sandbox-close-btn',
    textContent: '✕',
    title: 'Close sandbox',
    onClick: () => root.remove(),
  });

  root.appendChild(el('div', { className: 'stock-sandbox-header' }, [
    el('h3', { className: 'stock-sandbox-title' }, [
      document.createTextNode('Stock API Sandbox'),
      el('span', { className: 'stock-sandbox-badge', textContent: 'DEV' }),
    ]),
    closeBtn,
  ]));

  /* Dashboard */
  root.appendChild(createDashboard());

  /* Loading message while we init */
  const initMsg = el('div', { className: 'stock-sandbox-init-status', textContent: 'Initializing service layer…' });
  root.appendChild(initMsg);
  block.appendChild(root);

  /* Init provider */
  try {
    await initApiService();
    state.provider = await serviceManager.getProvider('stock');
    if (!state.provider) throw new Error('Stock provider returned null — is ENABLE_STOCK feature flag on?');
  } catch (err) {
    initMsg.className = 'stock-sandbox-init-error';
    initMsg.textContent = `Failed to initialise Stock provider: ${err.message}`;
    console.error('[StockSandbox]', err);
    return;
  }
  initMsg.remove();

  /* Panels */
  const panels = el('div', { className: 'stock-sandbox-panels' }, [
    panelSearchThemes(),
    panelGetCuratedGalleries(),
    panelGetGalleryByName(),
    panelCheckDataAvailability(),
    panelGetFileRedirectUrl(),
    panelGetContributorUrl(),
    createResourceTimingPanel(),
  ]);
  root.appendChild(panels);

  /* Call history log */
  root.appendChild(createLogSection());

  console.log('[StockSandbox] Mounted successfully');
}
