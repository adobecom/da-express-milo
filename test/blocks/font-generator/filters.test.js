import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const [
  { getState, setState, initFonts },
  { default: initFilters, createFontsIcon, buildPromo },
] = await Promise.all([
  import('../../../express/code/blocks/font-generator/state.js'),
  import('../../../express/code/blocks/font-generator/filters.js'),
]);

const MOCK_FONTS = [
  { name: 'Bold', category: 'bold', map: {} },
  { name: 'Italic', category: 'italic', map: {} },
  { name: 'Bold Italic', category: 'bold', map: {} },
  { name: 'Strikethrough', category: 'strikethrough', map: {} },
];
// unique categories: bold, italic, strikethrough
const UNIQUE_CATEGORIES = ['bold', 'italic', 'strikethrough'];

initFonts(MOCK_FONTS);

describe('filters / createFontsIcon', () => {
  it('returns an SVG element', () => {
    expect(createFontsIcon().tagName.toLowerCase()).to.equal('svg');
  });

  it('has aria-hidden="true"', () => {
    expect(createFontsIcon().getAttribute('aria-hidden')).to.equal('true');
  });

  it('returns a new element on each call', () => {
    expect(createFontsIcon()).to.not.equal(createFontsIcon());
  });
});

describe('filters / buildPromo', () => {
  it('returns a .fg-promo element', () => {
    expect(buildPromo('button primary medium fg-promo-btn').classList.contains('fg-promo')).to.be.true;
  });

  it('applies btnClass verbatim to the link', () => {
    const cls = 'button primary medium fg-promo-btn';
    expect(buildPromo(cls).querySelector('a').className).to.equal(cls);
  });

  it('link points to fonts.adobe.com', () => {
    expect(buildPromo('button primary medium fg-promo-btn').querySelector('a').href).to.include('fonts.adobe.com');
  });

  it('link opens in a new tab with noopener', () => {
    const link = buildPromo('button primary small fg-promo-btn').querySelector('a');
    expect(link.target).to.equal('_blank');
    expect(link.rel).to.include('noopener');
  });

  it('contains a .fg-promo-icon svg', () => {
    const icon = buildPromo('button primary medium fg-promo-btn').querySelector('.fg-promo-icon');
    expect(icon).to.exist;
    expect(icon.tagName.toLowerCase()).to.equal('svg');
  });

  it('medium and small classes produce different link classes', () => {
    const medium = buildPromo('button primary medium fg-promo-btn').querySelector('a');
    const small = buildPromo('button primary small fg-promo-btn').querySelector('a');
    expect(medium.className).to.not.equal(small.className);
  });
});

