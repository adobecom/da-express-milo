import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  normalizeHex,
  createColorPaletteParamApi,
  PARAM_NAME,
  PALETTE_PRESETS,
  pickRandomPalette,
} from '../../../../express/code/scripts/color-shared/utils/utilities.js';

describe('normalizeHex', () => {
  it('normalizes a 6-digit hex string', () => {
    expect(normalizeHex('ff0000')).to.equal('#FF0000');
  });

  it('normalizes a 6-digit hex with leading #', () => {
    expect(normalizeHex('#00ff00')).to.equal('#00FF00');
  });

  it('expands 3-digit shorthand to 6-digit', () => {
    expect(normalizeHex('f00')).to.equal('#FF0000');
    expect(normalizeHex('0f0')).to.equal('#00FF00');
    expect(normalizeHex('abc')).to.equal('#AABBCC');
  });

  it('expands 3-digit shorthand with leading #', () => {
    expect(normalizeHex('#f00')).to.equal('#FF0000');
  });

  it('trims whitespace', () => {
    expect(normalizeHex('  ff0000  ')).to.equal('#FF0000');
    expect(normalizeHex(' #abc ')).to.equal('#AABBCC');
  });

  it('is case-insensitive', () => {
    expect(normalizeHex('AbCdEf')).to.equal('#ABCDEF');
    expect(normalizeHex('aBc')).to.equal('#AABBCC');
  });

  it('returns null for invalid characters', () => {
    expect(normalizeHex('xyz123')).to.equal(null);
    expect(normalizeHex('gg0000')).to.equal(null);
  });

  it('returns null for wrong lengths (1, 2, 4, 5, 7+ chars)', () => {
    expect(normalizeHex('f')).to.equal(null);
    expect(normalizeHex('ff')).to.equal(null);
    expect(normalizeHex('ffff')).to.equal(null);
    expect(normalizeHex('fffff')).to.equal(null);
    expect(normalizeHex('fffffff')).to.equal(null);
    expect(normalizeHex('ffffffff')).to.equal(null);
  });

  it('returns null for empty string', () => {
    expect(normalizeHex('')).to.equal(null);
  });

  it('returns null for null and undefined', () => {
    expect(normalizeHex(null)).to.equal(null);
    expect(normalizeHex(undefined)).to.equal(null);
  });
});

describe('PARAM_NAME', () => {
  it('equals "color-palette"', () => {
    expect(PARAM_NAME).to.equal('color-palette');
  });
});

