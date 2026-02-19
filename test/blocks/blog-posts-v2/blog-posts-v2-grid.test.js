/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/blog-posts-v2/blog-posts-v2.js'),
  import('../../../express/code/blocks/blog-posts-v2/blog-posts-v2-grid.js'),
]);
const { getLibs } = imports[0];
const decorate = imports[2].default;
const { resetBlogCache } = imports[2];
const { GRID_PAGE_SIZE, loadGridStyles, createGridLoadMore } = imports[3];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales: { '': { ietf: 'en-US', tk: 'jdq5hay.css' } } });
});

function generateMockPosts(count) {
  return Array.from({ length: count }, (_, i) => ({
    path: `/blog/grid-post-${i + 1}.html`,
    title: `Grid Post ${i + 1}`,
    teaser: `Teaser for grid post ${i + 1}`,
    image: `test_grid_image${i + 1}.jpg`,
    date: 1640995200 + (i * 86400),
    tags: '["design"]',
    category: 'Design',
  }));
}

function createMockBlogData(posts) {
  return {
    data: posts,
    byPath: Object.fromEntries(
      posts.map((p) => [p.path.split('.')[0], p]),
    ),
  };
}

describe('Blog Posts V2 Grid Module', () => {
  describe('GRID_PAGE_SIZE', () => {
    it('should be 12', () => {
      expect(GRID_PAGE_SIZE).to.equal(12);
    });
  });

  describe('loadGridStyles', () => {
    afterEach(() => {
      const link = document.querySelector('link[href*="blog-posts-v2-grid.css"]');
      if (link) link.remove();
    });

    it('should add a stylesheet link to the head', () => {
      loadGridStyles();
      const link = document.querySelector('link[href*="blog-posts-v2-grid.css"]');
      expect(link).to.exist;
      expect(link.rel).to.equal('stylesheet');
    });

    it('should not add duplicate stylesheet links', () => {
      loadGridStyles();
      loadGridStyles();
      const links = document.querySelectorAll('link[href*="blog-posts-v2-grid.css"]');
      expect(links.length).to.equal(1);
    });
  });

  describe('createGridLoadMore', () => {
    function mockCreateTag(tag, attrs = {}) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    }

    it('should create a load-more link with secondary button style, icon and text', async () => {
      const loadMoreEl = await createGridLoadMore({
        createTag: mockCreateTag,
        replaceKey: () => Promise.resolve('load more'),
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        onLoadMore: sinon.stub(),
      });

      expect(loadMoreEl.classList.contains('load-more')).to.be.true;
      expect(loadMoreEl.classList.contains('button')).to.be.true;
      expect(loadMoreEl.classList.contains('secondary')).to.be.true;

      const icon = loadMoreEl.querySelector('.load-more-icon');
      expect(icon).to.exist;
      expect(icon.querySelector('svg')).to.exist;

      const text = loadMoreEl.querySelector('.load-more-text');
      expect(text).to.exist;
      expect(text.textContent).to.equal('Load more');
    });

    it('should use localized text when available', async () => {
      const loadMoreDiv = await createGridLoadMore({
        createTag: mockCreateTag,
        replaceKey: () => Promise.resolve('Mehr laden'),
        getConfig: () => ({ locale: { ietf: 'de-DE' } }),
        onLoadMore: sinon.stub(),
      });

      const text = loadMoreDiv.querySelector('.load-more-text');
      expect(text.textContent).to.equal('Mehr laden');
    });

    it('should fall back to "Load more" when replaceKey returns default', async () => {
      const loadMoreDiv = await createGridLoadMore({
        createTag: mockCreateTag,
        replaceKey: () => Promise.resolve('load more'),
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        onLoadMore: sinon.stub(),
      });

      const text = loadMoreDiv.querySelector('.load-more-text');
      expect(text.textContent).to.equal('Load more');
    });

    it('should call onLoadMore and disable link on click', async () => {
      const onLoadMore = sinon.stub().resolves();

      const loadMoreEl = await createGridLoadMore({
        createTag: mockCreateTag,
        replaceKey: () => Promise.resolve('load more'),
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        onLoadMore,
      });

      document.body.append(loadMoreEl);
      loadMoreEl.click();

      await new Promise((r) => { setTimeout(r, 50); });
      expect(onLoadMore.calledOnce).to.be.true;
      expect(loadMoreEl.classList.contains('disabled')).to.be.true;
    });

    it('should remove load-more from DOM on click', async () => {
      const onLoadMore = sinon.stub().resolves();

      const loadMoreEl = await createGridLoadMore({
        createTag: mockCreateTag,
        replaceKey: () => Promise.resolve('load more'),
        getConfig: () => ({ locale: { ietf: 'en-US' } }),
        onLoadMore,
      });

      document.body.append(loadMoreEl);
      expect(document.querySelector('.load-more')).to.exist;

      loadMoreEl.click();

      await new Promise((r) => { setTimeout(r, 50); });
      expect(document.querySelector('.load-more')).to.not.exist;
    });
  });
});

