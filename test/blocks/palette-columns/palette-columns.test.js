/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { setConfig } = await import(`${getLibs()}/utils/utils.js`);
setConfig({});

const {
  default: decorate,
  takeUniquePreset,
  resetPresetQueue,
  generateRandomPalette,
  buildEditHref,
} = await import('../../../express/code/blocks/palette-columns/palette-columns.js');
const { PALETTE_PRESETS } = await import('../../../express/code/scripts/color-shared/utils/utilities.js');

const HEX_RE = /^#[0-9A-F]{6}$/;
const MOBILE_QUERY = '(max-width: 599px)';
const SATELLITE = '_satellite';
const CORP = '_adobe_corpnew';

function stubMatchMedia(mobile = false) {
  const listeners = [];
  const original = window.matchMedia.bind(window);
  const stub = sinon.stub(window, 'matchMedia').callsFake((query) => {
    if (query !== MOBILE_QUERY) return original(query);
    return {
      matches: mobile,
      media: query,
      addEventListener: (type, fn) => listeners.push(fn),
      removeEventListener: () => {},
    };
  });
  return { stub, fire: (matches) => listeners.forEach((fn) => fn({ matches })) };
}

function getRail(block) {
  return block.querySelector('color-swatch-rail');
}

function getRailHexes(block) {
  return getRail(block).controller.getState().swatches.map((s) => s.hex.toUpperCase());
}

async function setup(mock, { mobile = false } = {}) {
  document.body.innerHTML = await readFile({ path: `./mocks/${mock}` });
  const media = stubMatchMedia(mobile);
  const blocks = [...document.querySelectorAll('.palette-columns')];
  await blocks.reduce((prev, block) => prev.then(() => decorate(block)), Promise.resolve());
  return { blocks, block: blocks[0], media };
}

