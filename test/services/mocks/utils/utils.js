/**
 * Mock of milo's libs/utils/utils.js for auth middleware tests.
 * The auth middleware calls setLibs('/test/services/mocks') so it
 * resolves this file when doing import(`${getLibs()}/utils/utils.js`).
 */

export async function loadIms() {
  // no-op — auth middleware tests inject IMS via window.adobeIMS
}

export function getConfig() {
  return {
    codeRoot: '/express/code',
    locales: { '': { ietf: 'en-US' } },
    locale: { ietf: 'en-US', prefix: '' },
    env: { name: 'prod' },
  };
}

export function getMetadata(name) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  return meta?.content || '';
}

// eslint-disable-next-line no-unused-vars
export function loadStyle(href, callback) {
  if (typeof callback === 'function') callback();
}

export function setConfig(conf) {
  return conf;
}
