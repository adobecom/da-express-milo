import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

window.isTestEnv = true;

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
const { default: BlockMediator } = await import('../../../express/code/scripts/block-mediator.min.js');

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});
const { default: decorate } = await import('../../../express/code/blocks/search-marquee/search-marquee.js');

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
describe('Search Marquee', () => {
  const block = document.querySelector('.search-marquee');
  before(async () => {
    window.isTestEnv = true;
    await decorate(block);
  });
  it('has a hero h1', () => {
    expect(block.querySelector('div:first-of-type h1#hero-title')).to.exist;
  });

  it('has a hero paragraph', () => {
    expect(block.querySelector('div:first-of-type p')).to.exist;
  });

  it('has a hero background image', () => {
    const img = block.querySelector('img');
    expect(img).to.exist;
    expect(img.fetchPriority).equal('high');
  });

  it('has a search bar', () => {
    const searchWrapper = block.querySelector('div.search-bar-wrapper');
    expect(searchWrapper).to.exist;
    const input = searchWrapper.querySelector(':scope > form > input');
    expect(input).to.exist;
    expect(input.type).to.equal('text');
    expect(input.placeholder).to.exist;
  });

  it('has search dropdown hidden when loaded', () => {
    const dropdownContainer = block.querySelector('.search-dropdown-container');
    const trendsContainer = dropdownContainer.querySelector('.trends-container');
    const suggestionsContainer = dropdownContainer.querySelector('.suggestions-container');
    expect(dropdownContainer.classList.contains('hidden')).to.be.true;
    expect(trendsContainer).to.exist;
    expect(suggestionsContainer).to.exist;
  });

  it('shows trends when first clicked', () => {
    const dropdownContainer = block.querySelector('.search-dropdown-container');
    const trendsContainer = dropdownContainer.querySelector('.trends-container');
    const suggestionsContainer = dropdownContainer.querySelector('.suggestions-container');
    const input = block.querySelector('form input');
    input.click();
    expect(dropdownContainer.classList.contains('hidden')).to.be.false;
    expect(suggestionsContainer.classList.contains('hidden')).to.be.true;
    expect(trendsContainer.classList.contains('hidden')).to.be.false;
  });

  it('has clear button that clears search input', () => {
    const input = block.querySelector('form input');
    const clearBtn = block.querySelector('.icon-search-clear');

    // Set input value
    input.value = 'test search';
    input.dispatchEvent(new Event('keyup'));

    // Click clear button
    clearBtn.click();

    expect(input.value).to.equal('');
  });

  it('shows suggestions container when typing', () => {
    const input = block.querySelector('form input');
    const suggestionsContainer = block.querySelector('.suggestions-container');
    const trendsContainer = block.querySelector('.trends-container');

    // Type in search bar
    input.value = 'logo';
    input.dispatchEvent(new Event('keyup'));

    expect(suggestionsContainer.classList.contains('hidden')).to.be.false;
    expect(trendsContainer.classList.contains('hidden')).to.be.true;
  });

  it('hides dropdown when clicking outside', () => {
    const dropdownContainer = block.querySelector('.search-dropdown-container');
    const input = block.querySelector('form input');

    // Show dropdown first
    input.click();
    expect(dropdownContainer.classList.contains('hidden')).to.be.false;

    // Click outside
    document.body.click();
    expect(dropdownContainer.classList.contains('hidden')).to.be.true;
  });
});

