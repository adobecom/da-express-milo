/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { loadToast } from '../../../express/code/scripts/color-shared/spectrum/load-spectrum.js';
import { waitFor } from '../../helpers/waitfor.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/color-extract/color-extract.js'),
]);
const { default: decorate } = imports[1];

const basic = await readFile({ path: './mocks/basic.html' });
const gradient = await readFile({ path: './mocks/gradient.html' });

describe('Color Extract — failed image uploads', function failedImageUploads() {
  this.timeout(10000);

  before(async () => {
    window.isTestEnv = true;
    await loadToast();
  });

  afterEach(() => {
    document.querySelectorAll('sp-toast').forEach((toast) => {
      toast.dispatchEvent(new Event('close'));
    });
    sinon.restore();
    document.body.replaceChildren();
    sessionStorage.removeItem('color-extract-image-src');
    window.history.replaceState({}, '', window.location.pathname);
  });

  async function mount(fixture = basic) {
    const parsed = new DOMParser().parseFromString(fixture, 'text/html');
    document.body.replaceChildren(...parsed.body.childNodes);
    const block = document.querySelector('.color-extract');
    await decorate(block);
    sinon.stub(block, 'getBoundingClientRect').returns({
      top: 0, bottom: 100, left: 0, right: 100, width: 100, height: 100,
    });
    return block;
  }

  function transfer(file = new File(['invalid image'], 'broken.png', { type: 'image/png' })) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer;
  }

  function selectFile(block, dataTransfer = transfer()) {
    const input = block.querySelector('input[type="file"]');
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function expectUploadError(block) {
    await waitFor(() => !!document.querySelector('sp-toast'), 5000);
    const toast = document.querySelector('sp-toast');
    expect(toast.getAttribute('variant')).to.equal('negative');
    expect(toast.textContent).to.equal('Unable to load image. Please try again.');
    expect(block.classList.contains('is-loading')).to.be.false;
    expect(block.querySelector('.image-upload-dropzone-container').classList.contains('is-loading')).to.be.false;
    expect(document.querySelector('.color-extract-loading-overlay').classList.contains('is-loading')).to.be.false;
    expect(document.querySelector('.color-extract-drag-overlay').classList.contains('is-dragging')).to.be.false;
    return toast;
  }

  [['palette', basic], ['gradient', gradient]].forEach(([variant, fixture]) => {
    it(`${variant}: clears the overlay after a corrupt image is selected`, async () => {
      const block = await mount(fixture);
      selectFile(block);
      expect(block.classList.contains('is-loading')).to.be.true;
      await expectUploadError(block);
      expect(block.classList.contains('has-image')).to.be.false;
    });
  });

  it('clears the overlay after a corrupt image is dropped on the dropzone', async () => {
    const block = await mount();
    const dataTransfer = transfer();
    window.dispatchEvent(new DragEvent('dragenter', { dataTransfer, cancelable: true }));
    block.querySelector('.image-upload-dropzone').dispatchEvent(new DragEvent('drop', {
      dataTransfer, bubbles: true, cancelable: true,
    }));
    await expectUploadError(block);
  });

  it('clears the overlay after a corrupt image is dropped outside the dropzone', async () => {
    const block = await mount();
    const dataTransfer = transfer();
    window.dispatchEvent(new DragEvent('dragenter', { dataTransfer, cancelable: true }));
    document.body.dispatchEvent(new DragEvent('drop', {
      dataTransfer, bubbles: true, cancelable: true,
    }));
    await expectUploadError(block);
  });

  it('clears the overlay after the file reader fails', async () => {
    const block = await mount();
    sinon.stub(FileReader.prototype, 'readAsDataURL').callsFake(function failReading() {
      queueMicrotask(() => this.dispatchEvent(new ProgressEvent('error')));
    });
    selectFile(block);
    await expectUploadError(block);
  });

  it('clears the overlay when a suggested image fails to load', async () => {
    const block = await mount();
    const suggestion = block.querySelector('.color-extract-suggestion');
    const preview = suggestion.querySelector('img');
    sinon.stub(preview, 'complete').value(true);
    sinon.stub(preview, 'naturalWidth').value(2);
    sinon.stub(HTMLImageElement.prototype, 'src').set(function failLoading() {
      queueMicrotask(() => this.dispatchEvent(new Event('error')));
    });
    suggestion.click();
    expect(block.classList.contains('is-loading')).to.be.true;
    await expectUploadError(block);
  });

  it('dismisses the error toast after three seconds without leaving an overlay', async () => {
    const block = await mount();
    const clock = sinon.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout'],
      shouldClearNativeTimers: true,
    });
    selectFile(block);
    const toast = await expectUploadError(block);
    await clock.tickAsync(2999);
    expect(toast.isConnected).to.be.true;
    await clock.tickAsync(1);
    expect(toast.isConnected).to.be.false;
    expect(block.classList.contains('is-loading')).to.be.false;
    expect(document.querySelector('.color-extract-loading-overlay').classList.contains('is-loading')).to.be.false;
    clock.restore();
  });

  it('allows the user to close the error toast before the timeout', async () => {
    const block = await mount();
    const clock = sinon.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout'],
      shouldClearNativeTimers: true,
    });
    selectFile(block);
    await waitFor(() => !!document.querySelector('sp-toast'), 5000);
    const toast = document.querySelector('sp-toast');
    await toast.updateComplete;
    await clock.tickAsync(1000);
    expect(toast.isConnected).to.be.true;
    const closeButton = toast.shadowRoot.querySelector('sp-close-button');
    expect(closeButton).to.exist;
    closeButton.click();
    expect(toast.isConnected).to.be.false;
    clock.restore();
  });

  it('allows a valid image to be uploaded after the failed image is dismissed', async () => {
    const block = await mount();
    selectFile(block);
    const toast = await expectUploadError(block);
    toast.dispatchEvent(new Event('close'));
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    canvas.getContext('2d').fillRect(0, 0, 2, 2);
    const blob = await new Promise((resolve) => { canvas.toBlob(resolve); });
    selectFile(block, transfer(new File([blob], 'valid.png', { type: 'image/png' })));
    await waitFor(() => block.classList.contains('has-image'), 5000);
    expect(block.classList.contains('is-loading')).to.be.false;
    expect(document.querySelector('.color-extract-loading-overlay').classList.contains('is-loading')).to.be.false;
  });
});

