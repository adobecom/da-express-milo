/* eslint-disable no-underscore-dangle -- _satellite is an Adobe global, not our naming */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  EasyUpload,
  EasyUploadVariants,
  EasyUploadControls,
} from '../../../express/code/scripts/utils/easy-upload-utils.js';
import {
  isEasyUploadExperimentEnabled,
  isEasyUploadControlExperimentEnabled,
  notifyEasyUploadSdkInitialization,
  refreshEasyUploadQrIfConsumed,
  setupEasyUploadUI,
  cleanupEasyUpload,
} from '../../../express/code/blocks/frictionless-quick-action/easy-upload-files/easy-upload.js';
import { createTag } from '../../../express/code/scripts/utils.js';

function buildEasyUploadBlock() {
  const block = document.createElement('div');
  const dropzoneContainer = document.createElement('div');
  dropzoneContainer.className = 'dropzone-container';
  const dropzone = document.createElement('div');
  dropzone.className = 'dropzone';
  dropzoneContainer.appendChild(dropzone);

  const input = document.createElement('input');
  input.type = 'file';
  dropzone.appendChild(input);

  ['Upload from computer', 'Use phone QR'].forEach((label) => {
    const wrapper = document.createElement('p');
    wrapper.className = 'button-container';
    const button = document.createElement('a');
    button.className = 'button';
    button.textContent = label;
    wrapper.appendChild(button);
    dropzone.appendChild(wrapper);
  });

  block.appendChild(dropzoneContainer);

  const paneRow = document.createElement('div');
  paneRow.innerHTML = `
    <div>
      <p>Heading</p>
      <p>Step 1</p>
      <p><a href="#">Confirm</a></p>
      <p>Tooltip text</p>
      <p>Error text</p>
    </div>
    <div>
      <p>QR error</p>
      <p>Question</p>
      <p>Tooltip help</p>
      <p>Secondary paragraph</p>
    </div>
  `;
  block.appendChild(paneRow);

  document.body.appendChild(block);
  return block;
}

async function waitFor(condition, attempts = 20) {
  for (let index = 0; index < attempts; index += 1) {
    if (condition()) {
      return true;
    }
    // Allow async listeners/imports to settle.
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  }
  return false;
}

