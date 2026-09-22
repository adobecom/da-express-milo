/* eslint-env mocha */

import {
  readFile, setViewport, sendMouse, resetMouse,
} from '@web/test-runner-commands';
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

const styleSheets = [
  '/express/code/styles/styles.css',
  '/express/code/blocks/resume-hero/resume-hero.css',
];
await Promise.all(styleSheets.map((href) => new Promise((resolve, reject) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.addEventListener('load', resolve, { once: true });
  link.addEventListener('error', reject, { once: true });
  document.head.append(link);
})));

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
      uploadPictures: [...block.querySelectorAll('[id^="authored-upload-picture-"]')],
      createCell: block.querySelector('#authored-create-cell'),
      createMedia: [...block.querySelectorAll('[id^="authored-create-media-"]')],
      createPictures: [...block.querySelectorAll('[id^="authored-create-picture-"]')],
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

  it('preserves every create-now picture, copy, and link', () => {
    expect([...block.querySelectorAll('[id^="authored-create-picture-"]')])
      .to.deep.equal(authoredNodes.createPictures);
    expect(block.querySelector('#authored-create-copy')).to.equal(authoredNodes.createCopy);
    expect(block.querySelector('#authored-create-link')).to.equal(authoredNodes.createLink);
    expect(authoredNodes.createLink.getAttribute('href')).to.equal('https://www.adobe.com/express/templates/resume');
  });

  it('uses the mobile-first spacing for the block and header', async () => {
    await setViewport({ width: 500, height: 800 });
    try {
      const blockStyles = getComputedStyle(block);
      const headerStyles = getComputedStyle(block.querySelector('.resume-hero-header'));
      const headerContentStyles = getComputedStyle(block.querySelector('.resume-hero-header-content'));
      const headingStyles = getComputedStyle(block.querySelector('.resume-hero .heading'));

      expect(blockStyles.padding).to.equal('32px 16px');
      expect(headerStyles.marginBlockEnd).to.equal('16px');
      expect(headerContentStyles.gap).to.equal('8px');
      expect(headerContentStyles.maxWidth).to.equal('666px');
      expect(headingStyles.fontSize).to.equal('36px');
      expect(headingStyles.letterSpacing).to.equal('-1px');
      expect(headingStyles.lineHeight).to.equal('32px');
      expect(getComputedStyle(authoredNodes.uploadCell).gap).to.equal('8px');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('keeps 8px between the headline and subcopy at every breakpoint', async () => {
    for (const width of [500, 1000, 1700]) {
      await setViewport({ width, height: 900 });
      expect(getComputedStyle(block.querySelector('.resume-hero-header-content')).gap).to.equal('8px');
    }
    await setViewport({ width: 800, height: 600 });
  });

  it('lays out the mobile create widget and decorates its link as a button', async () => {
    await setViewport({ width: 500, height: 1000 });
    try {
      const styles = getComputedStyle(authoredNodes.createCell);
      const copyStyles = getComputedStyle(authoredNodes.createCopy);
      const actionStyles = getComputedStyle(authoredNodes.createLink.closest('.action-area'));
      const mediaStage = block.querySelector('.resume-hero-create-media-stage');
      const pictureStyles = getComputedStyle(authoredNodes.createPictures[0]);
      const imageStyles = getComputedStyle(authoredNodes.createPictures[0].querySelector('img'));

      expect(styles.display).to.equal('flex');
      expect(styles.padding).to.equal('40px 24px');
      expect(styles.flexDirection).to.equal('column');
      expect(styles.justifyContent).to.equal('flex-end');
      expect(styles.alignItems).to.equal('center');
      expect(styles.gap).to.equal('8px');
      expect(styles.borderRadius).to.equal('24px');
      expect(copyStyles.order).to.equal('0');
      expect(actionStyles.order).to.equal('1');
      expect(getComputedStyle(mediaStage).order).to.equal('2');
      expect(authoredNodes.createCopy.classList.contains('resume-hero-create-copy')).to.be.true;
      authoredNodes.createMedia.forEach((media) => {
        expect(media.classList.contains('resume-hero-create-media')).to.be.true;
      });
      expect(authoredNodes.createCopy.getBoundingClientRect().top)
        .to.be.lessThan(authoredNodes.createLink.closest('.action-area').getBoundingClientRect().top);
      expect(authoredNodes.createLink.closest('.action-area').getBoundingClientRect().top)
        .to.be.lessThan(mediaStage.getBoundingClientRect().top);
      expect(getComputedStyle(mediaStage).height).to.equal('184px');
      expect(pictureStyles.marginBlockStart).to.equal('0px');
      expect(pictureStyles.maxHeight).to.equal('100%');
      expect(imageStyles.maxHeight).to.equal('100%');
      expect(authoredNodes.createLink.classList.contains('con-button')).to.be.true;
      expect(authoredNodes.createLink.classList.contains('blue')).to.be.false;
      expect(authoredNodes.createLink.classList.contains('small')).to.be.true;
      expect(authoredNodes.createLink.classList.contains('button-xl')).to.be.false;
      expect(getComputedStyle(authoredNodes.createLink).borderTopWidth).to.equal('0px');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('extends the authored Create link over the entire card', () => {
    const cardRect = authoredNodes.createCell.getBoundingClientRect();
    const hitTarget = document.elementFromPoint(
      Math.round(cardRect.left + 8),
      Math.round(cardRect.top + 8),
    );
    const overlayStyles = getComputedStyle(authoredNodes.createLink, '::after');

    expect(overlayStyles.position).to.equal('absolute');
    expect(overlayStyles.inset).to.equal('0px');
    expect(hitTarget).to.equal(authoredNodes.createLink);
  });

  it('uses the requested disclaimer and tooltip spacing', () => {
    const legal = block.querySelector('.verb-dropzone-legal');
    const infoIcon = block.querySelector('.info-icon');
    const uploadStyles = getComputedStyle(authoredNodes.uploadCell);
    const legalStyles = getComputedStyle(legal);
    const legalLineStyles = getComputedStyle(legal.querySelector('p'));
    const iconStyles = getComputedStyle(infoIcon);
    const tooltipStyles = getComputedStyle(infoIcon, '::before');
    const arrowStyles = getComputedStyle(infoIcon, '::after');

    expect(uploadStyles.gap).to.equal('8px');
    expect(legalStyles.gap).to.equal('0px');
    expect(legalLineStyles.position).to.equal('relative');
    expect(iconStyles.marginInlineStart).to.equal('2px');
    expect(iconStyles.bottom).to.equal('-3px');
    expect(iconStyles.marginBlockEnd).to.equal('0px');
    expect(tooltipStyles.left).to.equal('100%');
    expect(tooltipStyles.marginBlockEnd).to.equal('15px');
    expect(tooltipStyles.top).to.equal('50%');
    expect(arrowStyles.left).to.equal('100%');
    expect(arrowStyles.borderTopWidth).to.equal('4px');
    expect(arrowStyles.top).to.equal('50%');
  });

  it('uses the requested mobile spacing around the cards and value props', async () => {
    await setViewport({ width: 500, height: 1000 });
    try {
      const actionsRect = authoredNodes.actionsRow.getBoundingClientRect();
      const uploadRect = authoredNodes.uploadCell.getBoundingClientRect();
      const createRect = authoredNodes.createCell.getBoundingClientRect();
      const firstBenefit = authoredNodes.extraRow.querySelector('.resume-hero-benefit');
      const benefitRect = firstBenefit.getBoundingClientRect();
      const benefitStyles = getComputedStyle(firstBenefit);
      const actionsStyles = getComputedStyle(authoredNodes.actionsRow);

      expect(actionsStyles.gap).to.equal('24px');
      expect(createRect.top - uploadRect.bottom).to.equal(24);
      expect(benefitRect.top + parseFloat(benefitStyles.paddingTop) - actionsRect.bottom)
        .to.equal(22);
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('keeps 22px of visible space before value props at every breakpoint', async () => {
    const gaps = [];
    for (const width of [500, 1000, 1700]) {
      await setViewport({ width, height: 1000 });
      const firstBenefit = authoredNodes.extraRow.querySelector('.resume-hero-benefit');
      const benefitRect = firstBenefit.getBoundingClientRect();
      const benefitStyles = getComputedStyle(firstBenefit);
      const reference = width < 600
        ? authoredNodes.createCell
        : block.querySelector('.verb-dropzone-legal p:last-child');
      const visibleGap = benefitRect.top
        + parseFloat(benefitStyles.paddingTop)
        - reference.getBoundingClientRect().bottom;

      gaps.push({ width, visibleGap });
    }
    await setViewport({ width: 800, height: 600 });
    expect(gaps).to.deep.equal([
      { width: 500, visibleGap: 22 },
      { width: 1000, visibleGap: 22 },
      { width: 1700, visibleGap: 22 },
    ]);
  });

  it('keeps the first two benefits together and stacks the rest on narrow mobile', async () => {
    await setViewport({ width: 360, height: 800 });
    try {
      const benefits = [...block.querySelectorAll('.resume-hero-benefit')];
      const rects = benefits.map((benefit) => benefit.getBoundingClientRect());

      expect(getComputedStyle(block.querySelector('.resume-hero-benefits')).display).to.equal('grid');
      expect(rects[0].top).to.equal(rects[1].top);
      expect(rects[2].top).to.be.at.least(rects[0].bottom);
      expect(rects[3].top).to.be.at.least(rects[2].bottom);
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('uses the bounded tablet card widths when both cards fit side by side', async () => {
    await setViewport({ width: 1000, height: 800 });
    try {
      const actionsStyles = getComputedStyle(authoredNodes.actionsRow);
      const blockStyles = getComputedStyle(block);
      const createStyles = getComputedStyle(authoredNodes.createCell);
      const dropzoneStyles = getComputedStyle(block.querySelector('.resume-hero-dropzone-area'));
      const uploadRect = authoredNodes.uploadCell.getBoundingClientRect();
      const createRect = authoredNodes.createCell.getBoundingClientRect();

      expect(actionsStyles.display).to.equal('flex');
      expect(actionsStyles.flexWrap).to.equal('wrap');
      expect(blockStyles.paddingInlineStart).to.equal('32px');
      expect(blockStyles.paddingInlineEnd).to.equal('32px');
      expect(createRect.left).to.be.greaterThan(uploadRect.right);
      expect(uploadRect.width).to.be.within(551, 565);
      expect(createRect.width).to.be.within(268, 565);
      expect(dropzoneStyles.height).to.equal('298px');
      expect(createStyles.height).to.equal(dropzoneStyles.height);
      expect(createStyles.padding).to.equal('24px');
      expect(createStyles.alignItems).to.equal('center');
      expect(createStyles.justifyContent).to.equal('flex-end');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('lets both tablet cards share the available width inside 32px margins', async () => {
    await setViewport({ width: 1199, height: 800 });
    try {
      const uploadStyles = getComputedStyle(authoredNodes.uploadCell);
      const createStyles = getComputedStyle(authoredNodes.createCell);
      expect(parseFloat(uploadStyles.width)).to.be.within(550, 565);
      expect(parseFloat(createStyles.width)).to.be.within(550, 565);
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('stacks bounded tablet cards and displays dropzone artwork when both cards do not fit', async () => {
    await setViewport({ width: 850, height: 900 });
    try {
      const actionsStyles = getComputedStyle(authoredNodes.actionsRow);
      const widgetIcon = block.querySelector('.widget-icon');
      const dropzoneRect = block.querySelector('.resume-hero-dropzone-area').getBoundingClientRect();
      const uploadRect = authoredNodes.uploadCell.getBoundingClientRect();
      const createRect = authoredNodes.createCell.getBoundingClientRect();

      expect(actionsStyles.display).to.equal('flex');
      expect(actionsStyles.flexWrap).to.equal('wrap');
      expect(uploadRect.width).to.equal(565);
      expect(createRect.width).to.equal(565);
      expect(createRect.height).to.equal(dropzoneRect.height);
      expect(getComputedStyle(widgetIcon).display).to.equal('flex');
      expect(createRect.top).to.be.greaterThan(uploadRect.bottom);
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('uses the desktop grid, 40px top spacing, and a 1130px container', async () => {
    await setViewport({ width: 1440, height: 900 });
    try {
      const blockStyles = getComputedStyle(block);
      const actionsStyles = getComputedStyle(authoredNodes.actionsRow);
      const headerStyles = getComputedStyle(block.querySelector('.resume-hero-header'));
      const createStyles = getComputedStyle(authoredNodes.createCell);

      expect(blockStyles.paddingTop).to.equal('40px');
      expect(headerStyles.marginBlockEnd).to.equal('16px');
      expect(actionsStyles.display).to.equal('grid');
      expect(actionsStyles.maxWidth).to.equal('1130px');
      expect(createStyles.width).to.equal('323px');
      expect(createStyles.borderTopWidth).to.equal('1px');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('uses the specified 983px and 323px card widths at the XL breakpoint', async () => {
    await setViewport({ width: 1700, height: 900 });
    try {
      const blockStyles = getComputedStyle(block);
      const actionsStyles = getComputedStyle(authoredNodes.actionsRow);
      const actionsRect = authoredNodes.actionsRow.getBoundingClientRect();
      const headerStyles = getComputedStyle(block.querySelector('.resume-hero-header-content'));
      const uploadRect = authoredNodes.uploadCell.getBoundingClientRect();
      const createRect = authoredNodes.createCell.getBoundingClientRect();

      expect(blockStyles.maxWidth).to.equal('1410px');
      expect(actionsStyles.maxWidth).to.equal('1330px');
      expect(actionsRect.width).to.equal(1330);
      expect(headerStyles.maxWidth).to.equal('666px');
      expect(uploadRect.width).to.equal(983);
      expect(createRect.width).to.equal(323);
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('moves all authored upload pictures into the dropzone in source order', () => {
    const iconWrapper = block.querySelector('.widget-icon');
    const pictures = [...iconWrapper.querySelectorAll('.resume-hero-dropzone-image')];

    expect(pictures).to.deep.equal(authoredNodes.uploadPictures);
    expect(iconWrapper.classList.contains('resume-hero-media-sequence')).to.be.true;
    expect(pictures[0].classList.contains('resume-hero-dropzone-image-2')).to.be.true;
    expect(pictures[1].classList.contains('resume-hero-dropzone-image-1')).to.be.true;
  });

  it('leaves no empty paragraph wrappers behind in the upload cell', () => {
    const strayParagraphs = [...authoredNodes.uploadCell.children]
      .filter((child) => child.tagName === 'P');
    expect(strayParagraphs).to.have.lengthOf(0);
  });

  it('enlarges and offsets the upload sequence at the tablet breakpoint', async () => {
    await setViewport({ width: 1000, height: 800 });
    try {
      const [first, second] = authoredNodes.uploadPictures.map((picture) => (
        getComputedStyle(picture)
      ));

      expect(first.position).to.equal('absolute');
      expect(first.right).to.equal('-70px');
      expect(parseFloat(first.top)).to.be.closeTo(130.125, 0.1);
      expect(parseFloat(first.width)).to.be.closeTo(185.03, 0.1);
      expect(parseFloat(first.height)).to.be.closeTo(248.75, 0.1);
      expect(first.getPropertyValue('--resume-hero-media-rotation').trim()).to.equal('-8.28deg');

      expect(second.position).to.equal('absolute');
      expect(second.left).to.equal('-30px');
      expect(parseFloat(second.top)).to.be.closeTo(130.125, 0.1);
      expect(parseFloat(second.width)).to.be.closeTo(185.03, 0.1);
      expect(parseFloat(second.height)).to.be.closeTo(248.75, 0.1);
      expect(second.getPropertyValue('--resume-hero-media-rotation').trim()).to.equal('6.91deg');
      authoredNodes.uploadPictures.forEach((picture) => {
        const imageStyles = getComputedStyle(picture.querySelector('img'));
        expect(imageStyles.objectFit).to.equal('contain');
        expect(parseFloat(imageStyles.width)).to.be.closeTo(185.03, 0.1);
        expect(parseFloat(imageStyles.height)).to.be.closeTo(248.75, 0.1);
      });

      const sourceTopPadding = parseFloat(first.height) * 0.1;
      expect(parseFloat(first.top) + sourceTopPadding).to.be.closeTo(155, 0.1);
      expect(parseFloat(second.top) + sourceTopPadding).to.be.closeTo(155, 0.1);
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('keeps the upload sequence static on tablet hover', async () => {
    await setViewport({ width: 1000, height: 800 });
    const pictures = authoredNodes.uploadPictures;
    try {
      const dropzone = block.querySelector('.resume-hero-dropzone-area');
      const rect = dropzone.getBoundingClientRect();
      const restingStyles = pictures.map((picture) => {
        const styles = getComputedStyle(picture);
        return {
          left: styles.left,
          right: styles.right,
          top: styles.top,
          transform: styles.transform,
        };
      });
      await sendMouse({
        type: 'move',
        position: [Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2)],
      });

      pictures.forEach((picture, index) => {
        const styles = getComputedStyle(picture);
        expect(styles.left).to.equal(restingStyles[index].left);
        expect(styles.right).to.equal(restingStyles[index].right);
        expect(styles.top).to.equal(restingStyles[index].top);
        expect(styles.transform).to.equal(restingStyles[index].transform);
        expect(styles.transitionDuration).to.equal('0s');
      });
    } finally {
      await resetMouse();
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('sequences all three create images with their authored sizes and rotations', () => {
    const stage = block.querySelector('.resume-hero-create-media-stage');
    const media = [...stage.querySelectorAll('.resume-hero-create-media')];
    const specs = [
      { width: 100.322, height: 125.065 },
      { width: 100.322, height: 125.065 },
      { width: 96.634, height: 125.07 },
    ];

    expect(authoredNodes.createCell.classList.contains('resume-hero-media-sequence')).to.be.true;
    expect(media).to.deep.equal(authoredNodes.createMedia);
    media.forEach((item, index) => {
      const styles = getComputedStyle(item);
      expect(styles.position).to.equal('absolute');
      expect(parseFloat(styles.width)).to.be.closeTo(specs[index].width, 0.1);
      expect(parseFloat(styles.height)).to.be.closeTo(specs[index].height, 0.1);
    });
    expect(getComputedStyle(media[2]).aspectRatio).to.equal('17 / 22');
  });

  it('keeps all three create images visible so they appear stacked', () => {
    const stage = block.querySelector('.resume-hero-create-media-stage');
    const media = [...stage.querySelectorAll('.resume-hero-create-media')];

    media.forEach((item) => {
      const styles = getComputedStyle(item);
      expect(styles.opacity).to.equal('1');
      expect(styles.borderRadius).to.equal('6px');
      expect(styles.boxShadow).to.equal('none');
      expect(styles.filter).to.include('drop-shadow');
      expect(styles.overflow).to.equal('visible');
    });
  });

  it('shows the create-card focus treatment when its CTA receives focus', () => {
    authoredNodes.createLink.focus();
    const styles = getComputedStyle(authoredNodes.createCell);

    expect(styles.outlineStyle).to.equal('solid');
    expect(styles.outlineWidth).to.equal('2px');
    expect(styles.outlineOffset).to.equal('2px');
    authoredNodes.createLink.blur();
  });

  it('applies the authored offset/rotation transforms to media-1 and media-3', () => {
    const probe = document.createElement('div');
    document.body.append(probe);

    probe.style.transform = 'translate(-10px, 10px) rotate(-2.66deg)';
    const expectedMedia1 = getComputedStyle(probe).transform;
    probe.style.transform = 'translate(10px, -10px) rotate(2.66deg)';
    const expectedMedia3 = getComputedStyle(probe).transform;
    probe.remove();

    const media1 = block.querySelector('.resume-hero-create-media-1');
    const media3 = block.querySelector('.resume-hero-create-media-3');
    expect(getComputedStyle(media1).transform).to.equal(expectedMedia1);
    expect(getComputedStyle(media3).transform).to.equal(expectedMedia3);
  });

  it('fans out media-1/media-3 and shades the card on create-card hover', async () => {
    await setViewport({ width: 800, height: 1000 });
    const card = block.querySelector('.resume-hero-create');
    const rect = card.getBoundingClientRect();
    const mediaItems = [...card.querySelectorAll('.resume-hero-create-media')];
    try {
      card.style.transition = 'none';
      mediaItems.forEach((item) => {
        item.style.transition = 'none';
      });
      await sendMouse({
        type: 'move',
        position: [Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2)],
      });

      const media1 = block.querySelector('.resume-hero-create-media-1');
      const media2 = block.querySelector('.resume-hero-create-media-2');
      const media3 = block.querySelector('.resume-hero-create-media-3');

      expect(getComputedStyle(media1).transform).to.equal('matrix(1, 0, 0, 1, -116, 7)');
      expect(getComputedStyle(media2).transform).to.equal('matrix(1, 0, 0, 1, 0, 7)');
      expect(getComputedStyle(media3).transform).to.equal('matrix(1, 0, 0, 1, 116, 7)');
      [media1, media2, media3].forEach((media) => {
        const styles = getComputedStyle(media);
        expect(styles.borderRadius).to.equal('6px');
        expect(styles.boxShadow).to.equal('none');
        expect(styles.filter).to.include('drop-shadow');
        expect(styles.overflow).to.equal('visible');
        const pictureStyles = getComputedStyle(media.querySelector('picture'));
        const imageStyles = getComputedStyle(media.querySelector('img'));
        expect(pictureStyles.overflow).to.equal('hidden');
        expect(imageStyles.scale).to.equal('1.01');
      });

      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--color-gray-150)';
      document.body.append(probe);
      const expectedHoverColor = getComputedStyle(probe).backgroundColor;
      probe.remove();
      expect(getComputedStyle(card).backgroundColor).to.equal(expectedHoverColor);
    } finally {
      card.style.removeProperty('transition');
      mediaItems.forEach((item) => {
        item.style.removeProperty('transition');
      });
      await resetMouse();
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('paints the dropzone boundary above the sequence images and lets clicks pass through', async () => {
    await setViewport({ width: 1000, height: 800 });
    try {
      const dropzoneArea = block.querySelector('.resume-hero-dropzone-area');
      const border = block.querySelector('.resume-hero-dropzone-border');
      const borderStyles = getComputedStyle(border);
      const widgetIconStyles = getComputedStyle(block.querySelector('.widget-icon'));
      const pictures = [...block.querySelectorAll('.resume-hero-dropzone-image')];

      expect(border).to.exist;
      expect(borderStyles.position).to.equal('absolute');
      expect(borderStyles.pointerEvents).to.equal('none');
      expect(Number(borderStyles.zIndex)).to.be.greaterThan(Number(widgetIconStyles.zIndex));
      expect(borderStyles.borderBottomStyle).to.equal('dashed');
      expect(borderStyles.borderRightStyle).to.equal('dashed');
      expect(borderStyles.borderBottomWidth).to.equal('2px');
      expect(borderStyles.borderRightWidth).to.equal('2px');
      expect(getComputedStyle(dropzoneArea).backgroundImage).to.equal('none');
      pictures.forEach((picture) => {
        const styles = getComputedStyle(picture);
        expect(styles.boxShadow).to.equal('none');
        expect(styles.overflow).to.equal('visible');
      });
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('uses a compact card-image-free dropzone below the tablet breakpoint', async () => {
    await setViewport({ width: 500, height: 800 });
    try {
      const dropzone = block.querySelector('.resume-hero-dropzone-area');
      const widgetIcon = dropzone.querySelector('.widget-icon');
      const styles = getComputedStyle(dropzone);

      expect(styles.minHeight).to.equal('0px');
      expect(styles.padding).to.equal('40px 15px');
      expect(getComputedStyle(widgetIcon).display).to.equal('none');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
  });

  it('uses the complete XL typography mode and 8px subline gap on mobile', async () => {
    await setViewport({ width: 500, height: 800 });
    try {
      const contentStyles = getComputedStyle(block.querySelector('.verb-dropzone-content'));
      const headingStyles = getComputedStyle(block.querySelector('.verb-dropzone-heading'));
      const subcopyStyles = getComputedStyle(block.querySelector('.verb-dropzone-sub'));

      expect(contentStyles.gap).to.equal('8px');
      expect(headingStyles.color).to.equal('rgb(44, 44, 44)');
      expect(headingStyles.fontSize).to.equal('24px');
      expect(headingStyles.fontWeight).to.equal('900');
      expect(headingStyles.letterSpacing).to.equal('-0.48px');
      expect(headingStyles.lineHeight).to.equal('24px');
      expect(headingStyles.textAlign).to.equal('center');
      expect(subcopyStyles.color).to.equal('rgb(0, 0, 0)');
      expect(subcopyStyles.fontWeight).to.equal('400');
      expect(subcopyStyles.textAlign).to.equal('center');
    } finally {
      await setViewport({ width: 800, height: 600 });
    }
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
    expect(block.querySelectorAll('.resume-hero-create-media-stage')).to.have.length(1);
    expect(block.querySelectorAll('.resume-hero-dropzone-image')).to.have.length(2);
    expect(block.querySelectorAll('.resume-hero-create-media')).to.have.length(3);
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
            <picture id="legacy-create-picture"><img src="/express/code/icons/resume.svg" alt="Create"></picture>
            <p><a id="legacy-create-link" href="https://www.adobe.com/create">Create now</a></p>
          </div>
        </div>
        <div>
          <div><picture id="legacy-upload-picture"><img src="/express/code/icons/document.svg" alt="Upload"></picture></div>
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

describe('resume-hero placeholder precedence', () => {
  beforeEach(() => {
    stubGlobals();
    // Block-specific keys sit alongside the legacy verb-* / close-dialog
    // fallbacks (still stubbed by stubGlobals) so we can assert the new keys win.
    Object.assign(window.mph, {
      'resume-hero-resume-builder-upload-cta': 'RH upload cta',
      'resume-hero-resume-builder-file-limit': 'RH file limit',
      'resume-hero-legal': 'RH legal line',
      'resume-hero-tool-tip': 'RH tooltip',
      'resume-hero-close-dialog': 'RH close',
    });
    document.body.innerHTML = basicHtml;
  });

  afterEach(restoreGlobals);

  it('prefers resume-hero-* keys over the legacy verb-* fallbacks', async () => {
    const block = document.querySelector('.resume-hero');
    await decorate(block);

    expect(block.querySelector('.verb-dropzone-heading').textContent).to.equal('RH upload cta');
    expect(block.querySelector('.verb-dropzone-sub').textContent).to.equal('RH file limit');
    expect(block.querySelector('.verb-dropzone-legal p').firstChild.textContent).to.equal('RH legal line');
    expect(block.querySelector('.info-icon').getAttribute('aria-label')).to.equal('RH tooltip');
    const errorCloseButton = block.querySelector('.verb-dropzone-errorBtn');
    expect(errorCloseButton.tagName).to.equal('BUTTON');
    expect(errorCloseButton.type).to.equal('button');
    expect(errorCloseButton.getAttribute('aria-label')).to.equal('RH close');
  });

  it('lets resume-hero-* page metadata override the fetched sheet values', async () => {
    const metas = [
      ['resume-hero-resume-builder-upload-cta', 'Meta upload cta'],
      ['resume-hero-resume-builder-file-limit', 'Meta file limit'],
    ].map(([name, content]) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.append(meta);
      return meta;
    });

    const block = document.querySelector('.resume-hero');
    await decorate(block);

    expect(block.querySelector('.verb-dropzone-heading').textContent).to.equal('Meta upload cta');
    expect(block.querySelector('.verb-dropzone-sub').textContent).to.equal('Meta file limit');

    metas.forEach((meta) => meta.remove());
  });

  it('falls back to the legacy verb-* keys when no resume-hero-* key is authored', async () => {
    delete window.mph['resume-hero-resume-builder-upload-cta'];
    delete window.mph['resume-hero-legal'];
    window.mph['verb-dropzone-resume-builder-upload-cta'] = 'Upload Your Resume';
    const block = document.querySelector('.resume-hero');
    await decorate(block);

    expect(block.querySelector('.verb-dropzone-heading').textContent).to.equal('Upload your resume');
    expect(block.querySelector('.verb-dropzone-legal p').firstChild.textContent).to.equal('Your file will be securely handled.');
  });
});
