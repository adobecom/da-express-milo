import { createCheckerRenderer } from '../renderers/createCheckerRenderer.js';

const rendererRegistry = {
  checker: {
    create: createCheckerRenderer,
    defaultConfig: {
      modalType: 'drawer',
    },
  },
  default: {
    create: createCheckerRenderer,
    defaultConfig: {
      modalType: 'drawer',
    },
  },
};

export function createContrastRenderer(variant, options) {
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
