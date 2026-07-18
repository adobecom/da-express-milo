import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { waitFor } from '../../helpers/waitfor.js';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({});
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/font-generator/font-generator.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('font-generator', () => {
  let block;

  before(async () => {
    // Stub Typekit so loadWebFonts() resolves without loading the real
    // use.typekit.net script (disallowed in unit tests).
    window.Typekit = { load: ({ active }) => active?.() };
    block = document.querySelector('.font-generator');
    // decorate() shows the skeleton synchronously and hydrates in the
    // background (see font-generator.js) — it does not return a promise
    // callers can await, so wait for the skeleton to be swapped for the
    // real content instead.
    decorate(block);
    await waitFor(() => !block.querySelector('.fg-sk'));
  });

  after(() => {
    delete window.Typekit;
  });

  it('exports decorate as a function', () => {
    expect(typeof decorate).to.equal('function');
  });

  it('clears the original authored content', () => {
    expect(block.textContent).to.not.contain('Authored content to be cleared');
  });

  it('appends a section.fg-container', () => {
    const container = block.querySelector('.fg-container');
    expect(container).to.exist;
    expect(container.tagName.toLowerCase()).to.equal('section');
  });

  it('fg-container holds the sidebar and main columns', () => {
    expect(block.querySelector('.fg-container .fg-sidebar')).to.exist;
    expect(block.querySelector('.fg-container .fg-main')).to.exist;
  });

  it('sidebar contains the preview text input and the filters', () => {
    expect(block.querySelector('.fg-sidebar .font-generator-text-input')).to.exist;
    expect(block.querySelector('.fg-sidebar .fg-filters')).to.exist;
  });

  it('renders preview suggestion pills from the resolved copy', () => {
    expect(block.querySelectorAll('.fg-sidebar .tag-pills').length).to.be.greaterThan(0);
  });

  it('splits suggestions on ";" rather than "," so a suggestion may itself contain a comma', async () => {
    const { DEFAULT_PLACEHOLDERS } = await import('../../../express/code/blocks/font-generator/placeholders.js');
    const expected = DEFAULT_PLACEHOLDERS.suggestions.split(';').map((s) => s.trim()).filter(Boolean);
    const pills = [...block.querySelectorAll('.fg-sidebar .tag-pills .div')].map((el) => el.textContent);
    expect(pills).to.deep.equal(expected);
    // The last default suggestion contains a comma — confirms it survived
    // as one pill instead of being split into two.
    expect(pills[pills.length - 1]).to.contain(',');
  });

  it('main contains the toolbar and the card grid', () => {
    expect(block.querySelector('.fg-main .font-generator-toolbar')).to.exist;
    expect(block.querySelector('.fg-main .font-card-grid')).to.exist;
  });

  it('renders a font card for the loaded styles', () => {
    expect(block.querySelectorAll('.font-card').length).to.be.greaterThan(0);
  });

  it('mounts the mobile/tablet filter panel overlay', () => {
    expect(block.querySelector('.fg-overlay .fg-panel')).to.exist;
  });
});
