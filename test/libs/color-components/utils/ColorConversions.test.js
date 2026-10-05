import { expect } from '@esm-bundle/chai';
import { getContrastTextColor } from '../../../../express/code/libs/color-components/utils/ColorConversions.js';

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('ColorConversions.getContrastTextColor', () => {
  it('returns black on white and white on black', () => {
    expect(getContrastTextColor('#FFFFFF')).to.equal('#000000');
    expect(getContrastTextColor('#000000')).to.equal('#FFFFFF');
  });

  it('returns black for mid-tone swatches where white fails WCAG AA', () => {
    ['#22AD87', '#E0457B', '#2A9DF4', '#FF5733'].forEach((hex) => {
      expect(getContrastTextColor(hex), hex).to.equal('#000000');
    });
  });

  it('returns white for dark swatches', () => {
    ['#1B1B1B', '#3D2C8D', '#8B0000'].forEach((hex) => {
      expect(getContrastTextColor(hex), hex).to.equal('#FFFFFF');
    });
  });

  it('defaults to black for invalid input', () => {
    expect(getContrastTextColor('not-a-color')).to.equal('#000000');
  });

  it('always meets WCAG AA (4.5:1) across the gamut', () => {
    const steps = [0, 51, 102, 153, 204, 255];
    steps.forEach((r) => steps.forEach((g) => steps.forEach((b) => {
      const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
      const text = getContrastTextColor(hex);
      expect(contrast(hex, text), `${hex} on ${text}`).to.be.at.least(4.5);
    })));
  });
});
