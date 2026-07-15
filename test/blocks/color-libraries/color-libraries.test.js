/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const imports = await Promise.all([
  import('../../../express/code/blocks/color-libraries/color-libraries.js'),
  import('../../../express/code/libs/services/index.js'),
]);
const { default: decorate } = imports[0];
const { serviceManager } = imports[1];

// Raw CC-library element shapes, matching what the provider returns (see
// createLibrariesDataService.test.js). The block runs these through the real
// parser, so `swatches`/`tags` end up on the parsed model the search filters on.
function themeElement(id, name, colors, tags = []) {
  return {
    id,
    name,
    type: 'colortheme',
    representations: [{ 'colortheme#data': { swatches: colors, tags } }],
  };
}

// API order is [Neutrals, Brand Colors] so a name sort visibly reorders them.
const RAW_LIBRARIES = [
  { library_urn: 'urn:lib:neutrals', name: 'Neutrals' },
  { library_urn: 'urn:lib:brand', name: 'Brand Colors' },
];

const ELEMENTS_BY_ID = {
  'urn:lib:neutrals': [
    themeElement('theme-gray', 'Grayscale', ['#888888'], ['gray', 'muted']),
  ],
  'urn:lib:brand': [
    themeElement('theme-ocean', 'Ocean Blue', ['#0000FF'], ['sea', 'water']),
    themeElement('theme-sunset', 'Sunset Warm', ['#FF8800'], ['warm']),
  ],
};

describe('Color Libraries — search (signed-in)', () => {
  let block;

  const nextTask = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  // runSearch adds `is-loading` synchronously, then removes it once the async
  // render settles. Poll until it clears so assertions see the final view.
  async function settle() {
    for (let i = 0; i < 100; i += 1) {
      if (!block.classList.contains('is-loading')) return;
      // eslint-disable-next-line no-await-in-loop
      await nextTask();
    }
  }

  async function submitSearch(query, searchType) {
    document.dispatchEvent(new CustomEvent('floating-search:submit', {
      detail: { query, searchType },
      bubbles: true,
    }));
    await settle();
  }

  const accordions = () => [...block.querySelectorAll('.ax-lib-accordion')];
  const accordionNames = () => accordions().map(
    (el) => el.querySelector('.ax-lib-accordion-name')?.textContent,
  );
  const librariesEl = () => block.querySelector('.ax-libraries');

  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(async () => {
    // The block gates on ensureIms(), which resolves window.adobeIMS immediately
    // when it exists, so this satisfies the sign-in check without real auth.
    window.adobeIMS = { isSignedInUser: () => true };

    sinon.stub(serviceManager, 'init').resolves();
    sinon.stub(serviceManager, 'getProvider').resolves({
      fetchUserLibraries: sinon.stub().resolves({ libraries: RAW_LIBRARIES }),
      fetchLibraryElements: sinon.stub().callsFake(
        async (id) => ({ elements: ELEMENTS_BY_ID[id] || [] }),
      ),
    });

    block = document.createElement('div');
    block.className = 'color-libraries';
    document.body.appendChild(block);
    await decorate(block);
  });

  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
    document.body.innerHTML = '';
    // Drop any ?q= a search left behind so it doesn't deep-link the next test.
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('renders the library view with all libraries for a signed-in user', () => {
    expect(librariesEl()).to.exist;
    expect(librariesEl().classList.contains('ax-libraries--view-library')).to.be.true;
    expect(accordions()).to.have.lengthOf(2);
  });

  it('shows the total saved-library count in the header', () => {
    expect(block.querySelector('.ax-lib-header__count').textContent)
      .to.equal('2 saved libraries');
  });

  it('term search on a library name keeps only that library', async () => {
    await submitSearch('brand', 'term');

    expect(librariesEl().classList.contains('ax-libraries--view-search-result')).to.be.true;
    expect(accordionNames()).to.deep.equal(['Brand Colors']);
  });

  it('term search on an item name filters to the owning library', async () => {
    await submitSearch('ocean', 'term');

    expect(librariesEl().classList.contains('ax-libraries--view-search-result')).to.be.true;
    expect(accordionNames()).to.deep.equal(['Brand Colors']);
  });

  it('tag search matches items by tag only', async () => {
    await submitSearch('water', 'tag');

    expect(librariesEl().classList.contains('ax-libraries--view-search-result')).to.be.true;
    expect(accordionNames()).to.deep.equal(['Brand Colors']);
  });

  it('tag search does not match a library name', async () => {
    await submitSearch('brand', 'tag');

    expect(librariesEl().classList.contains('ax-libraries--view-empty')).to.be.true;
    expect(block.querySelector('.ax-lib-empty')).to.exist;
  });

  it('hex search matches items by color', async () => {
    await submitSearch('0000ff', 'hex');

    expect(librariesEl().classList.contains('ax-libraries--view-search-result')).to.be.true;
    expect(accordionNames()).to.deep.equal(['Brand Colors']);
  });

  it('hex search matches with a leading # too', async () => {
    await submitSearch('#0000ff', 'hex');

    expect(accordionNames()).to.deep.equal(['Brand Colors']);
  });

  it('shows the empty view with the query when nothing matches', async () => {
    await submitSearch('zzzzz', 'term');

    expect(librariesEl().classList.contains('ax-libraries--view-empty')).to.be.true;
    const heading = block.querySelector('.ax-lib-empty__heading');
    expect(heading).to.exist;
    expect(heading.textContent).to.include('zzzzz');
  });

  it('go-back resets the search to the full library view', async () => {
    await submitSearch('brand', 'term');
    expect(accordions()).to.have.lengthOf(1);

    block.dispatchEvent(new CustomEvent('libraries:empty-go-back', { bubbles: true }));
    await settle();

    expect(librariesEl().classList.contains('ax-libraries--view-library')).to.be.true;
    expect(accordions()).to.have.lengthOf(2);
  });

  it('go-back clears the q search param from the URL', async () => {
    window.history.replaceState({}, '', `${window.location.pathname}?q=brand`);
    await submitSearch('brand', 'term');

    block.dispatchEvent(new CustomEvent('libraries:empty-go-back', { bubbles: true }));
    await settle();

    expect(new URL(window.location.href).searchParams.has('q')).to.be.false;
  });

  // Sorting itself lives in createLibrariesComponent/createLibrariesHeader and is
  // unit-tested there; this only confirms the block wires the control through.
  it('sort control reorders the rendered libraries by name', () => {
    expect(accordionNames()).to.deep.equal(['Neutrals', 'Brand Colors']);

    const nameItem = block.querySelector('sp-menu-item[value="name"]');
    expect(nameItem).to.exist;
    nameItem.click();

    expect(accordionNames()).to.deep.equal(['Brand Colors', 'Neutrals']);
  });
});
