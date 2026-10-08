import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

// Set up mocks BEFORE any imports to prevent external calls
if (typeof window !== 'undefined') {
  // Mock fetch globally
  window.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  });

  // Mock LANA logging
  window.lana = {
    log: () => {}, // No-op function
  };

  // Mock geolocation service
  window.geo2 = {
    getCountry: () => Promise.resolve('US'),
    getLanguage: () => Promise.resolve('en'),
  };

  // Mock any other external services
  window.adobeDataLayer = [];
  window.satellite = {
    track: () => {},
  };

  // Mock utils functions that TOC-SEO uses
  window.mockUtils = {
    createTag: (tag, attributes, content) => {
      const element = document.createElement(tag);
      if (attributes) {
        Object.keys(attributes).forEach((key) => {
          if (key === 'class') {
            element.className = attributes[key];
          } else {
            element.setAttribute(key, attributes[key]);
          }
        });
      }
      if (content) {
        element.textContent = content;
      }
      return element;
    },
    getMetadata: (name) => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      return meta ? meta.getAttribute('content') : '';
    },
  };

  // Mock getLibs function
  window.getLibs = () => '/test/scripts';

  // Mock getIconElementDeprecated function
  window.getIconElementDeprecated = (name) => {
    const icon = document.createElement('span');
    icon.classList.add('icon', `icon-${name}`);
    return icon;
  };

  // Mock requestIdleCallback to execute immediately for testing
  window.requestIdleCallback = (callback) => {
    setTimeout(callback, 0);
  };
}

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/toc-seo/toc-seo.js'),
]);

const { default: decorate } = imports[1];

const setupTest = async (htmlFile, {
  width = 1024,
  startBlock = 'highlight',
  hideStartSection = false,
} = {}) => {
  const testBody = await readFile({ path: htmlFile });
  window.isTestEnv = true;

  // Default to desktop unless the test exercises a smaller viewport.
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  document.documentElement.innerHTML = testBody;

  // Create a mock TOC block element
  const tocBlock = document.createElement('div');
  tocBlock.classList.add('toc-seo');

  // Read configuration from meta tags in the HTML
  const configRows = [];
  const metaTags = document.querySelectorAll('meta[name]');
  metaTags.forEach((meta) => {
    const name = meta.getAttribute('name');
    const content = meta.getAttribute('content');
    if (name && content) {
      configRows.push([name, content]);
    }
  });

  // Fallback to default config if no meta tags found
  if (configRows.length === 0) {
    configRows.push(
      ['toc-title', 'Table of Contents'],
      ['toc-aria-label', 'Table of Contents Links'],
      ['content-1', 'First Section'],
      ['content-2', 'Second Section'],
      ['content-3', 'Third Section'],
    );
  }

  configRows.forEach(([key, value]) => {
    const row = document.createElement('div');
    const keyCell = document.createElement('div');
    const valueCell = document.createElement('div');
    keyCell.textContent = key;
    valueCell.textContent = value;
    row.appendChild(keyCell);
    row.appendChild(valueCell);
    tocBlock.appendChild(row);
  });

  // Check if main section already exists in the HTML, if not create it
  let mainSection = document.querySelector('main');
  if (!mainSection) {
    mainSection = document.createElement('main');
    const section = document.createElement('div');
    section.classList.add('section', 'long-form');
    const content = document.createElement('div');
    content.classList.add('content');

    // Add test headers
    ['First Section', 'Second Section', 'Third Section'].forEach((text) => {
      const header = document.createElement('h2');
      header.textContent = text;
      content.appendChild(header);
    });

    section.appendChild(content);
    mainSection.appendChild(section);
    document.body.appendChild(mainSection);
  }

  const tocSection = document.createElement('div');
  tocSection.classList.add('section');
  tocSection.append(tocBlock);
  mainSection.prepend(tocSection);

  if (startBlock) {
    const startSection = document.createElement('div');
    startSection.classList.add('section');
    const startElement = document.createElement('div');
    startElement.classList.add(startBlock);
    startSection.append(startElement);
    if (hideStartSection) startSection.style.display = 'none';
    mainSection.prepend(startSection);
  }

  await decorate(tocBlock);
  return document.querySelector('.toc-container');
};

const cleanupTest = () => {
  document.documentElement.innerHTML = '';
};

describe('Table of Contents SEO - Basic Test', () => {
  it('should load without error', async () => {
    const toc = await setupTest('./mocks/body.html');
    expect(toc).to.exist;
    cleanupTest();
  });
});

describe('Table of Contents SEO - Structure Test', () => {
  it('should render the TOC with correct structure', async () => {
    const toc = await setupTest('./mocks/body.html');

    expect(toc).to.exist;
    expect(toc.classList.contains('toc-container')).to.be.true;
    expect(toc.classList.contains('ax-grid-col-12')).to.be.true;
    expect(toc.getAttribute('role')).to.equal('navigation');
    expect(toc.getAttribute('aria-label')).to.equal('Table of Contents');

    cleanupTest();
  });
});