describe('filters / init', () => {
  let container;

  beforeEach(() => {
    setState({ activeFilters: [], previewText: '', layout: 'grid', fontSize: 48 });
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    sinon.restore();
  });

  // ── Guard cases ───────────────────────────────────────────────────

  it('returns a callable no-op when passed an empty array', async () => {
    const cleanup = await initFilters([]);
    expect(() => cleanup()).to.not.throw();
  });

  it('returns a callable no-op when passed null', async () => {
    const cleanup = await initFilters(null);
    expect(() => cleanup()).to.not.throw();
  });

  // ── DOM structure ─────────────────────────────────────────────────

  it('appends a promo banner when showCTA is true (default)', async () => {
    await initFilters([container]);
    expect(container.querySelector('.fg-promo')).to.exist;
  });

  it('does not append a promo banner when showCTA is false', async () => {
    await initFilters([container], { showCTA: false });
    expect(container.querySelector('.fg-promo')).to.not.exist;
  });

  it('renders an "All" filter button with data-category=""', async () => {
    await initFilters([container]);
    expect(container.querySelector('.fg-filter-btn[data-category=""]')).to.exist;
  });

  it('renders one button per unique category plus "All"', async () => {
    await initFilters([container]);
    const btns = container.querySelectorAll('.fg-filter-btn');
    expect(btns.length).to.equal(UNIQUE_CATEGORIES.length + 1);
  });

  // ── Initial tabindex / aria state ─────────────────────────────────

  it('"All" button is selected and tabbable when no filters are active', async () => {
    await initFilters([container]);
    const allBtn = container.querySelector('.fg-filter-btn[data-category=""]');
    expect(allBtn.classList.contains('is-selected')).to.be.true;
    expect(allBtn.getAttribute('aria-pressed')).to.equal('true');
    expect(allBtn.getAttribute('tabindex')).to.equal('0');
  });

  it('non-All buttons start with tabindex="-1"', async () => {
    await initFilters([container]);
    const others = [...container.querySelectorAll('.fg-filter-btn:not([data-category=""])')];
    expect(others.length).to.be.greaterThan(0);
    others.forEach((btn) => expect(btn.getAttribute('tabindex')).to.equal('-1'));
  });

  it('reflects a pre-existing active filter on init', async () => {
    setState({ activeFilters: ['bold'] });
    await initFilters([container]);
    const boldBtn = container.querySelector('.fg-filter-btn[data-category="bold"]');
    expect(boldBtn.classList.contains('is-selected')).to.be.true;
    expect(boldBtn.getAttribute('tabindex')).to.equal('0');
    expect(container.querySelector('.fg-filter-btn[data-category=""]').getAttribute('tabindex')).to.equal('-1');
  });

  // ── Click interactions / state ────────────────────────────────────

  it('clicking a category button sets it as the active filter', async () => {
    await initFilters([container]);
    container.querySelector('.fg-filter-btn[data-category="bold"]').click();
    expect(getState().activeFilters).to.deep.equal(['bold']);
  });

  it('clicking an already-selected category clears activeFilters', async () => {
    await initFilters([container]);
    const catBtn = container.querySelector('.fg-filter-btn[data-category="bold"]');
    catBtn.click();
    catBtn.click();
    expect(getState().activeFilters).to.deep.equal([]);
  });

  it('clicking "All" clears activeFilters', async () => {
    setState({ activeFilters: ['bold'] });
    await initFilters([container]);
    container.querySelector('.fg-filter-btn[data-category=""]').click();
    expect(getState().activeFilters).to.deep.equal([]);
  });

  it('calls onSelect when a filter button is clicked', async () => {
    const onSelect = sinon.spy();
    await initFilters([container], { showCTA: false, onSelect });
    container.querySelector('.fg-filter-btn[data-category=""]').click();
    expect(onSelect.calledOnce).to.be.true;
  });

  it('calls onSelect when a category button is clicked', async () => {
    const onSelect = sinon.spy();
    await initFilters([container], { showCTA: false, onSelect });
    container.querySelector('.fg-filter-btn[data-category="bold"]').click();
    expect(onSelect.calledOnce).to.be.true;
  });

  // ── Tabindex sync after click ─────────────────────────────────────

  it('selected category button becomes tabbable, All loses tabindex', async () => {
    await initFilters([container]);
    container.querySelector('.fg-filter-btn[data-category="bold"]').click();
    expect(container.querySelector('.fg-filter-btn[data-category="bold"]').getAttribute('tabindex')).to.equal('0');
    expect(container.querySelector('.fg-filter-btn[data-category=""]').getAttribute('tabindex')).to.equal('-1');
  });

  it('clearing a filter restores "All" as tabbable', async () => {
    await initFilters([container]);
    const catBtn = container.querySelector('.fg-filter-btn[data-category="bold"]');
    catBtn.click();
    catBtn.click();
    expect(container.querySelector('.fg-filter-btn[data-category=""]').getAttribute('tabindex')).to.equal('0');
    expect(catBtn.getAttribute('tabindex')).to.equal('-1');
  });

  // ── Arrow key navigation ──────────────────────────────────────────

  it('ArrowRight moves tabindex to the next button', async () => {
    await initFilters([container]);
    const filterList = container.querySelector('.fg-filter-list');
    const btns = [...filterList.querySelectorAll('.fg-filter-btn')];
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(btns[1].getAttribute('tabindex')).to.equal('0');
    expect(btns[0].getAttribute('tabindex')).to.equal('-1');
  });

  it('ArrowRight wraps from the last button to the first', async () => {
    await initFilters([container]);
    const filterList = container.querySelector('.fg-filter-list');
    const btns = [...filterList.querySelectorAll('.fg-filter-btn')];
    const last = btns[btns.length - 1];
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(btns[0].getAttribute('tabindex')).to.equal('0');
    expect(last.getAttribute('tabindex')).to.equal('-1');
  });

  it('ArrowLeft wraps from the first button to the last', async () => {
    await initFilters([container]);
    const filterList = container.querySelector('.fg-filter-list');
    const btns = [...filterList.querySelectorAll('.fg-filter-btn')];
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(btns[btns.length - 1].getAttribute('tabindex')).to.equal('0');
    expect(btns[0].getAttribute('tabindex')).to.equal('-1');
  });

  it('ArrowDown behaves the same as ArrowRight', async () => {
    await initFilters([container]);
    const filterList = container.querySelector('.fg-filter-list');
    const btns = [...filterList.querySelectorAll('.fg-filter-btn')];
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(btns[1].getAttribute('tabindex')).to.equal('0');
  });

  it('non-arrow keys leave tabindex unchanged', async () => {
    await initFilters([container]);
    const filterList = container.querySelector('.fg-filter-list');
    const btns = [...filterList.querySelectorAll('.fg-filter-btn')];
    btns[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(btns[0].getAttribute('tabindex')).to.equal('0');
    btns.slice(1).forEach((btn) => expect(btn.getAttribute('tabindex')).to.equal('-1'));
  });

  // ── Cleanup ───────────────────────────────────────────────────────

  it('cleanup function does not throw', async () => {
    const cleanup = await initFilters([container]);
    expect(() => cleanup()).to.not.throw();
  });

  it('cleanup unsubscribes from state — subsequent setState calls do not throw', async () => {
    const cleanup = await initFilters([container]);
    cleanup();
    expect(() => setState({ activeFilters: ['bold'] })).to.not.throw();
  });
});
