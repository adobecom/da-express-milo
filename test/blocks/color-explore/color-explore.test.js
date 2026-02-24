/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const stripsHtml = await readFile({ path: './mocks/strips.html' });
const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/color-explore/color-explore.js'),
]);
const { default: decorate } = imports[1];

describe('Color Explore', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('strips variant renders summary cards', async () => {
    document.body.innerHTML = stripsHtml;
    const block = document.querySelector('.color-explore');
    await decorate(block);

    expect(block.classList.contains('color-explore--strips')).to.be.true;
    const grid = block.querySelector('.palettes-grid');
    expect(grid).to.exist;
    const cards = block.querySelectorAll('.color-card');
    expect(cards.length).to.be.greaterThan(0);
    const strip = block.querySelector('.color-shared-palette-strip');
    expect(strip).to.exist;
    expect(strip.getAttribute('data-palette-strip-variant')).to.equal('explore');
  });
});