describe('palette-columns', () => {
  let satelliteTrack;

  beforeEach(() => {
    resetPresetQueue();
    satelliteTrack = sinon.spy();
    window[SATELLITE] = { track: satelliteTrack };
  });

  afterEach(() => {
    sinon.restore();
    delete window[SATELLITE];
    document.body.innerHTML = '';
  });

  describe('variants and layout', () => {
    it('adds the default palette-right class when no variant is authored', async () => {
      const { block } = await setup('basic.html');
      expect(block.classList.contains('palette-right')).to.be.true;
      expect(block.classList.contains('palette-left')).to.be.false;
      expect(block.classList.contains('is-ready')).to.be.true;
    });

    it('keeps the authored palette-left variant without adding palette-right', async () => {
      const { block } = await setup('palette-left.html');
      expect(block.classList.contains('palette-left')).to.be.true;
      expect(block.classList.contains('palette-right')).to.be.false;
    });

    it('moves the authored content into .palette-columns-content in a stable DOM order', async () => {
      const { block } = await setup('basic.html');
      const [content, swatches] = block.children;
      expect(block.children).to.have.length(2);
      expect(content.classList.contains('palette-columns-content')).to.be.true;
      expect(content.querySelector('h2#mock-heading')).to.exist;
      expect(content.querySelector('p')).to.exist;
      expect(swatches.classList.contains('palette-columns-swatches')).to.be.true;
      expect(swatches.querySelector('.palette-columns-rail')).to.exist;
      expect(swatches.querySelector('.palette-columns-ctas')).to.exist;
    });
  });

  describe('swatch rail', () => {
    it('renders a five-color rail from the preset palettes with hex + copy only', async () => {
      const { block } = await setup('basic.html');
      const rail = getRail(block);
      const hexes = getRailHexes(block);
      expect(hexes).to.have.length(5);
      const presetMatch = PALETTE_PRESETS.some(
        ({ colors }) => colors.map((c) => c.toUpperCase()).join() === hexes.join(),
      );
      expect(presetMatch).to.be.true;
      expect(rail.swatchFeatures).to.include({
        copy: true,
        hexCode: true,
        colorPicker: false,
        baseColor: false,
        copyFromHex: false,
      });
    });

    it('uses the vertical orientation on tablet/desktop', async () => {
      const { block } = await setup('basic.html');
      expect(getRail(block).getAttribute('orientation')).to.equal('vertical');
    });

    it('uses the stacked orientation on mobile and switches when the viewport changes', async () => {
      const { block, media } = await setup('basic.html', { mobile: true });
      const rail = getRail(block);
      expect(rail.getAttribute('orientation')).to.equal('stacked');
      media.fire(false);
      expect(rail.getAttribute('orientation')).to.equal('vertical');
      media.fire(true);
      expect(rail.getAttribute('orientation')).to.equal('stacked');
    });

    it('gives every block on the page a different first palette', async () => {
      const { blocks } = await setup('multiple.html');
      const palettes = blocks.map((b) => getRailHexes(b).join());
      expect(new Set(palettes).size).to.equal(blocks.length);
    });
  });

  describe('takeUniquePreset / resetPresetQueue', () => {
    it('returns a distinct preset on every call until all presets are used', () => {
      const seen = new Set();
      PALETTE_PRESETS.forEach(() => seen.add(takeUniquePreset().join()));
      expect(seen.size).to.equal(PALETTE_PRESETS.length);
    });

    it('returns a copy so callers cannot mutate the shared presets', () => {
      const colors = takeUniquePreset();
      const before = PALETTE_PRESETS.map((p) => p.colors.join());
      colors[0] = '#000000';
      expect(PALETTE_PRESETS.map((p) => p.colors.join())).to.deep.equal(before);
    });

    it('refills the queue after reset', () => {
      PALETTE_PRESETS.forEach(() => takeUniquePreset());
      resetPresetQueue();
      expect(takeUniquePreset()).to.have.length(5);
    });
  });

  describe('generateRandomPalette', () => {
    it('returns five uppercase hex colors', () => {
      const colors = generateRandomPalette();
      expect(colors).to.have.length(5);
      colors.forEach((c) => expect(c).to.match(HEX_RE));
    });
  });

  describe('CTAs', () => {
    it('renders the edit link pointing at the color wheel with the palette in the URL', async () => {
      const { block } = await setup('basic.html');
      const edit = block.querySelector('a.palette-columns-edit');
      const href = edit.getAttribute('href');
      expect(href).to.include('/create/color-wheel');
      expect(href).to.include('color-palette=');
      const hexes = getRailHexes(block).map((h) => h.replace('#', ''));
      expect(decodeURIComponent(href)).to.include(hexes.join(','));
    });

    it('buildEditHref encodes the palette colors', () => {
      const href = buildEditHref('/create/color-wheel', ['#AABBCC', '#112233']);
      expect(href.startsWith('/create/color-wheel?')).to.be.true;
      expect(decodeURIComponent(href)).to.include('AABBCC,112233');
    });

    it('renders accessible CTA labels with decorative icons', async () => {
      const { block } = await setup('basic.html');
      const edit = block.querySelector('.palette-columns-edit');
      const generate = block.querySelector('.palette-columns-generate');

      expect(edit.tagName).to.equal('A');
      expect(edit.textContent.trim()).to.equal('Edit in the color palette tool');
      expect(generate.tagName).to.equal('BUTTON');
      expect(generate.getAttribute('type')).to.equal('button');
      expect(generate.textContent.trim()).to.equal('Generate random');

      block.querySelectorAll('.palette-columns-icon').forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).to.equal('true');
        expect(icon.querySelector('svg').getAttribute('focusable')).to.equal('false');
      });
    });

    it('uses the milo con-button classes for both CTAs', async () => {
      const { block } = await setup('basic.html');
      const edit = block.querySelector('.palette-columns-edit');
      const generate = block.querySelector('.palette-columns-generate');
      expect(edit.classList.contains('con-button')).to.be.true;
      expect(edit.classList.contains('fill')).to.be.true;
      expect(generate.classList.contains('con-button')).to.be.true;
      expect(generate.classList.contains('outline')).to.be.true;
    });

    it('generate random replaces the palette, updates the edit link and announces it', async () => {
      const { block } = await setup('basic.html');
      const before = getRailHexes(block);
      sinon.stub(Math, 'random').returns(0.5);

      block.querySelector('.palette-columns-generate').click();

      const after = getRailHexes(block);
      expect(after).to.deep.equal(['#800000', '#800000', '#800000', '#800000', '#800000']);
      expect(after).to.not.deep.equal(before);
      expect(decodeURIComponent(block.querySelector('.palette-columns-edit').getAttribute('href')))
        .to.include('800000,800000,800000,800000,800000');

      await new Promise((resolve) => { setTimeout(resolve, 150); });
      const region = document.getElementById('express-spectrum-live-region');
      expect(region.textContent).to.include('New random palette generated');
    });
  });

  describe('analytics', () => {
    it('sets daa-lh on the swatches container and daa-ll on both CTAs', async () => {
      const { block } = await setup('basic.html');
      expect(block.querySelector('.palette-columns-swatches').getAttribute('daa-lh'))
        .to.equal('palette-columns');
      expect(block.querySelector('.palette-columns-edit').getAttribute('daa-ll')).to.match(/^Edit/);
      expect(block.querySelector('.palette-columns-generate').getAttribute('daa-ll'))
        .to.equal('Generate random');
    });

    it('fires the color block load event', async () => {
      await setup('basic.html');
      await new Promise((resolve) => { setTimeout(resolve, 0); });
      const call = satelliteTrack.getCalls().find(
        (c) => c.args[1]?.data?.[CORP]?.sdm?.event?.pagename === 'view-color-block',
      );
      expect(call).to.exist;
      expect(call.args[1].data[CORP].sdm.custom.block.type).to.equal('palette-columns');
    });
  });

  describe('error handling', () => {
    it('logs to lana when async decoration fails', async () => {
      document.body.innerHTML = await readFile({ path: './mocks/basic.html' });
      const block = document.querySelector('.palette-columns');
      window.lana = { log: sinon.spy() };
      sinon.stub(window, 'matchMedia').throws(new Error('boom'));

      await decorate(block);

      expect(window.lana.log.calledOnce).to.be.true;
      expect(window.lana.log.firstCall.args[0]).to.include('boom');
      expect(block.classList.contains('is-ready')).to.be.false;
      delete window.lana;
    });
  });
});
