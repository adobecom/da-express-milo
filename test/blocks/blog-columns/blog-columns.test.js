/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/blog-columns/blog-columns.js'),
]);

const base = await readFile({ path: './mocks/base.html' });
const imageUrlBase = await readFile({ path: './mocks/image-url.html' });

describe('Blog Columns block', () => {
  beforeEach(() => {
    document.body.innerHTML = base;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('decorates content from block rows with h2 heading', async () => {
    const block = document.getElementById('blog-columns-block');
    await decorate(block);

    const wrapper = block.querySelector('.blog-columns-inner');
    expect(wrapper).to.exist;
    expect(wrapper.classList.contains('blog-columns-ready')).to.be.true;
    const row = wrapper.querySelector(':scope > .blog-columns-row');
    expect(row).to.exist;
    const columns = [...row.querySelectorAll(':scope > .column')];
    expect(columns.length).to.equal(2);
    const [contentColumn, mediaColumn] = columns;
    expect(contentColumn.classList.contains('blog-columns-content')).to.be.true;
    expect(mediaColumn.classList.contains('blog-columns-media')).to.be.true;

    const eyebrow = contentColumn.querySelector('.blog-columns-eyebrow');
    expect(eyebrow).to.exist;
    expect(eyebrow.textContent.trim()).to.equal('Enterprise');

    const headline = contentColumn.querySelector('h2');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal('Lorem ipsum dolor sit amet consectetur. Nunc amet eu aenean gravida.');

    const subcopy = contentColumn.querySelector('.blog-columns-subcopy');
    expect(subcopy).to.exist;
    expect(subcopy.textContent.trim()).to.include('Mauris elementum ullamcorper');

    const product = block.querySelector('.blog-columns-product');
    expect(product).to.exist;
    const productHeading = product.querySelector('.blog-columns-product-name');
    expect(productHeading).to.exist;
    expect(productHeading.textContent).to.equal('Adobe Express');
    const productDate = product.querySelector('.blog-columns-product-date');
    expect(productDate).to.exist;
    expect(productDate.textContent.trim()).to.equal('10/20/2025');

    const buttonContainer = contentColumn.querySelector('.button-container');
    expect(buttonContainer).to.exist;
    const cta = buttonContainer.querySelector('a');
    expect(cta).to.exist;
    expect(cta.classList.contains('button-xl')).to.be.true;
    expect(cta.textContent.trim()).to.equal('Read more');

    const mediaPicture = mediaColumn.querySelector(':scope > picture');
    expect(mediaPicture).to.exist;
    const mediaImg = mediaPicture.querySelector('img');
    expect(mediaImg).to.exist;
    expect(mediaImg.classList.contains('blog-columns-media-image')).to.be.true;
  });

  it('supports image URL in first row instead of raw image', async () => {
    document.body.innerHTML = imageUrlBase;
    const block = document.getElementById('blog-columns-url-block');
    await decorate(block);

    const mediaColumn = block.querySelector('.blog-columns-media');
    expect(mediaColumn).to.exist;
    const img = mediaColumn.querySelector('img');
    expect(img).to.exist;
    expect(img.getAttribute('src')).to.equal('https://example.com/hero.jpg');
    expect(img.classList.contains('blog-columns-media-image')).to.be.true;

    const headline = block.querySelector('.blog-columns-content h2');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal('Test headline from block');

    const cta = block.querySelector('.button-container a');
    expect(cta).to.exist;
    expect(cta.textContent.trim()).to.equal('Label');
  });

  it('handles 2-row block with CTA only (backward compat)', async () => {
    const block = document.getElementById('blog-columns-block');
    block.children[1].remove();
    block.children[1].remove();
    block.innerHTML = `
      <div><div><picture><img src="./media.png" width="800" height="480" alt=""></picture></div></div>
      <div><div><p><a href="https://example.com/read">Read more</a></p></div></div>
    `;
    block.id = 'blog-columns-block';
    await decorate(block);

    const cta = block.querySelector('.button-container a');
    expect(cta).to.exist;
    expect(cta.textContent.trim()).to.equal('Read more');
    const eyebrow = block.querySelector('.blog-columns-eyebrow');
    expect(eyebrow).to.not.exist;
  });

  it('handles block without product/CTA row (image + content only)', async () => {
    const block = document.getElementById('blog-columns-block');
    block.lastElementChild.remove();
    await decorate(block);

    const contentColumn = block.querySelector('.blog-columns-content');
    expect(contentColumn).to.exist;
    const headline = contentColumn.querySelector('h2');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal('Lorem ipsum dolor sit amet consectetur. Nunc amet eu aenean gravida.');

    const buttonContainer = block.querySelector('.button-container');
    expect(buttonContainer).to.not.exist;

    const highlight = block.querySelector('.blog-columns-products');
    expect(highlight).to.not.exist;
  });

  it('omits product highlight when product row has no name or date', async () => {
    const block = document.getElementById('blog-columns-block');
    const productRow = block.children[2];
    productRow.innerHTML = '<div><p><a href="https://example.com">CTA only</a></p></div>';
    await decorate(block);

    const highlight = block.querySelector('.blog-columns-products');
    expect(highlight).to.not.exist;
    const cta = block.querySelector('.button-container a');
    expect(cta).to.exist;
  });

  it('supports text-right variant with media column rendered first', async () => {
    const block = document.getElementById('blog-columns-block');
    block.classList.add('text-right');

    await decorate(block);

    const row = block.querySelector('.blog-columns-row');
    expect(row).to.exist;
    const columns = [...row.querySelectorAll(':scope > .column')];
    expect(columns.length).to.equal(2);
    expect(columns[0].classList.contains('blog-columns-content')).to.be.true;
    expect(columns[1].classList.contains('blog-columns-media')).to.be.true;
  });

  it('applies fill class from #_button-fill in CTA href', async () => {
    document.body.innerHTML = base.replace(
      'href="https://example.com/read"',
      'href="https://example.com/read#_button-fill"',
    );
    const block = document.getElementById('blog-columns-block');
    await decorate(block);

    const cta = block.querySelector('.button-container a');
    expect(cta).to.exist;
    expect(cta.classList.contains('fill')).to.be.true;
    expect(cta.getAttribute('href')).to.not.include('#_button-fill');
  });
});
