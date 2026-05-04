/* eslint-disable */
// On-device diagnostic for the color-wheel iOS Safari refresh/crash issue.
// Activated by appending ?cwdiag=1 (or &cwdiag=1) to the URL.
//
// Why: iOS Safari Web Inspector is impractical for this user. We need a
// signal we can read on the device itself, that survives the very page
// refresh we're trying to diagnose. localStorage is the only persistence
// available; an on-screen panel reflects it for the human.

const PARAM = 'cwdiag';
const STORAGE_KEY = 'cwdiag.state.v1';

let active = false;
let initialized = false;
let panel = null;
let _lastRenderAt = 0;

let state = {
  loadAt: 0,
  prevLoadAt: 0,
  lastTickAt: 0,
  lastEventAt: 0,
  dragTickCount: 0,
  events: [],
  lastError: null,
};

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* noop */ }
}

function fmt(t) {
  if (!t) return '—';
  const d = new Date(t);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

function pushEvent(name) {
  const t = Date.now();
  state.lastEventAt = t;
  state.events.push({ t, name });
  if (state.events.length > 60) state.events = state.events.slice(-60);
}

function buildPanel() {
  if (panel || !document.body) return;
  panel = document.createElement('div');
  panel.id = 'cwdiag-panel';
  panel.style.cssText = [
    'position:fixed',
    'bottom:8px',
    'left:8px',
    'z-index:2147483647',
    'width:240px',
    'max-height:50vh',
    'overflow:auto',
    'padding:6px 8px',
    'background:rgba(20,20,20,0.92)',
    'color:#fff',
    'font:10px/1.3 -apple-system,monospace',
    'border-radius:6px',
    'box-shadow:0 4px 14px rgba(0,0,0,0.45)',
    'pointer-events:auto',
    'user-select:text',
    '-webkit-user-select:text',
    'transition:transform 0.15s ease',
  ].join(';');
  document.body.appendChild(panel);
  panel.addEventListener('click', (e) => {
    const action = e.target?.dataset?.cwdiagAction;
    if (action === 'clear') {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      state = {
        loadAt: Date.now(),
        prevLoadAt: 0,
        lastTickAt: 0,
        lastEventAt: 0,
        dragTickCount: 0,
        events: [{ t: Date.now(), name: 'cleared' }],
        lastError: null,
      };
      persist();
      render();
    } else if (action === 'toggle') {
      panel.classList.toggle('cwdiag-collapsed');
      if (panel.classList.contains('cwdiag-collapsed')) {
        panel.style.maxHeight = '20px';
        panel.style.width = '70px';
        panel.style.overflow = 'hidden';
      } else {
        panel.style.maxHeight = '50vh';
        panel.style.width = '240px';
        panel.style.overflow = 'auto';
      }
    }
  });
}

function render() {
  if (!panel) return;
  const now = Date.now();
  const sincePrev = state.prevLoadAt
    ? `${((state.loadAt - state.prevLoadAt) / 1000).toFixed(2)}s before this load`
    : 'first load this session';
  const sinceTick = state.lastTickAt
    ? `${((now - state.lastTickAt) / 1000).toFixed(2)}s ago`
    : '—';
  const tickToReload = state.prevLoadAt && state.lastTickAt && state.lastTickAt < state.loadAt
    ? `${(state.loadAt - state.lastTickAt)}ms before reload`
    : '—';
  const eventsHtml = state.events.slice(-10).reverse()
    .map((e) => `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmt(e.t)} ${escapeHtml(e.name)}</div>`)
    .join('');
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-weight:bold;color:#9bf">cwdiag</span>
      <span data-cwdiag-action="toggle" style="cursor:pointer;color:#9bf;padding:0 6px">▾</span>
    </div>
    <div>load: ${fmt(state.loadAt)}</div>
    <div>prev load: ${fmt(state.prevLoadAt)}</div>
    <div style="color:#fb9">${sincePrev}</div>
    <div>last tick: ${fmt(state.lastTickAt)} (${sinceTick})</div>
    <div style="color:#fb9">tick → reload: ${tickToReload}</div>
    <div>drag ticks (this load): ${state.dragTickCount}</div>
    <div>last error: ${escapeHtml(state.lastError || '—')}</div>
    <div style="margin-top:6px;border-top:1px solid #444;padding-top:4px">${eventsHtml || '<i>no events</i>'}</div>
    <button data-cwdiag-action="clear" style="margin-top:6px;font-size:10px;padding:3px 8px">clear</button>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function init() {
  if (initialized) return;
  initialized = true;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get(PARAM) !== '1') return;
  } catch (_) { return; }

  active = true;

  const persisted = readPersisted() || {};
  const now = Date.now();
  state = {
    loadAt: now,
    prevLoadAt: persisted.loadAt || 0,
    lastTickAt: persisted.lastTickAt || 0,
    lastEventAt: persisted.lastEventAt || 0,
    dragTickCount: 0,
    events: Array.isArray(persisted.events) ? persisted.events.slice(-40) : [],
    lastError: persisted.lastError || null,
  };

  const tickToReloadMs = state.prevLoadAt && state.lastTickAt && state.lastTickAt < state.loadAt
    ? state.loadAt - state.lastTickAt
    : Infinity;
  if (tickToReloadMs < 2000) {
    pushEvent(`!! RELOAD MID-DRAG (+${tickToReloadMs}ms after last tick)`);
  } else if (state.prevLoadAt && state.loadAt - state.prevLoadAt < 5000) {
    pushEvent('!! reload soon after previous load');
  } else {
    pushEvent('load');
  }
  persist();

  const mount = () => { buildPanel(); render(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  window.addEventListener('error', (e) => {
    state.lastError = `${e.message || 'error'} @ ${e.filename || '?'}:${e.lineno || '?'}`;
    pushEvent(`ERROR: ${e.message || 'error'}`);
    persist(); render();
  });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = e.reason?.message || String(e.reason || 'rejection');
    state.lastError = `unhandled: ${msg}`;
    pushEvent(`REJECT: ${msg}`);
    persist(); render();
  });
  window.addEventListener('pagehide', (e) => {
    pushEvent(e.persisted ? 'pagehide(bfcache)' : 'pagehide');
    persist();
  });
  window.addEventListener('beforeunload', () => {
    pushEvent('beforeunload');
    persist();
  });
  document.addEventListener('visibilitychange', () => {
    pushEvent(`visibility:${document.visibilityState}`);
    persist();
  });
}

export function tick() {
  if (!active) return;
  const now = Date.now();
  state.lastTickAt = now;
  state.dragTickCount += 1;
  persist();
  if (now - _lastRenderAt > 100) {
    _lastRenderAt = now;
    render();
  }
}

export function event(name) {
  if (!active) return;
  pushEvent(name);
  persist();
  render();
}

export function note(msg) {
  if (!active) return;
  state.lastError = String(msg);
  pushEvent(`note: ${msg}`);
  persist();
  render();
}

init();