describe('Search Marquee - marquee fused integration', () => {
  it('injects express logo when adjacent marquee-fused link list exists', async () => {
    document.body.innerHTML = `
      <main>
        <div class="section">
          <div class="search-marquee-wrapper">
            <div class="search-marquee">
              <div>
                <div>
                  <h1 id="hero-title">Search thousands of templates</h1>
                  <p>Find the perfect template for your project</p>
                </div>
              </div>
              <div>
                <div>
                  <picture>
                    <img src="./media/hero-bg.jpg" alt="Hero background">
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="link-list-wrapper">
            <div class="link-list marquee-fused">
              <div>
                <div>
                  <h3>Templates</h3>
                  <p class="button-container">
                    <a href="https://example.com/templates">Templates</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    const fusedBlock = document.querySelector('.link-list.marquee-fused');
    expect(fusedBlock).to.exist;

    const marqueeBlock = document.querySelector('.search-marquee');
    await decorate(marqueeBlock);

    expect(marqueeBlock.querySelector('.express-logo')).to.exist;
  });
});

describe('Search Marquee - manual links', () => {
  afterEach(() => {
    BlockMediator.set('searchMarqueeManualLinks', undefined);
    delete window.searchMarqueeManualLinks;
  });

  it('builds carousel from manual link data', async () => {
    const { default: decorateLinkList } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <main>
        <div class="section">
          <div class="search-marquee-wrapper search-marquee-manual-links">
            <div class="search-marquee">
              <div>
                <div>
                  <h1 id="hero-title">Manual Links Heading</h1>
                  <p>Manual description text</p>
                </div>
              </div>
              <div>
                <div>
                  <picture>
                    <img src="./media/hero-bg.jpg" alt="Hero background">
                  </picture>
                </div>
              </div>
              <div>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div class="section">
        <div class="link-list-wrapper">
          <div class="link-list marquee-fused">
            <div>
              <div>
                <h3>Manual Links</h3>
                <p class="button-container"><a class="button accent" href="/foo" title="Foo">Foo</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const block = document.querySelector('.search-marquee');
    const linkBlock = document.querySelector('.link-list.marquee-fused');

    // Decorate link-list first to export manual links
    await decorateLinkList(linkBlock);

    // Then decorate search-marquee which will pick up the exported data
    await decorate(block);

    // Manual links should be rendered immediately since data was already available
    const carousel = block.querySelector('.carousel-container.manual-link-list');
    expect(carousel).to.exist;
    const remainingPayload = BlockMediator.get('searchMarqueeManualLinks') || window.searchMarqueeManualLinks;
    expect(remainingPayload).to.be.undefined;
  });

  it('renders manual links when marquee decorates before link-list', async () => {
    const { default: decorateLinkList } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <main>
        <div class="section">
          <div class="search-marquee-wrapper">
            <div class="search-marquee">
              <div>
                <div>
                  <h1 id="hero-title">Manual Links Heading</h1>
                  <p>Manual description text</p>
                </div>
              </div>
              <div>
                <div>
                  <picture>
                    <img src="./media/hero-bg.jpg" alt="Hero background">
                  </picture>
                </div>
              </div>
              <div>
                <div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="link-list-wrapper">
            <div class="link-list marquee-fused">
              <div>
                <div>
                  <h3>Manual Links</h3>
                  <p class="button-container"><a class="button accent" href="/foo" title="Foo">Foo</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    const marqueeBlock = document.querySelector('.search-marquee');
    await decorate(marqueeBlock);

    const linkBlock = document.querySelector('.link-list.marquee-fused');
    await decorateLinkList(linkBlock);

    const carousel = marqueeBlock.querySelector('.carousel-container.manual-link-list');
    expect(carousel).to.exist;
  });
});

describe('Search Marquee - trending searches arrow key navigation', () => {
  let marqueeBlock;
  let searchInput;
  let trendsContainer;
  let suggestionsContainer;
  let getConfig;
  let focusSpy;

  const trendsJson = JSON.stringify({
    'Term 1': '/express/templates/t1',
    'Term 2': '/express/templates/t2',
    'Term 3': '/express/templates/t3',
  });

  before(async () => {
    ({ getConfig } = await import(`${getLibs()}/utils/utils.js`));
    // Seed placeholders on the config so trends render (getPlaceholder short-circuits
    // on config.placeholders before hitting the network/placeholder cache).
    getConfig().placeholders = {
      'search-trends': trendsJson,
      'search-trends-title': 'Trending searches',
      'search-suggestions-title': 'Suggestions',
    };

    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    marqueeBlock = document.querySelector('.search-marquee');
    await decorate(marqueeBlock);

    searchInput = marqueeBlock.querySelector('input.search-bar');
    trendsContainer = marqueeBlock.querySelector('.trends-container');
    suggestionsContainer = marqueeBlock.querySelector('.suggestions-container');
  });

  after(() => {
    delete getConfig().placeholders;
  });

  beforeEach(() => {
    // Reset roving state so each test starts from a known baseline.
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    trendLinks.forEach((link, index) => { link.tabIndex = index === 0 ? 0 : -1; });
    trendsContainer.classList.remove('hidden');
    suggestionsContainer.classList.add('hidden');
    focusSpy = sinon.spy(HTMLElement.prototype, 'focus');
  });

  afterEach(() => {
    focusSpy.restore();
  });

  it('renders trend links with a roving tabindex (only the first is tabbable)', () => {
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    expect(trendLinks.length).to.equal(3);
    expect(trendLinks[0].tabIndex).to.equal(0);
    expect(trendLinks[1].tabIndex).to.equal(-1);
    expect(trendLinks[2].tabIndex).to.equal(-1);
  });

  it('focuses the first trend link on ArrowDown from the search bar', () => {
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(focusSpy.getCalls().some((call) => call.thisValue === trendLinks[0])).to.be.true;
  });

  it('focuses a suggestion (not a trend link) on ArrowDown when suggestions are visible', () => {
    const suggestionsList = marqueeBlock.querySelector('.suggestions-list');
    const suggestionLi = document.createElement('li');
    suggestionLi.tabIndex = -1;
    suggestionsList.appendChild(suggestionLi);
    trendsContainer.classList.add('hidden');
    suggestionsContainer.classList.remove('hidden');

    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

    expect(focusSpy.getCalls().some((call) => call.thisValue === suggestionLi)).to.be.true;
    suggestionLi.remove();
  });

  it('moves focus to the next trend link on ArrowDown and applies roving tabindex', () => {
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

    expect(focusSpy.getCalls().some((call) => call.thisValue === trendLinks[1])).to.be.true;
    expect(trendLinks[0].tabIndex).to.equal(-1);
    expect(trendLinks[1].tabIndex).to.equal(0);
  });

  it('moves focus to the previous trend link on ArrowUp', () => {
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    trendLinks[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(focusSpy.getCalls().some((call) => call.thisValue === trendLinks[0])).to.be.true;
  });

  it('returns focus to the search bar on ArrowUp from the first trend link', () => {
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(focusSpy.getCalls().some((call) => call.thisValue === searchInput)).to.be.true;
  });

  it('does not move focus past the last trend link on ArrowDown', () => {
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    const lastTrendLink = trendLinks[trendLinks.length - 1];
    lastTrendLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(focusSpy.called).to.be.false;
  });

  it('closes the dropdown and focuses the search bar on Escape from a trend link', () => {
    const dropdown = marqueeBlock.querySelector('.search-dropdown-container');
    const trendLinks = marqueeBlock.querySelectorAll('.trend-link');
    dropdown.classList.remove('hidden');

    trendLinks[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    expect(dropdown.classList.contains('hidden')).to.be.true;
    expect(focusSpy.getCalls().some((call) => call.thisValue === searchInput)).to.be.true;
  });
});
