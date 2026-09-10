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

const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/standalone-search-bar/standalone-search-bar.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('standalone-search-bar', () => {
  let block;
  let oldFetch;

  before(async () => {
    oldFetch = window.fetch;
    sinon.stub(window, 'fetch').callsFake(async () => mockRes({ payload: {} }));

    block = document.querySelector('.standalone-search-bar');
    await decorate(block);
  });

  after(() => {
    window.fetch = oldFetch;
    sinon.restore();
  });

  it('creates correct block structure', () => {
    expect(block.querySelector('.search-bar-wrapper')).to.exist;
    expect(block.querySelector('.search-header')).to.exist;
    expect(block.querySelector('.search-title')).to.exist;
    expect(block.querySelector('.search-subtitle')).to.exist;
    expect(block.querySelector('input.search-bar')).to.exist;
    expect(block.querySelector('.search-dropdown-container')).to.exist;
  });

  it('parses Word document configuration', () => {
    // Test configuration by checking if configured elements exist and work correctly
    const searchInput = block.querySelector('input.search-bar');
    expect(searchInput.placeholder).to.equal('Search for card templates');
    expect(searchInput.getAttribute('aria-label')).to.equal('Search for card templates');

    // Check if title and subtitle from config are displayed
    const title = block.querySelector('.search-title');
    const subtitle = block.querySelector('.search-subtitle');
    expect(title).to.exist;
    expect(subtitle).to.exist;
    expect(title.textContent).to.not.be.empty;
    expect(subtitle.textContent).to.not.be.empty;
  });

  it('displays configured header and subtitle', () => {
    const title = block.querySelector('.search-title');
    const subtitle = block.querySelector('.search-subtitle');

    expect(title.textContent).to.equal('Create amazing cards in minutes');
    expect(subtitle.textContent).to.include('Make professional greeting cards');
  });

  it('uses configured placeholder text', () => {
    const searchInput = block.querySelector('input.search-bar');
    expect(searchInput.placeholder).to.equal('Search for card templates');
  });

  it('has search input with correct attributes', () => {
    const searchInput = block.querySelector('input.search-bar');
    expect(searchInput.getAttribute('type')).to.equal('text');
    expect(searchInput.getAttribute('enterKeyHint')).to.exist;
  });

  it('creates dropdown container', () => {
    const dropdown = block.querySelector('.search-dropdown-container');
    const trendsContainer = dropdown.querySelector('.trends-container');
    const suggestionsContainer = dropdown.querySelector('.suggestions-container');

    expect(dropdown).to.exist;
    expect(trendsContainer).to.exist;
    expect(suggestionsContainer).to.exist;
  });

  it('handles search input interactions', () => {
    const searchInput = block.querySelector('input.search-bar');
    const trendsContainer = block.querySelector('.trends-container');
    const suggestionsContainer = block.querySelector('.suggestions-container');
    const clearBtn = block.querySelector('.icon-search-clear');

    // Initially trends visible, suggestions hidden
    expect(trendsContainer.classList.contains('hidden')).to.be.false;
    expect(suggestionsContainer.classList.contains('hidden')).to.be.true;
    expect(clearBtn.style.display).to.equal('none');

    // Type in search input
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('keyup'));

    // Should toggle visibility
    expect(trendsContainer.classList.contains('hidden')).to.be.true;
    expect(suggestionsContainer.classList.contains('hidden')).to.be.false;
    expect(clearBtn.style.display).to.equal('inline-block');
  });

  it('handles clear button', () => {
    const searchInput = block.querySelector('input.search-bar');
    const clearBtn = block.querySelector('.icon-search-clear');

    searchInput.value = 'test';
    clearBtn.dispatchEvent(new Event('click'));

    expect(searchInput.value).to.equal('');
  });

  it('handles dropdown open/close', () => {
    const searchInput = block.querySelector('input.search-bar');
    const dropdown = block.querySelector('.search-dropdown-container');

    // Initially dropdown should be hidden
    expect(dropdown.classList.contains('hidden')).to.be.true;

    // Click search input to open dropdown
    const clickEvent = new Event('click', { bubbles: true });
    searchInput.dispatchEvent(clickEvent);
    expect(dropdown.classList.contains('hidden')).to.be.false;

    // Click outside to close dropdown
    const outsideClickEvent = new Event('click', { bubbles: true });
    document.body.dispatchEvent(outsideClickEvent);
    expect(dropdown.classList.contains('hidden')).to.be.true;
  });

  it('has proper form structure', () => {
    const form = block.querySelector('.search-form');
    const inputWrapper = block.querySelector('.search-input-wrapper');

    expect(form).to.exist;
    expect(inputWrapper).to.exist;
    expect(form.tagName.toLowerCase()).to.equal('form');
  });

  describe('trending searches arrow key navigation', () => {
    let focusSpy;

    beforeEach(() => {
      focusSpy = sinon.spy(HTMLElement.prototype, 'focus');
    });

    afterEach(() => {
      focusSpy.restore();
    });

    it('focuses the first trend link on ArrowDown from the search bar', () => {
      const searchInput = block.querySelector('input.search-bar');
      const trendLinks = block.querySelectorAll('.trend-link');

      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

      expect(focusSpy.getCalls().some((call) => call.thisValue === trendLinks[0])).to.be.true;
    });

    it('focuses the first suggestion (not a trend link) on ArrowDown when suggestions are visible', () => {
      const searchInput = block.querySelector('input.search-bar');
      const trendsContainer = block.querySelector('.trends-container');
      const suggestionsContainer = block.querySelector('.suggestions-container');
      const suggestionsList = block.querySelector('.suggestions-list');

      const suggestionLi = document.createElement('li');
      suggestionLi.tabIndex = -1;
      suggestionsList.appendChild(suggestionLi);
      trendsContainer.classList.add('hidden');
      suggestionsContainer.classList.remove('hidden');

      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

      expect(focusSpy.getCalls().some((call) => call.thisValue === suggestionLi)).to.be.true;

      suggestionLi.remove();
      trendsContainer.classList.remove('hidden');
      suggestionsContainer.classList.add('hidden');
    });

    it('keeps only the focused trend link in the tab sequence (roving tabindex)', () => {
      const trendLinks = block.querySelectorAll('.trend-link');

      trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

      expect(trendLinks[0].tabIndex).to.equal(-1);
      expect(trendLinks[1].tabIndex).to.equal(0);

      // Reset back to the initial roving state for subsequent tests
      trendLinks[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    });

    it('focuses the next trend link on ArrowDown from a trend link', () => {
      const trendLinks = block.querySelectorAll('.trend-link');

      trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

      expect(focusSpy.getCalls().some((call) => call.thisValue === trendLinks[1])).to.be.true;
    });

    it('focuses the previous trend link on ArrowUp', () => {
      const trendLinks = block.querySelectorAll('.trend-link');

      trendLinks[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));

      expect(focusSpy.getCalls().some((call) => call.thisValue === trendLinks[0])).to.be.true;
    });

    it('focuses the search bar on ArrowUp from the first trend link', () => {
      const searchInput = block.querySelector('input.search-bar');
      const trendLinks = block.querySelectorAll('.trend-link');

      trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));

      expect(focusSpy.getCalls().some((call) => call.thisValue === searchInput)).to.be.true;
    });

    it('does not move focus past the last trend link on ArrowDown', () => {
      const trendLinks = block.querySelectorAll('.trend-link');
      const lastTrendLink = trendLinks[trendLinks.length - 1];

      lastTrendLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

      expect(focusSpy.called).to.be.false;
    });

    it('closes the dropdown and focuses the search bar on Escape from a trend link', () => {
      const searchInput = block.querySelector('input.search-bar');
      const dropdown = block.querySelector('.search-dropdown-container');
      const trendLinks = block.querySelectorAll('.trend-link');

      dropdown.classList.remove('hidden');
      trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

      expect(dropdown.classList.contains('hidden')).to.be.true;
      expect(focusSpy.getCalls().some((call) => call.thisValue === searchInput)).to.be.true;
    });
  });
});
