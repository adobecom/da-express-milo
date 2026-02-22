import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { ThemeActions } from '../../../../express/code/libs/services/plugins/kuler/actions/KulerActions.js';
import { KulerTopics } from '../../../../express/code/libs/services/plugins/kuler/topics.js';
import { expectValidationError, createMockPlugin, stubFetch } from './helpers.js';

describe('ThemeActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    actions = new ThemeActions(mockPlugin);
    fetchStub = stubFetch({ id: 'theme-1' });
  });

  afterEach(() => sinon.restore());

  // ─── getHandlers ──────────────────────────────────────────────────────

  describe('getHandlers', () => {
    it('should map GET, SAVE, DELETE topics to functions', () => {
      const handlers = actions.getHandlers();
      [KulerTopics.THEME.GET, KulerTopics.THEME.SAVE, KulerTopics.THEME.DELETE].forEach((t) => {
        expect(handlers).to.have.property(t).that.is.a('function');
      });
    });

    it('should have exactly 3 handlers', () => {
      expect(Object.keys(actions.getHandlers())).to.have.lengthOf(3);
    });
  });

  // ─── URL Builders ─────────────────────────────────────────────────────

  describe('buildThemeUrl', () => {
    it('should build URL from configured endpoints', () => {
      expect(actions.buildThemeUrl('abc')).to.equal('https://themes.test.io/api/v2/themes/abc');
    });

    it('should fall back to defaults when endpoints are empty', () => {
      mockPlugin.endpoints = {};
      expect(actions.buildThemeUrl('abc')).to.equal('https://themes.adobe.io/api/v2/themes/abc');
    });

    it('should fall back piecemeal when only some endpoints are set', () => {
      mockPlugin.endpoints = { themeBaseUrl: 'https://custom.io' };
      expect(actions.buildThemeUrl('x')).to.equal('https://custom.io/api/v2/themes/x');
    });
  });

  describe('buildThemeSaveUrl', () => {
    it('should build URL without trailing ID', () => {
      expect(actions.buildThemeSaveUrl()).to.equal('https://themes.test.io/api/v2/themes');
    });

    it('should fall back to defaults when endpoints are empty', () => {
      mockPlugin.endpoints = {};
      expect(actions.buildThemeSaveUrl()).to.equal('https://themes.adobe.io/api/v2/themes');
    });
  });

  describe('buildThemeDeleteUrl', () => {
    it('should match buildThemeUrl (delegates)', () => {
      expect(actions.buildThemeDeleteUrl('del-1')).to.equal(actions.buildThemeUrl('del-1'));
    });
  });

  // ─── convertSwatchesToKulerFormat (static) ────────────────────────────

  describe('convertSwatchesToKulerFormat', () => {
    it('should convert RGB swatches', () => {
      const swatches = [{ rgb: { r: 255, g: 128, b: 0 } }, { rgb: { r: 0, g: 0, b: 255 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.deep.include({ mode: 'rgb', values: [255, 128, 0] });
      expect(result[1]).to.deep.include({ mode: 'rgb', values: [0, 0, 255] });
    });

    it('should convert CMYK swatches', () => {
      const swatches = [{ cmyk: { c: 0, m: 100, y: 100, k: 0 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result[0]).to.deep.include({ mode: 'cmyk', values: [0, 100, 100, 0] });
    });

    it('should convert HSV swatches', () => {
      const swatches = [{ hsv: { h: 180, s: 50, v: 100 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result[0]).to.deep.include({ mode: 'hsv', values: [180, 50, 100] });
    });

    it('should convert LAB swatches', () => {
      const swatches = [{ lab: { l: 50, a: 20, b: -30 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result[0]).to.deep.include({ mode: 'lab', values: [50, 20, -30] });
    });

    it('should detect color mode from the FIRST swatch only', () => {
      // First swatch is CMYK; second has RGB but should still be treated as CMYK
      const swatches = [
        { cmyk: { c: 0, m: 0, y: 0, k: 100 } },
        { cmyk: { c: 50, m: 0, y: 0, k: 0 }, rgb: { r: 0, g: 0, b: 0 } },
      ];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result[0].mode).to.equal('cmyk');
      expect(result[1].mode).to.equal('cmyk');
    });

    it('should produce empty values when swatch lacks the detected mode data', () => {
      // First swatch has CMYK (sets mode), second lacks cmyk property
      const swatches = [
        { cmyk: { c: 0, m: 0, y: 0, k: 0 } },
        { rgb: { r: 255, g: 0, b: 0 } }, // no cmyk key
      ];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result[1].values).to.deep.equal([]);
    });

    it('should default to RGB mode when first swatch has no recognized mode key', () => {
      const swatches = [{ rgb: { r: 10, g: 20, b: 30 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});
      expect(result[0].mode).to.equal('rgb');
    });

    it('should include swatchLabel from themeData when present', () => {
      const swatches = [{ rgb: { r: 255, g: 0, b: 0 } }];
      const themeData = { swatches: [{ label: 'Primary Red' }] };
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, themeData);

      expect(result[0].swatchLabel).to.equal('Primary Red');
    });

    it('should omit swatchLabel when themeData has no label at that index', () => {
      const swatches = [{ rgb: { r: 0, g: 0, b: 0 } }, { rgb: { r: 255, g: 255, b: 255 } }];
      const themeData = { swatches: [{ label: 'Black' }] }; // only index 0 has label
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, themeData);

      expect(result[0].swatchLabel).to.equal('Black');
      expect(result[1]).to.not.have.property('swatchLabel');
    });

    it('should omit swatchLabel when themeData.swatches is undefined', () => {
      const swatches = [{ rgb: { r: 0, g: 0, b: 0 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});
      expect(result[0]).to.not.have.property('swatchLabel');
    });

    it('should return empty array for empty swatches input', () => {
      expect(ThemeActions.convertSwatchesToKulerFormat([], {})).to.deep.equal([]);
    });

    it('should handle swatches with zero values correctly', () => {
      const swatches = [{ rgb: { r: 0, g: 0, b: 0 } }];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});
      expect(result[0].values).to.deep.equal([0, 0, 0]);
    });

    // ── colorWeb parity ──

    it('should convert all 5 swatches in a realistic multi-swatch RGB theme', () => {
      const swatches = [
        { rgb: { r: 71, g: 56, b: 215 } },
        { rgb: { r: 131, g: 114, b: 157 } },
        { rgb: { r: 86, g: 18, b: 183 } },
        { rgb: { r: 44, g: 30, b: 120 } },
        { rgb: { r: 22, g: 10, b: 78 } },
      ];
      const result = ThemeActions.convertSwatchesToKulerFormat(swatches, {});

      expect(result).to.have.lengthOf(5);
      result.forEach((s) => {
        expect(s.mode).to.equal('rgb');
        expect(s.values).to.have.lengthOf(3);
      });
      expect(result[0].values).to.deep.equal([71, 56, 215]);
      expect(result[4].values).to.deep.equal([22, 10, 78]);
    });
  });

  // ─── buildThemePostData (static) ──────────────────────────────────────

  describe('buildThemePostData', () => {
    const ccResponse = { id: 'asset-1', libraryid: 'lib-1' };

    it('should build complete post data with all fields', () => {
      const themeData = {
        name: 'Sunset',
        swatches: [{ rgb: { r: 255, g: 128, b: 0 } }],
        tags: ['warm', 'sunset'],
        harmony: {
          baseSwatchIndex: 2,
          mood: 'VIBRANT',
          rule: 'Analogous',
          sourceURL: 'https://source.com',
        },
      };
      const result = ThemeActions.buildThemePostData(themeData, ccResponse);

      expect(result.name).to.equal('Sunset');
      expect(result.swatches).to.have.lengthOf(1);
      expect(result.assets).to.deep.equal({ assetid: 'asset-1', libraryid: 'lib-1' });
      expect(result.tags).to.deep.equal(['warm', 'sunset']);
      expect(result.harmony).to.deep.equal({
        baseSwatchIndex: 2,
        mood: 'vibrant',
        rule: 'analogous',
        sourceURL: 'https://source.com',
      });
    });

    it('should default name to "My Color Theme"', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result.name).to.equal('My Color Theme');
    });

    it('should default tags to empty array', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result.tags).to.deep.equal([]);
    });

    it('should default harmony.rule to "custom"', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result.harmony.rule).to.equal('custom');
    });

    it('should default harmony.baseSwatchIndex to 0', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result.harmony.baseSwatchIndex).to.equal(0);
    });

    it('should default harmony.sourceURL to empty string', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result.harmony.sourceURL).to.equal('');
    });

    it('should lowercase harmony.mood', () => {
      const result = ThemeActions.buildThemePostData(
        { swatches: [], harmony: { mood: 'DARK' } },
        ccResponse,
      );
      expect(result.harmony.mood).to.equal('dark');
    });

    it('should handle undefined harmony.mood gracefully', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result.harmony.mood).to.be.undefined;
    });

    it('should lowercase harmony.rule', () => {
      const result = ThemeActions.buildThemePostData(
        { swatches: [], harmony: { rule: 'TRIAD' } },
        ccResponse,
      );
      expect(result.harmony.rule).to.equal('triad');
    });

    it('should include accessibilityData when present', () => {
      const themeData = { swatches: [], accessibilityData: { wcag: 'AA' } };
      const result = ThemeActions.buildThemePostData(themeData, ccResponse);
      expect(result.accessibilityData).to.deep.equal({ wcag: 'AA' });
    });

    it('should omit accessibilityData when absent', () => {
      const result = ThemeActions.buildThemePostData({ swatches: [] }, ccResponse);
      expect(result).to.not.have.property('accessibilityData');
    });

    it('should treat null swatches as empty via fallback', () => {
      const result = ThemeActions.buildThemePostData({ swatches: null }, ccResponse);
      expect(result.swatches).to.deep.equal([]);
    });

    it('should treat undefined swatches as empty via fallback', () => {
      const result = ThemeActions.buildThemePostData({}, ccResponse);
      expect(result.swatches).to.deep.equal([]);
    });

    // ── colorWeb parity ──

    it('should not include unrecognized theme properties in post data', () => {
      const themeData = {
        name: 'ROYAL BLUE HUES',
        swatches: [{ rgb: { r: 71, g: 56, b: 215 } }],
        tags: [{ value: 'glowing' }],
        harmony: { baseSwatchIndex: 4, mood: 'custom', rule: 'monochromatic', sourceURL: '' },
        author: { guid: 'F17BE33C569FF3F77F000101@AdobeID', name: 'Christian DeVito' },
        source: 'KULER',
        href: 'https://color.adobe.com/ROYAL-BLUE-HUES-color-theme-8775504/',
        id: '8775504',
        like: { count: 0, user: false },
        view: { count: 0, user: false },
        themeSavedToCCLibraries: { value: false },
      };
      const result = ThemeActions.buildThemePostData(themeData, ccResponse);

      expect(result).to.have.all.keys('name', 'swatches', 'assets', 'tags', 'harmony');
      expect(result).to.not.have.any.keys('author', 'source', 'href', 'id', 'like', 'view', 'themeSavedToCCLibraries');
      expect(result.harmony.rule).to.equal('monochromatic');
      expect(result.harmony.baseSwatchIndex).to.equal(4);
    });
  });

  // ─── fetchTheme ───────────────────────────────────────────────────────

  describe('fetchTheme', () => {
    describe('validation', () => {
      [
        { label: 'null', input: null },
        { label: 'undefined', input: undefined },
        { label: 'empty string', input: '' },
        { label: 'zero (falsy)', input: 0 },
      ].forEach(({ label, input }) => {
        it(`should throw ValidationError for ${label}`, async () => {
          await expectValidationError(
            () => actions.fetchTheme(input),
            (err) => {
              expect(err.field).to.equal('themeId');
              expect(err.serviceName).to.equal('Kuler');
              expect(err.topic).to.equal('THEME.GET');
            },
          );
        });
      });
    });

    it('should call correct theme URL with GET', async () => {
      await actions.fetchTheme('t-123');
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://themes.test.io/api/v2/themes/t-123');
      expect(opts.method).to.equal('GET');
    });

    it('should return parsed response', async () => {
      const result = await actions.fetchTheme('t-123');
      expect(result).to.deep.equal({ id: 'theme-1' });
    });
  });

  // ─── saveTheme ────────────────────────────────────────────────────────

  describe('saveTheme', () => {
    const validTheme = { name: 'T', swatches: [{ rgb: { r: 0, g: 0, b: 0 } }] };
    const validCC = { id: 'a-1', libraryid: 'l-1' };

    describe('validation', () => {
      it('should throw when themeData is null', async () => {
        await expectValidationError(
          () => actions.saveTheme(null, validCC),
          (err) => {
            expect(err.field).to.equal('themeData');
            expect(err.topic).to.equal('THEME.SAVE');
          },
        );
      });

      it('should throw when themeData is undefined', async () => {
        await expectValidationError(() => actions.saveTheme(undefined, validCC));
      });

      it('should throw when swatches is empty array', async () => {
        await expectValidationError(
          () => actions.saveTheme({ swatches: [] }, validCC),
          (err) => expect(err.field).to.equal('themeData.swatches'),
        );
      });

      it('should throw when swatches is undefined', async () => {
        await expectValidationError(
          () => actions.saveTheme({}, validCC),
          (err) => expect(err.field).to.equal('themeData.swatches'),
        );
      });

      it('should throw when ccLibrariesResponse is null', async () => {
        await expectValidationError(
          () => actions.saveTheme(validTheme, null),
          (err) => expect(err.field).to.equal('ccLibrariesResponse.id'),
        );
      });

      it('should throw when ccLibrariesResponse.id is missing', async () => {
        await expectValidationError(
          () => actions.saveTheme(validTheme, { libraryid: 'l' }),
          (err) => expect(err.field).to.equal('ccLibrariesResponse.id'),
        );
      });

      it('should throw when ccLibrariesResponse.libraryid is missing', async () => {
        await expectValidationError(
          () => actions.saveTheme(validTheme, { id: 'a' }),
          (err) => expect(err.field).to.equal('ccLibrariesResponse.libraryid'),
        );
      });

      it('should throw when both ccLibrariesResponse fields are empty strings', async () => {
        await expectValidationError(
          () => actions.saveTheme(validTheme, { id: '', libraryid: '' }),
          (err) => expect(err.field).to.equal('ccLibrariesResponse.id'),
        );
      });
    });

    it('should POST to save URL with built post data', async () => {
      await actions.saveTheme(validTheme, validCC);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://themes.test.io/api/v2/themes');
      expect(opts.method).to.equal('POST');

      const body = JSON.parse(opts.body);
      expect(body.name).to.equal('T');
      expect(body.assets).to.deep.equal({ assetid: 'a-1', libraryid: 'l-1' });
    });

    // ── colorWeb parity ──

    it('should include all swatches in POST body for a multi-swatch theme', async () => {
      const themeData = {
        name: 'ROYAL BLUE HUES',
        swatches: [
          { rgb: { r: 71, g: 56, b: 215 } },
          { rgb: { r: 131, g: 114, b: 157 } },
          { rgb: { r: 86, g: 18, b: 183 } },
          { rgb: { r: 44, g: 30, b: 120 } },
          { rgb: { r: 22, g: 10, b: 78 } },
        ],
        harmony: { baseSwatchIndex: 4, mood: 'custom', rule: 'monochromatic' },
      };
      await actions.saveTheme(themeData, validCC);

      const body = JSON.parse(fetchStub.firstCall.args[1].body);
      expect(body.swatches).to.have.lengthOf(5);
      expect(body.swatches[0]).to.deep.include({ mode: 'rgb', values: [71, 56, 215] });
      expect(body.swatches[4]).to.deep.include({ mode: 'rgb', values: [22, 10, 78] });
      expect(body.harmony.baseSwatchIndex).to.equal(4);
      expect(body.harmony.rule).to.equal('monochromatic');
    });
  });

  // ─── deleteTheme ──────────────────────────────────────────────────────

  describe('deleteTheme', () => {
    describe('validation', () => {
      [
        { label: 'null payload', input: null },
        { label: 'undefined payload', input: undefined },
        { label: 'missing id', input: { name: 'x' } },
        { label: 'empty id', input: { id: '', name: 'x' } },
      ].forEach(({ label, input }) => {
        it(`should throw ValidationError for ${label}`, async () => {
          await expectValidationError(
            () => actions.deleteTheme(input),
            (err) => {
              expect(err.field).to.equal('payload.id');
              expect(err.topic).to.equal('THEME.DELETE');
            },
          );
        });
      });
    });

    it('should DELETE to correct URL', async () => {
      await actions.deleteTheme({ id: 'del-1', name: 'Old' });
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://themes.test.io/api/v2/themes/del-1');
      expect(opts.method).to.equal('DELETE');
    });

    it('should return response wrapped with themeName', async () => {
      const result = await actions.deleteTheme({ id: 'd', name: 'My Theme' });
      expect(result.themeName).to.equal('My Theme');
      expect(result.response).to.deep.equal({ id: 'theme-1' });
    });

    it('should handle missing name gracefully (undefined themeName)', async () => {
      const result = await actions.deleteTheme({ id: 'd' });
      expect(result.themeName).to.be.undefined;
    });
  });
});
