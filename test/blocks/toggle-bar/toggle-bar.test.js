import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/toggle-bar/toggle-bar.js')]);
const { default: decorate } = imports[1];
const defVer = await readFile({ path: './mocks/default.html' });
const stickyVer = await readFile({ path: './mocks/sticky.html' });
const floatVer = await readFile({ path: './mocks/float-sticky.html' });

describe('Toggle Bar - Default Variant', () => {
  beforeEach(() => {
    document.body.innerHTML = defVer;
  });

  it('block exists', async () => {
    const block = document.getElementById('default-version');
    await decorate(block);
    expect(block).to.exist;
  });

  it('toggling works', async () => {
    const block = document.getElementById('default-version');
    await decorate(block);

    const buttons = block.querySelectorAll('button.toggle-bar-button');
    buttons[1].click();

    expect(document.querySelector('.section[data-toggle="Social media"]').style.display).to.equal('block');
  });
});

describe('Toggle Bar - Sticky Variant', () => {
  beforeEach(() => {
    document.body.innerHTML = stickyVer;
  });

  it('sticky variant block exists', async () => {
    const block = document.getElementById('sticky-version');
    await decorate(block);
    expect(block).to.exist;
  });

  // it('becomes sticky when scrolled', async () => {
  //   const block = document.getElementById('sticky-version');
  //   await decorate(block);
  //   window.scrollBy({ top: window.innerHeight });
  //   document.dispatchEvent(new Event('scroll'));
  //   expect(block.classList.contains('sticking')).to.be.true;
  // });

  it('hides when scrolled past activated section', async () => {
    const block = document.getElementById('sticky-version');
    await decorate(block);
    window.scrollTo({ top: document.body.scrollHeight });
    document.dispatchEvent(new Event('scroll'));
    expect(block.classList.contains('hidden')).to.be.true;
  });
});

describe('Toggle Bar - Float Sticky variant', async () => {
  beforeEach(() => {
    document.body.innerHTML = floatVer;
  });

  it('floating sticky variant block exists', async () => {
    const block = document.getElementById('float-sticky-version');
    await decorate(block);
    expect(block).to.exist;
  });
});