describe('Easy Upload module', () => {
  beforeEach(() => {
    if (!window.QRCodeStyling) {
      window.QRCodeStyling = class {};
    }
  });

  afterEach(() => {
    cleanupEasyUpload();
    document.body.innerHTML = '';
    sinon.restore();
  });

  it('detects experiment variants and controls', () => {
    expect(
      isEasyUploadExperimentEnabled(EasyUploadVariants.removeBackgroundEasyUploadVariant),
    ).to.be.true;
    expect(
      isEasyUploadControlExperimentEnabled(EasyUploadControls.removeBackgroundEasyUploadControl),
    ).to.be.true;
    expect(isEasyUploadExperimentEnabled('convert-to-jpg')).to.be.false;
    expect(isEasyUploadControlExperimentEnabled('resize-image')).to.be.false;
  });

  it('decorates the block when an easy upload variant is used', async () => {
    const block = buildEasyUploadBlock();
    const loadStyleSpy = sinon.spy((href, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });

    await setupEasyUploadUI({
      quickAction: EasyUploadVariants.removeBackgroundEasyUploadVariant,
      block,
      getConfig: () => ({ codeRoot: '/express/code', env: { name: 'stage' } }),
      loadStyle: loadStyleSpy,
      initializeUploadService: sinon.stub().resolves({}),
      startSDKWithUnconvertedFiles: sinon.stub(),
      createTag,
      showErrorToast: sinon.stub(),
    });

    expect(block.querySelector('.easy-upload-cta-row')).to.exist;
    expect(block.querySelector('.easy-upload-or')).to.exist;
    expect(block.querySelector('.dropzone').classList.contains('easy-upload-initial')).to.be.true;
    expect(loadStyleSpy.callCount).to.equal(2);
  });

  it('skips decoration when the quick action is not part of the experiment', async () => {
    const block = buildEasyUploadBlock();
    const result = await setupEasyUploadUI({
      quickAction: 'convert-to-jpg',
      block,
      getConfig: () => ({ codeRoot: '/express/code', env: { name: 'prod' } }),
      loadStyle: sinon.stub(),
      initializeUploadService: sinon.stub().resolves({}),
      startSDKWithUnconvertedFiles: sinon.stub(),
      createTag,
      showErrorToast: sinon.stub(),
    });

    expect(result).to.equal(null);
    expect(block.querySelector('.easy-upload-cta-row')).to.be.null;
  });

  it('refreshes QR state when QR is consumed and pane is visible', async () => {
    const block = buildEasyUploadBlock();
    sinon.stub(EasyUpload.prototype, 'initializeQRCode').resolves();
    sinon.stub(EasyUpload.prototype, 'startUploadDetectionPolling');
    const resetUploadSessionStub = sinon.stub(EasyUpload.prototype, 'resetUploadSession').resolves();
    const consumedStub = sinon.stub(EasyUpload.prototype, 'isQrCodeConsumed');
    consumedStub.onFirstCall().returns(false);
    consumedStub.onSecondCall().returns(true);
    consumedStub.onThirdCall().returns(true);

    await setupEasyUploadUI({
      quickAction: EasyUploadVariants.removeBackgroundEasyUploadVariant,
      block,
      getConfig: () => ({ codeRoot: '/express/code', env: { name: 'stage' } }),
      loadStyle: sinon.stub().callsFake((href, callback) => callback?.()),
      initializeUploadService: sinon.stub().resolves({}),
      startSDKWithUnconvertedFiles: sinon.stub(),
      createTag,
      showErrorToast: sinon.stub(),
    });

    const secondaryCta = block.querySelector('.easy-upload-cta-row > p.button-container:nth-child(2) a.button');
    secondaryCta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const qrPaneReady = await waitFor(() => {
      const qrPane = block.querySelector('.qr-code-container.dropzone-container');
      return qrPane && !qrPane.classList.contains('hidden') && qrPane.dataset.qrInitialized === 'true';
    });
    expect(qrPaneReady).to.be.true;

    const refreshed = await refreshEasyUploadQrIfConsumed(block);

    expect(refreshed).to.be.true;
    expect(resetUploadSessionStub.calledOnce).to.be.true;
    expect(EasyUpload.prototype.initializeQRCode.callCount).to.equal(2);
  });

  it('handles sdk initialized event by forcing QR pane refresh', async () => {
    const block = buildEasyUploadBlock();
    sinon.stub(EasyUpload.prototype, 'initializeQRCode').resolves();
    sinon.stub(EasyUpload.prototype, 'startUploadDetectionPolling');
    const markConsumedSpy = sinon.spy(EasyUpload.prototype, 'markQrCodeConsumed');

    await setupEasyUploadUI({
      quickAction: EasyUploadVariants.removeBackgroundEasyUploadVariant,
      block,
      getConfig: () => ({ codeRoot: '/express/code', env: { name: 'stage' } }),
      loadStyle: sinon.stub().callsFake((href, callback) => callback?.()),
      initializeUploadService: sinon.stub().resolves({}),
      startSDKWithUnconvertedFiles: sinon.stub(),
      createTag,
      showErrorToast: sinon.stub(),
    });

    const secondaryCta = block.querySelector('.easy-upload-cta-row > p.button-container:nth-child(2) a.button');
    secondaryCta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const qrPaneReady = await waitFor(() => {
      const qrPane = block.querySelector('.qr-code-container.dropzone-container');
      return qrPane && !qrPane.classList.contains('hidden') && qrPane.dataset.qrInitialized === 'true';
    });
    expect(qrPaneReady).to.be.true;

    notifyEasyUploadSdkInitialization(block);
    const refreshedByEvent = await waitFor(
      () => EasyUpload.prototype.initializeQRCode.callCount === 2,
      100,
    );

    expect(markConsumedSpy.called).to.be.true;
    expect(refreshedByEvent).to.be.true;
  });

  it('fires the confirm-upload analytics event when an enabled confirm button is clicked', async () => {
    const trackSpy = sinon.spy();
    window._satellite = { track: trackSpy };

    const block = buildEasyUploadBlock();
    block.dataset.frictionlessgroup = 'image';
    block.dataset.frictionlesstype = 'remove-background-easy-upload-variant';
    sinon.stub(EasyUpload.prototype, 'initializeQRCode').resolves();
    sinon.stub(EasyUpload.prototype, 'startUploadDetectionPolling');
    sinon.stub(EasyUpload.prototype, 'handleConfirmImport').resolves();
    sinon.stub(EasyUpload.prototype, 'isQrCodeConsumed').returns(false);

    await setupEasyUploadUI({
      quickAction: EasyUploadVariants.removeBackgroundEasyUploadVariant,
      block,
      getConfig: () => ({ codeRoot: '/express/code', env: { name: 'stage' } }),
      loadStyle: sinon.stub().callsFake((href, callback) => callback?.()),
      initializeUploadService: sinon.stub().resolves({}),
      startSDKWithUnconvertedFiles: sinon.stub(),
      createTag,
      showErrorToast: sinon.stub(),
    });

    const secondaryCta = block.querySelector('.easy-upload-cta-row > p.button-container:nth-child(2) a.button');
    secondaryCta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const qrReady = await waitFor(() => {
      const qrPane = block.querySelector('.qr-code-container.dropzone-container');
      return qrPane && qrPane.dataset.qrInitialized === 'true';
    });
    expect(qrReady).to.be.true;

    const confirmButton = block.querySelector('.qr-code-container .confirm-import-button');
    expect(confirmButton.dataset.easyUploadConfirmBound).to.equal('true');
    expect(confirmButton.getAttribute('daa-ll')).to.equal('select-confirm-upload-cta');
    // Simulate the upload being detected, which enables the button.
    confirmButton.classList.remove('disabled');
    confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    await waitFor(() => trackSpy.called);
    expect(trackSpy.called).to.be.true;
    const eventName = trackSpy.args[0][1]?.data?.web?.webInteraction?.name;
    expect(eventName).to.equal('select-confirm-upload-cta');
    expect(EasyUpload.prototype.handleConfirmImport.calledOnce).to.be.true;

    delete window._satellite;
  });

  it('does not fire the confirm-upload analytics event when the confirm button is disabled', async () => {
    const trackSpy = sinon.spy();
    window._satellite = { track: trackSpy };

    const block = buildEasyUploadBlock();
    sinon.stub(EasyUpload.prototype, 'initializeQRCode').resolves();
    sinon.stub(EasyUpload.prototype, 'startUploadDetectionPolling');
    sinon.stub(EasyUpload.prototype, 'handleConfirmImport').resolves();
    sinon.stub(EasyUpload.prototype, 'isQrCodeConsumed').returns(false);

    await setupEasyUploadUI({
      quickAction: EasyUploadVariants.removeBackgroundEasyUploadVariant,
      block,
      getConfig: () => ({ codeRoot: '/express/code', env: { name: 'stage' } }),
      loadStyle: sinon.stub().callsFake((href, callback) => callback?.()),
      initializeUploadService: sinon.stub().resolves({}),
      startSDKWithUnconvertedFiles: sinon.stub(),
      createTag,
      showErrorToast: sinon.stub(),
    });

    const secondaryCta = block.querySelector('.easy-upload-cta-row > p.button-container:nth-child(2) a.button');
    secondaryCta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await waitFor(() => {
      const qrPane = block.querySelector('.qr-code-container.dropzone-container');
      return qrPane && qrPane.dataset.qrInitialized === 'true';
    });

    const confirmButton = block.querySelector('.qr-code-container .confirm-import-button');
    // Button remains disabled (upload not yet detected).
    expect(confirmButton.classList.contains('disabled')).to.be.true;
    confirmButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    await new Promise((resolve) => { setTimeout(resolve, 10); });
    expect(trackSpy.called).to.be.false;
    expect(EasyUpload.prototype.handleConfirmImport.called).to.be.false;

    delete window._satellite;
  });
});
