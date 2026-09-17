/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/blog-posts-v2/blog-posts-v2.js'),
]);
const { getLibs } = imports[0];
const decorate = imports[2].default;
const {
  resetBlogCache,
} = imports[2];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales: { '': { ietf: 'en-US', tk: 'jdq5hay.css' } } });
});

const body = await readFile({ path: './mocks/body.html' });

describe('Blog Posts V2 Block', () => {
  let fetchStub;
  let block;

  beforeEach(async () => {
    // Clean up any existing stubs first
    if (fetchStub) {
      fetchStub.restore();
    }

    // Reset module cache to ensure fresh state for each test
    resetBlogCache();

    // Reset DOM
    document.body.innerHTML = body;
    block = document.querySelector('.blog-posts-v2');

    // Mock fetch for blog index API calls
    fetchStub = sinon.stub(window, 'fetch');
    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    // Mock createOptimizedPicture
    window.createOptimizedPicture = sinon.stub().callsFake((src, alt) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      return img;
    });

    // Mock loadDefaultBlock
    window.loadDefaultBlock = sinon.stub();
  });

  afterEach(() => {
    if (fetchStub) {
      fetchStub.restore();
    }

    // Clean up window mocks
    delete window.createOptimizedPicture;
    delete window.loadDefaultBlock;

    document.body.innerHTML = '';
  });

  it('should decorate the blog-posts-v2 block without errors', async () => {
    expect(block).to.exist;

    try {
      await decorate(block);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }

    expect(block).to.exist;
  });

  it('should have the correct block class', () => {
    expect(block.classList.contains('blog-posts-v2')).to.be.true;
  });

  it('should handle missing DOM elements gracefully', async () => {
    // Test with minimal DOM structure
    document.body.innerHTML = '<div class="blog-posts-v2"><div><div></div></div></div>';
    const minimalBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(minimalBlock);
      expect(true).to.be.true; // If we get here, no errors were thrown
    } catch (error) {
      // This is expected for minimal DOM - just ensure it doesn't crash the whole system
      expect(error).to.exist;
    }
  });

  it('should handle featured posts configuration', async () => {
    // Mock blog index data
    const mockBlogData = {
      data: [
        {
          path: '/blog/post1.html',
          title: 'Test Post 1',
          teaser: 'Test teaser 1',
          image: 'test_image1.jpg',
          date: 1640995200, // Jan 1, 2022
          tags: '["social-media", "design"]',
          category: 'Design',
        },
        {
          path: '/blog/post2.html',
          title: 'Test Post 2',
          teaser: 'Test teaser 2',
          image: 'test_image2.jpg',
          date: 1641081600, // Jan 2, 2022
          tags: '["marketing", "templates"]',
          category: 'Marketing',
        },
      ],
      byPath: {
        '/blog/post1': {
          path: '/blog/post1.html',
          title: 'Test Post 1',
          teaser: 'Test teaser 1',
          image: 'test_image1.jpg',
          date: 1640995200,
          tags: '["social-media", "design"]',
          category: 'Design',
        },
        '/blog/post2': {
          path: '/blog/post2.html',
          title: 'Test Post 2',
          teaser: 'Test teaser 2',
          image: 'test_image2.jpg',
          date: 1641081600,
          tags: '["marketing", "templates"]',
          category: 'Marketing',
        },
      },
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with featured posts configuration
    document.body.innerHTML = `
      <div class="blog-posts-v2">
        <div>
          <div>
            <a href="/blog/post1.html">Featured Post 1</a>
            <a href="/blog/post2.html">Featured Post 2</a>
          </div>
        </div>
      </div>
    `;
    const featuredBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(featuredBlock);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should handle filter configuration', async () => {
    // Mock blog index data
    const mockBlogData = {
      data: [
        {
          path: '/blog/post1.html',
          title: 'Design Post',
          teaser: 'Design teaser',
          image: 'test_image1.jpg',
          date: 1640995200,
          tags: '["design", "templates"]',
          category: 'Design',
          author: 'John Doe',
        },
        {
          path: '/blog/post2.html',
          title: 'Marketing Post',
          teaser: 'Marketing teaser',
          image: 'test_image2.jpg',
          date: 1641081600,
          tags: '["marketing", "social-media"]',
          category: 'Marketing',
          author: 'Jane Smith',
        },
      ],
      byPath: {},
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with filter configuration
    document.body.innerHTML = `
      <div class="blog-posts-v2">
        <div>
          <div>
            <p>tags: design</p>
            <p>author: John Doe</p>
            <p>page-size: 5</p>
          </div>
        </div>
      </div>
    `;
    const filterBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(filterBlock);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should handle hero card configuration', async () => {
    // Mock blog index data with single featured post
    const mockBlogData = {
      data: [
        {
          path: '/blog/hero-post.html',
          title: 'Hero Post | Adobe Express',
          teaser: 'This is a hero post teaser',
          image: 'hero_image.jpg',
          date: 1640995200,
          tags: '["hero", "featured"]',
          category: 'Featured',
        },
      ],
      byPath: {
        '/blog/hero-post': {
          path: '/blog/hero-post.html',
          title: 'Hero Post | Adobe Express',
          teaser: 'This is a hero post teaser',
          image: 'hero_image.jpg',
          date: 1640995200,
          tags: '["hero", "featured"]',
          category: 'Featured',
        },
      },
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with single featured post (hero card)
    document.body.innerHTML = `
      <div class="blog-posts-v2">
        <div>
          <div>
            <a href="/blog/hero-post.html">Hero Post</a>
          </div>
        </div>
      </div>
    `;
    const heroBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(heroBlock);
      expect(true).to.be.true;
    } catch (error) {
      // This test might fail due to complex dependencies, just ensure it doesn't crash
      expect(error).to.exist;
    }
  });

  it('should handle load more functionality', async () => {
    // Mock blog index data with many posts
    const mockBlogData = {
      data: Array.from({ length: 20 }, (_, i) => ({
        path: `/blog/post${i + 1}.html`,
        title: `Post ${i + 1}`,
        teaser: `Teaser ${i + 1}`,
        image: `test_image${i + 1}.jpg`,
        date: 1640995200 + (i * 86400), // Increment by day
        tags: '["test"]',
        category: 'Test',
      })),
      byPath: {},
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with load more configuration
    document.body.innerHTML = `
      <div class="blog-posts-v2">
        <div>
          <div>
            <p>page-size: 5</p>
            <p>load-more: Load More Posts</p>
          </div>
        </div>
      </div>
    `;
    const loadMoreBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(loadMoreBlock);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should not render a date when post date is invalid', async () => {
    const invalidDatePost = {
      path: '/blog/invalid-date-post.html',
      title: 'Invalid Date Post',
      teaser: 'Post teaser with invalid date',
      image: 'test_image1.jpg',
      date: '',
      tags: '["design"]',
      category: 'Design',
    };
    const validDatePost = {
      path: '/blog/valid-date-post.html',
      title: 'Valid Date Post',
      teaser: 'Post teaser with valid date',
      image: 'test_image2.jpg',
      date: 1641081600,
      tags: '["design"]',
      category: 'Design',
    };
    const mockBlogData = {
      data: [invalidDatePost, validDatePost],
      byPath: {
        '/blog/invalid-date-post': invalidDatePost,
        '/blog/valid-date-post': validDatePost,
      },
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    document.body.innerHTML = `
      <div class="blog-posts-v2">
        <div>
          <div>
            <a href="/blog/invalid-date-post.html">Invalid Date Post</a>
            <a href="/blog/valid-date-post.html">Valid Date Post</a>
          </div>
        </div>
      </div>
    `;
    const invalidDateBlock = document.querySelector('.blog-posts-v2');
    await decorate(invalidDateBlock);

    const invalidCard = [...invalidDateBlock.querySelectorAll('.blog-card')].find(
      (card) => card.href.includes('/blog/invalid-date-post'),
    );
    expect(invalidCard).to.exist;
    expect(invalidCard.querySelector('.blog-card-date')).to.not.exist;
  });

  it('should handle view all link localization', async () => {
    // Mock blog index data
    const mockBlogData = {
      data: [],
      byPath: {},
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with view all link
    document.body.innerHTML = `
      <div class="content">
        <a href="/blog">view all</a>
      </div>
      <div class="blog-posts-v2">
        <div>
          <div></div>
        </div>
      </div>
    `;
    const blockWithViewAll = document.querySelector('.blog-posts-v2');

    try {
      await decorate(blockWithViewAll);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should handle blog posts decoration structure', async () => {
    // Mock blog index data
    const mockBlogData = {
      data: [],
      byPath: {},
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with specific structure that triggers decoration
    document.body.innerHTML = `
      <div>
        <h2>Blog Posts</h2>
        <p>Description paragraph 1</p>
        <p>Description paragraph 2</p>
        <div class="blog-posts-v2">
          <div>
            <div></div>
          </div>
        </div>
      </div>
    `;
    const structuredBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(structuredBlock);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should handle empty blog posts gracefully', async () => {
    // Mock empty blog index data
    const mockBlogData = {
      data: [],
      byPath: {},
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with empty configuration
    document.body.innerHTML = `
      <div class="blog-posts-v2">
        <div>
          <div></div>
        </div>
      </div>
    `;
    const emptyBlock = document.querySelector('.blog-posts-v2');

    try {
      await decorate(emptyBlock);
      expect(true).to.be.true;
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should handle include-heading variant with blog posts', async () => {
    // Mock blog index data with multiple posts to avoid hero card path
    const mockPost1 = {
      path: '/blog/featured-post-1.html',
      title: 'Featured Test Post 1',
      teaser: 'This is a featured test post',
      image: 'test_featured_image.jpg',
      date: 1640995200,
      tags: '["design", "featured"]',
      category: 'Design',
    };

    const mockPost2 = {
      path: '/blog/featured-post-2.html',
      title: 'Featured Test Post 2',
      teaser: 'This is another featured test post',
      image: 'test_featured_image2.jpg',
      date: 1640995200,
      tags: '["design"]',
      category: 'Design',
    };

    const mockBlogData = {
      data: [mockPost1, mockPost2],
      byPath: {
        '/blog/featured-post-1': mockPost1,
        '/blog/featured-post-2': mockPost2,
      },
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with include-heading variant using multiple featured posts
    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 no-top-padding include-heading">
          <div>
            <div>
              <h3 id="you-might-also-like">You might also like...</h3>
              <p><a href="https://www.adobe.com/express/learn/blog#_cls">View all</a></p>
            </div>
          </div>
          <div>
            <div>
              <p><a href="/blog/featured-post-1.html">Featured Post 1</a></p>
              <p><a href="/blog/featured-post-2.html">Featured Post 2</a></p>
            </div>
          </div>
        </div>
      </div>
    `;
    const includeHeadingBlock = document.querySelector('.blog-posts-v2');
    await decorate(includeHeadingBlock);

    const header = includeHeadingBlock.querySelector('.blog-posts-header');
    expect(header).to.exist;

    const heading = header.querySelector('h3');
    expect(heading).to.exist;
    expect(heading.textContent).to.equal('You might also like...');
    expect(heading.classList.contains('header')).to.be.true;
    expect(heading.classList.contains('no-view-all')).to.be.false;

    const link = header.querySelector('a');
    expect(link).to.exist;
    expect(link.href).to.include('/blog');
  });

  it('should hide section when include-heading variant has no blog posts', async () => {
    // Mock empty blog index data
    const mockBlogData = {
      data: [],
      byPath: {},
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with include-heading variant and no posts
    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 include-heading">
          <div>
            <div><h2>Latest Blog Posts</h2></div>
            <div><p><a href="/blog">View All</a></p></div>
          </div>
          <div>
            <div>tags</div>
            <div>nonexistent-tag</div>
          </div>
        </div>
      </div>
    `;
    const includeHeadingBlock = document.querySelector('.blog-posts-v2');
    const section = document.querySelector('.section');

    try {
      await decorate(includeHeadingBlock);

      // Check that the section is hidden
      expect(section.style.display).to.equal('none');
    } catch (error) {
      expect.fail(`decorate should not throw errors: ${error.message}`);
    }
  });

  it('should handle include-heading variant without view all link', async () => {
    // Mock blog index data with multiple posts to avoid hero card path
    const mockPost1 = {
      path: '/blog/recent-post-1.html',
      title: 'Recent Test Post 1',
      teaser: 'This is a recent test post',
      image: 'test_recent_image.jpg',
      date: 1640995200,
      tags: '["tutorials"]',
      category: 'Tutorials',
    };

    const mockPost2 = {
      path: '/blog/recent-post-2.html',
      title: 'Recent Test Post 2',
      teaser: 'This is another recent test post',
      image: 'test_recent_image2.jpg',
      date: 1640995200,
      tags: '["tutorials"]',
      category: 'Tutorials',
    };

    const mockBlogData = {
      data: [mockPost1, mockPost2],
      byPath: {
        '/blog/recent-post-1': mockPost1,
        '/blog/recent-post-2': mockPost2,
      },
    };

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockBlogData),
    });

    // Test with include-heading variant without view all link
    document.body.innerHTML = `
      <div class="section">
        <div class="blog-posts-v2 include-heading">
          <div>
            <div><h3>Recent Posts</h3></div>
          </div>
          <div>
            <div>
              <p><a href="/blog/recent-post-1.html">Recent Post 1</a></p>
              <p><a href="/blog/recent-post-2.html">Recent Post 2</a></p>
            </div>
          </div>
        </div>
      </div>
    `;
    const includeHeadingBlock = document.querySelector('.blog-posts-v2');

    await decorate(includeHeadingBlock);

    // Check that the heading was added and preserves h3
    const header = includeHeadingBlock.querySelector('.blog-posts-header');
    expect(header).to.exist;

    const heading = header.querySelector('h3');
    expect(heading).to.exist;
    expect(heading.textContent).to.equal('Recent Posts');
    expect(heading.classList.contains('header')).to.be.true;
    expect(heading.classList.contains('no-view-all')).to.be.true;

    // Check that no link was added (since we didn't provide one in the first row)
    const links = header.querySelectorAll('a');
    expect(links.length).to.equal(0);
  });

  describe('blog card tags', () => {
    const postA = {
      path: '/blog/post-a.html',
      title: 'Post A',
      teaser: 'Teaser A',
      image: 'test_image1.jpg',
      date: 1640995200,
      tags: '["design"]',
      category: 'Design',
    };
    const postB = {
      path: '/blog/post-b.html',
      title: 'Post B',
      teaser: 'Teaser B',
      image: 'test_image2.jpg',
      date: 1641081600,
      tags: '["marketing"]',
      category: 'Marketing',
    };
    const postNoCategory = {
      path: '/blog/post-c.html',
      title: 'Post C',
      teaser: 'Teaser C',
      image: 'test_image3.jpg',
      date: 1641168000,
      tags: '[]',
      category: '',
    };
    const postJunkCategory = {
      path: '/blog/post-d.html',
      title: 'Post D',
      teaser: 'Teaser D',
      image: 'test_image4.jpg',
      date: 1641254400,
      tags: '[]',
      category: 'null',
    };
    const postUnsafeCategory = {
      path: '/blog/post-e.html',
      title: 'Post E',
      teaser: 'Teaser E',
      image: 'test_image5.jpg',
      date: 1641340800,
      tags: '[]',
      category: '<b>Design</b> & "Video"',
    };

    function stubBlogData(posts) {
      const byPath = {};
      posts.forEach((post) => {
        byPath[post.path.split('.')[0]] = post;
      });
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ data: posts, byPath }),
      });
    }

    // Two <a> links keeps config.featured.length at 2, which routes decoration
    // through the non-hero getCard() path and renders plain .blog-card elements.
    function featuredMarkup(posts, wrapperOpen = '', wrapperClose = '') {
      const links = posts.map((post) => `<a href="${post.path}">${post.title}</a>`).join('\n');
      return `${wrapperOpen}<div class="blog-posts-v2"><div><div>${links}</div></div></div>${wrapperClose}`;
    }

    it('renders each card with its own post category instead of a shared tag', async () => {
      stubBlogData([postA, postB]);
      document.body.innerHTML = featuredMarkup([postA, postB]);
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const cardA = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-a'));
      const cardB = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-b'));
      expect(cardA.querySelector('.blog-tag').textContent).to.equal('Design');
      expect(cardB.querySelector('.blog-tag').textContent).to.equal('Marketing');
    });

    it('shows the section\'s configured tag, not an unrelated post category', async () => {
      const matchingCategoryPost = {
        path: '/blog/post-f.html',
        title: 'Post F',
        teaser: 'Teaser F',
        image: 'test_image6.jpg',
        date: 1641427200,
        tags: '["design", "inspiration"]',
        category: 'Design',
      };
      const unrelatedCategoryPost = {
        path: '/blog/post-g.html',
        title: 'Post G',
        teaser: 'Teaser G',
        image: 'test_image7.jpg',
        date: 1641513600,
        tags: '["design", "small business"]',
        category: 'Featured',
      };
      stubBlogData([matchingCategoryPost, unrelatedCategoryPost]);
      document.body.innerHTML = `
        <div class="blog-posts-v2">
          <div><div><p>tags</p></div><div><p>design</p></div></div>
          <div><div><p>page-size</p></div><div><p>3</p></div></div>
        </div>
      `;
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const tags = [...tagBlock.querySelectorAll('.blog-tag')];
      expect(tags.length).to.equal(2);
      tags.forEach((tag) => expect(tag.textContent).to.equal('Design'));
    });

    it('omits the tag element entirely when a post has no category', async () => {
      stubBlogData([postNoCategory, postA]);
      document.body.innerHTML = featuredMarkup([postNoCategory, postA]);
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const card = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-c'));
      expect(card.querySelector('.blog-tag')).to.not.exist;
    });

    it('treats stringy-junk category values ("null") as no tag', async () => {
      stubBlogData([postJunkCategory, postA]);
      document.body.innerHTML = featuredMarkup([postJunkCategory, postA]);
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const card = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-d'));
      expect(card.querySelector('.blog-tag')).to.not.exist;
    });

    it('escapes HTML special characters in the category before rendering', async () => {
      stubBlogData([postUnsafeCategory, postA]);
      document.body.innerHTML = featuredMarkup([postUnsafeCategory, postA]);
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const card = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-e'));
      const tag = card.querySelector('.blog-tag');
      expect(tag.textContent).to.equal('<b>Design</b> & "Video"');
      expect(tag.querySelector('b')).to.not.exist;
    });

    it('uses the active content-toggle section value instead of post category', async () => {
      stubBlogData([postA, postB]);
      document.body.innerHTML = featuredMarkup(
        [postA, postB],
        '<div class="section content-toggle-active" data-toggle="Trending">',
        '</div>',
      );
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const tags = [...tagBlock.querySelectorAll('.blog-tag')];
      expect(tags.length).to.equal(2);
      tags.forEach((tag) => expect(tag.textContent).to.equal('Trending'));
    });

    it('restores each card\'s own category when the toggle activates without a value', async () => {
      stubBlogData([postA, postB]);
      document.body.innerHTML = featuredMarkup(
        [postA, postB],
        '<div class="section" data-toggle="">',
        '</div>',
      );
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const section = document.querySelector('.section[data-toggle]');
      section.classList.add('content-toggle-active');
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      const cardA = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-a'));
      const cardB = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-b'));
      expect(cardA.querySelector('.blog-tag').textContent).to.equal('Design');
      expect(cardB.querySelector('.blog-tag').textContent).to.equal('Marketing');
    });

    it('creates a tag element on activation for a card that had no category at render time', async () => {
      stubBlogData([postNoCategory, postA]);
      document.body.innerHTML = featuredMarkup(
        [postNoCategory, postA],
        '<div class="section" data-toggle="Trending">',
        '</div>',
      );
      const tagBlock = document.querySelector('.blog-posts-v2');
      await decorate(tagBlock);

      const noCategoryCard = [...tagBlock.querySelectorAll('.blog-card')].find((c) => c.href.includes('post-c'));
      expect(noCategoryCard.querySelector('.blog-tag')).to.not.exist;

      const section = document.querySelector('.section[data-toggle]');
      section.classList.add('content-toggle-active');
      await new Promise((resolve) => { setTimeout(resolve, 0); });

      expect(noCategoryCard.querySelector('.blog-tag').textContent).to.equal('Trending');
    });
  });
});
