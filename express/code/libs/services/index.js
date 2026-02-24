export { serviceManager, initApiService } from './core/ServiceManager.js';
export { default as config } from './config.js';

export {
  ServiceError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NotFoundError,
  ConfigError,
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
