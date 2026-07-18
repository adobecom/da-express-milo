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

  describe('roving tabindex across cards', () => {
    it('makes only the first visible card a tab stop', () => {
      const { container, unsubscribe } = mount(makeFonts(3));
      const cards = container.querySelectorAll('.font-card');
      expect(cards[0].tabIndex).to.equal(0);
      expect(cards[1].tabIndex).to.equal(-1);
      expect(cards[2].tabIndex).to.equal(-1);
      unsubscribe();
    });

    it('ArrowRight moves focus and the tab stop to the next card', () => {
      const { container, unsubscribe } = mount(makeFonts(3));
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      cards[0].focus();
      cards[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(document.activeElement).to.equal(cards[1]);
      expect(cards[0].tabIndex).to.equal(-1);
      expect(cards[1].tabIndex).to.equal(0);
      container.remove();
      unsubscribe();
    });

    it('ArrowLeft from the first card does not move past the start', () => {
      const { container, unsubscribe } = mount(makeFonts(3));
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      cards[0].focus();
      cards[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement).to.equal(cards[0]);
      container.remove();
      unsubscribe();
    });

    it('End moves focus to the last card, Home back to the first', () => {
      const { container, unsubscribe } = mount(makeFonts(4));
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      cards[0].focus();
      cards[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).to.equal(cards[3]);
      cards[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).to.equal(cards[0]);
      container.remove();
      unsubscribe();
    });

    // Forcing list view pins the column count to 1 regardless of the test
    // browser's viewport width, so Up/Down here is equivalent to Left/Right.
    it('ArrowDown/ArrowUp move by one row', () => {
      const { container, unsubscribe } = mount(makeFonts(3));
      setState({ layout: 'list' });
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      cards[0].focus();
      cards[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).to.equal(cards[1]);
      cards[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).to.equal(cards[0]);
      container.remove();
      unsubscribe();
    });

    it('arrow keys do not act while focus is inside an entered cell', () => {
      const { container, unsubscribe } = mount(makeFonts(3));
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      const copyBtn = cards[0].querySelector('.font-card-copy-btn');
      copyBtn.focus();
      copyBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(document.activeElement).to.equal(copyBtn);
      container.remove();
      unsubscribe();
    });

    it('a direct click on a card’s copy button moves the tab stop to that card', () => {
      const { container, unsubscribe } = mount(makeFonts(3));
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      const copyBtn = cards[2].querySelector('.font-card-copy-btn');
      copyBtn.focus();
      // document.activeElement updates synchronously regardless of whether
      // this document has real OS-level focus, but the corresponding
      // focusin event does not reliably fire without it — which a
      // concurrent (multi-iframe) test run can't guarantee any single
      // document has. Dispatch it explicitly so this test exercises the
      // listener's own logic rather than depending on that environment
      // detail (a real click in a real, focused, single-tab browser always
      // fires it naturally).
      copyBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(cards[0].tabIndex).to.equal(-1);
      // card2 is "entered" — its own wrapper tabindex stays -1 while its
      // copy button (now the focused element) is the tabbable one.
      expect(cards[2].tabIndex).to.equal(-1);
      expect(copyBtn.tabIndex).to.equal(0);
      container.remove();
      unsubscribe();
    });

    it('re-clamps the tab stop when the visible set shrinks past it', () => {
      const { container, unsubscribe } = mount(makeFonts(5)); // bold at 0,2,4
      document.body.append(container);
      const cards = container.querySelectorAll('.font-card');
      cards[4].focus();
      // See the "direct click" test above — focusin needs an explicit
      // nudge in a concurrent/unfocused-document test run.
      cards[4].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      setState({ activeFilters: ['bold'] });
      const remaining = container.querySelectorAll('.font-card');
      expect(remaining.length).to.equal(3);
      expect(remaining[remaining.length - 1].tabIndex).to.equal(0);
      container.remove();
      unsubscribe();
    });
  });
});
