/* eslint-env mocha */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
window.isTestEnv = true;

const [{ getLibs, decorateMiloIcons }] = await Promise.all([
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

const {
  default: decorate,
  LIMITS,
} = await import('../../../express/code/blocks/resume-hero/resume-hero.js');
const basicHtml = await readFile({ path: './mocks/basic.html' });

function stubGlobals() {
  sinon.stub(window, 'fetch').callsFake((url) => {
    const iconName = `${url}`.match(/\/([^/]+)\.svg$/)?.[1];
    if (iconName) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`<svg data-source="${iconName}" xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>`),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
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

  it('decorates Milo-authored icon tokens with inline SVG spans', async () => {
    const icons = [
      ['free-to-use', 'free-to-use'],
      ['file-not-stored', 'file-not-stored'],
      ['secure-with-adobe', 'secure-with-adobe'],
      ['one-tap-pay', 'card-tap-payment'],
    ];

    icons.forEach(([authoredName, svgName]) => {
      const icon = block.querySelector(`.icon.icon-${authoredName}`);
      expect(icon).to.exist;
      expect(icon.dataset.svgInjected).to.equal('true');
      expect(icon.querySelector(`svg[data-source="${svgName}"]`)).to.exist;
      expect(icon.querySelector('svg').getAttribute('aria-hidden')).to.equal('true');
    });
    expect(authoredNodes.extraRow.textContent).to.not.match(/:(free-to-use|file-not-stored|secure-with-adobe|one-tap-pay):/);

    const benefits = [...authoredNodes.extraRow.querySelectorAll('.resume-hero-benefit')];
    const benefitsWrapper = authoredNodes.extraRow.querySelector('.resume-hero-benefits');
    const wrapperStyles = getComputedStyle(benefitsWrapper);
    expect(wrapperStyles.display).to.equal('flex');
    expect(wrapperStyles.flexWrap).to.equal('wrap');
    expect(wrapperStyles.justifyContent).to.equal('center');
    expect(wrapperStyles.padding).to.equal('0px 32px');
    expect(benefits).to.have.length(4);
    expect(benefits.map((benefit) => benefit.textContent.trim())).to.deep.equal([
      'Free to use',
      'No credit card needed',
      'Secured with Adobe',
      'File Not Stored',
    ]);
    benefits.forEach((benefit) => {
      const styles = getComputedStyle(benefit);
      expect(benefit.querySelector(':scope > span.icon')).to.exist;
      expect(styles.display).to.equal('flex');
      expect(styles.padding).to.equal('12px 12px 12px 8px');
      expect(styles.alignItems).to.equal('center');
      expect(styles.justifyContent).to.equal('center');
      expect(styles.gap).to.equal('8px');
      expect(styles.fontWeight).to.equal('700');
    });

    const decoratedIcons = [...block.querySelectorAll('#authored-extra-row .icon')];
    await decorateMiloIcons(authoredNodes.extraRow);
    expect([...block.querySelectorAll('#authored-extra-row .icon')]).to.deep.equal(decoratedIcons);

    const genericIcons = document.createElement('div');
    genericIcons.innerHTML = `
      <p>:custom-status:</p>
      <span class="icon icon-existing-status"></span>
      <span class="icon icon-marked-without-svg" data-svg-injected="true"></span>
      <span class="icon icon-complete" data-svg-injected="true"><svg data-existing="true"></svg></span>`;
    await decorateMiloIcons(genericIcons);
    expect(genericIcons.querySelector('.icon-custom-status svg[data-source="custom-status"]')).to.exist;
    expect(genericIcons.querySelector('.icon-existing-status svg[data-source="existing-status"]')).to.exist;
    expect(genericIcons.querySelector('.icon-marked-without-svg svg[data-source="marked-without-svg"]')).to.exist;
    expect(genericIcons.querySelector('.icon-complete svg[data-existing="true"]')).to.exist;
    expect(genericIcons.querySelector('.icon-complete svg[data-source]')).to.not.exist;

    const rootIcon = document.createElement('span');
    rootIcon.className = 'icon icon-root-status';
    await decorateMiloIcons(rootIcon);
    expect(rootIcon.querySelector('svg[data-source="root-status"]')).to.exist;
  });

  it('preserves the create-now picture, copy, and link', () => {
    expect(block.querySelector('#authored-create-picture')).to.equal(authoredNodes.createPicture);
    expect(block.querySelector('#authored-create-copy')).to.equal(authoredNodes.createCopy);
    expect(block.querySelector('#authored-create-link')).to.equal(authoredNodes.createLink);
    expect(authoredNodes.createLink.getAttribute('href')).to.equal('https://www.adobe.com/express/templates/resume');
  });

  it('uses the mobile-first spacing for the block and header', () => {
    const blockStyles = getComputedStyle(block);
    const headerStyles = getComputedStyle(block.querySelector('.resume-hero-header'));
    const headerContentStyles = getComputedStyle(block.querySelector('.resume-hero-header-content'));

    expect(blockStyles.padding).to.equal('32px 16px');
    expect(headerStyles.marginBlockEnd).to.equal('16px');
    expect(headerContentStyles.gap).to.equal('8px');
  });

  it('lays out the mobile create widget and decorates its link as a button', () => {
    const styles = getComputedStyle(authoredNodes.createCell);
    const buttonStyles = getComputedStyle(authoredNodes.createLink);
    const copyStyles = getComputedStyle(authoredNodes.createCopy);
    const actionStyles = getComputedStyle(authoredNodes.createLink.closest('.action-area'));
    const pictureStyles = getComputedStyle(authoredNodes.createPicture);
    const imageStyles = getComputedStyle(authoredNodes.createPicture.querySelector('img'));

    expect(styles.display).to.equal('flex');
    expect(styles.padding).to.equal('40px 24px');
    expect(styles.flexDirection).to.equal('column-reverse');
    expect(styles.justifyContent).to.equal('flex-end');
    expect(styles.alignItems).to.equal('center');
    expect(styles.gap).to.equal('8px');
    expect(styles.borderRadius).to.equal('24px');
    expect(styles.backgroundColor).to.equal('rgb(248, 248, 248)');
    expect(buttonStyles.height).to.equal('24px');
    expect(copyStyles.order).to.equal('2');
    expect(actionStyles.order).to.equal('1');
    expect(pictureStyles.order).to.equal('0');
    expect(authoredNodes.createCopy.classList.contains('resume-hero-create-copy')).to.be.true;
    expect(authoredNodes.createPicture.classList.contains('resume-hero-create-media')).to.be.true;
    expect(authoredNodes.createCopy.getBoundingClientRect().top)
      .to.be.lessThan(authoredNodes.createLink.closest('.action-area').getBoundingClientRect().top);
    expect(authoredNodes.createLink.closest('.action-area').getBoundingClientRect().top)
      .to.be.lessThan(authoredNodes.createPicture.getBoundingClientRect().top);
    expect(pictureStyles.marginBlockStart).to.equal('24px');
    expect(pictureStyles.maxHeight).to.equal('216px');
    expect(imageStyles.maxHeight).to.equal('216px');
    expect(authoredNodes.createLink.classList.contains('con-button')).to.be.true;
    expect(authoredNodes.createLink.classList.contains('blue')).to.be.true;
    expect(authoredNodes.createLink.classList.contains('button-xl')).to.be.true;
  });

  it('moves only the authored upload picture into the dropzone icon', () => {
    const picture = block.querySelector('.widget-icon #authored-upload-picture');
    expect(picture).to.equal(authoredNodes.uploadPicture);
    expect(picture.classList.contains('resume-hero-dropzone-image')).to.be.true;
  });

  it('uses a compact image-free dropzone on mobile', () => {
    const dropzone = block.querySelector('.resume-hero-dropzone-area');
    const widgetIcon = dropzone.querySelector('.widget-icon');
    const styles = getComputedStyle(dropzone);

    expect(styles.backgroundImage).to.equal('none');
    expect(styles.minHeight).to.equal('0px');
    expect(styles.padding).to.equal('51px 15px');
    expect(getComputedStyle(widgetIcon).display).to.equal('none');
  });

  it('styles the upload heading and subcopy with centered S2A typography', () => {
    const headingStyles = getComputedStyle(block.querySelector('.verb-dropzone-heading'));
    const subcopyStyles = getComputedStyle(block.querySelector('.verb-dropzone-sub'));

    expect(headingStyles.color).to.equal('rgb(44, 44, 44)');
    expect(headingStyles.fontWeight).to.equal('900');
    expect(headingStyles.textAlign).to.equal('center');
    expect(subcopyStyles.color).to.equal('rgb(0, 0, 0)');
    expect(subcopyStyles.fontWeight).to.equal('400');
    expect(subcopyStyles.textAlign).to.equal('center');
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
    const logo = block.querySelector('.resume-hero-header-content > .express-logo');
    expect(logo).to.exist;
    expect(getComputedStyle(logo).marginBlockEnd).to.equal('0px');
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
    expect(createLink.classList.contains('con-button')).to.be.true;
  });
});
