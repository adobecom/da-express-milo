import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { mockRes } from '../test-utilities.js';

// Must be set before scripts.js is imported below: it makes loadPage() bail out
// so its deferred page-init side effects (external IMS script, a fire-and-forget
// getCountry() that rejects against the mock config) don't leak into tests and
// fail unrelated cases under load.
window.isTestEnv = true;

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { setLibs, getLibs } = imports[0];
// Point getLibs() at the local mocks so dynamic imports inside the block
// (placeholders, samplerum, etc.) resolve to stubs instead of the CDN.
setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({});
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/template-x-carousel-toolbar/template-x-carousel-toolbar.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const mockAPIResposne = JSON.parse(await readFile({ path: './mocks/template-utils.json' }));
const defaultBody = document.body.innerHTML;

// The search submit handler awaits a dynamic import(samplerum.js) before it
// calls t_locationAssign, so the redirect happens asynchronously and its
// timing varies (cold module fetch, CI load). Poll instead of a fixed delay.
const waitUntil = async (predicate, { timeout = 2000, interval = 10 } = {}) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) return false;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => { setTimeout(r, interval); });
  }
  return true;
};
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
    // Keep a persistent redirect stub for the whole suite. The block's search
    // submit falls back to a real window.location.assign() when t_locationAssign
    // is missing (template-x-carousel-toolbar.js). A late/leaked async redirect
    // firing after a test tore down its stub would then navigate the test iframe
    // for real, wiping the page and breaking later tests. A suite-wide stub means
    // a stray redirect is always harmlessly captured, never a real navigation.
    window.t_locationAssign = sinon.stub();
    block = document.querySelector('.template-x-carousel-toolbar');
    await decorate(block);
  });
  after(() => {
    window.fetch = oldFetch;
    delete window.t_locationAssign;
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
      window.t_locationAssign.resetHistory();
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

    describe('authored redirect URLs', () => {
      const CUSTOM_OUT_URL = 'https://example.com/out?q=<category>';
      const CUSTOM_IN_URL = 'https://example.com/in?q=<category>';

      beforeEach(async () => {
        const authoredBody = `
<main>
  <div class="section" data-status="decorated" data-idx="2">
    <div class="template-x-carousel-toolbar search-bar">
      <div>
        <div>
          <h2>Start with a template.</h2>
          <p>Search templates.</p>
          <p>Browse by category</p>
        </div>
      </div>
      <div><div>tasks=invoice&amp;orderBy=-createDate&amp;limit=10&amp;collection=default</div></div>
      <div><div>logged-out</div><div>${CUSTOM_OUT_URL.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>
      <div><div>logged-in</div><div>${CUSTOM_IN_URL.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div>
    </div>
  </div>
</main>`;
        document.body.innerHTML = authoredBody;
        block = document.querySelector('.template-x-carousel-toolbar');
        window.t_locationAssign.resetHistory();
        await decorate(block);
      });

      afterEach(() => {
        delete window.adobeIMS;
        document.body.innerHTML = defaultBody;
      });

      it('removes authored redirect rows from the DOM', () => {
        const rows = [...block.querySelectorAll(':scope > div')];
        const hasLoggedOutRow = rows.some((r) => r.textContent.toLowerCase().includes('logged-out'));
        const hasLoggedInRow = rows.some((r) => r.textContent.toLowerCase().includes('logged-in'));
        expect(hasLoggedOutRow).to.be.false;
        expect(hasLoggedInRow).to.be.false;
      });

      it('uses the authored logged-out URL for unauthenticated users', async () => {
        window.adobeIMS = { isSignedInUser: () => false };
        const searchForm = block.querySelector('.search-form');
        block.querySelector('input.search-bar').value = 'poster';
        // Ignore any redirect leaked from a prior test's async submit.
        window.t_locationAssign.resetHistory();
        searchForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await waitUntil(() => window.t_locationAssign.called);
        expect(window.t_locationAssign.calledOnce).to.be.true;
        expect(window.t_locationAssign.firstCall.args[0]).to.equal(
          CUSTOM_OUT_URL.replace('<category>', encodeURIComponent('poster')),
        );
      });

      it('uses the authored logged-in URL for authenticated users', async () => {
        window.adobeIMS = { isSignedInUser: () => true };
        const searchForm = block.querySelector('.search-form');
        block.querySelector('input.search-bar').value = 'poster';
        // Ignore any redirect leaked from a prior test's async submit.
        window.t_locationAssign.resetHistory();
        searchForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await waitUntil(() => window.t_locationAssign.called);
        expect(window.t_locationAssign.calledOnce).to.be.true;
        expect(window.t_locationAssign.firstCall.args[0]).to.equal(
          CUSTOM_IN_URL.replace('<category>', encodeURIComponent('poster')),
        );
      });
    });
  });

  describe('search-bar variant – trend cap', () => {
    let trendBlock;

    before(async () => {
      window.placeholders = {
        'search-trends': JSON.stringify({
          'Term 1': '/express/templates/t1',
          'Term 2': '/express/templates/t2',
          'Term 3': '/express/templates/t3',
          'Term 4': '/express/templates/t4',
          'Term 5': '/express/templates/t5',
          'Term 6': '/express/templates/t6',
          'Term 7': '/express/templates/t7',
        }),
      };
      document.body.innerHTML = searchBarBody;
      trendBlock = document.querySelector('.template-x-carousel-toolbar');
      await decorate(trendBlock);
    });

    after(() => {
      delete window.placeholders;
      document.body.innerHTML = defaultBody;
    });

    it('shows at most 5 trend links when source has more than 5 entries', () => {
      const trendLinks = trendBlock.querySelectorAll('.trends-wrapper .trend-link');
      expect(trendLinks.length).to.equal(5);
    });
  });
});
