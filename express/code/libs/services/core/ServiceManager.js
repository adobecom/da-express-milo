import config from '../config.js';
import { guardMiddleware, matchTopic } from '../middlewares/guard.js';
import { getPluginManifest, getPluginManifests } from '../plugins/index.js';
import { PluginRegistrationError, ProviderRegistrationError, ServiceError } from './Errors.js';

const pluginManifests = getPluginManifests();
const pluginManifestMap = new Map(
  pluginManifests.map((manifest) => [manifest.name, manifest]),
);

/**
 * ServiceManager
 *
 * Replaces integration/index.js (ColorApiService). Handles:
 * - Lazy loading of plugins based on feature flags
 * - Middleware application (global and per-plugin)
 * - Plugin activation checks (isActivated pattern)
 * - Singleton initialization
 * - Duplicate plugin registration protection
 *
 * Uses custom error types from Errors.js:
 * - PluginRegistrationError: When duplicate plugins are registered
 * - ProviderRegistrationError: When duplicate providers are registered
 * - ServiceError: For plugin/provider loading failures
 */
class ServiceManager {
  #plugins = new Map();

  #providers = new Map();

  #initPromise = null;

  /**
   * Runtime configuration passed to init()
   * Allows overriding which plugins are loaded
   * @type {{ plugins?: string[], features?: Record<string, boolean> } | null}
   */
  #runtimeConfig = null;

  /**
   * Plugin manifests (for lazy loading)
   * Plugins define their own loader and feature flag signature.
   */
  #pluginManifests = pluginManifests;

