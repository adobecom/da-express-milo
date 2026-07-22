import { expect } from '@esm-bundle/chai';
import {
  searchTransform,
  stockTransform,
  identityTransform,
  namedTransform,
  themeToGradient,
  themesToGradients,
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
});
