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
const mockBlogQueryIndex = {
  data: [
    {
      date: 1763510400,
      image: '/express/learn/blog/media_1a45e7c149544ba551a4f6084dbf38cbee7005756.png?width=1200',
      path: '/express/learn/blog/top-creative-influences',
      title: 'Where creators find inspiration | Adobe',
      author: 'Adobe Express',
      category: 'Design',
      teaser: 'Find out who and what inspires modern creatives.',
      tags: ['Featured', 'Tips & Tricks', 'Branding'],
    },
    {
      date: 1762992000,
      image: '/express/learn/blog/media_1f1749ffb3ec977c9135ff69bc1fd9f03f4e9f98d.jpg?width=1200',
      path: '/express/learn/blog/report-writing-format-guide',
      title: 'Report Writing Format Guide with Examples & Templates | Adobe',
      author: 'Adobe Express',
      category: 'Design',
      teaser: 'Discover how to write a report using the proper format.',
      tags: ['Tips & Tricks', 'marketing', 'inspirational'],
    },
    {
      date: 1762732800,
      image: '/express/learn/blog/media_17c8945bfd1cc09959a9558a497a097c902ee2bdd.jpg?width=1200',
      path: '/express/learn/blog/typography-tips',
      title: '12 typography tips for any design project',
      author: 'Adobe Express',
      category: 'Design',
      teaser: 'Level up your typography skills.',
      tags: ['featured', 'logo', 'inspiration', 'branding', 'templates'],
    },
    {
      date: 1762819200,
      image: '/express/learn/blog/media_18c3acf7b0471012287ccdd3ab1f265cb07140672.png?width=1200',
      path: '/express/learn/blog/best-time-to-post-on-facebook',
      title: 'Best Time to Post on Facebook',
      author: 'Adobe Express',
      category: 'Social Media',
      teaser: 'Discover when to post on Facebook.',
      tags: ['Strategy', 'Instagram', 'Tips and Tricks'],
    },
  ],
};

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

  it('uses row tag values when tag config is missing', async () => {
    document.body.innerHTML = `
      <div class="blog-feature-marquee" id="row-tag-filter-block">
        <div>
          <div>
            <p>Featured</p>
            <h2>Tag fallback</h2>
            <p>Uses row tags.</p>
          </div>
        </div>
        <div>
          <div>
            <p> FEATURED </p>
            <p>branding</p>
          </div>
        </div>
        <div>
          <div>
            <p><a href="/express/learn/blog">View all</a></p>
          </div>
        </div>
        <div>
          <div>max</div>
          <div>3</div>
        </div>
      </div>
    `;
    const block = document.getElementById('row-tag-filter-block');
    fetchStub.resolves({
      ok: true,
      json: async () => mockBlogQueryIndex,
    });

    await decorate(block);

    const cardLinks = [...block.querySelectorAll('.blog-feature-marquee-card')]
      .map((card) => card.getAttribute('href'));
    expect(cardLinks).to.deep.equal([
      '/express/learn/blog/top-creative-influences',
      '/express/learn/blog/typography-tips',
    ]);
  });

  it('normalizes configured tag filters against array query tags', async () => {
    document.body.innerHTML = `
      <div class="blog-feature-marquee" id="config-tag-filter-block">
        <div>
          <div>
            <p>Featured</p>
            <h2>Config tag filter</h2>
            <p>Uses config tags.</p>
          </div>
        </div>
        <div>
          <div>
            <p>Design</p>
          </div>
        </div>
        <div>
          <div>
            <p><a href="/express/learn/blog">View all</a></p>
          </div>
        </div>
        <div>
          <div>max</div>
          <div>2</div>
        </div>
        <div>
          <div>tag</div>
          <div>  tips & tricks ,  BRANDING  </div>
        </div>
      </div>
    `;
    const block = document.getElementById('config-tag-filter-block');
    fetchStub.resolves({
      ok: true,
      json: async () => mockBlogQueryIndex,
    });

    await decorate(block);

    const cardLinks = [...block.querySelectorAll('.blog-feature-marquee-card')]
      .map((card) => card.getAttribute('href'));
    expect(cardLinks).to.deep.equal([
      '/express/learn/blog/top-creative-influences',
      '/express/learn/blog/report-writing-format-guide',
    ]);
  });
});
