/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }, , { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/blog-feature-marquee/blog-feature-marquee.js'),
]);

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({
    locale: {
      prefix: '',
      ietf: 'en-US',
    },
    locales: {
      '': { ietf: 'en-US', tk: 'jdq5hay.css' },
    },
  });
});

const body = await readFile({ path: './mocks/body.html' });

const upsertMeta = (name, content) => {
  const selector = name.includes(':') ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let meta = document.head.querySelector(selector);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(name.includes(':') ? 'property' : 'name', name);
    document.head.append(meta);
  }
  const previous = meta.getAttribute('content');
  meta.setAttribute('content', content);
  return () => {
    if (previous === null) meta.remove();
    else meta.setAttribute('content', previous);
  };
};

describe('Blog Feature Marquee block', () => {
  let fetchStub;
  let restoreMeta = [];

  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    document.body.innerHTML = body;
    fetchStub = sinon.stub(window, 'fetch');
    restoreMeta = [
      upsertMeta('author', 'Express Team'),
      upsertMeta('blog-feature-marquee-autoplay-duration', '9'),
      upsertMeta('marquee-inject-logo', 'off'),
    ];
  });

  afterEach(() => {
    fetchStub.restore();
    restoreMeta.forEach((restore) => restore());
    restoreMeta = [];
    document.body.innerHTML = '';
  });

  it('decorates dynamic carousel and applies filtering and config', async () => {
    const block = document.getElementById('blog-feature-marquee-block');

    fetchStub.resolves({
      ok: true,
      json: async () => ({
        data: [
          {
            path: '/express/learn/blog/keep-first.html',
            title: 'Keep First | Adobe Express',
            teaser: 'First teaser',
            image: '/img/first.png?foo=bar',
            date: 1733011200,
            author: '',
            tags: 'design,branding',
            category: 'Design',
          },
          {
            path: '/express/learn/blog/keep-second.html',
            title: 'Keep Second',
            teaser: 'Second teaser',
            image: '/img/second.png',
            date: 1733097600,
            author: 'Jane Doe',
            tags: 'design',
            category: 'Design',
          },
          {
            path: '/express/learn/blog/filter-out.html',
            title: 'Filtered Out',
            teaser: 'Should not show',
            image: '/img/third.png',
            date: 1733184000,
            author: 'Someone',
            tags: 'marketing',
            category: 'Marketing',
          },
        ],
      }),
    });

    await decorate(block);

    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.firstCall.args[0]).to.equal('/express/learn/blog/query-index.json');

    expect(block.classList.contains('blog-feature-marquee-ready')).to.be.true;
    const cards = block.querySelectorAll('.blog-feature-marquee-card');
    expect(cards.length).to.equal(2);

    const firstImage = cards[0].querySelector('img');
    expect(firstImage).to.exist;
    expect(firstImage.getAttribute('loading')).to.equal('eager');
    expect(firstImage.getAttribute('fetchpriority')).to.equal('high');
    expect(firstImage.getAttribute('src')).to.include('width=752');

    const secondImage = cards[1].querySelector('img');
    expect(secondImage.getAttribute('loading')).to.equal('lazy');
    expect(secondImage.hasAttribute('fetchpriority')).to.be.false;

    const firstAuthor = cards[0].querySelector('.blog-feature-marquee-card-author-name');
    expect(firstAuthor).to.exist;
    expect(firstAuthor.textContent.trim()).to.equal('Express Team');

    const controls = block.querySelector('.carousel-controls');
    expect(controls).to.exist;
    expect(block.querySelectorAll('.carousel-dot').length).to.equal(2);

    const viewAll = block.querySelector('.blog-feature-marquee-view-all-link');
    expect(viewAll).to.exist;
    expect(viewAll.querySelector('.blog-feature-marquee-view-all-icon')).to.exist;
  });

  it('renders static single featured card without carousel controls', async () => {
    document.body.innerHTML = `
      <div class="blog-feature-marquee" id="static-block">
        <div>
          <div>
            <p>Featured</p>
            <h2>Single Feature</h2>
            <p>One highlighted story.</p>
          </div>
        </div>
        <div>
          <div>
            <p><a href="https://www.adobe.com/express/learn/blog/featured-one">Featured one</a></p>
          </div>
        </div>
        <div>
          <div>
            <p><a href="/express/learn/blog">View all</a></p>
          </div>
        </div>
      </div>
    `;
    const block = document.getElementById('static-block');

    fetchStub.resolves({
      ok: true,
      json: async () => ({
        data: [
          {
            path: '/express/learn/blog/featured-one.html',
            title: 'Featured One',
            teaser: 'Featured teaser',
            image: '/img/featured.png',
            date: 1733011200,
            author: 'Adobe Express',
            tags: 'design',
            category: 'Design',
          },
        ],
      }),
    });

    await decorate(block);

    expect(block.classList.contains('blog-feature-marquee-single')).to.be.true;
    expect(block.querySelectorAll('.blog-feature-marquee-card').length).to.equal(1);
    expect(block.querySelector('.carousel-controls')).to.not.exist;
    expect(block.querySelector('.blog-feature-marquee-view-all-link')).to.exist;
  });

  it('injects express logo when marquee metadata enables it', async () => {
    restoreMeta.push(upsertMeta('marquee-inject-logo', 'on'));

    const block = document.getElementById('blog-feature-marquee-block');
    fetchStub.resolves({ ok: true, json: async () => ({ data: [] }) });

    await decorate(block);

    const eyebrowLogo = block.querySelector('.blog-feature-marquee-eyebrow-row .express-logo');
    expect(eyebrowLogo).to.exist;
  });
});
