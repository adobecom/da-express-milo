import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const mockItems = [
  {
    path: '/us/express/learn/blog/sample',
    title: 'Sample Title | Adobe Express',
    teaser: 'Sample teaser copy',
    date: 1700000000,
    image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    category: 'Design',
    author: 'Adobe Express',
  },
];

const root = (() => {
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  return {};
})();
const fetchStub = sinon.stub(root, 'fetch');
const mockFetch = () => Promise.resolve({
  ok: true,
  json: async () => ({ data: mockItems }),
});
fetchStub.callsFake(mockFetch);

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = {
    locale: { prefix: '/us', ietf: 'en-US', region: 'us' },
    env: { name: 'stage' },
  };
  mod.setConfig(conf);
});
const [{ default: decorate }] = await Promise.all([
  import('../../../express/code/blocks/blog-article-columns/blog-article-columns.js'),
]);

describe('blog-article-columns', () => {
  beforeEach(async () => {
    window.lana = { log: () => {} };
    fetchStub.resetHistory();
    fetchStub.callsFake(mockFetch);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  after(() => {
    fetchStub.restore();
  });

  it('renders article content with meta and CTA', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/right-image.html' });
    const block = document.querySelector('.blog-article-columns');
    block.innerHTML = `
      <div>
        <div><a href="/us/express/learn/blog/sample">Sample</a></div>
      </div>
    `;

    await decorate(block);
    expect(block).to.exist;
    const article = block.querySelector('.blog-article-column');
    expect(article).to.exist;
    expect(article.querySelector('.blog-article-column-title').textContent).to.include('Sample Title');
    expect(article.querySelector('.blog-article-column-teaser').textContent).to.include('Sample teaser copy');
    expect(article.querySelector('.blog-article-column-category').textContent).to.equal('Design');
    expect(article.querySelector('.blog-article-column-meta')).to.exist;
    expect(article.querySelector('.blog-article-column-avatar')).to.exist;
    expect(article.querySelector('.blog-article-column-author').textContent).to.equal('Adobe Express');
    expect(article.querySelector('.blog-article-column-date').textContent).to.equal('11/14/2023');
    const cta = article.querySelector('.blog-card-cta a.button');
    expect(cta).to.exist;
    expect(cta.textContent).to.equal('Read More');
    expect(cta.getAttribute('href')).to.equal('/us/express/learn/blog/sample');
    expect(block.classList.contains('left-image')).to.be.false;

    // layout: image should follow content in DOM for right-image
    const children = [...block.querySelector('.blog-article-column').children];
    expect(children[0].classList.contains('blog-article-column-content')).to.be.true;
    expect(children[1].classList.contains('blog-article-column-image')).to.be.true;
  });

  it('supports left-image variant via block class', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/left-image.html' });
    const block = document.querySelector('.blog-article-columns');
    block.innerHTML = `
      <div>
        <div><a href="/us/express/learn/blog/sample">Sample</a></div>
      </div>
    `;

    await decorate(block);

    expect(block.classList.contains('left-image')).to.be.true;
    const article = block.querySelector('.blog-article-column');
    expect(article).to.exist;
    expect(article.querySelector('.blog-article-column-title').textContent).to.include('Sample Title');
    expect(article.querySelector('.blog-article-column-author').textContent).to.equal('Adobe Express');
    expect(article.querySelector('.blog-article-column-date').textContent).to.equal('11/14/2023');

    // layout: DOM order remains content then image; CSS handles row-reverse for left-image
    const children = [...article.children];
    expect(children[0].classList.contains('blog-article-column-content')).to.be.true;
    expect(children[1].classList.contains('blog-article-column-image')).to.be.true;
  });
});