describe('Color Extract', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    document.body.innerHTML = basic;
  });

  it('decorates without throwing', async () => {
    const block = document.querySelector('.color-extract');
    let error;
    try {
      await decorate(block);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.undefined;
  });

  it('builds suggestion images from row 0', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-suggestions')).to.exist;
  });

  it('builds the edit stage from rows 1 and 2', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-edit')).to.exist;
  });

  it('builds the landing stage', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-landing')).to.exist;
  });

  it('does not produce a hero element (new markup has no hero row)', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-hero')).to.not.exist;
  });

  it('places dropzone inside the landing content', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const landing = block.querySelector('.color-extract-landing-content');
    expect(landing.querySelector('.image-upload-dropzone-container')).to.exist;
  });

  it('suggestion list contains the expected number of images', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const suggestions = block.querySelectorAll('.color-extract-suggestion');
    // mock HTML has 2 suggestion images
    expect(suggestions.length).to.equal(2);
  });
});

describe('Color Extract — gradient variant', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    document.body.innerHTML = gradient;
  });

  it('decorates without throwing', async () => {
    const block = document.querySelector('.color-extract');
    let error;
    try {
      await decorate(block);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.undefined;
  });

  it('builds suggestion images from row 0', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-suggestions')).to.exist;
  });

  it('builds the gradient edit stage', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-edit-stage--gradient')).to.exist;
  });

  it('builds the landing stage', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    expect(block.querySelector('.color-extract-landing')).to.exist;
  });

  it('places dropzone inside the landing content', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const landing = block.querySelector('.color-extract-landing-content');
    expect(landing.querySelector('.image-upload-dropzone-container')).to.exist;
  });

  it('suggestion list contains the expected number of images', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const suggestions = block.querySelectorAll('.color-extract-suggestion');
    // gradient mock HTML has 2 suggestion images
    expect(suggestions.length).to.equal(2);
  });

  it('suggestion bars use gradient style, not palette chips', async () => {
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const bars = block.querySelectorAll('.color-extract-suggestion-bar');
    bars.forEach((bar) => {
      expect(bar.classList.contains('is-gradient')).to.be.true;
      expect(bar.querySelector('.color-extract-suggestion-chip')).to.not.exist;
    });
  });

  it('palette variant suggestion bars use chips, not gradient style', async () => {
    document.body.innerHTML = basic;
    const block = document.querySelector('.color-extract');
    await decorate(block);
    const bars = block.querySelectorAll('.color-extract-suggestion-bar');
    bars.forEach((bar) => {
      expect(bar.classList.contains('is-gradient')).to.be.false;
      expect(bar.querySelectorAll('.color-extract-suggestion-chip').length).to.be.greaterThan(0);
    });
  });
});