describe('createColorPaletteParamApi', () => {
  let api;

  beforeEach(() => {
    api = createColorPaletteParamApi();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getResolvedPalette', () => {
    it('parses a valid multi-color param', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=FF0000,00FF00,0000FF',
      );
      expect(colors).to.deep.equal(['#FF0000', '#00FF00', '#0000FF']);
    });

    it('handles 3-digit shorthand in URL', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=f00,0f0,00f',
      );
      expect(colors).to.deep.equal(['#FF0000', '#00FF00', '#0000FF']);
    });

    it('preserves order of colors', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=AABBCC,112233,DDEEFF',
      );
      expect(colors).to.deep.equal(['#AABBCC', '#112233', '#DDEEFF']);
    });

    it('is case-insensitive', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=aAbBcC,DDeeFF',
      );
      expect(colors).to.deep.equal(['#AABBCC', '#DDEEFF']);
    });

    it('returns default palette when param is missing', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?other=value',
      );
      const allPresetColors = PALETTE_PRESETS.map((p) => p.colors);
      expect(allPresetColors).to.deep.include(colors);
    });

    it('returns default palette when param is empty', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=',
      );
      const allPresetColors = PALETTE_PRESETS.map((p) => p.colors);
      expect(allPresetColors).to.deep.include(colors);
    });

    it('skips entire param and returns defaults when any segment is invalid', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=FF0000,ZZZZZZ,00FF00',
      );
      const allPresetColors = PALETTE_PRESETS.map((p) => p.colors);
      expect(allPresetColors).to.deep.include(colors);
    });

    it('returns defaults for an invalid URL string', () => {
      const colors = api.getResolvedPalette('not-a-url');
      const allPresetColors = PALETTE_PRESETS.map((p) => p.colors);
      expect(allPresetColors).to.deep.include(colors);
    });

    it('parses a single color', () => {
      const colors = api.getResolvedPalette(
        'https://example.test/page?color-palette=ABCDEF',
      );
      expect(colors).to.deep.equal(['#ABCDEF']);
    });
  });

  describe('setOnUrl', () => {
    it('sets a single color on the URL', () => {
      const url = new URL('https://example.test/page');
      api.setOnUrl(url, ['#FF0000']);
      expect(url.searchParams.get('color-palette')).to.equal('FF0000');
    });

    it('sets multiple colors on the URL', () => {
      const url = new URL('https://example.test/page');
      api.setOnUrl(url, ['#FF0000', '#00AA00']);
      expect(url.searchParams.get('color-palette')).to.equal('FF0000,00AA00');
    });

    it('strips # in wire format', () => {
      const url = new URL('https://example.test/page');
      api.setOnUrl(url, ['#AABBCC']);
      const raw = url.searchParams.get('color-palette');
      expect(raw).to.not.include('#');
      expect(raw).to.equal('AABBCC');
    });

    it('normalizes input colors', () => {
      const url = new URL('https://example.test/page');
      api.setOnUrl(url, ['f00', 'abc']);
      expect(url.searchParams.get('color-palette')).to.equal('FF0000,AABBCC');
    });

    it('replaces existing param by default', () => {
      const url = new URL('https://example.test/page?color-palette=111111');
      api.setOnUrl(url, ['#FF0000']);
      expect(url.searchParams.get('color-palette')).to.equal('FF0000');
    });

    it('appends to existing param with merge: append', () => {
      const url = new URL('https://example.test/page?color-palette=111111');
      api.setOnUrl(url, ['#FF0000'], { merge: 'append' });
      expect(url.searchParams.get('color-palette')).to.equal('111111,FF0000');
    });

    it('preserves unrelated query params', () => {
      const url = new URL('https://example.test/page?martech=off&foo=bar');
      api.setOnUrl(url, ['#AABB00']);
      expect(url.searchParams.get('martech')).to.equal('off');
      expect(url.searchParams.get('foo')).to.equal('bar');
      expect(url.searchParams.get('color-palette')).to.equal('AABB00');
    });

    it('filters out invalid colors silently', () => {
      const url = new URL('https://example.test/page');
      api.setOnUrl(url, ['#FF0000', 'invalid', '#00FF00']);
      expect(url.searchParams.get('color-palette')).to.equal('FF0000,00FF00');
    });
  });
});

describe('PALETTE_PRESETS defaults', () => {
  it('contains the expected number of preset palettes', () => {
    expect(PALETTE_PRESETS).to.be.an('array').with.lengthOf(11);
  });

  it('each preset has a colors array with valid hex values', () => {
    PALETTE_PRESETS.forEach((preset) => {
      expect(preset.colors).to.be.an('array').with.length.at.least(5);
      preset.colors.forEach((hex) => {
        expect(hex).to.match(/^#[0-9A-F]{6}$/);
      });
    });
  });

  it('contains the specific Design-provided palettes', () => {
    const allColors = PALETTE_PRESETS.map((p) => p.colors);
    expect(allColors).to.deep.include(['#811B0E', '#D29500', '#FFEBE8', '#D7F7E1', '#1D3ECF']);
    expect(allColors).to.deep.include(['#D73220', '#F4DACB', '#1286CD', '#68150A', '#1F0062']);
    expect(allColors).to.deep.include(['#AF7400', '#FFF197', '#FF9D91', '#0E1843', '#120B00']);
    expect(allColors).to.deep.include(['#FF4885', '#CBE2FE', '#EDC4AC', '#10288C', '#4B0090']);
    expect(allColors).to.deep.include(['#2A0081', '#B7E7FC', '#FFD3F0', '#F5C700', '#BA1650']);
    expect(allColors).to.deep.include(['#ADEEC5', '#B72818', '#E86A00', '#3B63FB', '#480058']);
    expect(allColors).to.deep.include(['#1C3A16', '#04953D', '#482E0A', '#D0F1B7', '#FCFAFA', '#607F5D', '#1C221B']);
    expect(allColors).to.deep.include(['#911400', '#F7E7CB', '#3B0014', '#9AB6FF', '#00291B', '#F2B9A9']);
    expect(allColors).to.deep.include(['#2086F9', '#00428D', '#F1EDE5', '#FEFFB2', '#F04517', '#181B1E']);
    expect(allColors).to.deep.include(['#2B2D42', '#9DD8FF', '#B20D30', '#999CC0', '#FFB997', '#1D7874']);
    expect(allColors).to.deep.include(['#F1EEE1', '#1A1717', '#627E2E', '#D2AF9A', '#602222', '#B6DAF0']);
  });

  it('pickRandomPalette returns one of the presets', () => {
    const picked = pickRandomPalette();
    expect(PALETTE_PRESETS).to.deep.include(picked);
  });
});
