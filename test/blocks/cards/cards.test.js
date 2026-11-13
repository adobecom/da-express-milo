/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/cards/cards.js'),
]);
const { default: decorate } = imports[1];

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Cards', () => {
  before(async () => {
    const cards = document.querySelector('.cards');
    await decorate(cards);
  });

  it('Cards exists', () => {
    const cards = document.querySelector('.cards');
    expect(cards).to.exist;
  });

  it('Cards has the correct elements', () => {
    expect(document.querySelector('.card')).to.exist;
    // If img
    expect(document.querySelector('.card-image')).to.exist;
    // If not img
    expect(document.querySelector('.card-content')).to.exist;
  });

  it('If text content starts with https://, create a card wrapper', () => {
    expect(document.querySelector('a')).to.exist;
    expect(document.querySelector('a.card')).to.exist;
  });
});
