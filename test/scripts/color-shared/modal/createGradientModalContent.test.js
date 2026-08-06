/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createGradientModalContent } from '../../../../express/code/scripts/color-shared/modal/createGradientModalContent.js';

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

  it('exposes LESS/CSS/SASS/XML copy-as-code options in Figma order', () => {
    const main = createGradientModalContent(gradient);
    const items = [...main.querySelectorAll('.modal-codes-menu sp-menu-item')]
      .map((i) => i.getAttribute('value'));
    expect(items).to.deep.equal(['less', 'css', 'scss', 'xml']);
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

  it('prefers an explicit opts.description over gradient.description', () => {
    const main = createGradientModalContent(
      { ...gradient, description: 'From gradient object' },
      { description: 'From opts' },
    );
    expect(main.querySelector('.modal-gradient-description').textContent).to.equal('From opts');
  });
});
