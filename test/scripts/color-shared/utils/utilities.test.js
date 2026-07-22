import { expect } from '@esm-bundle/chai';
import {
  interpolate,
  createColorPaletteParamApi,
  buildColorToolUrl,
} from '../../../../express/code/scripts/color-shared/utils/utilities.js';

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

describe('createColorPaletteParamApi — item/library id', () => {
  const { getResolvedItemId, getResolvedLibraryId, setOnUrl } = createColorPaletteParamApi();

  it('getResolvedItemId reads color-palette-id from the URL', () => {
    const url = 'https://example.com/create/color-wheel?color-palette-id=theme-1';
    expect(getResolvedItemId(url)).to.equal('theme-1');
  });

  it('getResolvedLibraryId reads color-library-id from the URL', () => {
    const url = 'https://example.com/create/color-wheel?color-library-id=lib-1';
    expect(getResolvedLibraryId(url)).to.equal('lib-1');
  });

  it('getResolvedItemId/getResolvedLibraryId return null when absent', () => {
    const url = 'https://example.com/create/color-wheel?color-palette=FF0000';
    expect(getResolvedItemId(url)).to.be.null;
    expect(getResolvedLibraryId(url)).to.be.null;
  });

  it('setOnUrl writes id and libraryId onto the URL', () => {
    const url = new URL('https://example.com/create/color-wheel');
    setOnUrl(url, ['#FF0000'], { id: 'theme-1', libraryId: 'lib-1' });
    expect(url.searchParams.get('color-palette-id')).to.equal('theme-1');
    expect(url.searchParams.get('color-library-id')).to.equal('lib-1');
  });

  it('setOnUrl omits id/libraryId params when not provided', () => {
    const url = new URL('https://example.com/create/color-wheel');
    setOnUrl(url, ['#FF0000'], { name: 'Sunset' });
    expect(url.searchParams.has('color-palette-id')).to.be.false;
    expect(url.searchParams.has('color-library-id')).to.be.false;
  });
});

describe('buildColorToolUrl — item/library id', () => {
  it('includes id/libraryId params alongside colors/name/tags', () => {
    const url = buildColorToolUrl('/create/color-wheel', {
      colors: ['#FF0000', '#00FF00'],
      name: 'Sunset',
      tags: ['warm'],
      id: 'theme-1',
      libraryId: 'lib-1',
    }, 'https://example.com');

    const parsed = new URL(url);
    expect(parsed.searchParams.get('color-palette')).to.equal('FF0000,00FF00');
    expect(parsed.searchParams.get('color-palette-name')).to.equal('Sunset');
    expect(parsed.searchParams.get('color-palette-tags')).to.equal('warm');
    expect(parsed.searchParams.get('color-palette-id')).to.equal('theme-1');
    expect(parsed.searchParams.get('color-library-id')).to.equal('lib-1');
  });

  it('omits id/libraryId params when the palette has no saved-item context', () => {
    const url = buildColorToolUrl('/create/color-wheel', {
      colors: ['#FF0000'],
      name: 'Untitled',
    }, 'https://example.com');

    const parsed = new URL(url);
    expect(parsed.searchParams.has('color-palette-id')).to.be.false;
    expect(parsed.searchParams.has('color-library-id')).to.be.false;
  });
});
