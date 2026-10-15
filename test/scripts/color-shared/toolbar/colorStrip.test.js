/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { createColorStrip } from '../../../../express/code/scripts/color-shared/toolbar/colorStrip.js';

const t = {
  swatchLabel: 'Color {index}: {hex}',
  swatchStripLabel: '{count} colors in {type}',
  gradientLabel: 'Gradient: {stops}',
};

describe('createColorStrip', () => {
  it('renders one .ax-swatch per color for a palette', () => {
    const strip = createColorStrip(['#FF0000', '#00FF00', '#0000FF'], 'palette', null, t);
    expect(strip.classList.contains('ax-swatch-strip')).to.equal(true);
    expect(strip.querySelectorAll('.ax-swatch')).to.have.length(3);
    expect(strip.getAttribute('aria-label')).to.equal('3 colors in palette');
  });

  it('caps swatches at 10 for very large palettes', () => {
    const colors = Array.from({ length: 15 }, (_, i) => `#${String(i).padStart(6, '0')}`);
    const strip = createColorStrip(colors, 'palette', null, t);
    expect(strip.querySelectorAll('.ax-swatch')).to.have.length(10);
  });

  it('renders a linear-gradient background strip for gradients', () => {
    const strip = createColorStrip(['#FF0000', '#0000FF'], 'gradient', 45, t);
    expect(strip.classList.contains('ax-gradient-strip')).to.equal(true);
    expect(strip.style.background).to.include('linear-gradient(45deg');
    expect(strip.getAttribute('aria-label')).to.include('#FF0000');
  });
});
