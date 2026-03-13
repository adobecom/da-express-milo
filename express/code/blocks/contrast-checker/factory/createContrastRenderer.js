import { createCheckerRenderer } from '../renderers/createCheckerRenderer.js';
import createHistoryService from '../services/createHistoryService.js';
import createRecommendationService from '../services/createRecommendationService.js';

const rendererRegistry = {
  checker: {
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
  },
  default: {
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
  },
};

function createServices(serviceFactories = {}) {
  return Object.fromEntries(
    Object.entries(serviceFactories).map(([key, factory]) => [key, factory()]),
  );
}

export function createContrastRenderer(variant, options) {
  const rendererConfig = rendererRegistry[variant] || rendererRegistry.default;

  const mergedConfig = {
    ...rendererConfig.defaultConfig,
    ...options.config,
  };

  const services = createServices(rendererConfig.services);

  return rendererConfig.create({
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
