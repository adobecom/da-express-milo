/**
 * Dependency Tracker — CSS/Service/Spectrum Deduplication
 *
 * Wraps loadCSS, serviceManager.init, and load-spectrum loaders to provide
 * a unified preload API with in-flight promise sharing and safe retry after failure.
 *
 * Reuses:
 * - loadCSS (Set-based dedup)
 * - createDependencyLoader pattern (loaded/loading Maps)
 * - load-spectrum.js (idempotent component loaders)
 * - serviceManager.init (plugin loading with dedup)
 */

import loadCSS from '../utils/loadCss.js';
import { serviceManager } from '../../../libs/services/core/ServiceManager.js';
import * as loadSpectrum from '../spectrum/load-spectrum.js';

/**
 * Create a dependency tracker instance.
 * @param {Object} deps - Dependency injection for testing
 * @param {Function} deps.loadCSS - CSS loader function
 * @param {Object} deps.serviceManager - Service manager instance
 * @param {Object} deps.loadSpectrum - Spectrum loader functions
 * @returns {Object} Dependency tracker API
 */
export function createDependencyTracker(deps = {}) {
  const cssLoader = deps.loadCSS || loadCSS;
  const serviceMgr = deps.serviceManager || serviceManager;
  const spectrumLoader = deps.loadSpectrum || loadSpectrum;

  // Track in-flight service loading promises
  const loadingServices = new Map();

  /**
   * Preload dependencies based on config.
   * @param {Object} config - Dependency configuration
   * @param {string[]} [config.css] - CSS file URLs to load
   * @param {string[]} [config.services] - Service plugin names to load
   * @param {string[]} [config.spectrum] - Spectrum component families to load
   * @returns {Promise<void>}
   */
  async function preload(config = {}) {
    const { css = [], services = [], spectrum = [] } = config;

    const promises = [];

    // Load CSS files (loadCSS handles its own deduplication)
    for (const href of css) {
      promises.push(cssLoader(href));
    }

    // Load services (deduplicate via in-flight tracking)
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

    // Load Spectrum components (load-spectrum functions are idempotent)
    for (const component of spectrum) {
      const loaderName = `load${component.charAt(0).toUpperCase()}${component.slice(1)}`;
      const loader = spectrumLoader[loaderName];
      
      if (loader && typeof loader === 'function') {
        promises.push(loader());
      }
    }

    await Promise.all(promises);
  }

  return {
    preload,
  };
}

/**
 * Global dependency tracker instance.
 */
export const globalDependencyTracker = createDependencyTracker();
