import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { EasyUpload } from '../../../express/code/scripts/utils/easy-upload-utils.js';
import { createTag } from '../../../express/code/scripts/utils.js';

if (!window.QRCodeStyling) {
  window.QRCodeStyling = class {};
}

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => 'test-uuid';
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
