import createContextProvider from './contextProvider.js';
import { globalDependencyTracker } from './dependencyTracker.js';

/**
 * Preload CSS and services dependencies
 * @param {Object} dependencies - { css: string[], services: string[] }
 * @returns {Promise<void>}
 */
function preload(dependencies) {
  return globalDependencyTracker.preload(dependencies);
}

/**
 * Create a shell instance.
 *
 * The shell is a container that:
 * 1. Provides reactive context (get/set/on/off)
 * 2. Resolves dependencies via ServiceManager
 * 3. Hands control to a layout
 *
 * @returns {Object} Shell API
 */
export default function createShell(host) {
  const context = createContextProvider(host);

  return { context, preload, destroy() { context?.destroy(); } };
}
