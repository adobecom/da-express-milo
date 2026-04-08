import { getLibs } from '../../utils.js';

let miloStyleLoaderPromise = null;

export default async function loadMiloStyle(path) {
  if (!miloStyleLoaderPromise) {
    miloStyleLoaderPromise = import(`${getLibs()}/utils/utils.js`)
      .then(({ loadStyle, getConfig }) => ({ loadStyle, getConfig }));
  }

  const { loadStyle, getConfig } = await miloStyleLoaderPromise;
  const codeRoot = getConfig?.()?.codeRoot || '/express/code';
  const href = path.startsWith('/') ? path : `${codeRoot}/${path}`;

  return new Promise((resolve) => {
    loadStyle(href, () => resolve());
  });
}
