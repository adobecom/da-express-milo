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
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/template-x-carousel-toolbar/template-x-carousel-toolbar.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const mockAPIResposne = JSON.parse(await readFile({ path: './mocks/template-utils.json' }));
const defaultBody = document.body.innerHTML;
const searchBarBody = `
<main>
  <div class="section" data-status="decorated" data-idx="2">
    <div class="template-x-carousel-toolbar search-bar">
      <div>
        <div>
          <h2 id="start-with-a-template">Start with a template.</h2>
          <p>Search professionally-designed templates.</p>
          <p>Browse by category</p>
        </div>
      </div>
      <div>
        <div>
          tasks=invoice&amp;orderBy=-createDate&amp;limit=10&amp;collection=default
        </div>
      </div>
    </div>
  </div>
</main>`;

describe('template-x-carousel-toolbar', () => {
  let block;
  let oldFetch;
  before(async () => {
    oldFetch = window.fetch;
    sinon.stub(window, 'fetch').callsFake(async (url) => {
      if (url.includes('/express-search-api')) return mockRes({ payload: mockAPIResposne });
      return {};
    });
    block = document.querySelector('.template-x-carousel-toolbar');
    await decorate(block);
  });
  after(() => {
    window.fetch = oldFetch;
  });

  afterEach(() => {
    document.body.click();
  });

  it('has correct block structures', async () => {
    expect(block.querySelector('.heading')).to.exist;
    expect(block.querySelector('.toolbar')).to.exist;
    expect(block.querySelector('.toolbar .controls-container')).to.exist;
    expect(block.querySelector('.templates-container.gallery')).to.exist;
    const templates = [...block.querySelectorAll('.template')];
    expect(templates.length).to.equal(10);
    expect(block.querySelector('.from-scratch-container')).to.exist;
  });

  it('handles dropdown clicks', async () => {
    const controlsContainer = block.querySelector('.toolbar .controls-container');
    const select = controlsContainer.querySelector('.select');
    expect(select.getAttribute('aria-expanded')).to.equal('false');
    select.click();
    expect(select.getAttribute('aria-expanded')).to.equal('true');
    const options = select.querySelectorAll('.options:not(.sizing-proxy) .option');
    expect(options.length).to.equal(2);
    expect(options[0].getAttribute('aria-selected') === 'true').to.be.false;
    expect(options[1].getAttribute('aria-selected') === 'true').to.be.true;
    options[0].click();
    expect(options[0].getAttribute('aria-selected') === 'true').to.be.true;
    expect(options[1].getAttribute('aria-selected') === 'true').to.be.false;
    block.click();
    expect(select.getAttribute('aria-expanded')).to.equal('false');
  });

  it('handles dropdown keyboard events', async () => {
    const controlsContainer = block.querySelector('.toolbar .controls-container');
    const select = controlsContainer.querySelector('.select');
    expect(select.getAttribute('aria-expanded')).to.equal('false');
    select.focus();
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(select.getAttribute('aria-expanded')).to.equal('true');
    const options = select.querySelectorAll('.options:not(.sizing-proxy) .option');
    options[0].click();
    select.click();
    expect(options[0].classList.contains('hovered')).to.be.true;
    expect(options[1].classList.contains('hovered')).to.be.false;
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(options[0].classList.contains('hovered')).to.be.false;
    expect(options[1].classList.contains('hovered')).to.be.true;
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[0].classList.contains('hovered')).to.be.true;
    expect(options[1].classList.contains('hovered')).to.be.false;
    select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(select.getAttribute('aria-expanded')).to.equal('false');
  });

  describe('search-bar variant', () => {
    beforeEach(async () => {
      document.body.innerHTML = searchBarBody;
      block = document.querySelector('.template-x-carousel-toolbar');
      await decorate(block);
    });

    afterEach(() => {
      document.body.innerHTML = defaultBody;
    });

    it('builds the search field and toolbar layout', async () => {
      const toolbar = block.querySelector('.toolbar.search-bar');
      const searchBarWrapper = block.querySelector('.search-bar-wrapper');
      const searchInput = searchBarWrapper.querySelector('input.search-bar');
      const controlsContainer = block.querySelector('.controls-container');
      const rightControls = controlsContainer.querySelector('.right-controls');

      expect(block.classList.contains('search-bar')).to.be.true;
      expect(block.querySelector('.heading.centered-heading')).to.exist;
      expect(toolbar).to.exist;
      expect(searchBarWrapper).to.exist;
      expect(searchBarWrapper.querySelector('.icon-search')).to.exist;
      expect(searchBarWrapper.querySelector('.icon-search-clear')).to.exist;
      expect(searchInput.getAttribute('type')).to.equal('text');
      expect(searchInput.getAttribute('placeholder')).to.exist;
      expect(searchInput.getAttribute('enterKeyHint')).to.exist;
      expect(block.querySelector('.search-dropdown-container.hidden')).to.exist;
      expect(block.querySelector('.templates-container.search-bar-gallery')).to.exist;
      expect(block.querySelector('.from-scratch-container')).to.not.exist;
      expect(controlsContainer.querySelector('.controls-label').textContent).to.equal('Browse by category');
      expect(rightControls.querySelector('.select')).to.exist;
      expect(rightControls.querySelector('.gallery-control')).to.exist;
    });

    it('shows, updates, and clears search suggestions state', async () => {
      const searchBarWrapper = block.querySelector('.search-bar-wrapper');
      const searchInput = searchBarWrapper.querySelector('input.search-bar');
      const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');
      const clearBtn = searchBarWrapper.querySelector('.icon-search-clear');
      const trendsContainer = searchBarWrapper.querySelector('.trends-container');
      const suggestionsContainer = searchBarWrapper.querySelector('.suggestions-container');
      const suggestionsList = searchBarWrapper.querySelector('.suggestions-list');

      expect(searchDropdown.classList.contains('hidden')).to.be.true;
      expect(clearBtn.style.display).to.equal('none');
      expect(trendsContainer.classList.contains('hidden')).to.be.false;
      expect(suggestionsContainer.classList.contains('hidden')).to.be.true;

      searchInput.click();
      expect(searchDropdown.classList.contains('hidden')).to.be.false;

      searchInput.value = 'flyer';
      searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      expect(clearBtn.style.display).to.equal('inline-block');
      expect(trendsContainer.classList.contains('hidden')).to.be.true;
      expect(suggestionsContainer.classList.contains('hidden')).to.be.false;

      suggestionsList.innerHTML = '<li>flyer template</li>';
      clearBtn.click();
      expect(searchInput.value).to.equal('');
      expect(suggestionsList.children.length).to.equal(0);
      expect(clearBtn.style.display).to.equal('none');
      expect(trendsContainer.classList.contains('hidden')).to.be.false;
      expect(suggestionsContainer.classList.contains('hidden')).to.be.true;
    });

    it('hides the search dropdown when clicking outside the field', async () => {
      const searchBarWrapper = block.querySelector('.search-bar-wrapper');
      const searchInput = searchBarWrapper.querySelector('input.search-bar');
      const searchDropdown = searchBarWrapper.querySelector('.search-dropdown-container');

      searchInput.click();
      expect(searchDropdown.classList.contains('hidden')).to.be.false;

      document.body.click();
      expect(searchDropdown.classList.contains('hidden')).to.be.true;
    });
  });
});
