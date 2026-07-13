import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { EasyUpload } from '../../../express/code/scripts/utils/easy-upload-utils.js';
import { createTag } from '../../../express/code/scripts/utils.js';

if (!window.QRCodeStyling) {
  window.QRCodeStyling = class {};
}

describe('EasyUpload failure handling', () => {
  let uploadService;
  let startSDKStub;
  let showErrorToast;
  let instances;

  beforeEach(() => {
    uploadService = {};
    startSDKStub = sinon.stub();
    showErrorToast = sinon.stub();
    instances = [];
  });

  afterEach(async () => {
    await Promise.all(instances.map(async (instance) => {
      window.removeEventListener('beforeunload', instance.handleBeforeUnload);
      await instance.cleanup();
    }));
    document.body.innerHTML = '';
    sinon.restore();
  });

  function createInstance(overrides = {}) {
    const block = document.createElement('div');
    document.body.appendChild(block);
    const instance = new EasyUpload(
      overrides.uploadService || uploadService,
      overrides.envName || 'prod',
      overrides.quickAction || 'remove-background',
      block,
      overrides.startSDKWithUnconvertedFiles || startSDKStub,
      createTag,
      showErrorToast,
      'qrError',
    );
    instance.confirmButton = document.createElement('button');
    instances.push(instance);
    return instance;
  }

  it('re-enables the confirm button when finalizeUpload fails', async () => {
    const easyUpload = createInstance();
    sinon.stub(easyUpload, 'finalizeUpload').rejects(new Error('finalize failed'));

    await easyUpload.handleConfirmImport();

    expect(easyUpload.confirmButton.classList.contains('disabled')).to.be.false;
    expect(startSDKStub.called).to.be.false;
  });

  it('refreshes the QR code when retrieving the uploaded file fails', async () => {
    const easyUpload = createInstance();
    sinon.stub(easyUpload, 'finalizeUpload').resolves();
    const refreshSpy = sinon.stub(easyUpload, 'refreshQRCode').resolves();
    sinon.stub(easyUpload, 'retrieveUploadedFile').rejects(new Error('download failed'));

    await easyUpload.handleConfirmImport();

    expect(refreshSpy.calledOnce).to.be.true;
    expect(startSDKStub.called).to.be.false;
  });

  it('marks the QR code as consumed after confirm import is pressed', async () => {
    const easyUpload = createInstance();
    sinon.stub(easyUpload, 'finalizeUpload').resolves();
    sinon.stub(easyUpload, 'retrieveUploadedFile').resolves(
      new File(['file-content'], 'upload.png', { type: 'image/png' }),
    );

    await easyUpload.handleConfirmImport();

    expect(easyUpload.isQrCodeConsumed()).to.be.true;
    expect(startSDKStub.calledOnce).to.be.true;
  });

  it('marks the QR code as fresh after regenerating it', async () => {
    const easyUpload = createInstance();
    easyUpload.markQrCodeConsumed();
    sinon.stub(easyUpload, 'generateUploadUrl').resolves('https://example.com/upload');
    sinon.stub(easyUpload, 'displayQRCode').resolves();
    sinon.stub(easyUpload, 'scheduleQRRefresh');

    await easyUpload.initializeQRCode();

    expect(easyUpload.isQrCodeConsumed()).to.be.false;
  });

  it('resetUploadSession clears polling intervals and resets upload state', async () => {
    const easyUpload = createInstance();
    easyUpload.qrRefreshInterval = setTimeout(() => {}, 10000);
    easyUpload.pollingInterval = setInterval(() => {}, 10000);
    easyUpload.uploadFinalized = true;
    easyUpload.uploadDetected = true;
    const versionReject = sinon.stub();
    easyUpload.versionReadyPromise = { reject: versionReject };
    sinon.stub(easyUpload, 'stopUploadDetectionPolling');
    sinon.stub(easyUpload, 'cleanupAcpStorage').resolves();

    await easyUpload.resetUploadSession();

    expect(easyUpload.qrRefreshInterval).to.be.null;
    expect(easyUpload.pollingInterval).to.be.null;
    expect(easyUpload.uploadFinalized).to.be.false;
    expect(easyUpload.uploadDetected).to.be.false;
    expect(versionReject.calledOnce).to.be.true;
    expect(easyUpload.versionReadyPromise).to.be.null;
  });

  describe('corrupted image detection', () => {
    const FAILED_MSG = 'We are having trouble processing the file. Please try another file.';

    function bytesToArrayBuffer(bytes) {
      return new Uint8Array(bytes).buffer;
    }

    async function createValidPngBlob() {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
    }

    function stubReadyDownload(instance, blob) {
      sinon.stub(instance, 'waitForAssetVersionReady').resolves();
      instance.versionReadyPromise = null;
      instance.asset = {};
      instance.uploadService = { downloadAssetContent: sinon.stub().resolves(blob) };
    }

    it('detects MIME type from magic bytes and rejects unknown content', () => {
      const easyUpload = createInstance();
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )).to.equal('image/png');
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0xff, 0xd8, 0xff, 0xe0]),
      )).to.equal('image/jpeg');
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
      )).to.equal('image/gif');
      // "RIFF....WEBP"
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
      )).to.equal('image/webp');
      // RIFF is also used by WAV and AVI and is not sufficient by itself.
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]),
      )).to.be.null;
      // ISO-BMFF's ftyp box is shared by HEIC, MP4, MOV, and AVIF.
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]),
      )).to.equal('image/heic');
      // HEIC may use a generic mif1 major brand and a compatible HEIC brand.
      expect(easyUpload.detectFileTypeFromBytes(bytesToArrayBuffer([
        0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70,
        0x6d, 0x69, 0x66, 0x31, 0, 0, 0, 0,
        0x68, 0x65, 0x69, 0x63,
      ]))).to.equal('image/heic');
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
      )).to.be.null;
      // A generic HEIF-compatible AVIF is not HEIC.
      expect(easyUpload.detectFileTypeFromBytes(bytesToArrayBuffer([
        0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70,
        0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0,
        0x6d, 0x69, 0x66, 0x31,
      ]))).to.be.null;
      // An XML declaration does not make an arbitrary XML document an SVG.
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([...new TextEncoder().encode('<?xml version="1.0"?><root/>')]),
      )).to.be.null;
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([...new TextEncoder().encode('<?xml version="1.0"?><!-- exported --><svg/>')]),
      )).to.equal('image/svg+xml');
      // No recognized signature => corrupted/unsupported
      expect(easyUpload.detectFileTypeFromBytes(
        bytesToArrayBuffer([0x00, 0x11, 0x22, 0x33, 0x44]),
      )).to.be.null;
    });

    it('validateImageIntegrity rejects an undecodable image', async () => {
      const easyUpload = createInstance();
      // Valid PNG signature but garbage body -> cannot decode.
      const corrupt = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])], { type: 'image/png' });
      let threw = false;
      try {
        await easyUpload.validateImageIntegrity(corrupt, 'image/png');
      } catch (error) {
        threw = true;
        expect(error.message).to.contain('Corrupted');
      }
      expect(threw).to.be.true;
    });

    it('validateImageIntegrity rejects truncated SVG markup', async () => {
      const easyUpload = createInstance();
      const corrupt = new Blob(['<svg><path>'], { type: 'image/svg+xml' });

      try {
        await easyUpload.validateImageIntegrity(corrupt, 'image/svg+xml');
        expect.fail('Expected validateImageIntegrity to throw');
      } catch (error) {
        expect(error.message).to.contain('SVG');
      }
    });

    it('does not require browser-native HEIC decoding', async () => {
      const easyUpload = createInstance();
      const createImageBitmapStub = sinon.stub(window, 'createImageBitmap').rejects(
        new Error('HEIC decoder unavailable'),
      );

      await easyUpload.validateImageIntegrity(new Blob(['heic']), 'image/heic');

      expect(createImageBitmapStub.called).to.be.false;
    });

    it('restarts upload polling with Confirm disabled after QR refresh', async () => {
      const easyUpload = createInstance();
      easyUpload.confirmButton.classList.remove('disabled');
      sinon.stub(easyUpload, 'cleanup').resolves();
      sinon.stub(easyUpload, 'initializeQRCode').resolves();
      const startPollingSpy = sinon.spy(easyUpload, 'startUploadDetectionPolling');

      await easyUpload.refreshQRCode();
      easyUpload.cleanup.restore();

      expect(startPollingSpy.calledOnce).to.be.true;
      expect(easyUpload.confirmButton.classList.contains('disabled')).to.be.true;
    });

    it('retrieveUploadedFile rejects an empty upload', async () => {
      const easyUpload = createInstance();
      stubReadyDownload(easyUpload, new Blob([]));
      try {
        await easyUpload.retrieveUploadedFile();
        expect.fail('Expected retrieveUploadedFile to throw');
      } catch (error) {
        expect(error.message).to.contain('empty');
      }
    });

    it('retrieveUploadedFile rejects content without a valid image signature', async () => {
      const easyUpload = createInstance();
      stubReadyDownload(easyUpload, new Blob([new Uint8Array([0, 1, 2, 3, 4, 5])]));
      try {
        await easyUpload.retrieveUploadedFile();
        expect.fail('Expected retrieveUploadedFile to throw');
      } catch (error) {
        expect(error.message).to.contain('corrupted');
      }
    });

    it('retrieveUploadedFile returns a typed File for a valid image', async () => {
      const easyUpload = createInstance();
      stubReadyDownload(easyUpload, await createValidPngBlob());
      const file = await easyUpload.retrieveUploadedFile();
      expect(file).to.be.instanceOf(File);
      expect(file.type).to.equal('image/png');
    });

    it('shows the authored error tooltip when a corrupted file is confirmed', async () => {
      const easyUpload = createInstance();
      const tooltip = document.createElement('div');
      tooltip.classList.add('hidden');
      easyUpload.setConfirmTooltipConfig({
        element: tooltip,
        messages: { failed: FAILED_MSG },
      });
      sinon.stub(easyUpload, 'finalizeUpload').resolves();
      sinon.stub(easyUpload, 'refreshQRCode').resolves();
      sinon.stub(easyUpload, 'retrieveUploadedFile').rejects(
        new Error('Unrecognized or corrupted file: no valid image signature'),
      );

      await easyUpload.handleConfirmImport();

      expect(tooltip.textContent).to.equal(FAILED_MSG);
      expect(tooltip.classList.contains('hidden')).to.be.false;
      expect(tooltip.classList.contains('hover')).to.be.true;
      expect(startSDKStub.called).to.be.false;
    });
  });

  it('propagates initializeBlockUpload failures during URL generation', async () => {
    const createAssetStub = sinon.stub().resolves({ links: {} });
    const initializeBlockUploadStub = sinon.stub().rejects(new Error('init failed'));
    const easyUpload = createInstance({
      uploadService: {
        createAsset: createAssetStub,
        initializeBlockUpload: initializeBlockUploadStub,
      },
    });

    try {
      await easyUpload.generatePresignedUploadUrl();
      expect.fail('Expected generatePresignedUploadUrl to throw');
    } catch (error) {
      expect(error.message).to.equal('init failed');
    }
  });
});
