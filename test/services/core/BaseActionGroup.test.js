import { expect } from '@esm-bundle/chai';
import BaseActionGroup from '../../../express/code/libs/services/core/BaseActionGroup.js';
import { ConfigError } from '../../../express/code/libs/services/core/Errors.js';

describe('BaseActionGroup', () => {
  it('stores plugin reference and exposes it through accessors', () => {
    const plugin = { name: 'mock-plugin' };
    const group = new BaseActionGroup(plugin);

    expect(group.plugin).to.equal(plugin);
    expect(group.getPlugin()).to.equal(plugin);
  });

  it('throws when getHandlers is not implemented by subclass', () => {
    const group = new BaseActionGroup({});
    expect(() => group.getHandlers()).to.throw('Subclasses must implement getHandlers()');
  });

  it('returns registered group names from plugin actionGroups map', () => {
    const plugin = {
      actionGroups: new Map([
        ['search', {}],
        ['themes', {}],
      ]),
    };

    expect(BaseActionGroup.getRegisteredGroupNames(plugin)).to.deep.equal(['search', 'themes']);
  });

  it('returns empty array when plugin has no actionGroups map', () => {
    expect(BaseActionGroup.getRegisteredGroupNames({})).to.deep.equal([]);
  });

  it('throws for null plugin input (current behavior)', () => {
    expect(() => BaseActionGroup.getRegisteredGroupNames(null)).to.throw(TypeError);
  });

  describe('requireConfig', () => {
    it('does not throw when all values are truthy', () => {
      expect(() => BaseActionGroup.requireConfig({ a: 'val', b: 1 }, 'TestService')).to.not.throw();
    });

    it('throws ConfigError when a value is falsy', () => {
      try {
        BaseActionGroup.requireConfig({ url: '', key: 'ok' }, 'TestService');
        expect.fail('Should have thrown ConfigError');
      } catch (err) {
        expect(err).to.be.instanceOf(ConfigError);
        expect(err.serviceName).to.equal('TestService');
        expect(err.configKey).to.equal('url');
        expect(err.message).to.include('url');
      }
    });

    it('lists all missing keys in the error message', () => {
      try {
        BaseActionGroup.requireConfig({ alpha: undefined, beta: null, gamma: 'ok' }, 'Svc');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('alpha');
        expect(err.message).to.include('beta');
        expect(err.message).to.not.include('gamma');
      }
    });

    it('sets configKey to the first missing key', () => {
      try {
        BaseActionGroup.requireConfig({ first: 0, second: '' }, 'Svc');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.configKey).to.equal('first');
      }
    });

    it('does not throw for an empty values object', () => {
      expect(() => BaseActionGroup.requireConfig({}, 'Svc')).to.not.throw();
    });
  });
});
