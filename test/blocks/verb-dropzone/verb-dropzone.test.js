/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

// Boot milo so setLibs is initialized before the block module loads
const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const { default: init, LIMITS } = await import('../../../express/code/blocks/verb-dropzone/verb-dropzone.js');

const basicHtml = await readFile({ path: './mocks/basic.html' });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubGlobals() {
  sinon.stub(window, 'fetch').resolves({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  });
  window.adobeIMS = { isSignedInUser: sinon.stub().returns(false) };
  window.lana = { log: sinon.stub() };
  window.analytics = {
    verbAnalytics: sinon.stub(),
    sendAnalyticsToSplunk: sinon.stub(),
  };
}

function restoreGlobals() {
  sinon.restore();
  delete window.adobeIMS;
  delete window.lana;
  delete window.analytics;
  delete window.mph;
}

// ---------------------------------------------------------------------------
// DOM structure
// ---------------------------------------------------------------------------

describe('verb-dropzone – DOM structure', () => {
  let block;

  before(async () => {
    stubGlobals();
    document.body.innerHTML = basicHtml;
    block = document.querySelector('.verb-dropzone');
    await init(block);
  });

  after(restoreGlobals);

  it('adds con-block class to the element', () => {
    expect(block.classList.contains('con-block')).to.be.true;
  });

  it('renders a dropzone button with the correct id', () => {
    const dz = block.querySelector('#drop-zone');
    expect(dz).to.exist;
    expect(dz.tagName).to.equal('BUTTON');
    expect(dz.classList.contains('verb-dropzone-area')).to.be.true;
  });

  it('renders the heading from authored content inside the dropzone', () => {
    const heading = block.querySelector('.verb-dropzone-heading');
    expect(heading).to.exist;
    expect(heading.textContent.trim()).to.equal('Upload your resume');
  });

  it('renders the subcopy desktop and mobile spans', () => {
    expect(block.querySelector('.verb-dropzone-subcopy-desktop')).to.exist;
    expect(block.querySelector('.verb-dropzone-subcopy-mobile')).to.exist;
  });

  it('renders a file input with the correct attributes', () => {
    const input = block.querySelector('#file-upload');
    expect(input).to.exist;
    expect(input.type).to.equal('file');
    expect(input.classList.contains('hide')).to.be.true;
    expect(input.getAttribute('aria-hidden')).to.equal('true');
  });

  it('file input accepts the types defined by LIMITS for resume-builder', () => {
    const input = block.querySelector('#file-upload');
    const accepted = input.getAttribute('accept');
    expect(accepted).to.include('.pdf');
    expect(accepted).to.include('.doc');
  });

  it('renders the CTA button with an upload SVG and label', () => {
    const cta = block.querySelector('.verb-dropzone-cta');
    expect(cta).to.exist;
    expect(cta.querySelector('svg.upload-icon')).to.exist;
    expect(cta.querySelector('.verb-dropzone-cta-label')).to.exist;
  });

  it('renders the legal footer', () => {
    expect(block.querySelector('.verb-dropzone-footer')).to.exist;
    expect(block.querySelector('.verb-dropzone-legal')).to.exist;
  });

  it('renders the info-icon tooltip button', () => {
    expect(block.querySelector('.info-icon')).to.exist;
  });

  it('has an error container that starts hidden', () => {
    const err = block.querySelector('.error');
    expect(err).to.exist;
    expect(err.classList.contains('hide')).to.be.true;
  });
});

// ---------------------------------------------------------------------------
// Widget icon (upload-document.png)
// ---------------------------------------------------------------------------

describe('verb-dropzone – widget icon', () => {
  let block;

  before(async () => {
    stubGlobals();
    document.body.innerHTML = basicHtml;
    block = document.querySelector('.verb-dropzone');
    await init(block);
  });

  after(restoreGlobals);

  it('renders an img element inside .widget-icon', () => {
    const img = block.querySelector('.widget-icon img');
    expect(img).to.exist;
  });

  it('img src points to upload-document.png', () => {
    const img = block.querySelector('.widget-icon img');
    expect(img.src).to.include('upload-document.png');
  });

  it('img has aria-hidden="true"', () => {
    const img = block.querySelector('.widget-icon img');
    expect(img.getAttribute('aria-hidden')).to.equal('true');
  });

  it('does not render an Acrobat SVG inside .widget-icon', () => {
    const acrobatSvg = block.querySelector('.widget-icon .icon-acrobat');
    expect(acrobatSvg).to.not.exist;
  });
});

// ---------------------------------------------------------------------------
// Error state (driven by unity:show-error-toast)
// ---------------------------------------------------------------------------

