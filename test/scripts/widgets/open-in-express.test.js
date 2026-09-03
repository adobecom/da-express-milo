/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { buildExpressUrl, openInExpress } from '../../../express/code/scripts/widgets/mini-editor-widget/open-in-express.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const MODEL = {
  backgroundUrn: 'urn:aaid:sc:VA6C2:60d17865-6817-5343-84db-34219e8ec3a4',
  backgroundUrl: 'https://design-assets.adobeprojectm.com/x/rendition?assetType=TEMPLATE&etag=1',
  quote: 'Stay hungry, stay foolish',
  author: 'Steve Jobs',
  font: {
    family: 'Georgia, serif', style: 'italic', weight: 'bold', stretch: 'normal',
  },
};

// Mirrors the hz-side decoder (base64url → base64 → UTF-8 bytes → JSON), so these
// tests double as a contract check between milo's encoder and the Express reader.
function decodeMiniEditor(param) {
  const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

describe('mini-editor open-in-express', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
    sinon.restore();
  });

  describe('base URL selection', () => {
    it('uses the prod base by default', async () => {
      expect(await buildExpressUrl(MODEL)).to.include('adobesparkpost.app.link');
    });

    it('uses the local base when hzenv=local', async () => {
      window.history.pushState({}, '', '?hzenv=local');
      expect(await buildExpressUrl(MODEL)).to.include('localhost.adobe.com:8080');
    });

    it('uses the stage base when hzenv=stage', async () => {
      window.history.pushState({}, '', '?hzenv=stage');
      expect(await buildExpressUrl(MODEL)).to.include('stage.projectx.corp.adobe.com');
    });

    it('honors an allow-listed prenv base', async () => {
      window.history.pushState({}, '', '?hzenv=stage&base=https%3A%2F%2F273916.prenv.projectx.corp.adobe.com%2Fnew');
      expect(await buildExpressUrl(MODEL)).to.include('273916.prenv.projectx.corp.adobe.com');
    });

    it('honors an allow-listed local base override', async () => {
      window.history.pushState({}, '', '?hzenv=local&base=https%3A%2F%2Flocalhost.adobe.com%3A9000%2Fnew');
      expect(await buildExpressUrl(MODEL)).to.include('localhost.adobe.com:9000');
    });

    it('rejects a non-allow-listed base and falls back to the hzenv default', async () => {
      window.history.pushState({}, '', '?hzenv=stage&base=https%3A%2F%2Fattacker.com%2F');
      const url = await buildExpressUrl(MODEL);
      expect(url).to.include('stage.projectx.corp.adobe.com');
      expect(url).to.not.include('attacker.com');
    });

    it('falls back to the hzenv default when base is malformed', async () => {
      window.history.pushState({}, '', '?hzenv=local&base=not-a-url');
      expect(await buildExpressUrl(MODEL)).to.include('localhost.adobe.com:8080');
    });

    it('ignores hzenv values other than local/stage (stays on prod)', async () => {
      window.history.pushState({}, '', '?hzenv=whatever');
      expect(await buildExpressUrl(MODEL)).to.include('adobesparkpost.app.link');
    });

    it('honors an explicit prodBaseUrl argument on the default env', async () => {
      expect(await buildExpressUrl(MODEL, 'https://custom.example.com/new')).to.include('custom.example.com');
    });
  });

  describe('branch-link background (prod)', () => {
    const BRANCH_URL = 'https://adobesparkpost.app.link/MrDeAD6dB5b';
    const BRANCH_MODEL = { ...MODEL, backgroundBranchUrl: BRANCH_URL };

    it('opens the template branch link and hands off text only', async () => {
      const url = new URL(await buildExpressUrl(BRANCH_MODEL));
      // The template's own branch code (not the generic JpBOBeJz35b default).
      expect(url.pathname).to.include('MrDeAD6dB5b');
      const payload = decodeMiniEditor(url.searchParams.get('miniEditor'));
      // No background URL — the branch-opened template already supplies it — but URN is kept.
      expect(payload.backgroundUrl).to.equal('');
      expect(payload.backgroundUrn).to.equal(MODEL.backgroundUrn);
      // Our activation/feature keys still ride along, appended to the branch link.
      expect(url.searchParams.get('referrer')).to.equal('express-mini-editor');
      expect(url.searchParams.get('feature-enable')).to.equal('acom-mini-editor-entry');
      expect(url.searchParams.get('miniEditor')).to.be.a('string');
    });

    it('omits the /new canvas-size params in the branch case', async () => {
      const url = new URL(await buildExpressUrl(BRANCH_MODEL));
      expect(url.searchParams.has('width')).to.be.false;
      expect(url.searchParams.has('height')).to.be.false;
      expect(url.searchParams.has('unit')).to.be.false;
    });

    it('ignores the branch link under hzenv=stage (test base + background kept)', async () => {
      window.history.pushState({}, '', '?hzenv=stage');
      const url = new URL(await buildExpressUrl(BRANCH_MODEL));
      expect(url.hostname).to.equal('stage.projectx.corp.adobe.com');
      const payload = decodeMiniEditor(url.searchParams.get('miniEditor'));
      expect(payload.backgroundUrl).to.equal(MODEL.backgroundUrl);
      expect(url.searchParams.get('width')).to.equal('1084');
      expect(url.searchParams.get('height')).to.equal('700');
      expect(url.searchParams.get('unit')).to.equal('px');
    });
  });

  describe('appended params', () => {
    it('sets referrer, feature flag, and canvas size', async () => {
      const url = new URL(await buildExpressUrl(MODEL));
      expect(url.searchParams.get('referrer')).to.equal('express-mini-editor');
      expect(url.searchParams.get('feature-enable')).to.equal('acom-mini-editor-entry');
      expect(url.searchParams.get('width')).to.equal('1084');
      expect(url.searchParams.get('height')).to.equal('700');
      expect(url.searchParams.get('unit')).to.equal('px');
    });

    it('encodes the payload as base64url that round-trips to the model', async () => {
      const url = new URL(await buildExpressUrl(MODEL));
      const param = url.searchParams.get('miniEditor');
      expect(param).to.match(/^[A-Za-z0-9_-]+$/);
      expect(decodeMiniEditor(param)).to.deep.equal({
        backgroundUrn: MODEL.backgroundUrn,
        backgroundUrl: MODEL.backgroundUrl,
        quote: MODEL.quote,
        author: MODEL.author,
        quoteColor: '#FFFFFF',
        authorColor: '#E6E6E6',
        // family reduced from the 'Georgia, serif' stack to the concrete family name
        font: {
          family: 'Georgia', style: 'italic', weight: 'bold', stretch: 'normal',
        },
        // renderer 1084x700 design coords; hz scales this to the actual canvas (identity at 1084).
        // No card is rendered in this test, so the quote width falls back to QUOTE_MAX_WIDTH (624).
        layout: {
          width: 1084,
          height: 700,
          quote: {
            x: 230, y: 298, width: 624, height: 104, fontSize: 40,
          },
          author: {
            x: 230, y: 638, width: 624, height: 40, fontSize: 32,
          },
        },
      });
    });

    it('measures the desktop quote box, scaled by its font size to export space', async () => {
      // 300px box at 20px font -> 300 * (40 / 20) = 600 export px.
      const wrap = document.createElement('div');
      wrap.className = 'me-quote-wrap';
      wrap.style.cssText = 'display: block; width: 300px;';
      const quote = document.createElement('div');
      quote.className = 'me-quote';
      quote.style.fontSize = '20px';
      wrap.append(quote);
      document.body.append(wrap);
      try {
        const decoded = decodeMiniEditor(new URL(await buildExpressUrl(MODEL)).searchParams.get('miniEditor'));
        expect(decoded.layout.quote.width).to.equal(600);
        // x re-derives from the measured width so the column stays centred: (1084 - 600) / 2
        expect(decoded.layout.quote.x).to.equal(242);
      } finally {
        wrap.remove();
      }
    });

    it('measures the arc-carousel centre quote by its 18px font on mobile/tablet', async () => {
      // 270px box at 18px arc font -> 270 * (40 / 18) = 600 export px (matching the desktop wrap).
      const centre = document.createElement('div');
      centre.className = 'me-arc-card--center';
      const wrap = document.createElement('div');
      wrap.className = 'me-quote-wrap';
      wrap.style.cssText = 'display: block; width: 270px;';
      const quote = document.createElement('div');
      quote.className = 'me-arc-quote';
      quote.style.fontSize = '18px';
      wrap.append(quote);
      centre.append(wrap);
      document.body.append(centre);
      try {
        const decoded = decodeMiniEditor(new URL(await buildExpressUrl(MODEL)).searchParams.get('miniEditor'));
        expect(decoded.layout.quote.width).to.equal(600);
      } finally {
        centre.remove();
      }
    });

    it('sizes the Express canvas + layout to the background native size and full-res URL', async () => {
      const model = {
        ...MODEL,
        backgroundFullUrl: `${MODEL.backgroundUrl}&size=1920&type=image/jpeg`,
        backgroundWidth: 1920,
        backgroundHeight: 1080,
      };
      const url = new URL(await buildExpressUrl(model));
      expect(url.searchParams.get('width')).to.equal('1920');
      expect(url.searchParams.get('height')).to.equal('1080');
      const decoded = decodeMiniEditor(url.searchParams.get('miniEditor'));
      expect(decoded.backgroundUrl).to.equal(model.backgroundFullUrl);
      expect(decoded.layout.width).to.equal(1920);
      expect(decoded.layout.height).to.equal(1080);
      // Text scales by the height factor 1080/700.
      expect(decoded.layout.quote.fontSize).to.be.closeTo(40 * (1080 / 700), 0.01);
      expect(decoded.layout.author.fontSize).to.be.closeTo(32 * (1080 / 700), 0.01);
    });

    it('reduces a CSS font stack to the bare family name (no quotes or var())', async () => {
      const model = {
        ...MODEL,
        font: {
          family: '"lobster", var(--body-font-family, sans-serif)',
          style: 'normal',
          weight: 'normal',
          stretch: 'normal',
        },
      };
      const url = new URL(await buildExpressUrl(model));
      expect(decodeMiniEditor(url.searchParams.get('miniEditor')).font.family).to.equal('lobster');
    });

    it('round-trips unicode quote text through the payload', async () => {
      const model = { ...MODEL, quote: '“Créativité” — naïve résumé' };
      const url = new URL(await buildExpressUrl(model));
      expect(decodeMiniEditor(url.searchParams.get('miniEditor')).quote).to.equal(model.quote);
    });

    it('applies safe defaults for missing model fields', async () => {
      const url = new URL(await buildExpressUrl({ quote: 'q' }));
      const payload = decodeMiniEditor(url.searchParams.get('miniEditor'));
      expect(payload.backgroundUrn).to.equal('');
      expect(payload.backgroundUrl).to.equal('');
      expect(payload.author).to.equal('');
      expect(payload.font).to.deep.equal({
        family: 'sans-serif', style: 'normal', weight: 'normal', stretch: 'normal',
      });
    });
  });

  describe('text colour by background mode', () => {
    async function colorsFor(mode) {
      const url = new URL(await buildExpressUrl(mode ? { ...MODEL, mode } : MODEL));
      const payload = decodeMiniEditor(url.searchParams.get('miniEditor'));
      return { quoteColor: payload.quoteColor, authorColor: payload.authorColor };
    }

    it('uses light text on a dark background', async () => {
      expect(await colorsFor('dark')).to.deep.equal({ quoteColor: '#FFFFFF', authorColor: '#E6E6E6' });
    });

    it('uses dark text on a light background', async () => {
      expect(await colorsFor('light')).to.deep.equal({ quoteColor: '#131313', authorColor: '#505050' });
    });

    it('defaults to light text when mode is absent', async () => {
      expect(await colorsFor()).to.deep.equal({ quoteColor: '#FFFFFF', authorColor: '#E6E6E6' });
    });
  });

  describe('openInExpress', () => {
    it('opens the built URL in a new tab with noopener,noreferrer', async () => {
      const openStub = sinon.stub(window, 'open');
      await openInExpress(MODEL);
      expect(openStub.calledOnce).to.be.true;
      expect(openStub.firstCall.args[0]).to.include('adobesparkpost.app.link');
      expect(openStub.firstCall.args[1]).to.equal('_blank');
      expect(openStub.firstCall.args[2]).to.equal('noopener,noreferrer');
    });
  });
});
