/**
 * Color Renderer Factory
 * 
 * WIREFRAME FILE - Shows routing logic
 * 
 * Responsibilities:
 * - Registry of available variants
 * - Route to correct renderer based on variant
 * - Merge default configurations
 * 
 * Does NOT:
 * - Render UI
 * - Contain business logic
 * - Fetch data
 */

// UPDATED: Now using shared component library
import { createStripsRenderer } from '../../scripts/color-shared/renderers/createStripsRenderer.js';
import { createGradientsRenderer } from '../../scripts/color-shared/renderers/createGradientsRenderer.js';
import { createExtractRenderer } from '../../scripts/color-shared/renderers/createExtractRenderer.js';

/**
 * Registry of available renderers
 * Each entry contains:
 * - create: Factory function for the renderer
 * - defaultConfig: Default configuration for the variant
 */
const RENDERER_REGISTRY = {
  strips: {
    create: createStripsRenderer,
    defaultConfig: {
      gridColumns: 4,
      cardLayout: 'horizontal-strip',
      searchEnabled: true,
      modalType: 'drawer',
    },
  },
  gradients: {
    create: createGradientsRenderer,
    defaultConfig: {
      gridColumns: 3,
      cardLayout: 'vertical-gradient',
      searchEnabled: true,
      modalType: 'full-screen',
    },
  },
  extract: {
    create: createExtractRenderer,
    defaultConfig: {
      maxResults: 5,
      uploadTypes: ['image/jpeg', 'image/png', 'image/webp'],
      searchEnabled: false,
      modalType: 'drawer',
    },
  },
};

/**
 * Create color renderer based on variant
 * @param {string} variant - Variant type (strips, gradients, extract)
 * @param {Object} options - Configuration options
 * @returns {Object} Renderer instance
 */
export function createColorRenderer(variant = 'strips', options = {}) {
  console.log('[Factory] Creating renderer for variant:', variant, 'with options:', options);

  // 1. Lookup variant in registry
  const entry = RENDERER_REGISTRY[variant] || RENDERER_REGISTRY.strips;

  if (!entry) {
    console.warn('[Factory] Unknown variant, falling back to strips:', variant);
  }

  // 2. Merge configurations
  const finalConfig = {
    ...entry.defaultConfig,
    ...options.config,
  };

  // 3. Extract container and data from options
  const { container, data, ...restOptions } = options;

  // 4. Create renderer instance
  const renderer = entry.create({
    container,
    data,
    config: finalConfig,
    ...restOptions,
  });

  console.log('[Factory] ✅ Renderer created with config:', finalConfig);

  return renderer;
}

/**
 * Get list of available variants
 * @returns {Array<string>} Array of variant names
 */
export function getAvailableVariants() {
  return Object.keys(RENDERER_REGISTRY);
}

/**
 * Register a new variant (for extensibility)
 * @param {string} name - Variant name
 * @param {Function} createFn - Factory function
 * @param {Object} defaultConfig - Default configuration
 */
export function registerVariant(name, createFn, defaultConfig = {}) {
  if (RENDERER_REGISTRY[name]) {
    console.warn('[Factory] Overwriting existing variant:', name);
  }

  RENDERER_REGISTRY[name] = {
    create: createFn,
    defaultConfig,
  };

  console.log('[Factory] ✅ Registered variant:', name);
}
