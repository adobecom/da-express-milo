/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// eslint-disable-next-line import/no-unresolved
import { ExportActions } from '../../../../../../express/code/libs/services/plugins/download/actions/DownloadActions.js';

const themeData = {
  name: 'Jolly Rancher',
  swatches: [
    { rgb: { r: 217 / 255, g: 159 / 255, b: 89 / 255 } },
    { rgb: { r: 1, g: 1, b: 1 } },
  ],
};

const gradientThemeData = {
  name: 'Sunset',
  assetType: 'gradient',
  swatches: [
    { rgb: { r: 217 / 255, g: 159 / 255, b: 89 / 255 }, offset: 0, midpoint: 0.5 },
    { rgb: { r: 1, g: 1, b: 1 }, offset: 1, midpoint: 0.5 },
  ],
};

describe('ExportActions — Color mode scoping (Copy as CSS/SCSS/LESS)', () => {
  let actions;

  beforeEach(() => {
    actions = new ExportActions();
    // Real clipboard access is unnecessary noise for these tests — only the
    // returned `output` string is under test here.
    sinon.stub(navigator.clipboard, 'writeText').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('exportAsCSS', () => {
    it('emits only the requested mode, not hex+rgba+hsla together, with no header comment', async () => {
      const { output } = await actions.exportAsCSS(themeData, 'HSB');
      expect(output).not.to.include('/*');
      expect(output).to.include('hsl(33, 63%, 60%)');
      expect(output).not.to.include('-hex');
      expect(output).not.to.include('-rgb');
    });

    it('uses hsl() for HSB (no valid CSS hsb()/hsv() function, same substitution as the gradient path)', async () => {
      const { output } = await actions.exportAsCSS(themeData, 'HSB');
      expect(output).to.include('color: hsl(33, 63%, 60%);');
    });

    it('uses the real lab() CSS function for Lab mode', async () => {
      const { output } = await actions.exportAsCSS(themeData, 'Lab');
      expect(output).to.include('color: lab(70% 14 44);');
    });

    it('defaults to RGB when no mode is given, with no header comment', async () => {
      const { output } = await actions.exportAsCSS(themeData);
      expect(output).not.to.include('/*');
      expect(output).to.include('rgba(217, 159, 89, 1)');
    });

    it('gradients: scopes the linear-gradient() to the requested mode, with no header comment', async () => {
      const { output } = await actions.exportAsCSS(gradientThemeData, 'Lab');
      expect(output).not.to.include('/*');
      expect(output).to.include('linear-gradient(to right, lab(70% 14 44)');
      expect(output).not.to.include('rgba(');
    });

    it('gradients: HSB has no valid CSS color syntax (no hsb()/hsv() function), so its stops use hsl() instead — same as colorweb\'s own "Copy as CSS" — with no comments, just a real linear-gradient()', async () => {
      const { output } = await actions.exportAsCSS(gradientThemeData, 'HSB');
      expect(output).not.to.include('/*');
      expect(output).to.include('linear-gradient(to right, hsl(33, 63%, 60%)');
      expect(output).not.to.include('hsb(');
      expect(output).not.to.include('rgba(');
    });
  });

  describe('exportAsSCSS / exportAsLESS', () => {
    it('SCSS emits only the requested mode with a $ prefix', async () => {
      const { output } = await actions.exportAsSCSS(themeData, 'HEX');
      expect(output).to.include('$Jolly-Rancher-1-hex: #D99F59;');
      expect(output).not.to.include('-rgb:');
      expect(output).not.to.include('hsla(');
    });

    it('LESS emits only the requested mode with an @ prefix', async () => {
      const { output } = await actions.exportAsLESS(themeData, 'RGB');
      expect(output).to.include('@Jolly-Rancher-1-rgba: rgba(217, 159, 89, 1);');
      expect(output).not.to.include('-hex:');
      expect(output).not.to.include('hsla(');
    });

    it('suffix matches the actual CSS function/format used, not the mode name (rgba, hsl, lab, hex)', async () => {
      const rgba = await actions.exportAsLESS(themeData, 'RGB');
      expect(rgba.output).to.include('-1-rgba:');
      const hsl = await actions.exportAsLESS(themeData, 'HSB');
      expect(hsl.output).to.include('-1-hsl:');
      const lab = await actions.exportAsLESS(themeData, 'Lab');
      expect(lab.output).to.include('-1-lab:');
      const hex = await actions.exportAsLESS(themeData, 'HEX');
      expect(hex.output).to.include('-1-hex:');
    });

    it('gradients: SCSS emits a single $var holding a real linear-gradient(), not one variable per stop', async () => {
      const { output } = await actions.exportAsSCSS(gradientThemeData, 'RGB');
      expect(output).to.include('$Sunset: linear-gradient(to right, rgba(217, 159, 89, 1)');
      expect(output).not.to.include('-1-rgba:');
      expect(output).not.to.include('-2-rgba:');
    });

    it('gradients: LESS emits a single @var holding a real linear-gradient(), not one variable per stop', async () => {
      const { output } = await actions.exportAsLESS(gradientThemeData, 'Lab');
      expect(output).to.include('@Sunset: linear-gradient(to right, lab(');
      expect(output).not.to.include('-1-lab:');
      expect(output).not.to.include('-2-lab:');
    });
  });

  describe('exportAsXML', () => {
    it('RGB mode: only r/g/b attributes, no hex', async () => {
      const { output } = await actions.exportAsXML(themeData, 'RGB');
      expect(output).to.include("<color name='Jolly-Rancher-1' r='217' g='159' b='89' />");
      expect(output).not.to.include('hex=');
    });

    it('HEX mode: only the hex attribute, no r/g/b', async () => {
      const { output } = await actions.exportAsXML(themeData, 'HEX');
      expect(output).to.include("<color name='Jolly-Rancher-1' hex='D99F59' />");
      expect(output).not.to.include('r=');
      expect(output).not.to.include('g=');
      expect(output).not.to.include('b=');
    });

    it('defaults to RGB when no mode is given', async () => {
      const { output } = await actions.exportAsXML(themeData);
      expect(output).to.include("r='217' g='159' b='89'");
      expect(output).not.to.include('hex=');
    });

    it('produces well-formed XML that a strict parser accepts, in both RGB and HEX mode', async () => {
      const rgb = (await actions.exportAsXML(themeData, 'RGB')).output;
      const hex = (await actions.exportAsXML(themeData, 'HEX')).output;
      [rgb, hex].forEach((output) => {
        const doc = new DOMParser().parseFromString(output, 'application/xml');
        expect(doc.querySelector('parsererror'), `XML parse error in:\n${output}`).to.equal(null);
        expect(doc.documentElement.tagName).to.equal('palette');
        expect(doc.querySelectorAll('color').length).to.equal(themeData.swatches.length);
      });
    });

    it('regression: a theme name with an apostrophe still produces valid, parseable XML', async () => {
      const named = { name: "Tom's Palette", swatches: themeData.swatches };
      const { output } = await actions.exportAsXML(named, 'RGB');
      const doc = new DOMParser().parseFromString(output, 'application/xml');
      expect(doc.querySelector('parsererror'), `XML parse error in:\n${output}`).to.equal(null);
    });
  });
});
