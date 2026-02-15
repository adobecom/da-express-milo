/**
 * Service Layer - Public API
 *
 * This is the main entry point for the color-explorer service layer.
 * Use this module to access plugins, providers, and service configuration.
 *
 * @example
 * import { serviceManager, initApiService } from './services/index.js';
 *
 * // Initialize all services
 * const plugins = await initApiService();
 *
 * // Or use serviceManager directly
 * await serviceManager.init();
 * const kulerPlugin = serviceManager.getPlugin('kuler');
 * const kulerProvider = await serviceManager.getProvider('kuler');
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

// Standalone providers
export { default as AuthStateProvider } from './providers/AuthStateProvider.js';

// Base classes (for creating new plugins)
export { default as BasePlugin } from './core/BasePlugin.js';
export { default as BaseApiService } from './core/BaseApiService.js';
export { default as BaseActionGroup } from './core/BaseActionGroup.js';
