import { expect } from '@esm-bundle/chai';
import {
  serviceManager,
  initApiService,
} from '../../../express/code/libs/services/core/ServiceManager.js';
import { PluginRegistrationError } from '../../../express/code/libs/services/core/Errors.js';

describe('ServiceManager (core behaviors)', () => {
  beforeEach(() => {
    serviceManager.reset();
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

  it('getProvider creates and caches provider instances', async () => {
    const plugin = {
      constructor: { serviceName: 'StockPlugin' },
      useAction() {
        return async () => ({ ok: true });
      },
    };
    serviceManager.registerPlugin('stock', plugin);

    const providerA = await serviceManager.getProvider('stock');
    const providerB = await serviceManager.getProvider('stock');

    expect(providerA).to.not.be.null;
    expect(providerB).to.equal(providerA);
  });

  it('init returns manager instance consistently within a reset cycle', async () => {
    const managerA = await serviceManager.init({ plugins: [] });
    const managerB = await serviceManager.init({ plugins: ['stock'] });

    expect(managerA).to.equal(serviceManager);
    expect(managerB).to.equal(serviceManager);
    expect(serviceManager.getPlugins()).to.deep.equal({});
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
});
