/**
 * Service Layer - Public API
 *
 * This is the main entry point for the color-explorer service layer.
 * Use this module to access plugins, providers, and service configuration.
 *
 * Plugins are loaded **on demand** — just ask for what you need:
 *
 * @example
 * import { serviceManager } from './services/index.js';
 *
 * // Providers lazy-load their backing plugin automatically
 * const kulerProvider = await serviceManager.getProvider('kuler');
 *
 * // Or load a plugin directly on demand
 * const kulerPlugin = await serviceManager.loadPlugin('kuler');
 *
 * // Optional: batch-preload plugins (additive across calls)
 * await serviceManager.init({ plugins: ['kuler', 'curated'] });
 */

// Core exports
export { serviceManager, initApiService } from './core/ServiceManager.js';
export { default as config } from './config.js';

// Error types
export {
  ServiceError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NotFoundError,
  PluginRegistrationError,
  ProviderRegistrationError,
} from './core/Errors.js';

// Auth middleware helpers
export { resetImsState, ensureIms, IMS_READY_EVENT } from './middlewares/auth.middleware.js';

// Standalone providers
export { default as AuthStateProvider } from './providers/AuthStateProvider.js';

// Base classes (for creating new plugins)
export { default as BasePlugin } from './core/BasePlugin.js';
export { default as BaseApiService } from './core/BaseApiService.js';
export { default as BaseActionGroup } from './core/BaseActionGroup.js';
