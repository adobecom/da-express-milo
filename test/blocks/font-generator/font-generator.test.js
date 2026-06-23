import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({});
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/font-generator/font-generator.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('font-generator', () => {
  let block;

  before(async () => {
    block = document.querySelector('.font-generator');
    await decorate(block);
  });

  it('clears the original authored content', () => {
    expect(block.querySelector('div > div')).to.not.exist;
  });

  it('appends a section.fg-container', () => {
    const container = block.querySelector('.fg-container');
    expect(container).to.exist;
    expect(container.tagName.toLowerCase()).to.equal('section');
  });

  it('fg-container contains fg-sidebar', () => {
    expect(block.querySelector('.fg-container .fg-sidebar')).to.exist;
  });

  it('fg-container contains fg-main', () => {
    expect(block.querySelector('.fg-container .fg-main')).to.exist;
  });
});
