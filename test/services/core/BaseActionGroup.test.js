import { expect } from '@esm-bundle/chai';
import BaseActionGroup from '../../../express/code/libs/services/core/BaseActionGroup.js';

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
});
