/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const { default: decorate } = await import('../../../express/code/blocks/font-bento/font-bento.js');

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const block = document.querySelector('.font-bento');
  await decorate(block);
  return block;
}

describe('font-bento', () => {
  it('decorates successfully', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
  });

  it('builds header with text and CTA', async () => {
    const block = await prepBlock('./mocks/default.html');
    const header = block.querySelector('.font-bento-header');
    expect(header).to.exist;
    const textContent = header.querySelector('.font-bento-text');
    expect(textContent).to.exist;
    expect(textContent.querySelector('h2')).to.exist;
    expect(textContent.querySelector('p')).to.exist;
  });

  it('header text contains heading', async () => {
    const block = await prepBlock('./mocks/default.html');
    const h2 = block.querySelector('.font-bento-text h2');
    expect(h2).to.exist;
    expect(h2.textContent).to.include('Lorem ipsum');
  });

  it('builds bento grid with 6 cards', async () => {
    const block = await prepBlock('./mocks/default.html');
    const grid = block.querySelector('.font-bento-grid');
    expect(grid).to.exist;
    const cards = grid.querySelectorAll('.font-bento-card');
    expect(cards.length).to.equal(6);
  });

  it('each card has a title and media', async () => {
    const block = await prepBlock('./mocks/default.html');
    const cards = block.querySelectorAll('.font-bento-card');
    cards.forEach((card) => {
      expect(card.querySelector('.font-bento-card-title')).to.exist;
      expect(card.querySelector('.font-bento-card-media')).to.exist;
      expect(card.querySelector('picture')).to.exist;
    });
  });

  it('first and last cards have numbered classes for wide layout', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.font-bento-card-1')).to.exist;
    expect(block.querySelector('.font-bento-card-6')).to.exist;
  });

  it('removes original authored rows after decoration', async () => {
    const block = await prepBlock('./mocks/default.html');
    const rawRows = [...block.children].filter(
      (el) => !el.classList.contains('font-bento-header') && !el.classList.contains('font-bento-grid'),
    );
    expect(rawRows.length).to.equal(0);
  });
});
