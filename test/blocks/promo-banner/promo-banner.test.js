/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/promo-banner/promo-banner.js')]);
const { default: decorate } = imports[1];

const body = await readFile({ path: './mocks/body.html' });

describe('PromoBanner', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('PromoBanner exists', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#with-bg-color.promo-banner');
    await decorate(block);
    expect(block).to.exist;
  });

  it('content row gets content class', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#with-bg-color.promo-banner');
    await decorate(block);
    const content = block.querySelector('.content');
    expect(content).to.exist;
  });

  it('config rows are removed from DOM', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#with-bg-color.promo-banner');
    await decorate(block);
    const rows = block.querySelectorAll(':scope > div');
    expect(rows.length).to.equal(1);
  });

  it('background color is applied from config row', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#with-bg-color.promo-banner');
    await decorate(block);
    expect(block.style.background).to.equal('#1473e6');
    expect(block.classList.contains('has-custom-bg')).to.be.true;
  });

  it('text color is applied from second config row', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#with-bg-color.promo-banner');
    await decorate(block);
    expect(block.style.color).to.equal('#ffffff');
  });

  it('gradient background is applied', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#with-gradient-bg.promo-banner');
    await decorate(block);
    expect(block.style.background).to.include('linear-gradient');
    expect(block.classList.contains('has-custom-bg')).to.be.true;
  });

  it('no inline styles when no config rows', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('#no-config.promo-banner');
    await decorate(block);
    expect(block.style.background).to.equal('');
    expect(block.style.color).to.equal('');
  });
});
