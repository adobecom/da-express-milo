import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createTag, getIconElementDeprecated } from '../../../express/code/scripts/utils.js';
import createMiniEditorWidget from '../../../express/code/scripts/widgets/mini-editor-widget/mini-editor-widget.js';

const noop = () => {};
const a11y = {
  trapFocus: () => ({ release: noop }),
  handleEscapeClose: () => ({ release: noop }),
  disableBackgroundScroll: noop,
  restoreBackgroundScroll: noop,
  copyQuoteToClipboard: async () => true,
};

const fontOptions = [
  { label: 'Sans', font: '"Cal Sans", sans-serif' },
  { label: 'Serif', font: 'Georgia, serif', italic: true },
];

function buildCardSet(count = 9) {
  return Array.from({ length: count }, (_, i) => ({
    card: { id: `urn:${i}`, bg: `/img/image${i}.jpg` },
    quote: `Quote number ${i}`,
    author: i % 2 === 0 ? `Author ${i}` : '',
  }));
}

async function mount(overrides = {}) {
  const root = document.createElement('div');
  root.className = 'mini-editor';
  document.body.append(root);
  const editor = await createMiniEditorWidget({
    root,
    topActions: [],
    fontOptions,
    backgrounds: { cardSet: buildCardSet(), decoCount: 8 },
    a11y,
    deps: { createTag, getIconElementDeprecated },
    ...overrides,
  });
  root.append(editor.decorations, editor.stage);
  return { root, editor };
}

