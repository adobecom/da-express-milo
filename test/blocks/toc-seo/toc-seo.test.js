import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

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

const setupTest = async (htmlFile) => {
  const testBody = await readFile({ path: htmlFile });
  window.isTestEnv = true;

  // Mock window width to be desktop (>= 1024px) for consistent testing
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  document.documentElement.innerHTML = testBody;

  // Create a mock TOC block element
  const tocBlock = document.createElement('div');
  tocBlock.classList.add('toc-seo');

  // Add mock configuration rows
  const configRows = [
    ['toc-title', 'Table of Contents'],
    ['toc-aria-label', 'Table of Contents Links'],
    ['content-1', 'First Section'],
    ['content-2', 'Second Section'],
    ['content-3', 'Third Section'],
  ];

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

  // Add highlight element that TOC needs
  const highlight = document.createElement('div');
  highlight.classList.add('section');
  const highlightDiv = document.createElement('div');
  highlightDiv.classList.add('highlight');
  highlight.appendChild(highlightDiv);
  document.body.appendChild(highlight);

  // Add main section with long-form content
  const mainSection = document.createElement('main');
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
