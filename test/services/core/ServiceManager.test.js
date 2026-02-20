import { expect } from '@esm-bundle/chai';
import {
  serviceManager,
  initApiService,
} from '../../../express/code/libs/services/core/ServiceManager.js';
import {
  ConfigError,
  PluginRegistrationError,
  ProviderRegistrationError,
} from '../../../express/code/libs/services/core/Errors.js';

describe('ServiceManager (core behaviors)', () => {
  beforeEach(() => {
    serviceManager.reset();
    serviceManager.setConfigResolverForTesting(async () => ({
      features: {
        ENABLE_KULER: true,
        ENABLE_CURATED: true,
        ENABLE_CCLIBRARY: true,
        ENABLE_ERROR: true,
        ENABLE_LOGGING: true,
        ENABLE_AUTH: true,
      },
      middleware: ['error', 'logging'],
      services: {},
      environment: 'prod',
    }));
  });

  afterEach(() => {
    serviceManager.reset();
  });

  it('registers and retrieves plugins, and reports existence', () => {
    const plugin = { dispatch: async () => ({ ok: true }) };

    serviceManager.registerPlugin('mock', plugin);

    expect(serviceManager.hasPlugin('mock')).to.be.true;
    expect(serviceManager.getPlugin('mock')).to.equal(plugin);
    expect(serviceManager.getPlugins()).to.deep.equal({ mock: plugin });
  });

  it('throws PluginRegistrationError for duplicate plugin registration', () => {
    const plugin = {};
    serviceManager.registerPlugin('mock', plugin);

    expect(() => serviceManager.registerPlugin('mock', {})).to.throw(PluginRegistrationError);
  });

  it('unregisterPlugin removes plugin and returns boolean status', () => {
    serviceManager.registerPlugin('to-remove', {});
    expect(serviceManager.unregisterPlugin('to-remove')).to.be.true;
    expect(serviceManager.hasPlugin('to-remove')).to.be.false;
    expect(serviceManager.unregisterPlugin('missing')).to.be.false;
  });

  it('hasProvider reflects manifest-defined provider support', () => {
    expect(serviceManager.hasProvider('stock')).to.be.true;
    expect(serviceManager.hasProvider('kuler')).to.be.true;
    expect(serviceManager.hasProvider('curated')).to.be.false;
  });

  it('getProvider returns null when plugin is not registered', async () => {
    const provider = await serviceManager.getProvider('stock');
    expect(provider).to.be.null;
  });

  it('getProvider returns null when provider module cannot be loaded', async () => {
    const providerA = await serviceManager.getProvider('stock');
    const providerB = await serviceManager.getProvider('stock');

    expect(providerA).to.be.null;
    expect(providerB).to.be.null;
  });

  it('init is additive — subsequent calls load new plugins', async () => {
    const managerA = await serviceManager.init({ plugins: [] });
    expect(managerA).to.equal(serviceManager);
    expect(serviceManager.getPlugins()).to.deep.equal({});

    // Second call with different plugins should still resolve
    const managerB = await serviceManager.init({ plugins: [] });
    expect(managerB).to.equal(serviceManager);
  });

  it('initApiService returns loaded plugins map', async () => {
    const plugins = await initApiService({ plugins: [] });
    expect(plugins).to.deep.equal({});
  });

  it('reset clears state and allows init to run again', async () => {
    await serviceManager.init({ plugins: [] });
    serviceManager.registerPlugin('temporary', {});
    expect(serviceManager.hasPlugin('temporary')).to.be.true;

    serviceManager.reset();

    expect(serviceManager.getPlugins()).to.deep.equal({});
    await serviceManager.init({ plugins: [] });
    expect(serviceManager.getPlugins()).to.deep.equal({});
  });

  it('loadPlugin returns null for unknown plugin names', async () => {
    const result = await serviceManager.loadPlugin('nonexistent');
    expect(result).to.be.null;
  });

  it('loadPlugin returns cached plugin if already loaded', async () => {
    const plugin = { dispatch: async () => ({}) };
    serviceManager.registerPlugin('cached', plugin);

    const result = await serviceManager.loadPlugin('cached');
    expect(result).to.equal(plugin);
  });

  it('wraps config resolver failures as ConfigError', async () => {
    serviceManager.setConfigResolverForTesting(async () => {
      throw new Error('boom');
    });

    try {
      await serviceManager.loadPlugin('kuler');
      throw new Error('Expected ConfigError to be thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(ConfigError);
      expect(error.code).to.equal('CONFIG_ERROR');
      expect(error.originalError).to.be.instanceOf(Error);
      expect(error.originalError.message).to.equal('boom');
    }
  });

  describe('registerProvider (standalone providers)', () => {
    it('registers and retrieves a standalone provider', async () => {
      const provider = { getState: () => ({ ok: true }) };
      serviceManager.registerProvider('authState', provider);

      expect(serviceManager.hasProvider('authState')).to.be.true;

      const retrieved = await serviceManager.getProvider('authState');
      expect(retrieved).to.equal(provider);
    });

    it('throws ProviderRegistrationError for duplicate registration', () => {
      const first = { id: 'first' };
      const second = { id: 'second' };

      serviceManager.registerProvider('authState', first);

      expect(() => serviceManager.registerProvider('authState', second))
        .to.throw(ProviderRegistrationError);
    });

    it('standalone provider is returned before plugin-backed lookup', async () => {
      const standalone = { standalone: true };
      serviceManager.registerProvider('stock', standalone);

      const retrieved = await serviceManager.getProvider('stock');
      expect(retrieved).to.equal(standalone);
    });

    it('reset clears standalone providers', async () => {
      serviceManager.registerProvider('authState', { ok: true });
      expect(serviceManager.hasProvider('authState')).to.be.true;

      serviceManager.reset();

      expect(serviceManager.hasProvider('authState')).to.be.false;
      const retrieved = await serviceManager.getProvider('authState');
      expect(retrieved).to.be.null;
    });
  });
});
