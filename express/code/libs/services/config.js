/**
 * Service layer configuration.
 * Used by ServiceManager for middleware, features, and per-plugin config.
 */

const hostname = typeof window !== 'undefined' ? window.location?.hostname : '';
const environment = /localhost|127\.0\.0\.1/.test(hostname)
  ? 'development'
  : /stage|staging/.test(hostname)
    ? 'stage'
    : 'production';

export default {
  environment,
  middleware: ['error', 'logging'],
  features: {
    ENABLE_ERROR: true,
    ENABLE_LOGGING: true,
    ENABLE_AUTH: true,
  },
  services: {},
};
