import { NotFoundError, ServiceError } from './Errors.js';

export default class BasePlugin {
  /** @type {Map<string, Function>} */
  topicRegistry = new Map();

  /** @type {Array<Function>} */
  middlewares = [];

  /** @type {Object} */
  serviceConfig = null;

  /** @type {Object} */
  appConfig = null;

  /** @type {Object} */
  servicesConfig = null;

  /** @type {Map<string, BaseActionGroup>} */
  actionGroups = new Map();

  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    this.serviceConfig = serviceConfig;
    this.appConfig = appConfig;
    this.servicesConfig = appConfig.services || {};
  }

  /** @abstract */
  static get serviceName() {
    throw new Error('ServiceName must be implemented by subclass');
  }

  /** @returns {string|undefined} */
  get baseUrl() {
    return this.serviceConfig.baseUrl;
  }

  /** @returns {string|undefined} */
  get apiKey() {
    return this.serviceConfig.apiKey;
  }

  /** @returns {Object} */
  get endpoints() {
    return this.serviceConfig.endpoints || {};
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  isActivated(appConfigParam) {
    return true;
  }

  /** @param {Function} middleware */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /** @param {Object|BaseActionGroup} actionGroup */
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
   * @param {string} topic
   * @param {...any} args
   * @returns {Promise<any>}
   * @throws {NotFoundError}
   * @throws {ServiceError}
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
   * @param {Object} context
   * @param {Object} meta
   * @returns {Object}
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  middlewareContextTransform(context, meta) {
    return context;
  }

  /**
   * @param {string} groupName
   * @param {string} [topic]
   * @returns {Function|Object|undefined}
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
   * @param {string} name
   * @param {BaseActionGroup} actionGroup
   */
  registerActionGroup(name, actionGroup) {
    if (!actionGroup || typeof actionGroup !== 'object') {
      throw new Error(`Invalid action group provided for "${name}"`);
    }
    this.actionGroups.set(name, actionGroup);
    this.registerHandlers(actionGroup);
  }
}
