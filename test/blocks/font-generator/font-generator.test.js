import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({});
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/font-generator/font-generator.js')]);

describe('font-generator module', () => {
  it('exports decorate as a function', () => {
    expect(typeof decorate).to.equal('function');
  });

  it('decorate is async (returns a Promise)', () => {
    // A quick structural check: calling decorate with a null-ish block lets us
    // confirm it returns a thenable without running the full DOM flow.
    const div = document.createElement('div');
    div.innerHTML = '<div><div>placeholder</div></div>';
    const result = decorate(div);
    expect(result).to.be.instanceOf(Promise);
    // Swallow the rejection so the test environment stays clean.
    result.catch(() => {});
  });
});