describe('Color Extract — sign-in image restoration', () => {
  const IMAGE_SRC_KEY = 'color-extract-image-src';
  // Use a URL that triggers onerror (not onload) so the async setupMarkers
  // dynamic import is never reached in the test environment.
  const FAKE_SRC = './nonexistent-test-image.png';
  const PARAM_NAME = 'color-palette';

  before(() => {
    window.isTestEnv = true;
  });

  afterEach(() => {
    sessionStorage.removeItem(IMAGE_SRC_KEY);
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('palette: keeps bgWrapper in DOM when image src is stored and color-palette param present', async () => {
    sessionStorage.setItem(IMAGE_SRC_KEY, FAKE_SRC);
    window.history.replaceState({}, '', `${window.location.pathname}?${PARAM_NAME}=FF0000,00FF00`);
    document.body.innerHTML = basic;
    const block = document.querySelector('.color-extract');
    await decorate(block);

    expect(sessionStorage.getItem(IMAGE_SRC_KEY)).to.be.null;
    expect(block.classList.contains('has-image')).to.be.true;
    // bgWrapper should remain in the DOM (not replaced by the dropzone)
    expect(block.querySelector('.color-extract-edit-bg')).to.exist;
  });

  it('palette: replaces bgWrapper with dropzone when no image stored and color-palette param present', async () => {
    sessionStorage.removeItem(IMAGE_SRC_KEY);
    window.history.replaceState({}, '', `${window.location.pathname}?${PARAM_NAME}=FF0000,00FF00`);
    document.body.innerHTML = basic;
    const block = document.querySelector('.color-extract');
    await decorate(block);

    expect(block.classList.contains('has-image')).to.be.true;
    // bgWrapper replaced by dropzone — edit-bg should be gone
    expect(block.querySelector('.color-extract-edit-bg')).to.not.exist;
  });

  it('gradient: keeps bgWrapper in DOM when image src is stored and color-palette param present', async () => {
    sessionStorage.setItem(IMAGE_SRC_KEY, FAKE_SRC);
    window.history.replaceState({}, '', `${window.location.pathname}?${PARAM_NAME}=FF0000,00FF00`);
    document.body.innerHTML = gradient;
    const block = document.querySelector('.color-extract');
    await decorate(block);

    expect(sessionStorage.getItem(IMAGE_SRC_KEY)).to.be.null;
    expect(block.classList.contains('has-image')).to.be.true;
    expect(block.querySelector('.color-extract-edit-bg')).to.exist;
  });

  it('gradient: replaces bgWrapper with dropzone when no image stored and color-palette param present', async () => {
    sessionStorage.removeItem(IMAGE_SRC_KEY);
    window.history.replaceState({}, '', `${window.location.pathname}?${PARAM_NAME}=FF0000,00FF00`);
    document.body.innerHTML = gradient;
    const block = document.querySelector('.color-extract');
    await decorate(block);

    expect(block.classList.contains('has-image')).to.be.true;
    expect(block.querySelector('.color-extract-edit-bg')).to.not.exist;
  });
});
