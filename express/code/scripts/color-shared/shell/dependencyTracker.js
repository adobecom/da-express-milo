import loadCSS from '../utils/loadCss.js';
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';

export function createDependencyTracker(deps = {}) {
  const cssLoader = deps.loadCSS || loadCSS;
  const serviceMgr = deps.serviceManager || serviceManager;

  const loadingServices = new Map();

  async function preload(config = {}) {
    const { css = [], services = [] } = config;

    const promises = [];

    for (const href of css) {
      promises.push(cssLoader(href));
    }

    if (services.length > 0) {
      const serviceKey = services.slice().sort().join(',');

      if (!loadingServices.has(serviceKey)) {
        const promise = serviceMgr.init({ plugins: services })
          .then(() => {
            loadingServices.delete(serviceKey);
          })
          .catch((err) => {
            loadingServices.delete(serviceKey);
            throw err;
          });

        loadingServices.set(serviceKey, promise);
      }

      promises.push(loadingServices.get(serviceKey));
    }

    await Promise.all(promises);
  }

  return {
    preload,
  };
}

export const globalDependencyTracker = createDependencyTracker();
