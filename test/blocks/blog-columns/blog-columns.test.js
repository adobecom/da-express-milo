/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/blog-columns/blog-columns.js'),
]);

const base = await readFile({ path: './mocks/base.html' });

const META_FIXTURES = {
  category: 'Enterprise',
  headline: 'Test title',
  'og:title': 'Test title fallback',
  'sub-heading': 'Lorem ipsum dolor sit amet consectetur. Mauris elementum ullamcorper dignissim sodales tempus. A a nam ut facilisi nunc. Convallis morbi faucibus vulputate proin cras lectus interdum risus diam. Lacus semper sit magnis pellentesque.',
  author: 'Adobe Express',
  'publication-date': '10/20/2025',
  description: 'Get the lowdown on the hottest graphic design trends predicted for 2025.',
  tags: '',
};

const applyMetaFixtures = (fixtures) => Object.entries(fixtures).map(([name, content]) => {
  const selector = name.includes(':') ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let meta = document.head.querySelector(selector);
  if (meta) {
    const previousContent = meta.getAttribute('content');
    meta.setAttribute('content', content);
    return { element: meta, previousContent, created: false, selector };
  }
  meta = document.createElement('meta');
  const attr = name.includes(':') ? 'property' : 'name';
  meta.setAttribute(attr, name);
  meta.setAttribute('content', content);
  document.head.append(meta);
  return { element: meta, previousContent: null, created: true, selector };
});

const restoreMetaFixtures = (state) => {
  state.forEach(({ element, previousContent, created, selector }) => {
    const meta = element?.isConnected ? element : document.head.querySelector(selector);
    if (!meta) return;
    if (created) {
      meta.remove();
    } else if (previousContent !== null && previousContent !== undefined) {
      meta.setAttribute('content', previousContent);
    } else {
      meta.removeAttribute('content');
    }
  });
};

describe('Blog Columns block', () => {
  let metaState = [];

  beforeEach(() => {
    metaState = applyMetaFixtures(META_FIXTURES);
    document.body.innerHTML = base;
  });

  afterEach(() => {
    restoreMetaFixtures(metaState);
    metaState = [];
    document.body.innerHTML = '';
  });

  it('decorates content from metadata with h2 heading (columns default)', async () => {
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

    const expectedProductName = META_FIXTURES.author;
    const expectedProductDate = META_FIXTURES['publication-date'];
    const expectedEyebrow = META_FIXTURES.category;
    const expectedSubcopy = META_FIXTURES['sub-heading'];
    const expectedHeadline = META_FIXTURES.headline;

    const eyebrow = contentColumn.querySelector('.blog-columns-eyebrow');
    expect(eyebrow).to.exist;
    expect(eyebrow.textContent.trim()).to.equal(expectedEyebrow);

    const headline = contentColumn.querySelector('h2');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal(expectedHeadline);

    const subcopy = contentColumn.querySelector('.blog-columns-subcopy');
    expect(subcopy).to.exist;
    expect(subcopy.textContent.trim()).to.equal(expectedSubcopy);

    const product = block.querySelector('.blog-columns-product');
    expect(product).to.exist;
    const productCopyWrapper = product.querySelector('.blog-columns-product-copy');
    expect(productCopyWrapper).to.exist;
    const productHeading = productCopyWrapper.querySelector('.blog-columns-product-name');
    expect(productHeading).to.exist;
    expect(productHeading.textContent).to.equal(expectedProductName);
    const productDate = productCopyWrapper.querySelector('.blog-columns-product-date');
    expect(productDate).to.exist;
    expect(productDate.textContent.trim()).to.equal(expectedProductDate);

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

  it('falls back to og:title metadata when headline is missing', async () => {
    const block = document.getElementById('blog-columns-block');
    const headlineMeta = document.head.querySelector('meta[name="headline"]');
    headlineMeta?.setAttribute('content', '');

    await decorate(block);

    const headline = block.querySelector('.blog-columns-content h2');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal(META_FIXTURES['og:title']);
  });

  it('omits eyebrow when metadata value is empty', async () => {
    const block = document.getElementById('blog-columns-block');
    const eyebrowMeta = document.head.querySelector('meta[name="category"]');
    eyebrowMeta?.setAttribute('content', '');

    await decorate(block);

    const decoratedEyebrow = block.querySelector('.blog-columns-eyebrow');
    expect(decoratedEyebrow).to.not.exist;
  });

  it('handles block without optional CTA row', async () => {
    const block = document.getElementById('blog-columns-block');
    block.lastElementChild.remove();
    await decorate(block);

    const highlight = block.querySelector('.blog-columns-products');
    expect(highlight).to.exist;
    const buttonContainer = block.querySelector('.button-container');
    expect(buttonContainer).to.not.exist;
  });

  it('omits product highlight when product metadata is absent', async () => {
    const block = document.getElementById('blog-columns-block');
    ['author', 'publication-date', 'description', 'tags']
      .forEach((metaName) => {
        const meta = document.head.querySelector(`meta[name="${metaName}"]`);
        meta?.setAttribute('content', '');
      });

    await decorate(block);

    const highlight = block.querySelector('.blog-columns-products');
    expect(highlight).to.not.exist;
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