describe('mini-editor-widget', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    clock.restore();
    document.body.innerHTML = '';
  });

  it('returns the stage, decorations, and control API', async () => {
    const { editor } = await mount();
    expect(editor.stage).to.be.instanceOf(HTMLElement);
    expect(editor.decorations).to.be.instanceOf(HTMLElement);
    expect(editor.useQuote).to.be.a('function');
    expect(editor.updateCentre).to.be.a('function');
    expect(editor.getContentModel).to.be.a('function');
    expect(editor.syncViewportMode).to.be.a('function');
    expect(editor.destroy).to.be.a('function');
  });

  it('exposes a defensive snapshot of the initial edited content', async () => {
    const { editor } = await mount();
    const model = editor.getContentModel();
    expect(model).to.deep.equal({
      quote: 'Quote number 0',
      author: 'Author 0',
      backgroundUrl: '/img/image0.jpg',
      font: {
        family: fontOptions[0].font,
        style: 'normal',
        weight: 'normal',
        stretch: 'normal',
      },
    });

    model.quote = 'Changed outside';
    model.font.family = 'Changed outside';
    expect(editor.getContentModel().quote).to.equal('Quote number 0');
    expect(editor.getContentModel().font.family).to.equal(fontOptions[0].font);
  });

  it('renders the first card set entry into the main widget card', async () => {
    const { root } = await mount();
    const quote = root.querySelector('.me-quote');
    const author = root.querySelector('.me-author');
    expect(quote.textContent).to.equal('Quote number 0');
    expect(author.textContent).to.equal('Author 0');
    expect(root.style.getPropertyValue('--me-card-bg')).to.contain('/img/image0.jpg');
  });

  it('builds one decorative card per entry after the first, up to decoCount', async () => {
    const { root } = await mount();
    const decos = root.querySelectorAll('.mini-editor-decorations .me-deco');
    expect(decos.length).to.equal(8);
  });

  it('omits the author line on a decorative card when the entry has no author', async () => {
    const { root } = await mount();
    // cardSet[1] (author '') powers the first decorative card (me-deco--1).
    const deco = root.querySelector('.me-deco--1');
    expect(deco.querySelector('.me-deco-author')).to.not.exist;
  });

  it('selects the first font option on load and applies it as a CSS variable', async () => {
    const { root } = await mount();
    expect(root.style.getPropertyValue('--me-quote-font')).to.equal(fontOptions[0].font);
    const selected = root.querySelector('.me-row--fonts .me-font.is-selected');
    expect(selected.textContent).to.equal('Sans');
  });

  it('applies a picked font to the CSS variables and marks it selected', async () => {
    const { root, editor } = await mount();
    const serifBtn = Array.from(root.querySelectorAll('.me-row--fonts .me-font'))
      .find((b) => b.textContent === 'Serif');
    serifBtn.click();
    expect(root.style.getPropertyValue('--me-quote-font')).to.equal(fontOptions[1].font);
    expect(root.style.getPropertyValue('--me-quote-font-style')).to.equal('italic');
    expect(serifBtn.classList.contains('is-selected')).to.be.true;
    expect(editor.getContentModel().font).to.deep.equal({
      family: fontOptions[1].font,
      style: 'italic',
      weight: 'normal',
      stretch: 'normal',
    });
  });

  it('updates the model when a background is picked', async () => {
    const { root, editor } = await mount();
    root.querySelectorAll('.me-row--colour .me-swatch-btn')[2].click();
    expect(editor.getContentModel().backgroundUrl).to.equal('/img/image2.jpg');
  });

  it('opens the matching panel and toggles aria-expanded when a control is clicked', async () => {
    const { root } = await mount();
    const fontControl = root.querySelector('.me-control--font');
    fontControl.click();
    expect(root.getAttribute('data-me-panel')).to.equal('fonts');
    expect(fontControl.getAttribute('aria-expanded')).to.equal('true');
    fontControl.click();
    expect(root.getAttribute('data-me-panel')).to.equal('none');
    expect(fontControl.getAttribute('aria-expanded')).to.equal('false');
  });

  it('closes the open panel when clicking outside the widget', async () => {
    const { root } = await mount();
    root.querySelector('.me-control--font').click();
    expect(root.getAttribute('data-me-panel')).to.equal('fonts');
    document.body.click();
    expect(root.getAttribute('data-me-panel')).to.equal('none');
  });

  it('useQuote swaps the quote/author shown in the main widget card', async () => {
    const { root, editor } = await mount();
    editor.useQuote({ quote: 'Swapped in', author: 'Someone Else' });
    expect(root.querySelector('.me-quote').textContent).to.equal('Swapped in');
    expect(root.querySelector('.me-author').textContent).to.equal('Someone Else');
    expect(root.querySelector('.me-author').style.display).to.equal('');
    expect(editor.getContentModel()).to.include({
      quote: 'Swapped in',
      author: 'Someone Else',
    });
  });

  it('useQuote hides the author line when no author is given', async () => {
    const { root, editor } = await mount();
    editor.useQuote({ quote: 'No author here' });
    expect(root.querySelector('.me-author').style.display).to.equal('none');
  });

  it('copying the main quote shows the is-copied affordance and then clears it', async () => {
    const { root } = await mount();
    const quoteWrap = root.querySelector('.me-quote-wrap');
    quoteWrap.click();
    await clock.tickAsync(0);
    expect(quoteWrap.classList.contains('is-copied')).to.be.true;
    await clock.tickAsync(1200);
    expect(quoteWrap.classList.contains('is-copied')).to.be.false;
  });

  it('dispatching mini-editor:use-quote updates the widget', async () => {
    const { root } = await mount();
    document.dispatchEvent(new CustomEvent('mini-editor:use-quote', {
      detail: { quote: 'From collapsible-rows', author: 'Some Author' },
    }));
    expect(root.querySelector('.me-quote').textContent).to.equal('From collapsible-rows');
  });

  it('destroy removes the outside-click and use-quote listeners', async () => {
    const { root, editor } = await mount();
    editor.destroy();
    document.dispatchEvent(new CustomEvent('mini-editor:use-quote', {
      detail: { quote: 'Should not apply', author: '' },
    }));
    expect(root.querySelector('.me-quote').textContent).to.not.equal('Should not apply');
  });

  describe('arc carousel (tablet/mobile)', () => {
    it('navigating next updates the centre card and fires useQuote for the new active entry', async () => {
      const { root, editor } = await mount();
      const nextBtn = root.querySelector('.me-arc-nav--next');
      const centerBefore = root.querySelector('.me-arc-card--center .me-arc-quote').textContent;
      nextBtn.click();
      const centerAfter = root.querySelector('.me-arc-card--center .me-arc-quote').textContent;
      expect(centerAfter).to.not.equal(centerBefore);
      expect(editor.getContentModel()).to.include({
        quote: 'Quote number 1',
        author: '',
        backgroundUrl: '/img/image1.jpg',
      });
    });

    it('navigating prev then next returns to the original centre entry', async () => {
      const { root } = await mount();
      const original = root.querySelector('.me-arc-card--center .me-arc-quote').textContent;
      root.querySelector('.me-arc-nav--next').click();
      root.querySelector('.me-arc-nav--prev').click();
      expect(root.querySelector('.me-arc-card--center .me-arc-quote').textContent).to.equal(original);
    });

    it('clicking the prev-role card is equivalent to clicking the prev nav button', async () => {
      const { root } = await mount();
      const before = root.querySelector('.me-arc-card--center .me-arc-quote').textContent;
      root.querySelector('.me-arc-nav--next').click();
      const afterNext = root.querySelector('.me-arc-card--center .me-arc-quote').textContent;
      expect(afterNext).to.not.equal(before);
      // :not(.me-arc-ghost) — the outgoing ghost card is also briefly staged
      // to the --prev class while it plays its exit (see buildArcGhost), so
      // a plain .me-arc-card--prev query can match it instead of the real,
      // clickable prev card.
      root.querySelector('.me-arc-card--prev:not(.me-arc-ghost)').click();
      expect(root.querySelector('.me-arc-card--center .me-arc-quote').textContent).to.equal(before);
    });

    it('picking a font while the carousel is active re-renders all three visible cards', async () => {
      const { root } = await mount();
      const serifBtn = Array.from(root.querySelectorAll('.me-row--fonts .me-font'))
        .find((b) => b.textContent === 'Serif');
      serifBtn.click();
      const centerQuote = root.querySelector('.me-arc-card--center .me-arc-quote');
      expect(centerQuote.style.fontStyle).to.equal('italic');
    });
  });

  describe('topActions bar (edit/share/download)', () => {
    it('renders one button per supplied action, top-right of the widget, in order', async () => {
      const { root } = await mount({
        topActions: [
          { type: 'edit', onClick: () => {} },
          { type: 'share', onClick: () => {} },
          { type: 'download', onClick: () => {} },
        ],
      });
      const bar = root.querySelector('.mini-editor-widget > .me-actions');
      expect(bar).to.exist;
      const buttons = bar.querySelectorAll('.me-action');
      expect(buttons.length).to.equal(3);
      expect([...buttons].map((b) => b.className)).to.deep.equal([
        'me-action me-action--edit',
        'me-action me-action--share',
        'me-action me-action--download',
      ]);
    });

    it('renders only the types supplied', async () => {
      const { root } = await mount({ topActions: [{ type: 'share', onClick: () => {} }] });
      const bar = root.querySelector('.me-actions');
      expect(bar.querySelectorAll('.me-action').length).to.equal(1);
      expect(bar.querySelector('.me-action--share')).to.exist;
      expect(bar.querySelector('.me-action--edit')).to.not.exist;
    });

    it('invokes the matching onClick when each action button is clicked', async () => {
      const onEdit = sinon.spy();
      const onShare = sinon.spy();
      const onDownload = sinon.spy();
      const { root } = await mount({
        topActions: [
          { type: 'edit', onClick: onEdit },
          { type: 'share', onClick: onShare },
          { type: 'download', onClick: onDownload },
        ],
      });

      root.querySelector('.me-action--edit').click();
      root.querySelector('.me-action--share').click();
      root.querySelector('.me-action--download').click();

      expect(onEdit.calledOnce).to.be.true;
      expect(onShare.calledOnce).to.be.true;
      expect(onDownload.calledOnce).to.be.true;
    });

    it('renders an empty bar and does not throw when topActions is omitted', async () => {
      const { root } = await mount();
      const bar = root.querySelector('.me-actions');
      expect(bar).to.exist;
      expect(bar.querySelectorAll('.me-action').length).to.equal(0);
    });
  });

  describe('syncViewportMode', () => {
    it('adds me-carousel-mode when the viewport is at or below the tablet breakpoint', async () => {
      const { root, editor } = await mount();
      const original = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
      editor.syncViewportMode();
      expect(root.classList.contains('me-carousel-mode')).to.be.true;
      Object.defineProperty(window, 'innerWidth', { value: original, configurable: true });
      editor.syncViewportMode();
    });

    it('uses carousel mode at exactly 1200px and desktop mode above it', async () => {
      const { root, editor } = await mount();
      const original = window.innerWidth;
      const originalHeight = window.innerHeight;

      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      editor.syncViewportMode();
      expect(root.classList.contains('me-carousel-mode')).to.be.true;

      // Touch-tablet-like landscape dimensions should still switch to
      // desktop mode once width exceeds 1200.
      Object.defineProperty(window, 'innerHeight', { value: 700, configurable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1201, configurable: true });
      editor.syncViewportMode();
      expect(root.classList.contains('me-carousel-mode')).to.be.false;

      Object.defineProperty(window, 'innerWidth', { value: original, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true });
      editor.syncViewportMode();
    });

    it('removes me-carousel-mode above the tablet breakpoint on a non-touch device', async () => {
      const { root, editor } = await mount();
      const original = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
      editor.syncViewportMode();
      expect(root.classList.contains('me-carousel-mode')).to.be.false;
      Object.defineProperty(window, 'innerWidth', { value: original, configurable: true });
      editor.syncViewportMode();
    });
  });
});
