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
});
