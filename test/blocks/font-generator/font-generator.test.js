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

  it('exports decorate as a function', () => {
    expect(typeof decorate).to.equal('function');
  });

  it('clears the original authored content', () => {
    expect(block.textContent).to.not.contain('Authored content to be cleared');
  });

  it('appends a section.fg-container', () => {
    const container = block.querySelector('.fg-container');
    expect(container).to.exist;
    expect(container.tagName.toLowerCase()).to.equal('section');
  });

  it('fg-container holds the sidebar and main columns', () => {
    expect(block.querySelector('.fg-container .fg-sidebar')).to.exist;
    expect(block.querySelector('.fg-container .fg-main')).to.exist;
  });

  it('sidebar contains the preview text input and the filters', () => {
    expect(block.querySelector('.fg-sidebar .font-generator-text-input')).to.exist;
    expect(block.querySelector('.fg-sidebar .fg-filters')).to.exist;
  });

  it('renders preview suggestion pills from the resolved copy', () => {
    expect(block.querySelectorAll('.fg-sidebar .tag-pills').length).to.be.greaterThan(0);
  });

  it('main contains the toolbar and the card grid', () => {
    expect(block.querySelector('.fg-main .font-generator-toolbar')).to.exist;
    expect(block.querySelector('.fg-main .font-card-grid')).to.exist;
  });

  it('renders a font card for the loaded styles', () => {
    expect(block.querySelectorAll('.font-card').length).to.be.greaterThan(0);
  });

  it('mounts the mobile/tablet filter panel overlay', () => {
    expect(block.querySelector('.fg-overlay .fg-panel')).to.exist;
  });
});
