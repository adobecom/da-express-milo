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

/**
 * ServiceManager
 *
 * Central orchestrator for the service layer. Handles:
 * - On-demand (lazy) loading of plugins when first requested
 * - Batch initialization via init() for preloading multiple plugins
 * - Additive init — subsequent init() calls load new plugins without
 *   discarding previously loaded ones
 * - Middleware application (global and per-plugin)
 * - Plugin activation checks (isActivated pattern)
 * - Concurrent-request deduplication for lazy loading
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

  /**
   * In-flight plugin load promises for concurrent-request deduplication.
   * Entries are removed once the load settles (success or failure).
   * @type {Map<string, Promise<Object|null>>}
   */
  #pluginLoadPromises = new Map();

  /**
   * Runtime configuration passed to init()
   * Allows overriding which plugins are loaded
   * @type {{ plugins?: string[], features?: Record<string, boolean> } | null}
   */
  #runtimeConfig = null;

  /**
   * Resolved runtime configuration loaded from config.js
   * @type {Object|null}
   */
  #resolvedConfig = null;

  /**
   * In-flight config resolution promise for deduplication.
   * @type {Promise<Object>|null}
   */
  #configPromise = null;

  /**
   * Config resolver function (overridable for tests).
   * @type {() => Promise<Object>}
   */
  #configResolver = DEFAULT_CONFIG_RESOLVER;

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
   * Resolve runtime config once and cache it.
   *
   * @private
   * @returns {Promise<Object>} Resolved configuration
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
   * Initialize the service manager with a batch of plugins.
   *
   * Additive: subsequent calls merge the requested plugins with previously
   * loaded ones. Plugins that are already loaded are skipped, not reloaded.
   *
   * @param {Object} [options] - Runtime configuration options
   * @param {string[]} [options.plugins] - Plugin names to load (merged additively)
   * @param {Object} [options.features] - Feature flag overrides (e.g., { ENABLE_KULER: true })
   * @returns {Promise<ServiceManager>} Promise resolving to the ServiceManager
   *
   * @example
   * // Load specific plugins (additive across calls)
   * await serviceManager.init({ plugins: ['kuler'] });
   * await serviceManager.init({ plugins: ['cclibrary'] }); // loads cclibrary, keeps kuler
   *
   * @example
   * // Override feature flags
   * await serviceManager.init({ features: { ENABLE_KULER: true, ENABLE_STOCK: false } });
   */
  async init(options = {}) {
    // Merge runtime config additively
    if (this.#runtimeConfig?.plugins && options.plugins) {
      const combined = [...new Set([
        ...this.#runtimeConfig.plugins,
        ...options.plugins,
      ])];
      this.#runtimeConfig = { ...this.#runtimeConfig, ...options, plugins: combined };
    } else {
      this.#runtimeConfig = { ...this.#runtimeConfig, ...options };
    }

    // If plugins are explicitly provided, they take precedence and do not require
    // resolving feature-flag config unless plugins are actually loaded.
    if (Array.isArray(this.#runtimeConfig?.plugins)) {
      const loadPromises = this.#pluginManifests
        .filter((m) => this.#runtimeConfig.plugins.includes(m.name) && !this.#plugins.has(m.name))
        .map((manifest) => this.#ensurePlugin(manifest.name));

      await Promise.all(loadPromises);
      return this;
    }

    // Load any enabled plugins not yet loaded
    const resolvedConfig = await this.#ensureConfig();
    const loadPromises = this.#pluginManifests
      .filter((m) => this.#isEnabled(m, resolvedConfig) && !this.#plugins.has(m.name))
      .map((manifest) => this.#ensurePlugin(manifest.name, resolvedConfig));

    await Promise.all(loadPromises);
    return this;
  }

  /**
   * Lazily load a plugin by name if not already loaded.
   * Deduplicates concurrent requests for the same plugin.
   *
   * @private
   * @param {string} name - Plugin name
   * @returns {Promise<Object|null>} Plugin instance or null
   */
  async #ensurePlugin(name, resolvedConfigParam) {
    // Already loaded
    if (this.#plugins.has(name)) return this.#plugins.get(name);

    // Already loading (concurrent request dedup)
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
   * @param {string} pluginName - Plugin identifier
   * @param {Object} plugin - Plugin instance
   */
  async #applyMiddlewareToPlugin(pluginName, plugin, resolvedConfig) {
    // Check for plugin-specific middleware, fallback to global
    const pluginConfig = resolvedConfig.services[pluginName] || {};
    const middlewareList = pluginConfig.middleware || resolvedConfig.middleware;

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
  async #loadPlugin(manifest, resolvedConfig) {
    if (!manifest || !manifest.name || typeof manifest.loader !== 'function') {
      throw new ServiceError('Invalid plugin manifest provided.');
    }

    const { name, loader } = manifest;

    // Already loaded — return existing (safe for lazy-load races)
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
   * Check if a plugin is enabled based on runtime config or feature flags.
   *
   * @private
   * @param {Object} manifest - Plugin manifest
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
   * Check if a middleware is enabled based on feature flags.
   *
   * @private
   * @param {string} name - Middleware identifier
   * @returns {boolean}
   */
  static #isMiddlewareEnabled(name, resolvedConfig) {
    const flag = `ENABLE_${name.toUpperCase()}`;
    return resolvedConfig.features[flag] !== false;
  }

  /**
   * Get a plugin by name (synchronous).
   * Returns the cached plugin instance or undefined if not yet loaded.
   * For on-demand loading, use {@link loadPlugin}.
   *
   * @param {string} name - Plugin name
   * @returns {Object|undefined} Plugin instance or undefined
   */
  getPlugin(name) {
    return this.#plugins.get(name);
  }

  /**
   * Load a plugin by name on demand.
   * If the plugin is already loaded, returns the cached instance.
   * Otherwise, lazy-loads it from its manifest, applies middleware,
   * and caches it for future use.
   *
   * @param {string} name - Plugin name (must match a registered manifest)
   * @returns {Promise<Object|null>} Plugin instance or null if not found/deactivated
   *
   * @example
   * const kuler = await serviceManager.loadPlugin('kuler');
   */
  async loadPlugin(name) {
    const resolvedConfig = await this.#ensureConfig();
    return this.#ensurePlugin(name, resolvedConfig);
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
   * then falls back to lazy-loading the backing plugin and provider via manifest.
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

    const resolvedConfig = await this.#ensureConfig();

    // Lazy-load the plugin if not already loaded
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
    return this.#pluginManifests.find((manifest) => manifest.name === name)
      || pluginManifestMap.get(name)
      || getPluginManifest(name);
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
    this.#pluginLoadPromises.clear();
    this.#runtimeConfig = null;
    this.#resolvedConfig = null;
    this.#configPromise = null;
    this.#configResolver = DEFAULT_CONFIG_RESOLVER;
  }

  /**
   * Override runtime config resolver for tests.
   * @param {() => Promise<Object>} resolver - Async function returning resolved config
   */
  setConfigResolverForTesting(resolver) {
    this.#configResolver = resolver || DEFAULT_CONFIG_RESOLVER;
    this.#resolvedConfig = null;
    this.#configPromise = null;
  }
}

export const serviceManager = new ServiceManager();

/**
 * Public API to initialize the service.
 * Delegates to the singleton instance.
 * Additive: subsequent calls load additional plugins without discarding existing ones.
 *
 * @param {Object} [options] - Runtime configuration options
 * @param {string[]} [options.plugins] - Plugin names to load (merged additively)
 * @param {Object} [options.features] - Feature flag overrides
 * @returns {Promise<Object>} Promise resolving to the activated plugins map
 */
export async function initApiService(options) {
  await serviceManager.init(options);
  return serviceManager.getPlugins();
}