  /**
   * Middleware loaders
   */
  #middlewareLoaders = {
    error: () => import('../middlewares/error.middleware.js'),
    logging: () => import('../middlewares/logging.middleware.js'),
    auth: () => import('../middlewares/auth.middleware.js'),
  };

  /**
   * Initialize the service manager.
   * Ensures initialization happens only once (Singleton pattern).
   *
   * @param {Object} [options] - Runtime configuration options
   * @param {string[]} [options.plugins] - Whitelist of plugin names to load (overrides feature flags)
   * @param {Object} [options.features] - Feature flag overrides (e.g., { ENABLE_KULER: true })
   * @returns {Promise<ServiceManager>} Promise resolving to the initialized ServiceManager
   *
   * @example
   * // Load only specific plugins
   * await serviceManager.init({ plugins: ['kuler', 'curated'] });
   *
   * @example
   * // Override feature flags
   * await serviceManager.init({ features: { ENABLE_KULER: true, ENABLE_STOCK: false } });
   */
  async init(options = {}) {
    if (this.#initPromise) return this.#initPromise;
    this.#runtimeConfig = options;
    this.#initPromise = this.#initialize();
    return this.#initPromise;
  }

  /**
   * Internal initialization logic.
   * Loads enabled plugins and applies middleware.
   *
   * @private
   * @returns {Promise<ServiceManager>}
   */
  async #initialize() {
    const loadPromises = this.#pluginManifests.map(async (manifest) => {
      if (this.#isEnabled(manifest)) {
        const plugin = await this.#loadPlugin(manifest);
        if (plugin) {
          // Apply middleware (per-plugin or global)
          await this.#applyMiddlewareToPlugin(manifest.name, plugin);
          this.#plugins.set(manifest.name, plugin);
        }
      }
    });

    await Promise.all(loadPromises);
    return this;
  }

  /**
   * @private
   * @param {string} pluginName - Plugin identifier
   * @param {Object} plugin - Plugin instance
   */
  async #applyMiddlewareToPlugin(pluginName, plugin) {
    // Check for plugin-specific middleware, fallback to global
    const pluginConfig = config.services[pluginName] || {};
    const middlewareList = pluginConfig.middleware || config.middleware;

    if (!Array.isArray(middlewareList)) {
      return;
    }

    const middlewarePromises = middlewareList.map(async (entry) => {
      // Normalize: string → { name }, object stays as-is
      const spec = typeof entry === 'string' ? { name: entry } : entry;

      if (!spec?.name) {
        // eslint-disable-next-line no-console
        console.warn('Invalid middleware entry (missing name):', entry);
        return;
      }

      if (this.#isMiddlewareEnabled(spec.name)) {
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
   * @param {Function} middleware - Middleware function
   * @param {Object} spec - Middleware config entry
   * @param {string} spec.name - Middleware name
   * @param {string[]} [spec.topics] - Whitelist of topic patterns
   * @param {string[]} [spec.excludeTopics] - Blacklist of topic patterns
   * @returns {Function} Original or guarded middleware
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
   * Load a single plugin using its lazy loader.
   *
   * @private
   * @param {Object} manifest - Plugin manifest
   * @returns {Promise<Object|null>} Plugin instance or null
   */
  async #loadPlugin(manifest) {
    if (!manifest || !manifest.name || typeof manifest.loader !== 'function') {
      throw new ServiceError('Invalid plugin manifest provided.');
    }

    const { name, loader } = manifest;

    if (this.#plugins.has(name)) {
      throw new PluginRegistrationError(
        `Plugin "${name}" is already registered. Duplicate plugin registration is not allowed.`,
        { pluginName: name },
      );
    }

    try {
      const { default: PluginClass } = await loader();

      const serviceConfig = config.services[name] || {};

      const appConfig = {
        features: config.features,
        environment: config.environment,
        services: config.services,
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
   * Check if a plugin is enabled based on runtime config or feature flags.
   *
   * @private
   * @param {Object} manifest - Plugin manifest
   * @returns {boolean}
   */
  #isEnabled(manifest) {
    if (!manifest?.name) {
      return false;
    }

    if (this.#runtimeConfig?.plugins) {
      return this.#runtimeConfig.plugins.includes(manifest.name);
    }

    const features = { ...config.features, ...this.#runtimeConfig?.features };

    if (!manifest.featureFlag) {
      return false;
    }
    return features[manifest.featureFlag] === true;
  }

  /**
   * Check if a middleware is enabled based on feature flags.
   *
   * @private
   * @param {string} name - Middleware identifier
   * @returns {boolean}
   */
  #isMiddlewareEnabled(name) {
    const flag = `ENABLE_${name.toUpperCase()}`;
    return config.features[flag] !== false;
  }

  /**
   * Get a plugin by name.
   *
   * @param {string} name - Plugin name
   * @returns {Object|undefined} Plugin instance or undefined
   */
  getPlugin(name) {
    return this.#plugins.get(name);
  }

  /**
   * Get all loaded plugins.
   *
   * @returns {Object} Object with plugin names as keys
   */
  getPlugins() {
    return Object.fromEntries(this.#plugins);
  }

  /**
   * Get provider by name.
   * Checks for directly registered (standalone) providers first,
   * then falls back to lazy-loading plugin-backed providers via manifest.
   *
   * @param {string} name - Provider name
   * @returns {Promise<Object|null>} Provider instance or null
   */
  async getProvider(name) {
    // Standalone providers (registered directly via registerProvider)
    if (this.#providers.has(name)) {
      return this.#providers.get(name);
    }

    // Plugin-backed providers (loaded lazily via manifest)
    const manifest = this.#getManifest(name);
    if (!manifest?.providerLoader) {
      return null;
    }

    const plugin = this.getPlugin(name);
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
   * Check if a provider is available (standalone or plugin-backed).
   *
   * @param {string} name - Provider name
   * @returns {boolean}
   */
  hasProvider(name) {
    return this.#providers.has(name) || !!this.#getManifest(name)?.providerLoader;
  }

  /**
   * Register a standalone provider (no backing plugin required).
   * Throws if a provider with the same name is already registered.
   *
   * @param {string} name - Provider name
   * @param {Object} provider - Provider instance
   * @throws {ProviderRegistrationError} If provider with name already registered
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
   * Check if a plugin is already registered.
   *
   * @param {string} name - Plugin name
   * @returns {boolean}
   */
  hasPlugin(name) {
    return this.#plugins.has(name);
  }

  /**
   * Get plugin manifest by name.
   *
   * @private
   * @param {string} name - Plugin name
   * @returns {Object|undefined} Plugin manifest
   */
  #getManifest(name) {
    return pluginManifestMap.get(name) || getPluginManifest(name);
  }

  /**
   * Register a plugin dynamically (for runtime registration or testing).
   * Throws if plugin with same name already exists.
   *
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin instance
   * @throws {PluginRegistrationError} If plugin with name already registered
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
   * Unregister a plugin (for testing or dynamic swapping).
   * Also removes any cached provider for this plugin.
   *
   * @param {string} name - Plugin name
   * @returns {boolean} True if plugin was removed, false if not found
   */
  unregisterPlugin(name) {
    this.#providers.delete(name); // Clean up provider cache
    return this.#plugins.delete(name);
  }

  /**
   * Reset the service manager state.
   * Useful for testing.
   */
  reset() {
    this.#plugins.clear();
    this.#providers.clear();
    this.#initPromise = null;
    this.#runtimeConfig = null;
  }
}

export const serviceManager = new ServiceManager();

/**
 * Public API to initialize the service.
 * Delegates to the singleton instance.
 *
 * @param {Object} [options] - Runtime configuration options
 * @param {string[]} [options.plugins] - Whitelist of plugin names to load
 * @param {Object} [options.features] - Feature flag overrides
 * @returns {Promise<Object>} Promise resolving to the activated plugins map
 */
export async function initApiService(options) {
  await serviceManager.init(options);
  return serviceManager.getPlugins();
}
