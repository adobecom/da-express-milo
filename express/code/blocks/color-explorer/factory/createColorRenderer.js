import { createGradientsRenderer } from '../renderers/createGradientsRenderer.js';

const rendererRegistry = {
  gradients: {
    create: createGradientsRenderer,
    defaultConfig: {
      searchEnabled: true,
      modalType: 'full-screen',
      gridColumns: 3,
    },
  },
  default: {
    create: createGradientsRenderer,
    defaultConfig: {
      searchEnabled: true,
      modalType: 'full-screen',
      gridColumns: 3,
    },
  },
};

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

export function registerRenderer(variant, createFn, defaultConfig = {}) {
  rendererRegistry[variant] = {
    create: createFn,
    defaultConfig,
  };
}

export function getAvailableVariants() {
  return Object.keys(rendererRegistry).filter((k) => k !== 'default');
}
