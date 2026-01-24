/**
 * Color Explorer - Renderer Factory
 * Creates the appropriate renderer based on variant type
 * Pattern: Registry object (like Northstar's containerTypeMapper)
 */

import { createStripsRenderer } from '../renderers/createStripsRenderer.js';
import { createGradientsRenderer } from '../renderers/createGradientsRenderer.js';
import { createExtractRenderer } from '../renderers/createExtractRenderer.js';

/**
 * Renderer registry with default configurations
 */
const rendererRegistry = {
  strips: {
    create: createStripsRenderer,
    defaultConfig: {
      searchEnabled: true,
      modalType: 'drawer',
      gridColumns: 4,
    },
  },
  gradients: {
    create: createGradientsRenderer,
    defaultConfig: {
      searchEnabled: true,
      modalType: 'full-screen',
      gridColumns: 3,
    },
  },
  extract: {
    create: createExtractRenderer,
    defaultConfig: {
      searchEnabled: false,
      modalType: 'drawer',
      maxResults: 5,
    },
  },
  default: {
    create: createStripsRenderer,
    defaultConfig: {
      searchEnabled: true,
      modalType: 'drawer',
      gridColumns: 4,
    },
  },
};

/**
 * Create color renderer based on variant
 * @param {string} variant - Renderer type (strips, gradients, extract)
 * @param {Object} options - Configuration options
 * @param {Array} options.data - Initial data
 * @param {Object} options.controller - Color theme controller
 * @param {Object} options.config - Configuration
 * @returns {Object} Renderer instance with { render, update, on, emit }
 */
export function createColorRenderer(variant, options) {
  const rendererConfig = rendererRegistry[variant] || rendererRegistry.default;

  const mergedConfig = {
    ...rendererConfig.defaultConfig,
    ...options.config,
  };

  return rendererConfig.create({
    ...options,
    config: mergedConfig,
  });
}

/**
 * Register new renderer type (allows plugins/extensions)
 * @param {string} variant - Variant name
 * @param {Function} createFn - Factory function
 * @param {Object} defaultConfig - Default configuration
 */
export function registerRenderer(variant, createFn, defaultConfig = {}) {
  rendererRegistry[variant] = {
    create: createFn,
    defaultConfig,
  };
}

/**
 * Get available variants
 * @returns {Array<string>} List of variant names
 */
export function getAvailableVariants() {
  return Object.keys(rendererRegistry).filter((k) => k !== 'default');
}

