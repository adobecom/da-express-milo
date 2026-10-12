/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import createRenderer, {
  classify, contrast, linearize, luminance, LUMINANCE,
} from '../../../express/code/blocks/color-image-contrast-checker/analysis.js';

describe('Image contrast analysis', () => {
  it('preserves prototype transfer behavior and exact classification boundaries', () => {
    expect(linearize(0.03928)).to.equal(0.03928 / 12.92);
    expect(linearize(0.04)).to.equal(((0.04 + 0.055) / 1.055) ** 2.4);
    expect(classify(4.5)).to.deep.equal([0, 255, 0]);
    expect(classify(4.49999)).to.deep.equal([0, 128, 242]);
    expect(classify(3)).to.deep.equal([0, 128, 242]);
    expect(classify(2.99999)).to.deep.equal([0, 0, 0]);
  });

  it('has normalized D65 luminance weights and symmetric ratios', () => {
    Object.keys(LUMINANCE).forEach((space) => {
      expect(luminance([255, 255, 255], space)).to.be.closeTo(1, 1e-9);
      expect(luminance([0, 0, 0], space)).to.equal(0);
    });
    expect(contrast(1, 0)).to.equal(21);
    expect(contrast(0, 1)).to.equal(21);
    expect(contrast(0.4, 0.4)).to.equal(1);
  });

  it('uses different red-primary luminance for P3, not a cosmetic selection', () => {
    const rgb = [182, 0, 0];
    const srgb = classify(contrast(luminance(rgb, 'srgb'), 0));
    const p3 = classify(contrast(luminance(rgb, 'display-p3'), 0));
    expect(srgb).not.to.deep.equal(p3);
    expect(() => luminance(rgb, 'unsupported')).to.throw('unsupportedProfile');
  });

  it('matches a CPU backward-neighborhood reference at every pixel, including edges', () => {
    const width = 3;
    const height = 3;
    const pixels = new Uint8Array([
      0, 0, 0, 0, 255, 255, 255, 255, 182, 0, 0, 255,
      100, 100, 100, 255, 0, 0, 0, 255, 255, 0, 0, 255,
      0, 255, 0, 255, 80, 80, 80, 255, 255, 255, 255, 255,
    ]);
    const canvas = document.createElement('canvas');
    const renderer = createRenderer(canvas);
    const gl = canvas.getContext('webgl');
    ['srgb', 'display-p3'].forEach((space) => {
      renderer.render({ width, height, pixels }, space);
      const actual = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, actual);
      const expected = [];
      for (let y = height - 1; y >= 0; y -= 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          const current = luminance([...pixels.slice(offset, offset + 3)], space);
          let greatest = 1;
          for (let dy = 0; dy < 3; dy += 1) {
            for (let dx = 0; dx < 3; dx += 1) {
              const neighbor = (Math.max(0, y - dy) * width + Math.max(0, x - dx)) * 4;
              greatest = Math.max(greatest, contrast(
                current,
                luminance([...pixels.slice(neighbor, neighbor + 3)], space),
              ));
            }
          }
          expected.push(...classify(greatest), 255);
        }
      }
      expect([...actual]).to.deep.equal(expected);
    });
    expect(canvas.width).to.equal(width);
    expect(canvas.height).to.equal(height);
    renderer.destroy();
  });

  it('rejects missing WebGL, excessive dimensions and invalid pixel buffers', () => {
    expect(() => createRenderer({ getContext: () => null })).to.throw('analysisError');
    const renderer = createRenderer(document.createElement('canvas'));
    expect(() => renderer.render({ width: 100000, height: 1, pixels: [] }, 'srgb'))
      .to.throw('imageTooLarge');
    expect(() => renderer.render({ width: 1, height: 1, pixels: [] }, 'srgb'))
      .to.throw('analysisError');
    renderer.destroy();
  });
});
