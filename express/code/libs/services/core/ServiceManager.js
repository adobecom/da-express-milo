import { getResolvedConfig } from '../config.js';
import { guardMiddleware, matchTopic } from '../middlewares/guard.js';
import { getPluginManifest, getPluginManifests } from '../plugins/index.js';
import {
  ConfigError,
  PluginRegistrationError,
  ProviderRegistrationError,
  ServiceError,
} from './Errors.js';

const pluginManifests = getPluginManifests();
const pluginManifestMap = new Map(
  pluginManifests.map((manifest) => [manifest.name, manifest]),
);
const DEFAULT_CONFIG_RESOLVER = getResolvedConfig;

class ServiceManager {
  #plugins = new Map();

  #providers = new Map();

  /** @type {Map<string, Promise<Object|null>>} */
  #pluginLoadPromises = new Map();

  /** @type {{ plugins?: string[], features?: Record<string, boolean> } | null} */
  #runtimeConfig = null;

  /** @type {Object|null} */
  #resolvedConfig = null;

  /** @type {Promise<Object>|null} */
  #configPromise = null;

  /** @type {() => Promise<Object>} */
  #configResolver = DEFAULT_CONFIG_RESOLVER;

  #pluginManifests = pluginManifests;

  #middlewareLoaders = {
    error: () => import('../middlewares/error.middleware.js'),
    logging: () => import('../middlewares/logging.middleware.js'),
    auth: () => import('../middlewares/auth.middleware.js'),
  };

  /**
   * @private
   * @returns {Promise<Object>}
   */
  async #ensureConfig() {
    if (this.#resolvedConfig) return this.#resolvedConfig;
    if (this.#configPromise) return this.#configPromise;

    this.#configPromise = (async () => {
      try {
        const resolved = await this.#configResolver();
        this.#resolvedConfig = resolved;
        return resolved;
      } catch (error) {
        if (error instanceof ConfigError) {
          throw error;
        }
        throw new ConfigError('Failed to resolve service configuration.', {
          serviceName: 'ServiceManager',
          configKey: 'configResolver',
          originalError: error,
        });
      } finally {
        this.#configPromise = null;
      }
    })();

    return this.#configPromise;
  }

  /**
   * @param {Object} [options]
   * @param {string[]} [options.plugins]
   * @param {Object} [options.features]
   * @returns {Promise<ServiceManager>}
   */
  async init(options = {}) {
    if (this.#runtimeConfig?.plugins && options.plugins) {
      const combined = [...new Set([
        ...this.#runtimeConfig.plugins,
        ...options.plugins,
      ])];
      this.#runtimeConfig = { ...this.#runtimeConfig, ...options, plugins: combined };
    } else {
      this.#runtimeConfig = { ...this.#runtimeConfig, ...options };
    }

    if (Array.isArray(this.#runtimeConfig?.plugins)) {
      const loadPromises = this.#pluginManifests
        .filter((m) => this.#runtimeConfig.plugins.includes(m.name) && !this.#plugins.has(m.name))
        .map((manifest) => this.#ensurePlugin(manifest.name));

      await Promise.all(loadPromises);
      return this;
    }

    const resolvedConfig = await this.#ensureConfig();
    const loadPromises = this.#pluginManifests
      .filter((m) => this.#isEnabled(m, resolvedConfig) && !this.#plugins.has(m.name))
      .map((manifest) => this.#ensurePlugin(manifest.name, resolvedConfig));

    await Promise.all(loadPromises);
    return this;
  }

  /**
   * @private
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  async #ensurePlugin(name, resolvedConfigParam) {
    if (this.#plugins.has(name)) return this.#plugins.get(name);
    if (this.#pluginLoadPromises.has(name)) return this.#pluginLoadPromises.get(name);

    const manifest = this.#getManifest(name);
    if (!manifest) return null;
    const resolvedConfig = resolvedConfigParam || await this.#ensureConfig();

    const loadPromise = (async () => {
      try {
        const plugin = await this.#loadPlugin(manifest, resolvedConfig);
        if (plugin) {
          await this.#applyMiddlewareToPlugin(name, plugin, resolvedConfig);
          this.#plugins.set(name, plugin);
        }
        return plugin;
      } finally {
        this.#pluginLoadPromises.delete(name);
      }
    })();

    this.#pluginLoadPromises.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * @private
   * @param {string} pluginName
   * @param {Object} plugin
   */
  async #applyMiddlewareToPlugin(pluginName, plugin, resolvedConfig) {
    const pluginConfig = resolvedConfig.services[pluginName] || {};
    const middlewareList = pluginConfig.middleware || resolvedConfig.middleware;

    if (!Array.isArray(middlewareList)) {
      return;
    }

    const middlewarePromises = middlewareList.map(async (entry) => {
      const spec = typeof entry === 'string' ? { name: entry } : entry;

      if (!spec?.name) {
        // eslint-disable-next-line no-console
        console.warn('Invalid middleware entry (missing name):', entry);
        return;
      }

      if (ServiceManager.#isMiddlewareEnabled(spec.name, resolvedConfig)) {
        try {
          const loader = this.#middlewareLoaders[spec.name];
          if (!loader) {
            // eslint-disable-next-line no-console
            console.warn(`Middleware loader not found for "${spec.name}"`);
            return;
          }
          const { default: mw } = await loader();
          if (mw && typeof plugin.use === 'function') {
            const finalMw = ServiceManager.#applyTopicGuard(mw, spec);
            plugin.use(finalMw);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Failed to load middleware "${spec.name}":`, error);
        }
      }
    });

    await Promise.all(middlewarePromises);
  }

  /**
   * @private
   * @param {Function} middleware
   * @param {Object} spec
   * @param {string} spec.name
   * @param {string[]} [spec.topics]
   * @param {string[]} [spec.excludeTopics]
   * @returns {Function}
   */
  static #applyTopicGuard(middleware, spec) {
    const { topics, excludeTopics } = spec;

    if (Array.isArray(topics) && topics.length > 0) {
      return guardMiddleware(
        (topic) => topics.some((pattern) => matchTopic(pattern, topic)),
        middleware,
      );
    }

    if (Array.isArray(excludeTopics) && excludeTopics.length > 0) {
      return guardMiddleware(
        (topic) => !excludeTopics.some((pattern) => matchTopic(pattern, topic)),
        middleware,
      );
    }

    return middleware;
  }

  /**
   * @private
   * @param {Object} manifest
   * @returns {Promise<Object|null>}
   */
  async #loadPlugin(manifest, resolvedConfig) {
    if (!manifest || !manifest.name || typeof manifest.loader !== 'function') {
      throw new ServiceError('Invalid plugin manifest provided.');
    }

    const { name, loader } = manifest;

    if (this.#plugins.has(name)) {
      return this.#plugins.get(name);
    }

    try {
      const { default: PluginClass } = await loader();

      const serviceConfig = resolvedConfig.services[name] || {};

      const appConfig = {
        features: resolvedConfig.features,
        environment: resolvedConfig.environment,
        services: resolvedConfig.services,
      };

      const plugin = new PluginClass({ serviceConfig, appConfig });

      if (typeof plugin.isActivated === 'function') {
        const isActive = plugin.isActivated(appConfig);
        if (!isActive) {
          return null;
        }
      }

      return plugin;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load plugin "${name}":`, error);
      return null;
    }
  }

  /**
   * @private
   * @param {Object} manifest
   * @returns {boolean}
   */
  #isEnabled(manifest, resolvedConfig) {
    if (!manifest?.name) {
      return false;
    }

    if (this.#runtimeConfig?.plugins) {
      return this.#runtimeConfig.plugins.includes(manifest.name);
    }

    const features = { ...resolvedConfig.features, ...this.#runtimeConfig?.features };

    if (!manifest.featureFlag) {
      return false;
    }
    return features[manifest.featureFlag] === true;
  }

  /**
   * @private
   * @param {string} name
   * @returns {boolean}
   */
  static #isMiddlewareEnabled(name, resolvedConfig) {
    const flag = `ENABLE_${name.toUpperCase()}`;
    return resolvedConfig.features[flag] !== false;
  }

  /**
   * @param {string} name
   * @returns {Object|undefined}
   */
  getPlugin(name) {
    return this.#plugins.get(name);
  }

  /**
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  async loadPlugin(name) {
    const resolvedConfig = await this.#ensureConfig();
    return this.#ensurePlugin(name, resolvedConfig);
  }

  /** @returns {Object} */
  getPlugins() {
    return Object.fromEntries(this.#plugins);
  }

  /**
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  async getProvider(name) {
    if (this.#providers.has(name)) {
      return this.#providers.get(name);
    }

    const manifest = this.#getManifest(name);
    if (!manifest?.providerLoader) {
      return null;
    }

    const resolvedConfig = await this.#ensureConfig();

    const plugin = await this.#ensurePlugin(name, resolvedConfig);
    if (!plugin) return null;

    try {
      const { default: ProviderClass } = await manifest.providerLoader();
      const provider = new ProviderClass(plugin);
      this.#providers.set(name, provider);
      return provider;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load provider "${name}":`, error);
      return null;
    }
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  hasProvider(name) {
    return this.#providers.has(name) || !!this.#getManifest(name)?.providerLoader;
  }

  /**
   * @param {string} name
   * @param {Object} provider
   * @throws {ProviderRegistrationError}
   */
  registerProvider(name, provider) {
    if (this.#providers.has(name)) {
      throw new ProviderRegistrationError(
        `Cannot register provider "${name}": A provider with this name already exists.`,
        { providerName: name },
      );
    }
    this.#providers.set(name, provider);
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  hasPlugin(name) {
    return this.#plugins.has(name);
  }

  /**
   * @private
   * @param {string} name
   * @returns {Object|undefined}
   */
  #getManifest(name) {
    return this.#pluginManifests.find((manifest) => manifest.name === name)
      || pluginManifestMap.get(name)
      || getPluginManifest(name);
  }

  /**
   * @param {string} name
   * @param {Object} plugin
   * @throws {PluginRegistrationError}
   */
  registerPlugin(name, plugin) {
    if (this.#plugins.has(name)) {
      throw new PluginRegistrationError(
        `Cannot register plugin "${name}": A plugin with this name already exists. Use a unique name or call unregisterPlugin() first.`,
        { pluginName: name },
      );
    }
    this.#plugins.set(name, plugin);
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  unregisterPlugin(name) {
    this.#providers.delete(name);
    return this.#plugins.delete(name);
  }

  reset() {
    this.#plugins.clear();
    this.#providers.clear();
    this.#pluginLoadPromises.clear();
    this.#runtimeConfig = null;
    this.#resolvedConfig = null;
    this.#configPromise = null;
    this.#configResolver = DEFAULT_CONFIG_RESOLVER;
  }

  /** @param {() => Promise<Object>} resolver */
  setConfigResolverForTesting(resolver) {
    this.#configResolver = resolver || DEFAULT_CONFIG_RESOLVER;
    this.#resolvedConfig = null;
    this.#configPromise = null;
  }
}

export const serviceManager = new ServiceManager();

/**
 * @param {Object} [options]
 * @param {string[]} [options.plugins]
 * @param {Object} [options.features]
 * @returns {Promise<Object>}
 */
export async function initApiService(options) {
  await serviceManager.init(options);
  return serviceManager.getPlugins();
}
