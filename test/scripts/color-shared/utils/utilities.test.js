import { expect } from '@esm-bundle/chai';
import { interpolate } from '../../../../express/code/scripts/color-shared/utils/utilities.js';

describe('interpolate', () => {
  it('replaces a single token', () => {
    expect(interpolate('Hello {name}', { name: 'World' })).to.equal('Hello World');
  });

  it('replaces multiple distinct tokens', () => {
    expect(interpolate('{row}, {col}', { row: '2', col: '3' })).to.equal('2, 3');
  });

  it('replaces a repeated token every occurrence', () => {
    expect(interpolate('{n} of {n}', { n: '5' })).to.equal('5 of 5');
  });

  it('leaves unreferenced tokens untouched', () => {
    expect(interpolate('Row {row}', { col: '1' })).to.equal('Row {row}');
  });

  it('returns the template unchanged when vars is empty', () => {
    expect(interpolate('No tokens here', {})).to.equal('No tokens here');
  });
});
