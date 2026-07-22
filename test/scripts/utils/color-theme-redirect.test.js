import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import colorThemeRedirect, {
  extractThemeId,
  buildRedirectUrl,
} from '../../../express/code/scripts/utils/color-theme-redirect.js';

setLibs('/libs');

describe('Color Theme Redirect', () => {
  describe('extractThemeId', () => {
    it('extracts ID from standard deeplink path', () => {
      expect(extractThemeId('/Green-Shades-color-theme-628525/')).to.equal('628525');
    });

    it('extracts ID without trailing slash', () => {
      expect(extractThemeId('/Green-Shades-color-theme-628525')).to.equal('628525');
    });

    it('extracts ID with locale prefix', () => {
      expect(extractThemeId('/de/Green-Shades-color-theme-628525/')).to.equal('628525');
    });

    it('extracts ID from a long numeric ID', () => {
      expect(extractThemeId('/vibrant-sunsets-color-theme-21584317/')).to.equal('21584317');
    });

    it('extracts ID when theme name contains hyphens', () => {
      expect(extractThemeId('/my-cool-blue-green-color-theme-12345')).to.equal('12345');
    });

    it('returns null for /create/color-wheel path', () => {
      expect(extractThemeId('/create/color-wheel')).to.be.null;
    });

    it('returns null for /explore/ path', () => {
      expect(extractThemeId('/explore/')).to.be.null;
    });

    it('returns null for root path', () => {
      expect(extractThemeId('/')).to.be.null;
    });

    it('returns null for path with color-theme but no numeric ID', () => {
      expect(extractThemeId('/name-color-theme-abc/')).to.be.null;
    });

    it('returns null for path with color-palette query param style', () => {
      expect(extractThemeId('/create/color-wheel?color-palette=FF0000')).to.be.null;
    });
  });

  describe('buildRedirectUrl', () => {
    it('builds redirect URL from hex swatch data', () => {
      const raw = {
        id: '628525',
        name: 'Green Shades',
        swatches: [
          { hex: '2D5E2A' },
          { hex: '3B7A36' },
          { hex: '4F9648' },
        ],
      };

      const url = buildRedirectUrl(raw);
      expect(url).to.include('/create/color-wheel');
      expect(url).to.include('color-palette=');
      expect(url).to.include('2D5E2A');
      expect(url).to.include('3B7A36');
      expect(url).to.include('4F9648');
      expect(url).to.include('color-palette-name=Green+Shades');
    });

    it('preserves locale prefix', () => {
      const raw = {
        id: '1',
        name: 'Test',
        swatches: [{ hex: 'FF0000' }],
      };

      const url = buildRedirectUrl(raw, '/de');
      expect(url).to.match(/^\/de\/create\/color-wheel/);
    });

    it('handles 0-1 float swatch values', () => {
      const raw = {
        id: '99999',
        name: 'Float Theme',
        swatches: [
          { values: ['1.0', '0.0', '0.0'] },
          { values: ['0.0', '1.0', '0.0'] },
        ],
      };

      const url = buildRedirectUrl(raw);
      expect(url).to.include('/create/color-wheel');
      expect(url).to.include('color-palette=');
    });

    it('returns null for theme with no swatches', () => {
      const raw = { id: '1', name: 'Empty', swatches: [] };
      expect(buildRedirectUrl(raw)).to.be.null;
    });

    it('returns null for theme with undefined swatches', () => {
      const raw = { id: '1', name: 'No Swatches' };
      expect(buildRedirectUrl(raw)).to.be.null;
    });

    it('defaults name to "My Color Theme" when missing', () => {
      const raw = { swatches: [{ hex: 'AABBCC' }] };
      const url = buildRedirectUrl(raw);
      expect(url).to.include('color-palette-name=My+Color+Theme');
    });
  });

  describe('colorThemeRedirect (integration)', () => {
    let fetchStub;
    let savedHref;

    beforeEach(() => {
      fetchStub = sinon.stub(window, 'fetch');
      savedHref = window.location.href;
    });

    afterEach(() => {
      fetchStub.restore();
      window.history.replaceState({}, '', savedHref);
      document.body.style.display = '';
    });

    it('returns false for non-matching paths', async () => {
      window.history.replaceState({}, '', '/create/color-wheel');
      const result = await colorThemeRedirect({});
      expect(result).to.be.false;
      expect(fetchStub.called).to.be.false;
    });

    it('calls Kuler API with correct URL when path matches', async () => {
      window.history.replaceState({}, '', '/Green-Shades-color-theme-628525/');
      fetchStub.resolves({ ok: false, status: 404 });

      await colorThemeRedirect({});

      expect(fetchStub.calledOnce).to.be.true;
      const fetchUrl = fetchStub.firstCall.args[0];
      expect(fetchUrl).to.equal('https://themesb3.adobe.io/api/v2/themes/628525?metadata=all');
      expect(fetchStub.firstCall.args[1].headers['x-api-key']).to.equal('KulerBackendClientId');
    });

    it('returns false and restores body on API 404', async () => {
      window.history.replaceState({}, '', '/Fake-color-theme-99999999999/');
      fetchStub.resolves({ ok: false, status: 404 });

      const result = await colorThemeRedirect({});
      expect(result).to.be.false;
      expect(document.body.style.display).to.equal('');
    });

    it('returns false and restores body on network error', async () => {
      window.history.replaceState({}, '', '/Broken-color-theme-12345/');
      fetchStub.rejects(new Error('Network failure'));

      const result = await colorThemeRedirect({});
      expect(result).to.be.false;
      expect(document.body.style.display).to.equal('');
    });

    it('hides body immediately when pattern matches', async () => {
      window.history.replaceState({}, '', '/Test-color-theme-11111/');
      let bodyDisplayDuringFetch = '';
      fetchStub.callsFake(() => {
        bodyDisplayDuringFetch = document.body.style.display;
        return Promise.resolve({ ok: false });
      });

      await colorThemeRedirect({});
      expect(bodyDisplayDuringFetch).to.equal('none');
    });
  });
});
