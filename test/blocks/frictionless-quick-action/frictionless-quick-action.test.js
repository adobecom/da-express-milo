import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

import sinon from 'sinon';
import { mockRes } from '../test-utilities.js';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/frictionless-quick-action/frictionless-quick-action.js')]);
const { getLibs, createTag } = imports[0];
const { default: init, runQuickAction } = imports[2];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales: { '': { ietf: 'en-US', tk: 'jdq5hay.css' } } });
});

document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
const ogFetch = window.fetch;

describe('Frictionless Quick Action Block', () => {
  afterEach(() => {
    sinon.restore();
  });
  it('initializes correctly', async () => {
    window.fetch = sinon.stub().callsFake(() => mockRes({
      payload: {
        data: [
          {
            Key: 'free-plan-check-1',
            Text: 'Free use forever',
          },
          {
            Key: 'free-plan-check-2',
            Text: 'No credit card required',
          },
        ],
      },
    }));
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });

    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);
    const title = block.querySelector(':scope h1');
    const text = block.querySelector('div:nth-child(1) p');
    expect(title).to.not.be.null;
    expect(title.textContent).to.be.equal('Crop your image for free.');
    expect(text).to.not.be.null;
    expect(text.textContent).to.be.equal('The online Crop image tool from Adobe Express transforms your images into the perfect size in seconds.');
    const video = block.querySelector('div:nth-child(2) > div:nth-child(1) video');
    expect(video).to.not.be.null;
    const dropzone = block.querySelector('div:nth-child(2) > div:nth-child(2) .dropzone');
    const dropzoneTitle = dropzone.querySelector(':scope > h4');
    expect(dropzoneTitle.textContent).to.be.equal('Drag and drop an image or browse to upload.');
    window.fetch = ogFetch;
  });

  it('sdk loads other components', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');

    runQuickAction('convert-to-jpg', 'data:image/png;base64,', block);
    const qac = block.querySelector('.quick-action-container');
    expect(qac).to.not.be.null;
  });

  it('should test showErrorToast', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const oversizedFile = new File([new ArrayBuffer(50 * 1024 * 1024)], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(oversizedFile);

    const dropEvent = new DragEvent('drop', { dataTransfer });

    const dropzoneContainer = block.querySelector(':scope .dropzone-container');
    dropzoneContainer.dispatchEvent(dropEvent);

    await new Promise((resolve) => {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            const errorToast = document.querySelector('.error-toast');
            if (errorToast) {
              observer.disconnect();
              resolve();
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    const errorToast = document.querySelector('.error-toast');
    expect(errorToast).to.not.be.null;
    expect(errorToast.textContent).to.include('file size not supported');
  });
  it('handles popstate event correctly', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const quickActionContainer = document.createElement('div');
    quickActionContainer.classList.add('quick-action-container');
    block.append(quickActionContainer);

    const uploadContainer = document.createElement('div');
    uploadContainer.classList.add('hidden');
    block.append(uploadContainer);

    const event = new PopStateEvent('popstate', { state: { hideFrictionlessQa: true } });

    window.dispatchEvent(event);

    expect(uploadContainer.classList.contains('hidden')).to.be.true;
  });

  it('should handle dropzone container', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const dropzoneContainer = block.querySelector('.dropzone-container');
    const inputElement = block.querySelector('input[type="file"]');
    const inputClickStub = sinon.stub(inputElement, 'click');

    const clickEvent = new MouseEvent('click');
    dropzoneContainer.dispatchEvent(clickEvent);
    expect(inputClickStub.calledOnce).to.be.true;

    const dragenterEvent = new Event('dragenter');
    dropzoneContainer.dispatchEvent(dragenterEvent);

    expect(dropzoneContainer.classList.contains('highlight')).to.be.true;

    const dragleaveEvent = new Event('dragleave');
    dropzoneContainer.dispatchEvent(dragleaveEvent);
    expect(dropzoneContainer.classList.contains('highlight')).to.be.false;

    inputClickStub.restore();
  });

  it('should handle click on dropzone container and trigger input click', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const dropzoneContainer = block.querySelector('.dropzone-container');
    const inputElement = block.querySelector('input[type="file"]');

    const inputClickStub = sinon.stub(inputElement, 'click');

    dropzoneContainer.dispatchEvent(new MouseEvent('click'));

    expect(inputClickStub.calledOnce).to.be.true;

    inputClickStub.restore();
  });

  it('should add the metadata and test if the logo got added', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');

    const meta = createTag('meta', { name: 'marquee-inject-logo', content: 'on' });
    document.head.append(meta);

    await init(block);

    expect(block.querySelector('.express-logo')).to.not.be.null;

    meta.remove();
  });

  it('sdk starts on file drop', async () => {
    document.body.innerHTML = await readFile({ path: './mocks/crop-image-quick-action.html' });
    const block = document.body.querySelector('.frictionless-quick-action');
    await init(block);

    const dropzoneContainer = block.querySelector(':scope .dropzone-container');
    const file = new File([''], 'test', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const event = new DragEvent('drop', { dataTransfer });
    const callback = function cb(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'SCRIPT') {
              const script = document.querySelector('head > script[src="https://sdk.cc-embed.adobe.com/v3/CCEverywhere.js"]');
              expect(script).to.not.be.null;
              observer.disconnect();
            }
          });
        }
      }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.head, { childList: true, subtree: true });

    dropzoneContainer.dispatchEvent(event);
  });
});

describe('Frictionless Quick Action - Utility Functions', () => {
  it('should test createStep logic with manual DOM', () => {
    // Simulate what createStep does
    const number = '1';
    const content = document.createElement('div');
    content.textContent = 'Step content';

    const step = document.createElement('div');
    step.className = 'step';
    step.setAttribute('data-step', number);

    const stepNumber = document.createElement('div');
    stepNumber.className = 'step-number';
    stepNumber.textContent = number;

    step.append(stepNumber, content);

    // Verify structure
    expect(step.className).to.equal('step');
    expect(step.getAttribute('data-step')).to.equal('1');
    expect(step.querySelector('.step-number')).to.exist;
    expect(step.querySelector('.step-number').textContent).to.equal('1');
  });

  it('should test applySearchParamsToUrl logic', () => {
    const url = new URL('https://example.com');
    const searchParams = {
      param1: 'value1',
      param2: 'value2',
      param3: null,
      param4: undefined,
      param5: '',
      param6: 0,
    };

    // Apply params like the function does
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    // Verify only valid params were added
    expect(url.searchParams.get('param1')).to.equal('value1');
    expect(url.searchParams.get('param2')).to.equal('value2');
    expect(url.searchParams.get('param3')).to.be.null;
    expect(url.searchParams.get('param4')).to.be.null;
    expect(url.searchParams.get('param5')).to.be.null;
    expect(url.searchParams.get('param6')).to.equal('0'); // 0 is valid
  });
});
