import { expect } from '@esm-bundle/chai';

import {
  libraryGradientStopToSwatch,
  libraryGradientToDownloadData,
  libraryItemToDownloadData,
  libraryThemeToDownloadData,
} from '../../../../../express/code/scripts/color-shared/components/libraries/libraryDownloadUtils.js';

describe('libraryThemeToDownloadData', () => {
  it('maps theme colors to download swatches', () => {
    const data = libraryThemeToDownloadData({
      name: 'Ocean',
      colors: ['#FF0000', '#00FF00'],
    });

    expect(data.name).to.equal('Ocean');
    expect(data.colorMode).to.equal('rgb');
    expect(data.swatches).to.have.lengthOf(2);
    expect(data.swatches[0].rgb).to.deep.equal({ r: 1, g: 0, b: 0 });
    expect(data.swatches[1].rgb).to.deep.equal({ r: 0, g: 1, b: 0 });
  });
});

describe('libraryGradientStopToSwatch', () => {
  it('maps CC Library RGB stop shape to normalized swatch', () => {
    const swatch = libraryGradientStopToSwatch({
      color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }],
      offset: 0,
      midpoint: 0.5,
    }, 0, 2);

    expect(swatch.rgb).to.deep.equal({ r: 1, g: 0, b: 0 });
    expect(swatch.offset).to.equal(0);
    expect(swatch.midpoint).to.equal(0.5);
  });

  it('falls back to even offsets when offset is missing', () => {
    const swatch = libraryGradientStopToSwatch({
      color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }],
    }, 1, 3);

    expect(swatch.offset).to.equal(0.5);
    expect(swatch.rgb.b).to.equal(1);
  });
});

describe('libraryGradientToDownloadData', () => {
  it('builds gradient ThemeData with assetType gradient', () => {
    const data = libraryGradientToDownloadData({
      name: 'Sunset',
      colorStops: [
        {
          color: [{ mode: 'RGB', value: { r: 255, g: 128, b: 0 } }],
          offset: 0,
        },
        {
          color: [{ mode: 'RGB', value: { r: 128, g: 0, b: 255 } }],
          offset: 1,
        },
      ],
    });

    expect(data.name).to.equal('Sunset');
    expect(data.assetType).to.equal('gradient');
    expect(data.swatches).to.have.lengthOf(2);
    expect(data.swatches[0].offset).to.equal(0);
    expect(data.swatches[1].offset).to.equal(1);
  });
});

describe('libraryItemToDownloadData', () => {
  it('dispatches themes to palette ThemeData', () => {
    const data = libraryItemToDownloadData({
      type: 'theme',
      name: 'Theme',
      colors: ['#FFFFFF'],
    });

    expect(data.colorMode).to.equal('rgb');
    expect(data.swatches).to.have.lengthOf(1);
  });

  it('dispatches gradients to gradient ThemeData', () => {
    const data = libraryItemToDownloadData({
      type: 'gradient',
      name: 'Gradient',
      colorStops: [{
        color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 0 } }],
        offset: 0,
      }],
    });

    expect(data.assetType).to.equal('gradient');
    expect(data.swatches).to.have.lengthOf(1);
  });
});
