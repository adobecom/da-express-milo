/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createPaletteSwatchesModalContent, getPaletteColors } from '../../../../express/code/scripts/color-shared/modal/createPaletteModalContent.js';
import { setPreferredColorMode } from '../../../../express/code/scripts/color-shared/utils/colorModePreference.js';

const palette = { id: '1', name: 'Jolly rancher palette', colors: ['#FF0000', '#00FF00', '#0000FF'] };

describe('createPaletteSwatchesModalContent', () => {
  let content;

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
    content?.destroy?.();
    content = null;
    setPreferredColorMode('HEX');
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('renders a color-modes header above the swatch rail', () => {
    content = createPaletteSwatchesModalContent(palette);
    const header = content.element.querySelector('.modal-color-modes-header');
    const railSection = content.element.querySelector('.modal-palette-container--color-rail');
    expect(header).to.exist;
    expect(railSection).to.exist;
    // eslint-disable-next-line no-bitwise
    expect(header.compareDocumentPosition(railSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      .to.be.above(0);
  });

  it('initializes the rail with the persisted preferred color mode', () => {
    setPreferredColorMode('RGB');
    content = createPaletteSwatchesModalContent(palette);
    const rail = content.element.querySelector('color-swatch-rail');
    expect(rail.colorMode).to.equal('RGB');
  });

  it('propagates color-mode picker selections to the swatch rail', async () => {
    content = createPaletteSwatchesModalContent(palette);
    document.body.appendChild(content.element);
    await content.waitForColorModesReady();

    const picker = content.element.querySelector('.modal-color-mode-picker sp-picker');
    picker.value = 'Lab';
    picker.dispatchEvent(new Event('change'));

    const rail = content.element.querySelector('color-swatch-rail');
    expect(rail.colorMode).to.equal('Lab');
  });

  it('destroy() does not throw and tears down the color-modes header', () => {
    content = createPaletteSwatchesModalContent(palette);
    expect(() => content.destroy()).to.not.throw();
  });

  it('renders a hidden condensed palette-summary strip above the rail', () => {
    content = createPaletteSwatchesModalContent(palette);
    const strip = content.element.querySelector('.modal-palette-summary-strip');
    const railSection = content.element.querySelector('.modal-palette-container--color-rail');
    expect(strip).to.exist;
    expect(strip.getAttribute('aria-hidden')).to.equal('true');
    expect(strip.querySelectorAll('.ax-swatch')).to.have.length(3);
    // eslint-disable-next-line no-bitwise
    expect(strip.compareDocumentPosition(railSection) & Node.DOCUMENT_POSITION_FOLLOWING)
      .to.be.above(0);
  });
});

describe('getPaletteColors', () => {
  it('normalizes bare hex strings by adding a leading #', () => {
    expect(getPaletteColors({ colors: ['FF0000', '#00FF00'] })).to.deep.equal(['#FF0000', '#00FF00']);
  });

  it('falls back to colorStops when colors is absent', () => {
    expect(getPaletteColors({ colorStops: [{ color: '#111111' }, { color: '222222' }] }))
      .to.deep.equal(['#111111', '#222222']);
  });
});
