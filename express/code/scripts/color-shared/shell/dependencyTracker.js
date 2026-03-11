import loadCSS from '../utils/loadCss.js';
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';

/**
 * Create a dependency tracker instance.
 * @param {Object} deps - Dependency injection for testing
 * @param {Function} deps.loadCSS - CSS loader function
 * @param {Object} deps.serviceManager - Service manager instance
 * @returns {Object} Dependency tracker API
 */
export function createDependencyTracker(deps = {}) {
  const cssLoader = deps.loadCSS || loadCSS;
  const serviceMgr = deps.serviceManager || serviceManager;

  const loadingServices = new Map();

  /**
   * Preload dependencies based on config.
   * @param {Object} config - Dependency configuration
   * @param {string[]} [config.css] - CSS file URLs to load
   * @param {string[]} [config.services] - Service plugin names to load
   * @returns {Promise<void>}
   */
  async function preload(config = {}) {
    const { css = [], services = [] } = config;

    const promises = [];

    for (const href of css) {
      promises.push(cssLoader(href));
    }

    if (services.length > 0) {
      const serviceKey = services.sort().join(',');

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
