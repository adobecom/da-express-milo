import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

window.isTestEnv = true;

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];

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
