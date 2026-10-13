/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  decodeImage, identifyICC, inspectImage, MAX_FILE_BYTES, validateDimensions,
} from '../../../express/code/blocks/color-image-contrast-checker/image.js';
import {
  compressedICC, metadataPNG, pngChunk, profile, taggedImage,
} from './mocks/image-fixtures.js';

async function expectError(promise, message) {
  let failure;
  try {
    await promise;
  } catch (error) {
    failure = error;
  }
  expect(failure?.message).to.equal(message);
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

  it('recognizes Adobe RGB only with equivalent gamma curves on all three channels', () => {
    expect(identifyICC(profile('adobe-rgb'))).to.equal('adobe-rgb');
    expect(identifyICC(profile('adobe-rgb', { curveType: 'para' }))).to.equal('adobe-rgb');
    expect(() => identifyICC(profile('adobe-rgb', { gamma: 2.4 }))).to.throw('unsupportedProfile');
    expect(() => identifyICC(profile('adobe-rgb', { curveType: 'para', gamma: 2.2 })))
      .to.throw('unsupportedProfile');
    const missing = profile('adobe-rgb');
    missing[132 + 4 * 12] = 120;
    expect(() => identifyICC(missing)).to.throw('unsupportedProfile');
    const wrongGreen = profile('adobe-rgb');
    const greenView = new DataView(wrongGreen.buffer);
    greenView.setUint16(greenView.getUint32(136 + 5 * 12) + 12, 564);
    expect(() => identifyICC(wrongGreen)).to.throw('unsupportedProfile');
    const table = profile('adobe-rgb');
    const tableView = new DataView(table.buffer);
    tableView.setUint32(tableView.getUint32(136 + 4 * 12) + 8, 2);
    expect(() => identifyICC(table)).to.throw('unsupportedProfile');
    const lut = profile('adobe-rgb');
    lut.set(new TextEncoder().encode('A2B0'), 132 + 3 * 12);
    expect(() => identifyICC(lut)).to.throw('unsupportedProfile');
    const invalid = profile('adobe-rgb', { curveType: 'para' });
    const view = new DataView(invalid.buffer);
    view.setUint16(view.getUint32(136 + 4 * 12) + 8, 1);
    expect(() => identifyICC(invalid)).to.throw('unsupportedProfile');
    view.setUint32(136 + 4 * 12, invalid.length - 1);
    expect(() => identifyICC(invalid)).to.throw('unsupportedProfile');
  });

  for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
    it(`preserves encoded Adobe RGB channels and both owned URLs for ${type}`, async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 19;
      canvas.height = 7;
      const context = canvas.getContext('2d');
      context.fillStyle = 'rgb(160, 110, 40)';
      context.fillRect(0, 0, 19, 7);
      context.fillStyle = 'rgba(40, 120, 170, 0.75)';
      context.clearRect(10, 0, 9, 7);
      context.fillRect(10, 0, 9, 7);
      const blob = await new Promise((resolve) => { canvas.toBlob(resolve, type); });
      const baseline = await decodeImage(new File([blob], 'untagged', { type }));
      const file = new File([await taggedImage(blob)], 'adobe-rgb', { type });
      const create = sinon.spy(URL, 'createObjectURL');
      const revoke = sinon.spy(URL, 'revokeObjectURL');
      let input;
      try {
        input = await decodeImage(file);
        expect(input.colorSpace).to.equal('adobe-rgb');
        expect([input.width, input.height]).to.deep.equal([19, 7]);
        expect([...input.pixels]).to.deep.equal([...baseline.pixels]);
        expect(create.callCount).to.equal(2);
        expect(create.firstCall.args[0]).to.equal(file);
        expect(input.url).to.equal(create.firstCall.returnValue);
        expect(input.image.src).to.equal(create.secondCall.returnValue);
        const neutral = new Uint8Array(await create.secondCall.args[0].arrayBuffer());
        expect((await inspectImage(neutral, type)).colorSpace).to.equal('srgb');
        const original = new Image();
        original.src = input.url;
        await original.decode();
        context.clearRect(0, 0, 19, 7);
        context.drawImage(original, 0, 0);
        expect([...context.getImageData(0, 0, 19, 7).data]).not.to.deep.equal([...input.pixels]);
        input.destroy();
        expect(revoke.args.map(([url]) => url))
          .to.deep.equal([create.firstCall.returnValue, create.secondCall.returnValue]);
      } finally {
        create.restore();
        revoke.restore();
        input?.destroy();
        baseline.destroy();
      }
    });
  }

  it('releases both Adobe RGB URLs when native decoding fails', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 1;
    const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
    const file = new File([await taggedImage(blob)], 'bad-decode.png', { type: 'image/png' });
    const decode = sinon.stub(HTMLImageElement.prototype, 'decode').rejects(new Error('decodeFailure'));
    const create = sinon.spy(URL, 'createObjectURL');
    const revoke = sinon.spy(URL, 'revokeObjectURL');
    try {
      await expectError(decodeImage(file), 'decodeFailure');
      expect(create.callCount).to.equal(2);
      expect(revoke.args.map(([url]) => url))
        .to.deep.equal([create.firstCall.returnValue, create.secondCall.returnValue]);
    } finally {
      decode.restore();
      create.restore();
      revoke.restore();
    }
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
    const adobe = await compressedICC(profile('adobe-rgb'));
    const p3 = pngChunk('cICP', new Uint8Array([12, 13, 0, 1]));
    expect((await inspectImage(metadataPNG([srgb]), 'image/png')).colorSpace).to.equal('srgb');
    expect((await inspectImage(metadataPNG([p3]), 'image/png')).colorSpace).to.equal('display-p3');
    expect((await inspectImage(metadataPNG([adobe]), 'image/png')).colorSpace).to.equal('adobe-rgb');
    await expectError(inspectImage(metadataPNG([adobe, p3]), 'image/png'), 'unsupportedProfile');
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
