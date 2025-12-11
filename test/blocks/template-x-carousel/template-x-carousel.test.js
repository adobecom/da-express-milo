import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { mockRes } from '../test-utilities.js';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = {};
  mod.setConfig(conf);
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/template-x-carousel/template-x-carousel.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
// Reuse template-utils.json from template-x-carousel-toolbar since it's the same API structure
const mockAPIResposne = JSON.parse(await readFile({ path: '../template-x-carousel-toolbar/mocks/template-utils.json' }));

describe('template-x-carousel', () => {
  let block;
  let oldFetch;
  before(async () => {
    oldFetch = window.fetch;
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (url.includes('/express-search-api')) return mockRes({ payload: mockAPIResposne });
      return {};
    });
    block = document.querySelector('.template-x-carousel');
    await decorate(block);
  });
  after(() => {
    window.fetch = oldFetch;
  });

  it('has correct block structures for search bar mode', async () => {
    // Check basic structure
    expect(block.querySelector('.heading')).to.exist;
    expect(block.querySelector('.toolbar')).to.exist;
    expect(block.querySelector('.toolbar .controls-container')).to.exist;
    expect(block.querySelector('.templates-container.search-bar-gallery')).to.exist;

    // Check templates are rendered
    const templates = [...block.querySelectorAll('.template')];
    expect(templates.length).to.equal(10);

    // Should NOT have from-scratch container (search bar mode)
    expect(block.querySelector('.from-scratch-container')).to.not.exist;

    // Should NOT have dropdown (search bar mode)
    expect(block.querySelector('.select')).to.not.exist;
  });

  it('templates have custom URL configuration for search bar mode', async () => {
    const templates = [...block.querySelectorAll('.template')];
    expect(templates.length).to.be.greaterThan(0);

    // Check that templates have the expected link structure for search bar mode
    const firstTemplate = templates[0];
    const templateLink = firstTemplate.querySelector('a.button, a.cta-link');
    expect(templateLink).to.exist;

    // The href should include the custom base URL for search bar mode
    const href = templateLink.getAttribute('href');
    expect(href).to.include('adobesparkpost.app.link');
    expect(href).to.include('source=seo-template');
  });

  it('gallery controls work correctly', async () => {
    const controlsContainer = block.querySelector('.toolbar .controls-container');
    expect(controlsContainer).to.exist;

    // Should have gallery control buttons
    const galleryControl = controlsContainer.querySelector('.gallery-control');
    expect(galleryControl).to.exist;

    // Check for navigation buttons
    const prevButton = galleryControl.querySelector('.prev');
    const nextButton = galleryControl.querySelector('.next');
    expect(prevButton).to.exist;
    expect(nextButton).to.exist;
  });

  it('templates container has search-bar-gallery class', async () => {
    const templatesContainer = block.querySelector('.templates-container');
    expect(templatesContainer).to.exist;
    expect(templatesContainer.classList.contains('search-bar-gallery')).to.be.true;
  });

  it('heading is properly positioned', async () => {
    const heading = block.querySelector('.heading');
    expect(heading).to.exist;
    expect(heading.tagName.toLowerCase()).to.equal('h2');

    // Heading should be in headers-container which comes before toolbar
    const headersContainer = block.querySelector('.headers-container');
    const toolbar = block.querySelector('.toolbar');
    expect(headersContainer).to.exist;
    expect(toolbar).to.exist;

    // Check that headers-container comes before toolbar in DOM order
    const headersIndex = Array.from(block.children).indexOf(headersContainer);
    const toolbarIndex = Array.from(block.children).indexOf(toolbar);
    expect(headersIndex).to.be.lessThan(toolbarIndex);
  });

  it('handles API errors gracefully', async () => {
    // Create a new block to test error handling
    const errorBlock = document.createElement('div');
    errorBlock.className = 'template-x-carousel';
    errorBlock.innerHTML = `
      <div>
        <div>
          <h2>Test Heading</h2>
        </div>
      </div>
      <div>
        <div>invalid-recipe-that-will-fail</div>
      </div>
    `;
    document.body.appendChild(errorBlock);

    // Mock fetch to return error
    const originalFetch = window.fetch;
    window.fetch = sinon.stub().rejects(new Error('API Error'));

    try {
      await decorate(errorBlock);
      // In non-prod environment, should show error message
      expect(errorBlock.textContent).to.include('Error loading templates');
    } finally {
      window.fetch = originalFetch;
      errorBlock.remove();
    }
  });
});
