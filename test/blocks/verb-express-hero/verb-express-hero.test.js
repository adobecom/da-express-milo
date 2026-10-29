import { readFile, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
const { getLibs } = imports[0];

await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  mod.setConfig({ locales });
});

const {
  default: decorate,
  initResumeFork,
  RESUME_FORK_MODAL_ID,
} = await import('../../../express/code/blocks/verb-express-hero/verb-express-hero.js');

const styleSheets = [
  '/express/code/styles/styles.css',
  '/express/code/blocks/verb-express-hero/verb-express-hero.css',
];
await Promise.all(styleSheets.map((href) => new Promise((resolve, reject) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.addEventListener('load', resolve, { once: true });
  link.addEventListener('error', reject, { once: true });
  document.head.append(link);
})));

async function prepBlock(filePath) {
  const html = await readFile({ path: filePath });
  const fixture = new DOMParser().parseFromString(html, 'text/html');
  document.body.replaceChildren(
    ...[...fixture.body.childNodes].map((node) => document.importNode(node, true)),
  );
  const block = document.querySelector('.verb-express-hero');
  await decorate(block);
  return block;
}

describe('verb-express-hero', () => {
  const logoMetadataKeys = ['inject-branding-logo', 'marquee-inject-logo'];
  const metadataSelector = logoMetadataKeys
    .map((key) => `meta[name="${key}"]`)
    .join(', ');
  let originalMetadata;
  let originalPlaceholders;

  function setLogoMetadata(name, content) {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.append(meta);
  }

  beforeEach(() => {
    originalPlaceholders = window.mph;
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
    originalMetadata = [...document.head.querySelectorAll(metadataSelector)];
    originalMetadata.forEach((meta) => meta.remove());
  });

  afterEach(() => {
    if (originalPlaceholders === undefined) delete window.mph;
    else window.mph = originalPlaceholders;
    document.head.querySelectorAll(metadataSelector).forEach((meta) => meta.remove());
    document.head.append(...originalMetadata);
    document.body.replaceChildren();
  });

  it('decorates successfully', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block).to.exist;
  });

  it('builds foreground with copy-column and image-column', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.foreground')).to.exist;
    expect(block.querySelector('.copy-column')).to.exist;
    expect(block.querySelector('.image-column')).to.exist;
    expect(block.querySelector('.image-column picture')).to.exist;
  });

  it('omits the logo without metadata and preserves authored copy', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.express-logo')).not.to.exist;
    expect(block.querySelector('.copy h1')).to.exist;
    expect(block.querySelector('.copy p')).to.exist;
    expect(block.querySelector('.heading-group').textContent).not.to.include('null');
  });

  logoMetadataKeys.forEach((key) => {
    ['on', 'yes', 'true', ' ON ', ' Yes ', ' TRUE '].forEach((value) => {
      it(`injects the Adobe brand logo when ${key} is "${value}"`, async () => {
        setLogoMetadata(key, value);
        const block = await prepBlock('./mocks/default.html');
        expect(block.querySelector('.copy-column .heading-group > .express-logo')).to.exist;
      });
    });
  });

  ['', 'off', 'no', 'false'].forEach((value) => {
    it(`omits the logo when both metadata keys are "${value}"`, async () => {
      logoMetadataKeys.forEach((key) => setLogoMetadata(key, value));
      const block = await prepBlock('./mocks/default.html');
      expect(block.querySelector('.express-logo')).not.to.exist;
    });
  });

  logoMetadataKeys.forEach((enabledKey) => {
    it(`injects the logo when only ${enabledKey} is enabled`, async () => {
      logoMetadataKeys.forEach((key) => {
        setLogoMetadata(key, key === enabledKey ? 'yes' : 'off');
      });
      const block = await prepBlock('./mocks/default.html');
      expect(block.querySelector('.copy-column .heading-group > .express-logo')).to.exist;
    });
  });

  it('keeps the authored heading and body copy, separate from the dropzone', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.copy h1')).to.exist;
    expect(block.querySelector('.copy p')).to.exist;
  });

  it('decorates the authored CTA link as a milo con-button', async () => {
    const block = await prepBlock('./mocks/default.html');
    const ctaLink = block.querySelector('.cta-dropzone > .action-area a');
    expect(ctaLink).to.exist;
    expect(ctaLink.classList.contains('con-button')).to.be.true;
  });

  it('keeps the authored primary CTA visible with the mobile floating CTA', async () => {
    await setViewport({ width: 375, height: 812 });
    try {
      const block = await prepBlock('./mocks/default.html');
      const ctaLink = block.querySelector('.cta-dropzone > .action-area a');
      ctaLink.classList.add('same-fcta');

      expect(ctaLink.textContent.trim()).to.equal('Create your resume');
      expect(getComputedStyle(ctaLink).display).to.equal('block');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('builds a real interactive dropzone with a file input', async () => {
    const block = await prepBlock('./mocks/default.html');
    const dropzone = block.querySelector('.cta-dropzone .verb-dropzone-area');
    expect(dropzone).to.exist;
    expect(dropzone.tagName).to.equal('BUTTON');
    expect(dropzone.querySelector('.verb-dropzone-heading').textContent).to.equal('Upload your resume');
    expect(dropzone.querySelector('.verb-dropzone-sub').textContent).to.equal('PDF, DOCX, or DOC up to 20 MB.');
    expect(block.querySelector('input[type="file"]')).to.exist;
  });

  it('builds a verb-dropzone-footer with legal copy and an info icon', async () => {
    const block = await prepBlock('./mocks/default.html');
    const footer = block.querySelector('.verb-dropzone-footer');
    expect(footer).to.exist;
    expect(footer.querySelector('.verb-dropzone-legal')).to.exist;
    expect(footer.querySelector('.info-icon')).to.exist;
  });

  it('appends a hidden error state to the block', async () => {
    const block = await prepBlock('./mocks/default.html');
    expect(block.querySelector('.error.hide')).to.exist;
  });
});

describe('verb-express-hero resume fork', () => {
  let element;
  let responses;
  let modalOpens;
  const onModalOpen = (e) => modalOpens.push(e.detail);
  const select = (detail) => window.dispatchEvent(new CustomEvent('resume-upload-fork:select', { detail }));
  const closeModal = (id) => window.dispatchEvent(new CustomEvent('milo:modal:closed', { detail: { id } }));

  beforeEach(() => {
    element = document.createElement('div');
    const received = [];
    responses = received;
    modalOpens = [];
    element.addEventListener('unity:resume-fork-response', (e) => received.push(e.detail));
    window.addEventListener('modal:open', onModalOpen);
    initResumeFork(element);
  });

  afterEach(() => {
    window.removeEventListener('modal:open', onModalOpen);
  });

  it('opens the fork modal when Unity asks for it', () => {
    element.dispatchEvent(new CustomEvent('unity:show-resume-fork'));
    expect(modalOpens).to.deep.equal([{ hash: `#${RESUME_FORK_MODAL_ID}` }]);
  });

  it('forwards continue-fork with the chosen product to Unity', () => {
    element.dispatchEvent(new CustomEvent('unity:show-resume-fork'));
    select({ action: 'continue-fork', choice: 'refine' });
    expect(responses).to.deep.equal([{ action: 'continue-fork', choice: 'refine' }]);
  });

  it('forwards cancel-fork to Unity', () => {
    element.dispatchEvent(new CustomEvent('unity:show-resume-fork'));
    select({ action: 'cancel-fork' });
    expect(responses).to.deep.equal([{ action: 'cancel-fork' }]);
  });

  it('treats closing the fork modal without a choice as cancel-fork', () => {
    element.dispatchEvent(new CustomEvent('unity:show-resume-fork'));
    closeModal('some-other-modal');
    expect(responses).to.deep.equal([]);
    closeModal(RESUME_FORK_MODAL_ID);
    expect(responses).to.deep.equal([{ action: 'cancel-fork' }]);
  });

  it('sends only one response per request', () => {
    element.dispatchEvent(new CustomEvent('unity:show-resume-fork'));
    select({ action: 'continue-fork', choice: 'sharpen' });
    closeModal(RESUME_FORK_MODAL_ID);
    select({ action: 'cancel-fork' });
    expect(responses).to.deep.equal([{ action: 'continue-fork', choice: 'sharpen' }]);
  });

  it('ignores fork events when Unity has not asked', () => {
    select({ action: 'continue-fork', choice: 'sharpen' });
    closeModal(RESUME_FORK_MODAL_ID);
    expect(responses).to.deep.equal([]);
  });
});
