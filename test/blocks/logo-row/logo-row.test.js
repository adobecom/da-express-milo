import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate from '../../../express/code/blocks/logo-row/logo-row.js';

await import('../../../express/code/scripts/scripts.js');

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Logo Row', () => {
  let blocks;
  const cardCnts = 5;
  let fetchStub;

  before(async () => {
    blocks = Array.from(document.querySelectorAll('.logo-row'));
    await Promise.all(blocks.map((block) => decorate(block)));
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    // Restore the original functionality after each test
    fetchStub.restore();
  });

  it('Logo Row exists', () => {
    expect(Array.from(document.querySelectorAll('.text-column')).length === 1);
  });

  it(`Card counts to be ${cardCnts}`, () => {
    const cards = document.querySelectorAll('.image-column>picture');
    expect(cards.length === cardCnts.length);
  });

  it('removes slash separators without changing images, links, or other text', () => {
    const block = blocks[0].cloneNode(true);
    const imageColumn = block.querySelector('.image-column');
    const images = Array.from(imageColumn.querySelectorAll('img'));
    const imageMarkup = images.map((image) => image.outerHTML);
    const separator = document.createElement('p');
    separator.textContent = ' \\ ';
    imageColumn.prepend(separator, document.createTextNode(' / '));
    const caption = document.createElement('p');
    caption.textContent = 'Brand / Company';
    imageColumn.append(caption);
    const link = document.createElement('a');
    link.href = '/brands/example';
    link.append(images[0]);
    imageColumn.append(link, document.createTextNode(' \\ / '));
    block.querySelector('.text-column').append(' / ');

    decorate(block);

    expect(imageColumn.contains(separator)).to.equal(false);
    expect(imageColumn.textContent.trim()).to.equal('Brand / Company');
    expect(imageColumn.querySelectorAll('img').length).to.equal(images.length);
    images.forEach((image, index) => {
      expect(image.outerHTML).to.equal(imageMarkup[index]);
    });
    expect(link.getAttribute('href')).to.equal('/brands/example');
    expect(link.contains(images[0])).to.equal(true);
    expect(block.querySelector('.text-column').textContent).to.contain(' / ');
  });
});
