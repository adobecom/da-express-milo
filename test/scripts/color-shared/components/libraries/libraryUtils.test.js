import { expect } from '@esm-bundle/chai';

import {
  formatSavedCount,
  formatLibraryCounts,
  getSizeClass,
  libraryGradientToBackgroundImage,
} from '../../../../../express/code/scripts/color-shared/components/libraries/libraryUtils.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

const strings = createColorLibrariesPlaceholders();

describe('formatSavedCount', () => {
  it('uses singular template for count of 1', () => {
    expect(formatSavedCount(1, strings)).to.equal('1 saved library');
  });

  it('uses plural template for count other than 1', () => {
    expect(formatSavedCount(3, strings)).to.equal('3 saved libraries');
    expect(formatSavedCount(0, strings)).to.equal('0 saved libraries');
  });

  it('treats non-finite counts as 0', () => {
    expect(formatSavedCount(NaN, strings)).to.equal('0 saved libraries');
  });
});

describe('formatLibraryCounts', () => {
  it('interpolates singular theme and gradient labels', () => {
    const label = formatLibraryCounts({ themeCount: 1, gradientCount: 1 }, strings);
    expect(label).to.equal('1 theme, 1 gradient');
  });

  it('interpolates plural theme and gradient labels', () => {
    const label = formatLibraryCounts({ themeCount: 2, gradientCount: 3 }, strings);
    expect(label).to.equal('2 themes, 3 gradients');
  });

  it('supports themes/gradients alias keys', () => {
    const label = formatLibraryCounts({ themes: 1, gradients: 2 }, strings);
    expect(label).to.equal('1 theme, 2 gradients');
  });
});

describe('getSizeClass', () => {
  it('maps m and s to m-s', () => {
    expect(getSizeClass('m')).to.equal('m-s');
    expect(getSizeClass('s')).to.equal('m-s');
  });

  it('maps l and unknown sizes to l', () => {
    expect(getSizeClass('l')).to.equal('l');
    expect(getSizeClass('xl')).to.equal('l');
  });
});

describe('libraryGradientToBackgroundImage', () => {
  it('builds CSS from CC Library color stops', () => {
    const css = libraryGradientToBackgroundImage({
      angle: 90,
      colorStops: [
        {
          color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }],
          offset: 0,
        },
        {
          color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }],
          offset: 1,
        },
      ],
    });

    expect(css).to.equal('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)');
  });
});
