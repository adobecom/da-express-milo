import { getLibs } from '../../utils.js';

let loadStyleFn = null;
let codeRoot = null;

async function ensureLoadStyle() {
  if (!loadStyleFn) {
    const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
    loadStyleFn = loadStyle;
    codeRoot = getConfig?.()?.codeRoot || '/express/code';
  }
  return { loadStyle: loadStyleFn, codeRoot };
}

export default async function loadCSS(href) {
  const { loadStyle, codeRoot: root } = await ensureLoadStyle();

  const fullPath = href.startsWith('/') ? href : `${root}/${href}`;

  return new Promise((resolve) => {
    loadStyle(fullPath, (e) => {
      if (e?.type === 'error') {
        globalThis.lana?.log(`Failed to load CSS: ${fullPath}`, { tags: 'color-shared,css' });
      }
      resolve();
    });
  });
}
