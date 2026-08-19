/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  EXTRACT_CANVAS_MAX,
  isFileDrag,
  preventDefaults,
  toHex,
  samplePalette,
  drawImageToCanvas,
  extractPaletteFromImageElement,
  applyPaletteToChips,
  applyGradientToBar,
  getPictureSource,
  syncMarkersToImage,
} from '../../../../express/code/scripts/color-shared/utils/imageExtractUtils.js';

const TINY_GIF = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

function makeImage(naturalWidth, naturalHeight) {
  const img = document.createElement('img');
  Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: naturalHeight, configurable: true });
  return img;
}

function solidCanvas(color, w = 4, h = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return ctx;
}

describe('imageExtractUtils', () => {
  afterEach(() => sinon.restore());

  describe('EXTRACT_CANVAS_MAX', () => {
    it('is 320', () => {
      expect(EXTRACT_CANVAS_MAX).to.equal(320);
    });
  });

  describe('isFileDrag', () => {
    it('returns true when dataTransfer contains Files type', () => {
      expect(isFileDrag({ dataTransfer: { types: ['Files'] } })).to.be.true;
    });

    it('returns false when dataTransfer has no Files type', () => {
      expect(isFileDrag({ dataTransfer: { types: ['text/plain'] } })).to.be.false;
    });

    it('returns falsy when dataTransfer is absent', () => {
      expect(isFileDrag({})).to.not.be.ok;
    });

    it('returns true when Files appears among multiple types', () => {
      expect(isFileDrag({ dataTransfer: { types: ['text/uri-list', 'Files'] } })).to.be.true;
    });
  });

  describe('preventDefaults', () => {
    it('calls preventDefault and stopPropagation', () => {
      const event = { preventDefault: sinon.spy(), stopPropagation: sinon.spy() };
      preventDefaults(event);
      expect(event.preventDefault.calledOnce).to.be.true;
      expect(event.stopPropagation.calledOnce).to.be.true;
    });
  });

  describe('toHex', () => {
    it('converts black to #000000', () => {
      expect(toHex(0, 0, 0)).to.equal('#000000');
    });

    it('converts white to #FFFFFF', () => {
      expect(toHex(255, 255, 255)).to.equal('#FFFFFF');
    });

    it('converts pure red to #FF0000', () => {
      expect(toHex(255, 0, 0)).to.equal('#FF0000');
    });

    it('produces uppercase hex', () => {
      expect(toHex(171, 205, 239)).to.equal('#ABCDEF');
    });

    it('pads single-digit channel values', () => {
      expect(toHex(0, 0, 1)).to.equal('#000001');
    });
  });

  describe('samplePalette', () => {
    it('returns array with requested number of colors', () => {
      expect(samplePalette(solidCanvas('#FF0000', 10, 10), 10, 10, 5)).to.have.length(5);
    });

    it('each entry is an uppercase hex string', () => {
      const [color] = samplePalette(solidCanvas('#00FF00'), 4, 4, 1);
      expect(color).to.match(/^#[0-9A-F]{6}$/);
    });

    it('samples the correct color from a solid red canvas', () => {
      const [color] = samplePalette(solidCanvas('#FF0000'), 4, 4, 1);
      expect(color).to.equal('#FF0000');
    });

    it('returns count=1 without error', () => {
      expect(samplePalette(solidCanvas('#0000FF'), 4, 4, 1)).to.have.length(1);
    });
  });

  describe('drawImageToCanvas', () => {
    it('returns a canvas element', () => {
      expect(drawImageToCanvas(makeImage(50, 50)).tagName).to.equal('CANVAS');
    });

    it('caps width at EXTRACT_CANVAS_MAX for large images', () => {
      const canvas = drawImageToCanvas(makeImage(1000, 500));
      expect(canvas.width).to.equal(320);
    });

    it('preserves aspect ratio when capping at EXTRACT_CANVAS_MAX', () => {
      const canvas = drawImageToCanvas(makeImage(1000, 500));
      expect(canvas.height).to.equal(160);
    });

    it('preserves original width for images smaller than EXTRACT_CANVAS_MAX', () => {
      const canvas = drawImageToCanvas(makeImage(100, 200));
      expect(canvas.width).to.equal(100);
      expect(canvas.height).to.equal(200);
    });

    it('uses exactly EXTRACT_CANVAS_MAX when image width equals it', () => {
      const canvas = drawImageToCanvas(makeImage(320, 240));
      expect(canvas.width).to.equal(320);
      expect(canvas.height).to.equal(240);
    });
  });

  describe('extractPaletteFromImageElement', () => {
    it('returns null when image has no naturalWidth', () => {
      expect(extractPaletteFromImageElement(makeImage(0, 100), 5)).to.be.null;
    });

    it('returns null when image has no naturalHeight', () => {
      expect(extractPaletteFromImageElement(makeImage(100, 0), 5)).to.be.null;
    });

    it('returns null for null input', () => {
      expect(extractPaletteFromImageElement(null, 5)).to.be.null;
    });

    it('returns array of hex strings for a real loaded image', async () => {
      const img = new Image();
      img.src = TINY_GIF;
      await new Promise((resolve) => { img.onload = resolve; });
      const result = extractPaletteFromImageElement(img, 3);
      expect(result).to.be.an('array').with.length(3);
      result.forEach((hex) => expect(hex).to.match(/^#[0-9A-F]{6}$/));
    });
  });

  describe('applyPaletteToChips', () => {
    function makeChips(n) {
      return Array.from({ length: n }, () => document.createElement('span'));
    }

    it('sets background style on each chip', () => {
      const chips = makeChips(3);
      applyPaletteToChips(['#FF0000', '#00FF00', '#0000FF'], chips);
      expect(chips[0].style.background).to.include('255');
      expect(chips[1].style.background).to.include('255');
      expect(chips[2].style.background).to.include('255');
    });

    it('does nothing when colors is null', () => {
      const chips = makeChips(2);
      applyPaletteToChips(null, chips);
      chips.forEach((chip) => expect(chip.style.background).to.equal(''));
    });

    it('does nothing when chips is empty', () => {
      expect(() => applyPaletteToChips(['#FF0000'], [])).to.not.throw();
    });

    it('skips chip indices beyond the colors array', () => {
      const chips = makeChips(3);
      applyPaletteToChips(['#FF0000'], chips);
      expect(chips[0].style.background).to.not.equal('');
      expect(chips[1].style.background).to.equal('');
      expect(chips[2].style.background).to.equal('');
    });
  });

  describe('applyGradientToBar', () => {
    it('sets backgroundImage as a linear gradient', () => {
      const bar = document.createElement('div');
      applyGradientToBar(['#FF0000', '#0000FF'], bar);
      expect(bar.style.backgroundImage).to.include('linear-gradient');
    });

    it('includes both color stops in the gradient', () => {
      const bar = document.createElement('div');
      applyGradientToBar(['#FF0000', '#0000FF'], bar);
      // Browsers normalize hex to rgb() in computed style
      expect(bar.style.backgroundImage).to.match(/255.*0.*0|rgb\(255/);
      expect(bar.style.backgroundImage).to.match(/0.*0.*255|rgb\(0.*0.*255/);
    });

    it('positions first stop at 0% and last at 100%', () => {
      const bar = document.createElement('div');
      applyGradientToBar(['#FF0000', '#00FF00', '#0000FF'], bar);
      expect(bar.style.backgroundImage).to.include('0%');
      expect(bar.style.backgroundImage).to.include('100%');
    });

    it('does nothing when colors array is empty', () => {
      const bar = document.createElement('div');
      applyGradientToBar([], bar);
      expect(bar.style.backgroundImage).to.equal('');
    });

    it('does nothing when bar is null', () => {
      expect(() => applyGradientToBar(['#FF0000'], null)).to.not.throw();
    });
  });

  describe('getPictureSource', () => {
    it('returns src attribute from img inside picture', () => {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', '/path/to/image.jpg');
      pic.append(img);
      expect(getPictureSource(pic)).to.equal('/path/to/image.jpg');
    });

    it('prefers currentSrc over src attribute', () => {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', '/fallback.jpg');
      Object.defineProperty(img, 'currentSrc', { value: '/current.jpg', configurable: true });
      pic.append(img);
      expect(getPictureSource(pic)).to.equal('/current.jpg');
    });

    it('falls back to data-src when src is absent', () => {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.dataset.src = '/lazy.jpg';
      pic.append(img);
      expect(getPictureSource(pic)).to.equal('/lazy.jpg');
    });

    it('extracts first URL from source srcset when direct src is absent', () => {
      const pic = document.createElement('picture');
      const source = document.createElement('source');
      source.setAttribute('srcset', '/img-400.jpg 400w, /img-800.jpg 800w');
      pic.append(source);
      expect(getPictureSource(pic)).to.equal('/img-400.jpg');
    });

    it('returns empty string for null input', () => {
      expect(getPictureSource(null)).to.equal('');
    });
  });

  describe('syncMarkersToImage', () => {
    let container;
    let img;
    let overlay;

    beforeEach(() => {
      container = document.createElement('div');
      img = makeImage(400, 200);
      container.append(img);
      document.body.append(container);
      overlay = document.createElement('div');
    });

    afterEach(() => {
      container.remove();
    });

    it('does not set overlay styles when container has no img', () => {
      const empty = document.createElement('div');
      document.body.append(empty);
      syncMarkersToImage(overlay, empty);
      expect(overlay.style.left).to.equal('');
      empty.remove();
    });

    it('does not set overlay styles when img naturalWidth is 0', () => {
      Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
      syncMarkersToImage(overlay, container);
      expect(overlay.style.left).to.equal('');
    });

    it('does not set overlay styles when layout rect is zero-size', () => {
      sinon.stub(container, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 0, height: 0 });
      sinon.stub(img, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 0, height: 0 });
      syncMarkersToImage(overlay, container);
      expect(overlay.style.left).to.equal('');
    });

    it('positions overlay with top offset for a wider-than-box image (letterbox)', () => {
      // naturalWidth=400, naturalHeight=200 → imgRatio=2; box 400×300 → boxRatio≈1.33
      // imgRatio > boxRatio: renderW=400, renderH=200, offsetY=(300-200)/2=50
      sinon.stub(container, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 400, height: 300 });
      sinon.stub(img, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 400, height: 300 });
      syncMarkersToImage(overlay, container);
      expect(overlay.style.top).to.equal('50px');
      expect(overlay.style.left).to.equal('0px');
      expect(overlay.style.width).to.equal('400px');
      expect(overlay.style.height).to.equal('200px');
    });

    it('positions overlay with left offset for a taller-than-box image (pillarbox)', () => {
      // naturalWidth=100, naturalHeight=200 → imgRatio=0.5; box 400×300 → boxRatio≈1.33
      // imgRatio < boxRatio: renderH=300, renderW=150, offsetX=(400-150)/2=125
      Object.defineProperty(img, 'naturalWidth', { value: 100, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 200, configurable: true });
      sinon.stub(container, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 400, height: 300 });
      sinon.stub(img, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 400, height: 300 });
      syncMarkersToImage(overlay, container);
      expect(overlay.style.left).to.equal('125px');
      expect(overlay.style.top).to.equal('0px');
      expect(overlay.style.width).to.equal('150px');
      expect(overlay.style.height).to.equal('300px');
    });

    it('accounts for container offset when img rect differs from container rect', () => {
      sinon.stub(container, 'getBoundingClientRect').returns({ left: 10, top: 20, width: 400, height: 300 });
      sinon.stub(img, 'getBoundingClientRect').returns({ left: 10, top: 20, width: 400, height: 300 });
      syncMarkersToImage(overlay, container);
      // relLeft = (10-10) + 0 = 0, relTop = (20-20) + 50 = 50
      expect(overlay.style.left).to.equal('0px');
      expect(overlay.style.top).to.equal('50px');
    });

    it('uses explicit left/top/width/height positioning (not CSS inset shorthand)', () => {
      sinon.stub(container, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 400, height: 300 });
      sinon.stub(img, 'getBoundingClientRect').returns({ left: 0, top: 0, width: 400, height: 300 });
      syncMarkersToImage(overlay, container);
      expect(overlay.style.left).to.not.equal('');
      expect(overlay.style.top).to.not.equal('');
      expect(overlay.style.width).to.not.equal('');
      expect(overlay.style.height).to.not.equal('');
    });
  });
});
