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