describe('Blog Posts V2 Grid Integration', () => {
  let fetchStub;

  beforeEach(() => {
    if (fetchStub) fetchStub.restore();
    resetBlogCache();
    document.body.innerHTML = '';

    fetchStub = sinon.stub(window, 'fetch');
    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    window.createOptimizedPicture = sinon.stub().callsFake((src, alt) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      return img;
    });
  });

  afterEach(() => {
    if (fetchStub) fetchStub.restore();
    delete window.createOptimizedPicture;
    document.body.innerHTML = '';
    const link = document.querySelector('link[href*="blog-posts-v2-grid.css"]');
    if (link) link.remove();
  });

  it('should render grid variant with blog cards', async () => {
    const posts = generateMockPosts(5);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(5);
  });

  it('should load grid CSS when grid variant is detected', async () => {
    fetchStub.resolves({ ok: true, json: () => Promise.resolve({ data: [] }) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const link = document.querySelector('link[href*="blog-posts-v2-grid.css"]');
    expect(link).to.exist;
  });

  it('should display exactly 12 cards when more posts are available', async () => {
    const posts = generateMockPosts(20);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(12);
  });

  it('should show load-more button when more than 12 posts exist', async () => {
    const posts = generateMockPosts(20);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const loadMore = block.querySelector('.load-more');
    expect(loadMore).to.exist;
    expect(loadMore.classList.contains('secondary')).to.be.true;

    const loadMoreText = loadMore.querySelector('.load-more-text');
    expect(loadMoreText).to.exist;
  });

  it('should not show load-more when all posts fit in one page', async () => {
    const posts = generateMockPosts(10);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const loadMore = block.querySelector('.load-more');
    expect(loadMore).to.not.exist;
  });

  it('should not show load-more when exactly 12 posts exist', async () => {
    const posts = generateMockPosts(12);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const loadMore = block.querySelector('.load-more');
    expect(loadMore).to.not.exist;
  });

  it('should load more cards when load-more button is clicked', async () => {
    const posts = generateMockPosts(20);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    let cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(12);

    const loadMore = block.querySelector('.load-more');
    expect(loadMore).to.exist;
    loadMore.click();

    await new Promise((r) => { setTimeout(r, 100); });

    cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(20);
  });

  it('should hide load-more after all posts are loaded', async () => {
    const posts = generateMockPosts(20);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const loadMore = block.querySelector('.load-more');
    loadMore.click();

    await new Promise((r) => { setTimeout(r, 100); });

    expect(block.querySelector('.load-more')).to.not.exist;
  });

  it('should support multiple load-more clicks for large datasets', async () => {
    const posts = generateMockPosts(30);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    // First page: 12 cards
    let cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(12);

    // Click load more for second page
    let loadMore = block.querySelector('.load-more');
    expect(loadMore).to.exist;
    loadMore.click();
    await new Promise((r) => { setTimeout(r, 100); });

    // Should now have 24 cards
    cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(24);

    // Click load more for third page
    loadMore = block.querySelector('.load-more');
    expect(loadMore).to.exist;
    loadMore.click();
    await new Promise((r) => { setTimeout(r, 100); });

    // Should now have all 30 cards
    cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(30);

    // No more load-more button
    expect(block.querySelector('.load-more')).to.not.exist;
  });

  it('should handle grid variant with empty results', async () => {
    fetchStub.resolves({ ok: true, json: () => Promise.resolve({ data: [] }) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid">
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(0);

    const loadMore = block.querySelector('.load-more');
    expect(loadMore).to.not.exist;
  });

  it('should work with grid and include-heading variant combined', async () => {
    const posts = generateMockPosts(5);
    const mockData = createMockBlogData(posts);
    fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockData) });

    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 grid include-heading">
          <div>
            <div>
              <h3>All Blog Posts</h3>
              <p><a href="/blog">View all</a></p>
            </div>
          </div>
          <div>
            <div>category</div>
            <div>Design</div>
          </div>
        </div>
      </div>
    `;
    const block = document.querySelector('.blog-posts-v2');
    await decorate(block);

    const header = block.querySelector('.blog-posts-header');
    expect(header).to.exist;

    const heading = header.querySelector('h3');
    expect(heading).to.exist;
    expect(heading.textContent).to.equal('All Blog Posts');

    const cards = block.querySelectorAll('.blog-card');
    expect(cards.length).to.equal(5);
  });
});