describe('Table of Contents SEO - Title Test', () => {
  it('should have a properly configured title', async () => {
    const toc = await setupTest('./mocks/body.html');
    const title = toc.querySelector('.toc-title');

    expect(title).to.exist;
    expect(title.textContent).to.equal('Table of Contents');
    expect(title.tagName.toLowerCase()).to.equal('button');
    expect(title.getAttribute('aria-expanded')).to.equal('false');
    expect(title.getAttribute('aria-controls')).to.equal('toc-content');

    cleanupTest();
  });
});

describe('Table of Contents SEO - Content Test', () => {
  it('should have properly configured content area', async () => {
    const toc = await setupTest('./mocks/body.html');
    const content = toc.querySelector('.toc-content');

    expect(content).to.exist;
    expect(content.id).to.equal('toc-content');
    expect(content.getAttribute('role')).to.equal('region');
    expect(content.getAttribute('aria-label')).to.equal('Table of Contents Links');

    cleanupTest();
  });
});

describe('Table of Contents SEO - Links Test', () => {
  it('should render all TOC links correctly', async () => {
    const toc = await setupTest('./mocks/body.html');
    const content = toc.querySelector('.toc-content');
    const links = content.querySelectorAll('a');

    expect(links.length).to.equal(3);

    const expectedTexts = ['First Section', 'Second Section', 'Third Section'];
    links.forEach((link, index) => {
      expect(link.textContent).to.equal(expectedTexts[index]);
      expect(link.getAttribute('href')).to.equal(`#content-${index + 1}`);
    });

    cleanupTest();
  });

  it('should render all TOC links correctly with 40 links', async () => {
    const toc = await setupTest('./mocks/body-40.html');
    const content = toc.querySelector('.toc-content');
    const links = content.querySelectorAll('a');

    expect(links.length).to.equal(40);

    cleanupTest();
  });
});

describe('Table of Contents SEO - Error Handling Test', () => {
  it('should handle missing metadata gracefully', async () => {
    window.isTestEnv = true;

    // Create a TOC block without full configuration
    const tocBlock = document.createElement('div');
    tocBlock.classList.add('toc-seo');

    // Add minimal highlight element
    const highlight = document.createElement('div');
    highlight.classList.add('section');
    const highlightDiv = document.createElement('div');
    highlightDiv.classList.add('highlight');
    highlight.appendChild(highlightDiv);
    document.body.appendChild(highlight);

    // Should not throw an error even with minimal config
    await decorate(tocBlock);

    cleanupTest();
  });
});

describe('Table of Contents SEO - Social Icons Test', () => {
  it('should render social icons correctly', async () => {
    const toc = await setupTest('./mocks/body.html');
    const socialIcons = toc.querySelector('.toc-social-icons');

    expect(socialIcons).to.exist;

    // Wait for async social icons loading to complete
    await new Promise((resolve) => {
      setTimeout(() => {
        // After async loading, social icons should be present
        expect(socialIcons.children.length).to.be.greaterThan(0);
        resolve();
      }, 10);
    });

    cleanupTest();
  });
});

describe('Table of Contents SEO - Configuration Test', () => {
  it('should use configuration values correctly', async () => {
    const toc = await setupTest('./mocks/body.html');

    // Test that configuration is being used
    expect(toc.getAttribute('aria-label')).to.equal('Table of Contents');

    const title = toc.querySelector('.toc-title');
    expect(title.getAttribute('aria-controls')).to.equal('toc-content');

    cleanupTest();
  });
});

describe('Table of Contents SEO - Safari Compatibility Test', () => {
  it('should work when requestIdleCallback is not available (Safari fallback)', async () => {
    // Store original requestIdleCallback
    const originalRequestIdleCallback = window.requestIdleCallback;

    // Remove requestIdleCallback to simulate Safari
    delete window.requestIdleCallback;

    try {
      const toc = await setupTest('./mocks/body.html');
      const socialIcons = toc.querySelector('.toc-social-icons');

      expect(toc).to.exist;
      expect(socialIcons).to.exist;

      // Wait for setTimeout fallback to execute
      await new Promise((resolve) => {
        setTimeout(() => {
          // Social icons should still be loaded via setTimeout fallback
          expect(socialIcons.children.length).to.be.greaterThan(0);
          resolve();
        }, 20);
      });

      cleanupTest();
    } finally {
      // Restore original requestIdleCallback
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback;
      }
    }
  });
});

describe('Table of Contents SEO - Empty Block Test', () => {
  it('should handle completely empty block gracefully', async () => {
    const block = document.createElement('div');
    block.className = 'toc-seo';
    // Empty block with no children
    document.body.appendChild(block);

    await decorate(block);

    // Block should be hidden even with no content
    expect(block.style.display).to.equal('none');

    cleanupTest();
  });
});

