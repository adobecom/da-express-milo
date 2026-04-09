/**
 * Lightweight mock of milo's libs/utils/utils.js for unit tests.
 *
 * Modules under express/code/scripts/color-shared/ dynamically import
 * `${getLibs()}/utils/utils.js` at runtime. In tests we point getLibs()
 * at this file so those imports resolve without hitting the CDN.
 */

// eslint-disable-next-line no-unused-vars
export function loadStyle(href, callback) {
  if (typeof callback === 'function') callback();
}

export function getConfig() {
  return {
    codeRoot: '/express/code',
    locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } },
    locale: { ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' },
    env: { name: 'prod' },
  };
}

export function getMetadata(name) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return meta?.content || '';
}

export function setConfig(conf) {
  return conf;
}

export async function loadIms() {
  // no-op in tests
}

export function createTag(tag, attributes = {}, html = '') {
  const el = document.createElement(tag);
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  if (html) {
    if (html instanceof HTMLElement) el.append(html);
    else el.insertAdjacentHTML('beforeend', html);
  }
  return el;
}
