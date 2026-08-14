/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  createGradientModalContent,
  ensureGradientModalContentStyles,
} from '../../../../express/code/scripts/color-shared/modal/createGradientModalContent.js';
import { serviceManager } from '../../../../express/code/libs/services/core/ServiceManager.js';

const gradient = {
  name: 'Sunset gradient',
  colors: ['#FF0000', '#0000FF'],
};

describe('createGradientModalContent', () => {
  beforeEach(() => {
    // requestAnimationFrame is throttled to ~1fps in background browser tabs
    // (concurrent WTR sessions). Use queueMicrotask so the color-modes header's
    // express-picker retry loops resolve immediately under load.
    sinon.stub(window, 'requestAnimationFrame').callsFake((cb) => {
      queueMicrotask(() => cb(0));
      return 0;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('renders a color-modes header above the gradient preview', () => {
    const main = createGradientModalContent(gradient);
    const header = main.querySelector('.modal-color-modes-header');
    const preview = main.querySelector('.modal-gradient-preview');
    expect(header).to.exist;
    expect(preview).to.exist;
    // eslint-disable-next-line no-bitwise
    expect(header.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING)
      .to.be.above(0);
  });

  it('exposes only "Copy as CSS" — Figma\'s gradient Codes menu omits LESS/SASS/XML, which have no gradient-aware export', () => {
    const main = createGradientModalContent(gradient);
    const items = [...main.querySelectorAll('.modal-codes-menu sp-menu-item')]
      .map((i) => i.getAttribute('value'));
    expect(items).to.deep.equal(['css']);
  });

  it('renders a swatch strip (Palette-container) below the gradient preview', () => {
    const main = createGradientModalContent(gradient);
    const preview = main.querySelector('.modal-gradient-preview');
    const railSection = main.querySelector('.modal-palette-container--color-rail');
    expect(railSection).to.exist;
    expect(railSection.querySelectorAll('color-swatch-rail')).to.have.length(1);
    // eslint-disable-next-line no-bitwise
    expect(preview.compareDocumentPosition(railSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      .to.be.above(0);
  });

  it('caps the swatch rail at 10 stops, but shows every stop in the gradient preview bar', async () => {
    const manyStopsGradient = {
      name: 'Long gradient',
      colors: Array.from({ length: 14 }, (_, i) => `#${String(i).padStart(6, '0')}`),
    };
    const main = createGradientModalContent(manyStopsGradient);
    document.body.appendChild(main);
    const rail = main.querySelector('color-swatch-rail');
    await customElements.whenDefined('color-swatch-rail');
    await rail.updateComplete;
    expect(rail.swatches).to.have.length(10);
    expect(main.querySelectorAll('.gradient-editor-handle')).to.have.length(14);
  });

  it('passes opts.verticalMaxPerRow through to the stop swatch rail (regression: the Explore gradient modal never forwarded this option, so it silently fell back to the rail\'s default of 5 instead of the site-wide 10)', () => {
    const main = createGradientModalContent(gradient, { verticalMaxPerRow: 10 });
    const rail = main.querySelector('color-swatch-rail');
    expect(rail.getAttribute('vertical-max-per-row')).to.equal('10');
  });

  it('propagates color-mode changes to the stop swatch rail', async () => {
    const main = createGradientModalContent(gradient);
    document.body.appendChild(main);
    await main.waitForColorModesReady();

    const picker = main.querySelector('.modal-color-mode-picker sp-picker');
    picker.value = 'RGB';
    picker.dispatchEvent(new Event('change'));
    expect(main.querySelector('color-swatch-rail').colorMode).to.equal('RGB');
  });

  it('renders the description when the gradient has one', () => {
    const main = createGradientModalContent({ ...gradient, description: 'A bold sunset blend.' });
    const description = main.querySelector('.modal-gradient-description');
    expect(description).to.exist;
    expect(description.textContent).to.equal('A bold sunset blend.');
  });

  it('omits the description section entirely when there is no description', () => {
    const main = createGradientModalContent(gradient);
    expect(main.querySelector('.modal-gradient-description')).to.equal(null);
  });

  it('does not render a tags list (tags replaced by description)', () => {
    const main = createGradientModalContent({ ...gradient, description: 'Has a description' });
    expect(main.querySelector('.modal-tags-container')).to.equal(null);
    expect(main.querySelector('.modal-tag')).to.equal(null);
  });

  it('falls back to a letter-initial avatar (not a placeholder image) when there is no creator image — same as createPaletteModalContent.js', () => {
    const main = createGradientModalContent({ ...gradient, creator: { name: 'zooey' } });
    expect(main.querySelector('.modal-thumbnail img')).to.equal(null);
    const initial = main.querySelector('.modal-thumbnail .thumbnail-initial');
    expect(initial).to.exist;
    expect(initial.textContent).to.equal('Z');
  });

  it('renders a real creator image when one is available, instead of the initial avatar', () => {
    const main = createGradientModalContent({
      ...gradient,
      creator: { name: 'zooey', imageUrl: 'https://example.com/zooey.jpg' },
    });
    expect(main.querySelector('.modal-thumbnail .thumbnail-initial')).to.equal(null);
    const img = main.querySelector('.modal-thumbnail img.thumbnail-image');
    expect(img).to.exist;
    expect(img.getAttribute('src')).to.equal('https://example.com/zooey.jpg');
  });

  it('stretches the swatch rail to fill the desktop rail-wrap height, even in HEX mode', async function test() {
    if (window.innerWidth < 1200) this.skip(); // the fixed-height rail is min-width:1200px-scoped
    // Regression test: modal-gradient-content.css never gave .modal-color-rail-wrap
    // a flex context of its own, unlike modal-palette-content.css's rail (which
    // explicitly stretches sp-theme/color-swatch-rail via flex:1 1 0 + height:100%).
    // The rail "worked" in RGB/HSB/Lab modes only because their multi-channel rows
    // are naturally tall enough to reach the wrap's fixed height on content size
    // alone — HEX mode's single hex-code row is much shorter, so without an
    // explicit stretch rule the rail collapsed to ~56px instead of filling the box.
    await ensureGradientModalContentStyles();
    const wrapper = document.createElement('div');
    wrapper.className = 'ax-color-modal-content';
    const main = createGradientModalContent(gradient);
    wrapper.appendChild(main);
    document.body.appendChild(wrapper);
    const wrap = wrapper.querySelector('.modal-color-rail-wrap');
    const rail = wrapper.querySelector('color-swatch-rail');
    await customElements.whenDefined('color-swatch-rail');
    await rail.updateComplete;
    const wrapHeight = wrap.getBoundingClientRect().height;
    expect(wrapHeight).to.equal(158);
    expect(rail.getBoundingClientRect().height).to.equal(wrapHeight);
    wrapper.remove();
  });

  it('right-aligns the creator thumbnail — same as the palette modal — even with no description sibling to space against', async function test() {
    if (window.innerWidth < 600) this.skip(); // the alignment CSS is min-width:600px-scoped
    // Regression test: the palette modal's thumb-tags row is always [thumbnail,
    // tags] — tags default to ['Color', 'Palette'] even when empty, so
    // order:1 + justify-content:space-between reliably pushes the thumbnail
    // right. The gradient modal's row is [thumbnail, description?], and a
    // description is almost never present (real API descriptions are
    // essentially always empty), leaving the thumbnail as the sole flex
    // child — where order has nothing to reorder against. Only
    // margin-left: auto pushes it right unconditionally.
    await ensureGradientModalContentStyles();
    const wrapper = document.createElement('div');
    wrapper.className = 'ax-color-modal-content';
    const main = createGradientModalContent(gradient, { creator: { name: 'zooey' } });
    wrapper.appendChild(main);
    document.body.appendChild(wrapper);
    const thumbTags = wrapper.querySelector('.modal-palette-thumb-tags');
    const thumb = wrapper.querySelector('.modal-thumbnail-container');
    expect(thumbTags.children).to.have.length(1); // no description → sole flex child
    const containerRect = thumbTags.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    expect(thumbRect.right).to.be.closeTo(containerRect.right, 1);
    wrapper.remove();
  });

  it('prefers an explicit opts.description over gradient.description', () => {
    const main = createGradientModalContent(
      { ...gradient, description: 'From gradient object' },
      { description: 'From opts' },
    );
    expect(main.querySelector('.modal-gradient-description').textContent).to.equal('From opts');
  });

  it('passes each stop\'s real offset to Copy as CSS — not an evenly-spaced index (regression: the modal used to build the toolbar/codes palette from flat colors only, dropping colorStops\' real positions so every gradient exported as if its stops were spaced evenly)', async () => {
    const exportCSS = sinon.stub().resolves({ format: 'CSS', output: '', clipboardSuccess: true });
    sinon.stub(serviceManager, 'getProvider').resolves({ exportCSS });

    const main = createGradientModalContent({
      name: 'Naamloos-1(5)',
      colorStops: [
        { color: '#FFFFFF', position: 0 },
        { color: '#406B0F', position: 0.2 },
        { color: '#000000', position: 1 },
      ],
    });
    document.body.appendChild(main);
    await main.waitForColorModesReady();

    main.querySelector('.modal-codes-menu sp-action-button').click();
    const cssItem = [...main.querySelectorAll('.modal-codes-menu sp-menu-item')]
      .find((i) => i.getAttribute('value') === 'css');
    cssItem.click();
    await new Promise((r) => { setTimeout(r, 0); });

    expect(exportCSS.calledOnce).to.equal(true);
    expect(exportCSS.firstCall.args[0].swatches[1].offset).to.equal(0.2);
  });
});
