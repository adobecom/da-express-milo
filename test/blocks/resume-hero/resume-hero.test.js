/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const resumeHeroStyles = document.createElement('link');
resumeHeroStyles.rel = 'stylesheet';
resumeHeroStyles.href = '/express/code/blocks/resume-hero/resume-hero.css';
document.head.append(resumeHeroStyles);
await new Promise((resolve, reject) => {
  resumeHeroStyles.addEventListener('load', resolve, { once: true });
  resumeHeroStyles.addEventListener('error', reject, { once: true });
});

const { default: decorate, LIMITS } = await import('../../../express/code/blocks/resume-hero/resume-hero.js');
const basicHtml = await readFile({ path: './mocks/basic.html' });

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
  window.mph = {
    'verb-dropzone-resume-builder-upload-cta': 'Upload your resume',
    'verb-widget-resume-builder-file-limit': 'PDF, DOCX, or DOC up to 20 MB.',
    'verb-dropzone-legal': 'Your file will be securely handled.',
    'verb-dropzone-legal-2-ai': 'Review the Terms of Use and Privacy Policy.',
    'verb-widget-terms-of-use': 'Terms of Use',
    'verb-widget-privacy-policy': 'Privacy Policy',
    'verb-widget-tool-tip': 'Files are secured.',
    'verb-dropzone-drag-overlay': 'Drop your file here',
    'close-dialog': 'Close error',
  };
}

function restoreGlobals() {
  document.head.querySelector('meta[name="inject-branding-logo"]')?.remove();
  document.querySelectorAll('.verb-dropzone-drag-overlay').forEach((overlay) => overlay.remove());
  sinon.restore();
  delete window.adobeIMS;
  delete window.lana;
  delete window.analytics;
  delete window.mph;
}

describe('resume-hero', () => {
  let block;
  let authoredNodes;

  before(async () => {
    stubGlobals();
    document.body.innerHTML = basicHtml;
    block = document.querySelector('.resume-hero');
    authoredNodes = {
      headerRow: block.querySelector('#authored-header-row'),
      actionsRow: block.querySelector('#authored-actions-row'),
      uploadCell: block.querySelector('#authored-upload-cell'),
      uploadPicture: block.querySelector('#authored-upload-picture'),
      createCell: block.querySelector('#authored-create-cell'),
      createPicture: block.querySelector('#authored-create-picture'),
      createCopy: block.querySelector('#authored-create-copy'),
      createLink: block.querySelector('#authored-create-link'),
      extraRow: block.querySelector('#authored-extra-row'),
    };
    await decorate(block);
  });

  after(restoreGlobals);

  it('exports resume-builder limits', () => {
    expect(LIMITS['resume-builder'].acceptedFiles).to.deep.equal(['.pdf', '.doc', '.docx']);
    expect(LIMITS['resume-builder'].maxNumFiles).to.equal(1);
  });

  it('keeps authored rows and cells as the same nodes', () => {
    expect(block.querySelector('#authored-header-row')).to.equal(authoredNodes.headerRow);
    expect(block.querySelector('#authored-actions-row')).to.equal(authoredNodes.actionsRow);
    expect(block.querySelector('#authored-upload-cell')).to.equal(authoredNodes.uploadCell);
    expect(block.querySelector('#authored-create-cell')).to.equal(authoredNodes.createCell);
    expect(block.querySelector('#authored-extra-row')).to.equal(authoredNodes.extraRow);
  });

  it('preserves the create-now picture, copy, and link', () => {
    expect(block.querySelector('#authored-create-picture')).to.equal(authoredNodes.createPicture);
    expect(block.querySelector('#authored-create-copy')).to.equal(authoredNodes.createCopy);
    expect(block.querySelector('#authored-create-link')).to.equal(authoredNodes.createLink);
    expect(authoredNodes.createLink.getAttribute('href')).to.equal('https://www.adobe.com/express/templates/resume');
  });

  it('moves only the authored upload picture into the dropzone icon', () => {
    const picture = block.querySelector('.widget-icon #authored-upload-picture');
    expect(picture).to.equal(authoredNodes.uploadPicture);
    expect(picture.classList.contains('resume-hero-dropzone-image')).to.be.true;
  });

  it('creates a self-contained upload UI without a nested verb-dropzone block', () => {
    expect(block.querySelector('#unity-upload.verb-dropzone-area')).to.exist;
    expect(block.querySelector('#file-upload')).to.exist;
    expect(block.querySelector('.verb-dropzone-footer')).to.exist;
    expect(block.querySelector('.verb-dropzone')).to.not.exist;
  });

  it('adds layout classes without inline display overrides', () => {
    const actions = block.querySelector('.resume-hero-actions');
    expect(actions).to.equal(authoredNodes.actionsRow);
    expect(actions.classList.contains('foreground')).to.be.true;
    expect(block.querySelector('.foreground .resume-hero-dropzone-area')).to.exist;
    expect(actions.style.display).to.equal('');
    expect(getComputedStyle(actions).display).to.equal('flex');
    expect(authoredNodes.uploadCell.classList.contains('resume-hero-upload')).to.be.true;
    expect(authoredNodes.createCell.classList.contains('resume-hero-create')).to.be.true;
  });

  it('is idempotent', async () => {
    await decorate(block);
    expect(block.querySelectorAll('#unity-upload')).to.have.length(1);
    expect(block.querySelectorAll('#file-upload')).to.have.length(1);
  });
});

describe('resume-hero branding', () => {
  beforeEach(() => {
    stubGlobals();
    document.body.innerHTML = basicHtml;
    const meta = document.createElement('meta');
    meta.name = 'inject-branding-logo';
    meta.content = 'on';
    document.head.append(meta);
  });

  afterEach(restoreGlobals);

  it('supports inject-branding-logo metadata', async () => {
    const block = document.querySelector('.resume-hero');
    await decorate(block);
    expect(block.querySelector('.resume-hero-header-content > .express-logo')).to.exist;
  });
});

describe('resume-hero legacy authoring', () => {
  beforeEach(() => {
    stubGlobals();
    document.body.innerHTML = `
      <div class="resume-hero resume-builder">
        <div>
          <div><h2>Resume headline</h2><p>Resume subcopy</p></div>
          <div id="legacy-create-cell">
            <picture id="legacy-create-picture"><img src="/express/code/blocks/resume-hero/resume-preview.svg" alt="Create"></picture>
            <p><a id="legacy-create-link" href="https://www.adobe.com/create">Create now</a></p>
          </div>
        </div>
        <div>
          <div><picture id="legacy-upload-picture"><img src="/express/code/blocks/resume-hero/resume-preview.svg" alt="Upload"></picture></div>
        </div>
      </div>`;
  });

  afterEach(restoreGlobals);

  it('reparents the legacy create cell without recreating its content', async () => {
    const block = document.querySelector('.resume-hero');
    const createCell = block.querySelector('#legacy-create-cell');
    const createPicture = block.querySelector('#legacy-create-picture');
    const createLink = block.querySelector('#legacy-create-link');

    await decorate(block);

    expect(block.querySelector('.resume-hero-actions > #legacy-create-cell')).to.equal(createCell);
    expect(block.querySelector('#legacy-create-picture')).to.equal(createPicture);
    expect(block.querySelector('#legacy-create-link')).to.equal(createLink);
  });
});
