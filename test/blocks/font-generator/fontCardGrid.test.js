import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const [
  { setState, initFonts },
  { default: createFontCardGrid },
  { transformText },
  { INITIAL_VISIBLE_COUNT, LOAD_MORE_STEP },
] = await Promise.all([
  import('../../../express/code/blocks/font-generator/state.js'),
  import('../../../express/code/blocks/font-generator/fontCardGrid.js'),
  import('../../../express/code/blocks/font-generator/unicodeEngine.js'),
  import('../../../express/code/blocks/font-generator/types.js'),
]);

// Even indices bold, odd italic — lets us assert category filtering counts.
function makeFonts(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `f${i}`,
    styleName: `Style ${i}`,
    category: i % 2 ? 'italic' : 'bold',
    map: {},
  }));
}

describe('font-generator/fontCardGrid', () => {
  afterEach(() => {
    initFonts([]);
    sinon.restore();
  });

  function mount(fonts, extra = {}) {
    initFonts(fonts);
    setState({
      activeFilters: [], previewText: 'Hi', fontSize: 20, layout: 'grid',
    });
    return createFontCardGrid({ fonts, cardCta: null, ...extra });
  }

  it('renders a grid container with role=list', () => {
    const { container, unsubscribe } = mount(makeFonts(3));
    const grid = container.querySelector('.font-card-grid');
    expect(grid).to.exist;
    expect(grid.getAttribute('role')).to.equal('list');
    unsubscribe();
  });

  it('renders one listitem card per visible font', () => {
    const { container, unsubscribe } = mount(makeFonts(5));
    const cards = container.querySelectorAll('.font-card');
    expect(cards.length).to.equal(5);
    cards.forEach((c) => expect(c.getAttribute('role')).to.equal('listitem'));
    unsubscribe();
  });

  it('caps rendered cards at the initial visible count', () => {
    const { container, unsubscribe } = mount(makeFonts(INITIAL_VISIBLE_COUNT + 5));
    expect(container.querySelectorAll('.font-card').length).to.equal(INITIAL_VISIBLE_COUNT);
    unsubscribe();
  });

  it('hides load-more when everything fits on the first page', () => {
    const { container, unsubscribe } = mount(makeFonts(3));
    expect(container.querySelector('.font-card-load-more').hidden).to.be.true;
    unsubscribe();
  });

  it('shows load-more when there are more fonts than the visible count', () => {
    const { container, unsubscribe } = mount(makeFonts(INITIAL_VISIBLE_COUNT + 1));
    expect(container.querySelector('.font-card-load-more').hidden).to.be.false;
    unsubscribe();
  });

  it('load-more reveals the next page of cards', () => {
    const { container, unsubscribe } = mount(makeFonts(INITIAL_VISIBLE_COUNT + LOAD_MORE_STEP));
    container.querySelector('.font-card-load-more').click();
    expect(container.querySelectorAll('.font-card').length).to.equal(INITIAL_VISIBLE_COUNT + LOAD_MORE_STEP);
    unsubscribe();
  });

  it('labels the load-more button from strings', () => {
    const { container, unsubscribe } = mount(makeFonts(2), { strings: { loadMore: 'More!' } });
    expect(container.querySelector('.load-more-text').textContent).to.equal('More!');
    unsubscribe();
  });

  it('filters the visible cards to the active category', () => {
    const { container, unsubscribe } = mount(makeFonts(6)); // 3 bold, 3 italic
    setState({ activeFilters: ['bold'] });
    expect(container.querySelectorAll('.font-card').length).to.equal(3);
    unsubscribe();
  });

  it('toggles list layout via the is-list class', () => {
    const { container, unsubscribe } = mount(makeFonts(2));
    const grid = container.querySelector('.font-card-grid');
    setState({ layout: 'list' });
    expect(grid.classList.contains('is-list')).to.be.true;
    setState({ layout: 'grid' });
    expect(grid.classList.contains('is-list')).to.be.false;
    unsubscribe();
  });

  it('propagates text and size updates to the visible cards', () => {
    const fonts = makeFonts(2);
    const { container, unsubscribe } = mount(fonts);
    setState({ previewText: 'Updated', fontSize: 44 });
    const preview = container.querySelector('.font-card-preview');
    expect(preview.textContent).to.equal(transformText('Updated', fonts[0]));
    expect(preview.style.fontSize).to.equal('44px');
    unsubscribe();
  });

  it('stops updating after unsubscribe', () => {
    const { unsubscribe } = mount(makeFonts(2));
    unsubscribe();
    expect(() => setState({ layout: 'list' })).to.not.throw();
  });
});
