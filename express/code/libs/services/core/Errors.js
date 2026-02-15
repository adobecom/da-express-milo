/* eslint-disable max-classes-per-file */
/**
 * Custom Error Definitions for Service Layer
 *
 * Standardized error types for consistent error handling across plugins.
 */

/**
 * Base Service Error
 *
 * Custom error class for service layer errors with additional context.
 */
export class ServiceError extends Error {
  /**
   * @param {string} message - Error message
   * @param {Object} [options] - Additional error context
   * @param {string} [options.code] - Error code
   * @param {string} [options.serviceName] - Service name where error occurred
   * @param {string} [options.topic] - Topic/action that caused the error
   * @param {Error} [options.originalError] - Original error if wrapping
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

  /**
   * Convert error to JSON-serializable object
   * @returns {Object} JSON representation of error
   */
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

/**
 * Authentication Error
 * Thrown when user authentication is required but not present.
 */
export class AuthenticationError extends ServiceError {
  /**
   * @param {string} [message] - Error message
   * @param {Object} [options] - Additional error context
   */
  constructor(message = 'Authentication required', options = {}) {
    super(message, { ...options, code: 'AUTH_REQUIRED' });
    this.name = 'AuthenticationError';
  }
}

/**
 * API Error
 * Thrown for HTTP-related failures from external APIs.
 */
export class ApiError extends ServiceError {
  /**
   * @param {string} message - Error message
   * @param {Object} [options] - Additional error context
   * @param {number} [options.statusCode] - HTTP status code
   * @param {string} [options.responseBody] - Response body from API
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: options.statusCode ? String(options.statusCode) : 'API_ERROR' });
    this.name = 'ApiError';
    this.statusCode = options.statusCode || null;
    this.responseBody = options.responseBody || null;
  }
}

/**
 * Validation Error
 * Thrown when input parameters fail validation.
 */
export class ValidationError extends ServiceError {
  /**
   * @param {string} message - Error message
   * @param {Object} [options] - Additional error context
   * @param {string} [options.field] - Field that failed validation
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'VALIDATION_ERROR' });
    this.name = 'ValidationError';
    this.field = options.field || null;
  }
}

/**
 * Not Found Error
 * Thrown when a requested resource cannot be found.
 */
export class NotFoundError extends ServiceError {
  /**
   * @param {string} [message] - Error message
   * @param {Object} [options] - Additional error context
   */
  constructor(message = 'Resource not found', options = {}) {
    super(message, { ...options, code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

/**
 * Storage Full Error
 * Thrown when a CC Libraries operation fails due to full cloud storage (HTTP 507).
 */
export class StorageFullError extends ApiError {
  /**
   * @param {string} [message] - Error message
   * @param {Object} [options] - Additional error context
   */
  constructor(message = 'Cloud storage is full', options = {}) {
    super(message, { ...options, statusCode: 507, code: 'STORAGE_FULL' });
    this.name = 'StorageFullError';
  }
}

/**
 * Plugin Registration Error
 * Thrown when there's an issue with plugin registration.
 */
export class PluginRegistrationError extends ServiceError {
  /**
   * @param {string} message - Error message
   * @param {Object} [options] - Additional error context
   * @param {string} [options.pluginName] - Name of the plugin
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'PLUGIN_REGISTRATION_ERROR' });
    this.name = 'PluginRegistrationError';
    this.pluginName = options.pluginName || null;
  }
}

/**
 * Provider Registration Error
 * Thrown when a provider with the same name is already registered.
 */
export class ProviderRegistrationError extends ServiceError {
  /**
   * @param {string} message - Error message
   * @param {Object} [options] - Additional error context
   * @param {string} [options.providerName] - Name of the provider
   */
  constructor(message, options = {}) {
    super(message, { ...options, code: 'PROVIDER_REGISTRATION_ERROR' });
    this.name = 'ProviderRegistrationError';
    this.providerName = options.providerName || null;
  }
}
