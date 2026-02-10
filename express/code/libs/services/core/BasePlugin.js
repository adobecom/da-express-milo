import { NotFoundError, ServiceError } from './Errors.js';

/**
 * Base Plugin Class
 *
 * The foundation for all plugins in the system.
 * Handles:
 * - Action dispatching (Topic -> Handler)
 * - Middleware support (Interception)
 * - Handler registration
 * - Feature flag activation check
 *
 * Uses custom error types from Errors.js:
 * - NotFoundError: When no handler is registered for a topic
 * - ServiceError: For middleware execution failures
 *
 * This class is "universal" and does not depend on HTTP/API specifics.
 * Subclasses can be API services (extending BaseApiService) or
 * utility plugins (Calculator, Logger, etc.).
 */
export default class BasePlugin {
  /**
   * Registry of topic -> handler function
   * @type {Map<string, Function>}
   */
  topicRegistry = new Map();

  /**
   * Middleware chain
   * @type {Array<Function>}
   */
  middlewares = [];

  /**
   * Service-specific configuration (baseUrl, apiKey, endpoints)
   * @type {Object}
   */
  serviceConfig = null;

  /**
   * Application-level configuration (features, environment)
   * @type {Object}
   */
  appConfig = null;

  /**
   * Legacy alias for accessing all services config
   * @type {Object}
   */
  servicesConfig = null;

  /**
   * Action groups registered with this plugin
   * @type {Map<string, BaseActionGroup>}
   */
  actionGroups = new Map();

  /**
   * @param {Object} [options] - Configuration options
   * @param {Object} [options.serviceConfig] - Service-specific config (baseUrl, apiKey, endpoints)
   * @param {Object} [options.appConfig] - Application-level config (features, environment, services)
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    // Service-specific configuration (this plugin's baseUrl, apiKey, endpoints)
    this.serviceConfig = serviceConfig;

    // Application-level configuration (features, environment)
    this.appConfig = appConfig;

    // Legacy alias for backward compatibility (access to all services)
    this.servicesConfig = appConfig.services || {};
  }

  /**
   * Service name identifier
   * @abstract
   */
  static get serviceName() {
    throw new Error('ServiceName must be implemented by subclass');
  }

  /**
   * Convenience getter for base URL from service config
   * @returns {string|undefined}
   */
  get baseUrl() {
    return this.serviceConfig.baseUrl;
  }

  /**
   * Convenience getter for API key from service config
   * @returns {string|undefined}
   */
  get apiKey() {
    return this.serviceConfig.apiKey;
  }

  /**
   * Convenience getter for endpoints from service config
   * @returns {Object}
   */
  get endpoints() {
    return this.serviceConfig.endpoints || {};
  }

  /**
   * Check if this plugin is activated based on its feature flag.
   * Defaults to active if no config provided or no flag configured.
   *
   * @param {Object} appConfigParam - The app config object containing features map
   * @returns {boolean} True if enabled or no flag configured, False if explicitly disabled
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  isActivated(appConfigParam) {
    return true;
  }

  /**
   * Register a middleware function.
   *
   * Middleware signature: async (topic, args, next, context) => result
   * Middleware can optionally define a static buildContext(meta) helper:
   * - meta: { plugin, serviceName, topic, args }
   *
   * @param {Function} middleware
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * Register handlers from an action group or object.
   * Supports both BaseActionGroup instances (with getHandlers method) and plain objects.
   *
   * @param {Object|BaseActionGroup} actionGroup - Action group instance or
   * plain object with topic handlers
   */
  registerHandlers(actionGroup) {
    let handlers;

    if (typeof actionGroup.getHandlers === 'function') {
      handlers = actionGroup.getHandlers();
    } else if (typeof actionGroup === 'object') {
      handlers = actionGroup;
    } else {
      // eslint-disable-next-line no-console
      console.warn('Invalid action group provided for registration');
      return;
    }

    Object.entries(handlers).forEach(([topic, handler]) => {
      if (this.topicRegistry.has(topic)) {
        // eslint-disable-next-line no-console
        console.warn(`Overwriting handler for topic: ${topic} in ${this.constructor.serviceName}`);
      }
      this.topicRegistry.set(topic, handler);
    });
  }

  /**
   * Dispatch an action by topic through the middleware chain.
   * Composes middlewares and calls the handler as the final step.
   * The next() function passed to middleware returns a promise that resolves to the result
   * of the next middleware or handler.
   *
   * @param {string} topic - The action topic
   * @param {...any} args - Arguments to pass to the handler
   * @returns {Promise<any>} Result of the action
   * @throws {NotFoundError} If no handler is registered for the topic
   * @throws {ServiceError} If middleware execution fails
   */
  async dispatch(topic, ...args) {
    const handler = this.topicRegistry.get(topic);
    const { serviceName } = this.constructor;
    const meta = {
      plugin: this,
      serviceName,
      topic,
      args,
    };

    if (!handler) {
      throw new NotFoundError(`No handler registered for topic: ${topic}`, {
        serviceName,
        topic,
      });
    }

    let index = -1;

    const runner = async (i) => {
      if (i <= index) {
        throw new ServiceError('next() called multiple times', {
          code: 'MIDDLEWARE_ERROR',
          serviceName,
          topic,
        });
      }
      index = i;

      if (i === this.middlewares.length) {
        return handler(...args);
      }

      const fn = this.middlewares[i];
      if (!fn || typeof fn !== 'function') {
        throw new ServiceError(`Middleware at index ${i} is not a function`, {
          code: 'MIDDLEWARE_ERROR',
          serviceName,
          topic,
        });
      }

      const context = typeof fn.buildContext === 'function'
        ? fn.buildContext(meta)
        : {};
      const finalContext = this.middlewareContextTransform(context, meta);

      return fn(topic, args, async () => runner(i + 1), finalContext);
    };

    return runner(0);
  }

  /**
   * Optional plugin-level transformation for middleware context.
   * Override to enrich or redact context values for all middlewares.
   *
   * @param {Object} context - Context generated by middleware buildContext
   * @param {Object} meta - { plugin, serviceName, topic, args }
   * @returns {Object} Transformed context
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  middlewareContextTransform(context, meta) {
    return context;
  }

  /**
   * Use an action group or specific action topic
   *
   * @param {string} groupName - Action group name
   * @param {string} [topic] - Specific action topic (optional)
   * @returns {Function|Object|undefined} Action function, action group, or undefined
   */
  useAction(groupName, topic = null) {
    const group = this.actionGroups.get(groupName);

    if (!group) {
      return undefined;
    }

    if (topic) {
      return (...actionArgs) => this.dispatch(topic, ...actionArgs);
    }

    return group;
  }

  /**
   * Register an action group with the plugin.
   * Registers the topic handlers.
   *
   * @param {string} name - Name identifier for the action group
   * @param {BaseActionGroup} actionGroup - Action group instance
   */
  registerActionGroup(name, actionGroup) {
    if (!actionGroup || typeof actionGroup !== 'object') {
      throw new Error(`Invalid action group provided for "${name}"`);
    }
    this.actionGroups.set(name, actionGroup);
    this.registerHandlers(actionGroup);
  }
}
