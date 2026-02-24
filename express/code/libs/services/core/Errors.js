/* eslint-disable max-classes-per-file */

export class ServiceError extends Error {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.code]
   * @param {string} [options.serviceName]
   * @param {string} [options.topic]
   * @param {Error} [options.originalError]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'ServiceError';
    this.code = options.code || 'SERVICE_ERROR';
    this.serviceName = options.serviceName || 'Unknown';
    this.topic = options.topic || null;
    this.originalError = options.originalError || null;
    this.timestamp = new Date().toISOString();
  }

  /** @returns {Object} */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      serviceName: this.serviceName,
      topic: this.topic,
      timestamp: this.timestamp,
    };
  }
}

export class AuthenticationError extends ServiceError {
  /**
   * @param {string} [message]
   * @param {Object} [options]
   */
  constructor(message = 'Authentication required', options = {}) {
    super(message, { ...options, code: 'AUTH_REQUIRED' });
    this.name = 'AuthenticationError';
  }
}

export class ApiError extends ServiceError {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {number} [options.statusCode]
   * @param {string} [options.responseBody]
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: options.statusCode ? String(options.statusCode) : 'API_ERROR' });
    this.name = 'ApiError';
    this.statusCode = options.statusCode || null;
    this.responseBody = options.responseBody || null;
  }
}

export class ValidationError extends ServiceError {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.field]
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'VALIDATION_ERROR' });
    this.name = 'ValidationError';
    this.field = options.field || null;
  }
}

export class NotFoundError extends ServiceError {
  /**
   * @param {string} [message]
   * @param {Object} [options]
   */
  constructor(message = 'Resource not found', options = {}) {
    super(message, { ...options, code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

export class PluginRegistrationError extends ServiceError {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.pluginName]
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'PLUGIN_REGISTRATION_ERROR' });
    this.name = 'PluginRegistrationError';
    this.pluginName = options.pluginName || null;
  }
}

export class ProviderRegistrationError extends ServiceError {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.providerName]
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'PROVIDER_REGISTRATION_ERROR' });
    this.name = 'ProviderRegistrationError';
    this.providerName = options.providerName || null;
  }
}

export class ConfigError extends ServiceError {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.configKey]
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'CONFIG_ERROR' });
    this.name = 'ConfigError';
    this.configKey = options.configKey || null;
  }
}
