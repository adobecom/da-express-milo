import { createCheckerRenderer } from '../renderers/createCheckerRenderer.js';
import createHistoryService from '../services/createHistoryService.js';
import createRecommendationService from '../services/createRecommendationService.js';

const DEFAULT_RENDERER_CONFIG = {
  create: createCheckerRenderer,
  defaultConfig: {
    modalType: 'drawer',
    initialForeground: '#1B1B1B',
    initialBackground: '#FFFFFF',
    tabs: [
      { label: 'Summary', value: 'summary' },
      { label: 'Contrast suggestions', value: 'suggestions' },
      { label: 'Set a contrast ratio', value: 'set-ratio' },
    ],
  },
  services: {
    history: () => createHistoryService(),
    recommendation: () => createRecommendationService(),
  },
};

const rendererRegistry = {
  checker: {},
};

function createServices(serviceFactories = {}) {
  return Object.fromEntries(
    Object.entries(serviceFactories).map(([key, factory]) => [key, factory()]),
  );
}

export function createContrastRenderer(variant, options) {
  const rendererConfig = rendererRegistry[variant] || {};
  const create = rendererConfig.create || DEFAULT_RENDERER_CONFIG.create;

  const mergedConfig = {
    ...DEFAULT_RENDERER_CONFIG.defaultConfig,
    ...rendererConfig.defaultConfig,
    ...options.config,
  };

  const services = createServices({
    ...DEFAULT_RENDERER_CONFIG.services,
    ...rendererConfig.services,
  });

  return create({
    ...options,
    config: mergedConfig,
    services,
  });
}

export function registerRenderer(variant, createFn, defaultConfig = {}, services = {}) {
  rendererRegistry[variant] = {
    create: createFn,
    defaultConfig,
    services,
  };
}