describe('verb-dropzone – error state', () => {
  let block;

  beforeEach(async () => {
    stubGlobals();
    document.body.innerHTML = basicHtml;
    block = document.querySelector('.verb-dropzone');
    await init(block);
  });

  afterEach(restoreGlobals);

  it('shows error message when unity:show-error-toast fires', () => {
    block.dispatchEvent(new CustomEvent('unity:show-error-toast', {
      detail: { code: 'error_generic', message: 'Something went wrong', status: 500 },
    }));
    const err = block.querySelector('.error');
    expect(err.classList.contains('verb-dropzone-error')).to.be.true;
    expect(err.classList.contains('hide')).to.be.false;
    expect(block.querySelector('.verb-dropzone-error-text').textContent).to.equal('Something went wrong');
  });

  it('does not show the error div if message is missing', () => {
    block.dispatchEvent(new CustomEvent('unity:show-error-toast', {
      detail: { code: 'error_generic', status: 500 },
    }));
    const err = block.querySelector('.error');
    expect(err.classList.contains('verb-dropzone-error')).to.be.false;
  });

  it('hides error when the close button is clicked', () => {
    block.dispatchEvent(new CustomEvent('unity:show-error-toast', {
      detail: { code: 'error_generic', message: 'Oops', status: 500 },
    }));
    block.querySelector('.verb-dropzone-errorBtn').click();
    const err = block.querySelector('.error');
    expect(err.classList.contains('verb-dropzone-error')).to.be.false;
    expect(err.classList.contains('hide')).to.be.true;
  });

  it('hides error on Enter key on the close button', () => {
    block.dispatchEvent(new CustomEvent('unity:show-error-toast', {
      detail: { code: 'error_generic', message: 'Oops', status: 500 },
    }));
    const closeBtn = block.querySelector('.verb-dropzone-errorBtn');
    closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(block.querySelector('.error').classList.contains('hide')).to.be.true;
  });
});

// ---------------------------------------------------------------------------
// Analytics (driven by unity:track-analytics)
// ---------------------------------------------------------------------------

describe('verb-dropzone – analytics events', () => {
  let block;

  before(async () => {
    stubGlobals();
    document.body.innerHTML = basicHtml;
    block = document.querySelector('.verb-dropzone');
    await init(block);
  });

  after(restoreGlobals);

  it('calls verbAnalytics on a "change" track event', () => {
    block.dispatchEvent(new CustomEvent('unity:track-analytics', {
      detail: { event: 'change', data: {} },
    }));
    expect(window.analytics.verbAnalytics.calledWith('choose-file:open')).to.be.true;
  });

  it('calls verbAnalytics on a "drop" track event', () => {
    block.dispatchEvent(new CustomEvent('unity:track-analytics', {
      detail: { event: 'drop', data: {} },
    }));
    expect(window.analytics.verbAnalytics.calledWith('files-dropped')).to.be.true;
  });

  it('calls verbAnalytics on a "cancel" track event after an in-progress upload', () => {
    // Put the block into an in-progress state first
    block.dispatchEvent(new CustomEvent('unity:track-analytics', {
      detail: { event: 'change', data: {} },
    }));
    block.dispatchEvent(new CustomEvent('unity:track-analytics', {
      detail: { event: 'cancel', data: {} },
    }));
    expect(window.analytics.verbAnalytics.calledWith('job:cancel')).to.be.true;
  });
});

// ---------------------------------------------------------------------------
// LIMITS export
// ---------------------------------------------------------------------------

describe('verb-dropzone – LIMITS', () => {
  it('exports LIMITS for expected verbs', () => {
    expect(LIMITS).to.have.keys(['fillsign', 'summarize-pdf', 'resume-builder', 'word-to-pdf', 'jpg-to-pdf']);
  });

  it('resume-builder accepts .pdf, .doc, and .docx', () => {
    const { acceptedFiles } = LIMITS['resume-builder'];
    expect(acceptedFiles).to.include('.pdf');
    expect(acceptedFiles).to.include('.doc');
    expect(acceptedFiles).to.include('.docx');
  });

  it('resume-builder is flagged as genAI', () => {
    expect(LIMITS['resume-builder'].genAI).to.be.true;
  });

  it('resume-builder allows only one file', () => {
    expect(LIMITS['resume-builder'].maxNumFiles).to.equal(1);
  });

  it('fillsign has mobileApp flag', () => {
    expect(LIMITS.fillsign.mobileApp).to.be.true;
  });

  it('word-to-pdf has multipleFiles flag', () => {
    expect(LIMITS['word-to-pdf'].multipleFiles).to.be.true;
  });

  it('summarize-pdf is flagged as genAI', () => {
    expect(LIMITS['summarize-pdf'].genAI).to.be.true;
  });
});
