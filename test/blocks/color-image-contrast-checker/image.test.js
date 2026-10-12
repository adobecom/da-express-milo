/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  decodeImage, identifyICC, inspectImage, MAX_FILE_BYTES, validateDimensions,
} from '../../../express/code/blocks/color-image-contrast-checker/image.js';

function profile(space) {
  const bytes = new Uint8Array(228);
  const view = new DataView(bytes.buffer);
  const write = (offset, text) => [...text].forEach((char, i) => {
    bytes[offset + i] = char.charCodeAt(0);
  });
  view.setUint32(0, bytes.length);
  write(16, 'RGB ');
  write(20, 'XYZ ');
  write(36, 'acsp');
  view.setUint32(128, 3);
  const values = space === 'srgb'
    ? [[0.436075, 0.222505, 0.013932], [0.385065, 0.716879, 0.097105],
      [0.14308, 0.060617, 0.714173]]
    : [[0.515102, 0.241182, -0.001049], [0.291965, 0.692236, 0.041882],
      [0.157153, 0.066581, 0.784378]];
  ['rXYZ', 'gXYZ', 'bXYZ'].forEach((tag, index) => {
    const offset = 168 + index * 20;
    write(132 + index * 12, tag);
    view.setUint32(136 + index * 12, offset);
    view.setUint32(140 + index * 12, 20);
    write(offset, 'XYZ ');
    values[index].forEach((value, channel) => {
      view.setInt32(offset + 8 + channel * 4, Math.round(value * 65536));
    });
  });
  return bytes;
}

async function expectError(promise, message) {
  let failure;
  try {
    await promise;
  } catch (error) {
    failure = error;
  }
  expect(failure?.message).to.equal(message);
}

function pngChunk(tag, data) {
  const bytes = new Uint8Array(data.length + 12);
  new DataView(bytes.buffer).setUint32(0, data.length);
  [...tag].forEach((char, index) => { bytes[index + 4] = char.charCodeAt(0); });
  bytes.set(data, 8);
  return bytes;
}

function metadataPNG(chunks) {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, 11);
  view.setUint32(4, 7);
  const pieces = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header), ...chunks, pngChunk('IEND', new Uint8Array()),
  ];
  const bytes = new Uint8Array(pieces.reduce((sum, piece) => sum + piece.length, 0));
  let offset = 0;
  pieces.forEach((piece) => {
    bytes.set(piece, offset);
    offset += piece.length;
  });
  return bytes;
}

