/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/blog-article-marquee/blog-article-marquee.js'),
]);

const base = await readFile({ path: './mocks/base.html' });

const META_FIXTURES = {
  category: 'Enterprise',
  headline: 'Test title',
  'og:title': 'Test title fallback',
  subheading: 'Lorem ipsum dolor sit amet consectetur. Mauris elementum ullamcorper dignissim sodales tempus. A a nam ut facilisi nunc. Convallis morbi faucibus vulputate proin cras lectus interdum risus diam. Lacus semper sit magnis pellentesque.',
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

describe('Blog Article Marquee block', () => {
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

  it('decorates marquee content from metadata and positions CTA', async () => {
    const block = document.getElementById('blog-article-marquee-block');
    await decorate(block);

    const wrapper = block.querySelector('.blog-article-marquee-inner');
    expect(wrapper).to.exist;
    expect(wrapper.classList.contains('blog-article-marquee-ready')).to.be.true;
    const row = wrapper.querySelector(':scope > .blog-article-marquee-row');
    expect(row).to.exist;
    const columns = [...row.querySelectorAll(':scope > .column')];
    expect(columns.length).to.equal(2);
    const [contentColumn, mediaColumn] = columns;
    expect(contentColumn.classList.contains('blog-article-marquee-content')).to.be.true;
    expect(mediaColumn.classList.contains('blog-article-marquee-media')).to.be.true;

    const expectedProductName = META_FIXTURES.author;
    const expectedProductDate = META_FIXTURES['publication-date'];
    const expectedEyebrow = META_FIXTURES.category;
    const expectedSubcopy = META_FIXTURES.subheading;
    const expectedHeadline = META_FIXTURES.headline;

    const eyebrow = contentColumn.querySelector('.blog-article-marquee-eyebrow');
    expect(eyebrow).to.exist;
    expect(eyebrow.textContent.trim()).to.equal(expectedEyebrow);

    const headline = contentColumn.querySelector('h1');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal(expectedHeadline);

    const subcopy = contentColumn.querySelector('.blog-article-marquee-subcopy');
    expect(subcopy).to.exist;
    expect(subcopy.textContent.trim()).to.equal(expectedSubcopy);

    const product = block.querySelector('.blog-article-marquee-product');
    expect(product).to.exist;
    const productCopyWrapper = product.querySelector('.blog-article-marquee-product-copy');
    expect(productCopyWrapper).to.exist;
    const productHeading = productCopyWrapper.querySelector('.blog-article-marquee-product-name');
    expect(productHeading).to.exist;
    expect(productHeading.textContent).to.equal(expectedProductName);
    const productCopyParas = [...productCopyWrapper.querySelectorAll('p')]
      .filter((p) => !p.classList.contains('blog-article-marquee-product-name')
        && !p.classList.contains('blog-article-marquee-product-date'))
      .map((p) => p.textContent.trim());
    expect(productCopyParas).to.deep.equal([]);
    const productDate = productCopyWrapper.querySelector('.blog-article-marquee-product-date');
    expect(productDate).to.exist;
    expect(productDate.textContent.trim()).to.equal(expectedProductDate);
    const productCopyChildren = [...productCopyWrapper.children];
    expect(productCopyChildren.length).to.equal(2);
    expect(productCopyChildren[0]).to.equal(productHeading);
    expect(productCopyChildren[1]).to.equal(productDate);
    const productLogoWrapper = product.querySelector('.blog-article-marquee-product-media');
    expect(productLogoWrapper).to.exist;
    const productLogo = productLogoWrapper.querySelector('img');
    expect(productLogo).to.exist;
    expect(productLogo.getAttribute('alt')).to.equal(`${expectedProductName} logo`);
    expect(productLogo.getAttribute('loading')).to.equal('lazy');
    expect(productLogo.getAttribute('decoding')).to.equal('async');
    expect(productLogo.getAttribute('width')).to.equal('48');
    expect(productLogo.getAttribute('height')).to.equal('48');
    expect(productLogo.hasAttribute('fetchpriority')).to.be.false;

    const highlightWrapper = contentColumn.querySelector('.blog-article-marquee-products');
    expect(highlightWrapper).to.exist;
    const productWrapper = highlightWrapper.querySelector('.blog-article-marquee-product');
    expect(productWrapper).to.exist;

    const buttonContainer = contentColumn.querySelector('.button-container');
    expect(buttonContainer).to.exist;
    expect(buttonContainer.classList.contains('action-area')).to.be.true;
    const cta = buttonContainer.querySelector('a');
    expect(cta).to.exist;
    expect(cta.classList.contains('button-xl')).to.be.true;
    expect(cta.classList.contains('con-button')).to.be.true;
    expect(cta.textContent.trim()).to.equal('Read more');
    expect(cta.getAttribute('href')).to.equal('https://example.com/read');
    expect(subcopy.nextElementSibling).to.equal(highlightWrapper);
    expect(highlightWrapper.nextElementSibling).to.equal(buttonContainer);
    const orderedChildren = [...contentColumn.children];
    expect(orderedChildren.length).to.equal(5);
    expect(orderedChildren[0]).to.equal(eyebrow);
    expect(orderedChildren[1]).to.equal(headline);
    expect(orderedChildren[2]).to.equal(subcopy);
    expect(orderedChildren[3]).to.equal(highlightWrapper);
    expect(orderedChildren[4]).to.equal(buttonContainer);

    const mediaPicture = mediaColumn.querySelector(':scope > picture');
    expect(mediaPicture).to.exist;
    const mediaImg = mediaPicture.querySelector('img');
    expect(mediaImg).to.exist;
    expect(mediaImg.getAttribute('loading')).to.equal('eager');
    expect(mediaImg.getAttribute('fetchpriority')).to.equal('high');
    expect(mediaImg.getAttribute('decoding')).to.equal('async');
    expect(mediaImg.getAttribute('src')).to.contain('width=');
    expect(mediaImg.classList.contains('blog-article-marquee-media-image')).to.be.true;
    expect(Number(mediaImg.getAttribute('width'))).to.be.greaterThan(0);
  });

  it('falls back to og:title metadata when headline is missing', async () => {
    const block = document.getElementById('blog-article-marquee-block');
    const headlineMeta = document.head.querySelector('meta[name="headline"]');
    headlineMeta?.setAttribute('content', '');

    await decorate(block);

    const headline = block.querySelector('.blog-article-marquee-content h1');
    expect(headline).to.exist;
    expect(headline.textContent.trim()).to.equal(META_FIXTURES['og:title']);
  });

  it('omits eyebrow when metadata value is empty', async () => {
    const block = document.getElementById('blog-article-marquee-block');
    const eyebrowMeta = document.head.querySelector('meta[name="category"]');
    eyebrowMeta?.setAttribute('content', '');

    await decorate(block);

    const decoratedEyebrow = block.querySelector('.blog-article-marquee-eyebrow');
    expect(decoratedEyebrow).to.not.exist;
  });

  it('handles marquee without optional CTA row', async () => {
    const block = document.getElementById('blog-article-marquee-block');
    block.lastElementChild.remove();
    await decorate(block);

    const highlight = block.querySelector('.blog-article-marquee-products');
    expect(highlight).to.exist;
    const buttonContainer = block.querySelector('.button-container');
    expect(buttonContainer).to.not.exist;
  });

  it('omits product highlight when product metadata is absent', async () => {
    const block = document.getElementById('blog-article-marquee-block');
    ['author', 'publication-date', 'description', 'tags']
      .forEach((metaName) => {
        const meta = document.head.querySelector(`meta[name="${metaName}"]`);
        meta?.setAttribute('content', '');
      });

    await decorate(block);

    const highlight = block.querySelector('.blog-article-marquee-products');
    expect(highlight).to.not.exist;
  });
});
