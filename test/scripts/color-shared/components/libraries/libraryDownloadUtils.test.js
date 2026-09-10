import { expect } from '@esm-bundle/chai';

import {
  libraryGradientStopToSwatch,
  libraryGradientToDownloadData,
  libraryGradientToModalGradient,
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

describe('libraryGradientToModalGradient', () => {
  it('maps CC Library stops to modal colorStops with position', () => {
    const gradient = libraryGradientToModalGradient({
      id: 'grad-1',
      name: 'Sunset',
      angle: 45,
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

    expect(gradient.id).to.equal('grad-1');
    expect(gradient.name).to.equal('Sunset');
    expect(gradient.angle).to.equal(45);
    expect(gradient.colorStops).to.deep.equal([
      { color: '#ff0000', position: 0 },
      { color: '#0000ff', position: 1 },
    ]);
  });

  it('defaults angle to 90 and distributes missing offsets evenly', () => {
    const gradient = libraryGradientToModalGradient({
      name: 'Fade',
      colorStops: [
        { color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 0 } }] },
        { color: [{ mode: 'RGB', value: { r: 255, g: 255, b: 255 } }] },
        { color: [{ mode: 'RGB', value: { r: 128, g: 128, b: 128 } }] },
      ],
    });

    expect(gradient.angle).to.equal(90);
    expect(gradient.colorStops[0].position).to.equal(0);
    expect(gradient.colorStops[1].position).to.equal(0.5);
    expect(gradient.colorStops[2].position).to.equal(1);
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
