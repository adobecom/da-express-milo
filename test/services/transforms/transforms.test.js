import { expect } from '@esm-bundle/chai';
import {
  searchTransform,
  stockTransform,
  identityTransform,
  namedTransform,
  themeToGradient,
  themesToGradients,
  gradientApiResponseToGradient,
  paletteToThemeData,
  hexToNormalizedRGB,
} from '../../../express/code/libs/services/providers/transforms.js';

describe('provider transforms', () => {
  it('searchTransform builds criteria with defaults', () => {
    expect(searchTransform('sunset')).to.deep.equal({
      main: 'sunset',
      typeOfQuery: 'term',
      pageNumber: 1,
    });
  });

  it('searchTransform uses provided options', () => {
    expect(searchTransform('ocean', { typeOfQuery: 'tag', pageNumber: 3 })).to.deep.equal({
      main: 'ocean',
      typeOfQuery: 'tag',
      pageNumber: 3,
    });
  });

  it('stockTransform applies defaults and preserves explicit zero values', () => {
    expect(stockTransform()).to.deep.equal({ count: 20, offset: 0 });
    expect(stockTransform({ count: 0, offset: 0 })).to.deep.equal({ count: 0, offset: 0 });
  });

  it('identityTransform returns the same value', () => {
    const value = { id: 1, nested: { a: true } };
    expect(identityTransform(value)).to.equal(value);
  });

  it('namedTransform wraps value in object by key', () => {
    const transform = namedTransform('themeId');
    expect(transform('abc123')).to.deep.equal({ themeId: 'abc123' });
  });

  it('themeToGradient converts hex and rgb swatches and fallback colors', () => {
    const gradient = themeToGradient({
      id: 't1',
      name: 'Ocean',
      swatches: [
        { hex: 'FF0000' },
        { values: [0, 0.5, 1] },
        {},
      ],
    });

    expect(gradient.id).to.equal('t1');
    expect(gradient.name).to.equal('Ocean');
    expect(gradient.type).to.equal('linear');
    expect(gradient.angle).to.equal(90);
    expect(gradient).to.include({ _source: 'kuler' });
    expect(gradient.colorStops).to.deep.equal([
      { color: '#FF0000', position: 0 },
      { color: '#0080FF', position: 0.5 },
      { color: '#CCCCCC', position: 1 },
    ]);
  });

  it('themeToGradient handles missing swatches and default name', () => {
    const gradient = themeToGradient({ id: 'empty' });
    expect(gradient.name).to.equal('Unnamed Theme');
    expect(gradient.colorStops).to.deep.equal([]);
    expect(gradient.coreColors).to.deep.equal([]);
    expect(gradient.description).to.equal('');
  });

  it('themeToGradient passes through a real description, and normalizes null to an empty string', () => {
    expect(themeToGradient({ id: 't2', description: 'A calming ocean gradient' }).description)
      .to.equal('A calming ocean gradient');
    expect(themeToGradient({ id: 't3', description: null }).description).to.equal('');
  });

  it('themesToGradients returns empty array for non-arrays', () => {
    expect(themesToGradients(null)).to.deep.equal([]);
    expect(themesToGradients({})).to.deep.equal([]);
  });

  it('themesToGradients maps all themes', () => {
    const gradients = themesToGradients([
      { id: 'a', swatches: [{ hex: '000000' }] },
      { id: 'b', swatches: [{ hex: 'FFFFFF' }] },
    ]);

    expect(gradients).to.have.length(2);
    expect(gradients[0].id).to.equal('a');
    expect(gradients[1].id).to.equal('b');
  });

  it('gradientApiResponseToGradient passes through a real description, and normalizes null to an empty string', () => {
    const rendition = {
      type: 'linear',
      angle: 90,
      stops: [
        { color: [{ mode: 'rgb', value: { r: 255, g: 0, b: 0 } }], offset: 0, midpoint: 0.5 },
      ],
    };

    const withDescription = gradientApiResponseToGradient({
      id: 'g1',
      name: 'Sunset',
      description: 'Warm sunset tones',
      gradientSecondaryRepresentation: { rendition },
    });
    expect(withDescription.description).to.equal('Warm sunset tones');

    const withNullDescription = gradientApiResponseToGradient({
      id: 'g2',
      name: 'Sunrise',
      description: null,
      gradientSecondaryRepresentation: { rendition },
    });
    expect(withNullDescription.description).to.equal('');
  });

  it('gradientApiResponseToGradient falls back to themeToGradient (and its description mapping) when there is no rendition', () => {
    const gradient = gradientApiResponseToGradient({
      id: 'g3',
      description: 'Fallback path description',
      swatches: [{ hex: 'FF0000' }],
    });
    expect(gradient._source).to.equal('kuler');
    expect(gradient.description).to.equal('Fallback path description');
  });

  describe('paletteToThemeData', () => {
    it('spaces swatches evenly by index when there is no colorStops (plain palette)', () => {
      const themeData = paletteToThemeData({ name: 'Test', colors: ['#FF0000', '#00FF00', '#0000FF'] });
      expect(themeData.name).to.equal('Test');
      expect(themeData.swatches).to.deep.equal([
        { rgb: { r: 1, g: 0, b: 0 } },
        { rgb: { r: 0, g: 1, b: 0 } },
        { rgb: { r: 0, g: 0, b: 1 } },
      ]);
    });

    it('preserves each stop\'s real offset/midpoint when colorStops is given (gradient)', () => {
      // Regression test: a gradient whose 2nd of 3 stops sits at 20% (not the
      // 50% an even index-based spread would produce) — this used to get
      // silently discarded because paletteToThemeData only ever read
      // palette.colors, so the SVG/PNG/CSS exports rendered every gradient
      // with evenly-spaced stops regardless of its actual shape.
      const themeData = paletteToThemeData({
        name: 'Naamloos-1(5)',
        colors: ['#FFFFFF', '#406B0F', '#000000'],
        colorStops: [
          { color: '#FFFFFF', position: 0 },
          { color: '#406B0F', position: 0.2, midpoint: 0.5 },
          { color: '#000000', position: 1, midpoint: 0.5 },
        ],
      });
      expect(themeData.swatches[1].offset).to.equal(0.2);
      expect(themeData.swatches[1].rgb).to.deep.equal(hexToNormalizedRGB('#406B0F'));
    });

    it('falls back to even spacing for a colorStops entry with a non-numeric position', () => {
      const themeData = paletteToThemeData({
        name: 'Test',
        colorStops: [
          { color: '#FFFFFF' },
          { color: '#000000' },
        ],
      });
      expect(themeData.swatches.map((s) => s.offset)).to.deep.equal([0, 1]);
    });
  });
});