describe('Table of Contents SEO - Independent Positioning', () => {
  beforeEach(() => {
    // Background browser tabs may pause animation frames during the full suite.
    sinon.stub(window, 'requestAnimationFrame').callsFake((callback) => (
      setTimeout(() => callback(performance.now()), 0)
    ));
  });

  afterEach(() => {
    sinon.restore();
    cleanupTest();
  });

  const nextFrame = () => new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });

  [
    { width: 390, startBlock: 'highlight', hideStartSection: true },
    { width: 768, startBlock: 'highlight', hideStartSection: true },
    { width: 390, startBlock: null },
    { width: 390, startBlock: 'blog-article-marquee', hideStartSection: true },
    { width: 1024, startBlock: 'highlight' },
    { width: 1280, startBlock: 'blog-article-marquee' },
    { width: 1280, startBlock: null },
  ].forEach((options) => {
    it(`keeps the TOC at its authored position at ${options.width}px with ${options.startBlock || 'no preceding block'}`, async () => {
      const toc = await setupTest('./mocks/body-positioning.html', options);
      const block = document.querySelector('.toc-seo');
      const section = document.querySelector('.section.long-form');

      expect(toc).to.exist;
      expect(toc.parentElement).to.equal(block.parentElement);
      expect(toc.nextElementSibling).to.equal(block);
      expect(toc.parentElement.nextElementSibling).to.equal(section);
      expect(toc.getBoundingClientRect().height).to.be.greaterThan(0);

      if (options.width < 1024) {
        expect(toc.classList.contains('open')).to.be.true;
        const title = toc.querySelector('.toc-title');
        title.click();
        expect(title.getAttribute('aria-expanded')).to.equal('false');
        title.click();
        expect(title.getAttribute('aria-expanded')).to.equal('true');

        const header = section.querySelector('h2');
        const scrollIntoView = sinon.stub(header, 'scrollIntoView');
        toc.querySelector('.toc-link').click();
        expect(scrollIntoView.calledOnceWith({ behavior: 'smooth', block: 'start' })).to.be.true;
      }
    });
  });

  it('calculates desktop placement from long-form content and clears the sticky navigation', async () => {
    const toc = await setupTest('./mocks/body-positioning.html', { startBlock: null });
    const section = document.querySelector('.section.long-form');
    let sectionTop = 320;
    sinon.stub(section, 'getBoundingClientRect').callsFake(() => ({
      top: sectionTop, height: 600, bottom: sectionTop + 600,
    }));

    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    expect(toc.style.getPropertyValue('--toc-top-position')).to.equal('344px');
    expect(toc.classList.contains('toc-desktop')).to.be.true;

    sectionTop = -200;
    window.dispatchEvent(new Event('scroll'));
    await nextFrame();
    expect(toc.style.getPropertyValue('--toc-top-position')).to.equal('95px');

    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    expect(toc.classList.contains('toc-desktop')).to.be.false;
    expect(toc.style.getPropertyValue('--toc-top-position')).to.equal('');
    expect(toc.classList.contains('open')).to.be.true;

    window.innerWidth = 1280;
    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    expect(toc.classList.contains('toc-desktop')).to.be.true;
    expect(toc.style.getPropertyValue('--toc-top-position')).to.equal('95px');
  });

  it('updates the mobile floating button from the independent TOC position', async () => {
    const toc = await setupTest('./mocks/body-positioning.html', {
      width: 390, hideStartSection: true,
    });
    let tocTop = -500;
    sinon.stub(toc, 'getBoundingClientRect').callsFake(() => ({
      top: tocTop, bottom: tocTop + 200, height: 200,
    }));
    const floatingButton = document.querySelector('.toc-floating-button');

    window.dispatchEvent(new Event('scroll'));
    await nextFrame();
    expect(floatingButton.classList.contains('visible')).to.be.true;

    const scrollTo = sinon.stub(window, 'scrollTo');
    floatingButton.click();
    expect(scrollTo.calledOnceWith({ top: 0, behavior: 'smooth' })).to.be.true;

    tocTop = 100;
    window.dispatchEvent(new Event('scroll'));
    await nextFrame();
    expect(floatingButton.classList.contains('visible')).to.be.false;
  });

  it('keeps the desktop TOC above the configured stop element', async () => {
    const toc = await setupTest('./mocks/body-positioning.html', { startBlock: null });
    const section = document.querySelector('.section.long-form');
    sinon.stub(section, 'getBoundingClientRect').returns({ top: -200, height: 600 });
    sinon.stub(window, 'pageYOffset').get(() => 500);
    const stopElement = document.createElement('div');
    stopElement.classList.add('article-end');
    stopElement.style.height = '100px';
    section.after(stopElement);
    sinon.stub(stopElement, 'getBoundingClientRect').returns({ top: 200, height: 100 });
    toc.dataset.stopSelector = '.article-end';

    window.dispatchEvent(new Event('scroll'));
    await nextFrame();
    const expectedTop = Math.min(95, 200 - toc.offsetHeight - 20);
    expect(toc.style.getPropertyValue('--toc-top-position')).to.equal(`${expectedTop}px`);
  });
});