async function compressedICC(icc) {
  const stream = new Blob([icc]).stream().pipeThrough(new CompressionStream('deflate'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  const bytes = new Uint8Array(compressed.length + 3);
  bytes[0] = 112;
  bytes.set(compressed, 3);
  return pngChunk('iCCP', bytes);
}

describe('Image contrast input', () => {
  it('identifies sRGB/P3 primaries and rejects corrupt or unsupported profiles', () => {
    expect(identifyICC(profile('srgb'))).to.equal('srgb');
    expect(identifyICC(profile('p3'))).to.equal('display-p3');
    expect(() => identifyICC(new Uint8Array(20))).to.throw('unsupportedProfile');
    const wrong = profile('p3');
    new DataView(wrong.buffer).setInt32(176, 0);
    expect(() => identifyICC(wrong)).to.throw('unsupportedProfile');
    new DataView(wrong.buffer).setUint32(128, 100000);
    expect(() => identifyICC(wrong)).to.throw('unsupportedProfile');
  });

  it('enforces file and pixel limits before decoding', async () => {
    await expectError(decodeImage(new File(['bad'], 'bad.txt', { type: 'text/plain' })), 'unsupportedFile');
    await expectError(decodeImage({ type: 'image/png', size: MAX_FILE_BYTES + 1 }), 'fileTooLarge');
    expect(() => validateDimensions(5000, 5000)).to.throw('imageTooLarge');
    expect(() => validateDimensions(400, 200, 256)).to.throw('imageTooLarge');
    expect(() => validateDimensions(0, 2)).to.throw('imageTooLarge');
    expect(() => validateDimensions(4000, 4000)).not.to.throw();
    expect(() => validateDimensions(4000, 4001)).to.throw('imageTooLarge');
    expect(() => validateDimensions(-1, 2)).to.throw('imageTooLarge');
  });

  it('decodes an untagged full-size PNG in sRGB', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 11;
    canvas.height = 7;
    canvas.getContext('2d').fillRect(0, 0, 11, 7);
    const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
    const file = new File([blob], 'source.png', { type: 'image/png' });
    const input = await decodeImage(file);
    expect(input.colorSpace).to.equal('srgb');
    expect([input.width, input.height]).to.deep.equal([11, 7]);
    expect(input.pixels.length).to.equal(11 * 7 * 4);
    input.destroy();
    await expectError(inspectImage(new Uint8Array([137, 80]), 'image/png'), 'unsupportedFile');
  });

  it('detects and decodes the real tagged P3 fixture at its native dimensions', async () => {
    const response = await fetch('/nala/assets/test-image.png');
    expect(response.ok).to.equal(true);
    const input = await decodeImage(new File([await response.blob()], 'p3.png', { type: 'image/png' }));
    expect(input.colorSpace).to.equal('display-p3');
    expect([input.width, input.height]).to.deep.equal([2122, 1556]);
    input.destroy();
  });

  it('rejects malformed JPEG/WebP headers rather than assuming sRGB', async () => {
    await expectError(inspectImage(new Uint8Array([1, 2, 3]), 'image/jpeg'), 'unsupportedFile');
    await expectError(inspectImage(new Uint8Array(24), 'image/webp'), 'unsupportedFile');
  });

  it('decodes real browser-generated JPEG and WebP files without downsampling', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 19;
    canvas.height = 7;
    canvas.getContext('2d').fillRect(0, 0, 19, 7);
    for (const type of ['image/jpeg', 'image/webp']) {
      const blob = await new Promise((resolve) => { canvas.toBlob(resolve, type); });
      expect(blob.type).to.equal(type);
      const input = await decodeImage(new File([blob], 'source', { type }));
      expect([input.width, input.height, input.colorSpace]).to.deep.equal([19, 7, 'srgb']);
      input.destroy();
    }
  });

  it('supports JPEG fill bytes and rejects incomplete ICC segments', async () => {
    const sof = [255, 255, 192, 0, 8, 8, 0, 7, 0, 19, 0];
    const bytes = new Uint8Array([255, 216, ...sof, 255, 217]);
    expect(await inspectImage(bytes, 'image/jpeg')).to.deep.equal({
      colorSpace: 'srgb', width: 19, height: 7,
    });
    const signature = [...'ICC_PROFILE\0'].map((char) => char.charCodeAt(0));
    const incomplete = new Uint8Array([
      255, 216, 255, 226, 0, 16, ...signature, 1, 2, ...sof, 255, 217,
    ]);
    await expectError(inspectImage(incomplete, 'image/jpeg'), 'unsupportedProfile');
  });

  it('reads PNG profiles and rejects conflicting or duplicate declarations', async () => {
    const srgb = await compressedICC(profile('srgb'));
    const p3 = pngChunk('cICP', new Uint8Array([12, 13, 0, 1]));
    expect((await inspectImage(metadataPNG([srgb]), 'image/png')).colorSpace).to.equal('srgb');
    expect((await inspectImage(metadataPNG([p3]), 'image/png')).colorSpace).to.equal('display-p3');
    await expectError(inspectImage(metadataPNG([srgb, p3]), 'image/png'), 'unsupportedProfile');
    await expectError(inspectImage(metadataPNG([srgb, srgb]), 'image/png'), 'unsupportedProfile');
    const invalid = pngChunk('cICP', new Uint8Array([12, 16, 0, 1]));
    await expectError(inspectImage(metadataPNG([invalid]), 'image/png'), 'unsupportedProfile');
  });

  it('accepts exactly 4 MiB of ICC data and cancels inflation above that limit', async () => {
    const limit = 4 * 1024 * 1024;
    const valid = new Uint8Array(limit);
    valid.set(profile('srgb'));
    new DataView(valid.buffer).setUint32(0, valid.length);
    const atLimit = metadataPNG([await compressedICC(valid)]);
    expect((await inspectImage(atLimit, 'image/png')).colorSpace).to.equal('srgb');
    const tooLarge = new Uint8Array(limit + 1);
    tooLarge.set(valid);
    new DataView(tooLarge.buffer).setUint32(0, tooLarge.length);
    const oversized = metadataPNG([await compressedICC(tooLarge)]);
    const cancel = sinon.spy(ReadableStreamDefaultReader.prototype, 'cancel');
    try {
      await expectError(inspectImage(oversized, 'image/png'), 'unsupportedProfile');
      expect(cancel.calledOnce).to.equal(true);
    } finally {
      cancel.restore();
    }
  });
});
