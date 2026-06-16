/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { buildAutoBlocks } from '../../../express/code/scripts/utils.js';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/mobile-fork-button-dismissable/mobile-fork-button-dismissable.js'),
]);
const { default: decorate } = imports[1];

function setDocumentMetadata(
  includeForkCta2 = true,
  includForkCta3 = false,
  includeEligibilityCheck = false,
) {
  const metadata = {
    'floating-cta-live': 'Y',
    'show-floating-cta': 'yes',
    'mobile-floating-cta': 'mobile-fork-button-dismissable',
    'desktop-floating-cta': 'floating-button',
    'main-cta-link': 'https://www.adobe.com/express/create',
    'main-cta-text': 'Get the full experience in the app.',
    'fork-cta-1-icon': 'cc-express',
    'fork-cta-1-link': 'https://www.google.com',
    'fork-cta-1-text': 'Get Free App',
    'fork-cta-1-icon-text': 'Adobe Express',
    'floating-cta-device-and-ram-check': 'no',
    'fallback-text': '((mobile-gating-fallback-text))',
  };

  if (includeForkCta2) {
    metadata['fork-cta-2-icon'] = 'cc-express';
    metadata['fork-cta-2-text'] = 'Free Version';
    metadata['fork-cta-2-link'] = 'https://www.google.com';
    metadata['fork-cta-2-icon-text'] = 'Test';
  }

  if (includForkCta3) {
    metadata['cta-1-text'] = 'Create in web now';
    metadata['cta-1-link'] = 'https://adobesparkpost-web.app.link/';
  }

  if (includeEligibilityCheck) {
    metadata['fork-eligibility-check'] = 'on';
  }

  Object.entries(metadata).forEach(([name, content]) => {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  });
}

function setMobileDom() {
  document.body.dataset.device = 'mobile';
  document.body.innerHTML = '<main><div class="section">'
    + '<div class="mobile-fork-button-dismissable meta-powered"><div>mobile</div></div>'
    + '</div></main>';
  return document.querySelector('.mobile-fork-button-dismissable');
}

describe('Mobile Fork Button', () => {
  beforeEach(async () => {
    window.isTestEnv = true;
    window.hlx = {};
    window.floatingCta = [
      {
        path: 'default',
        live: 'Y',
      },
    ];
    window.placeholders = { 'see-more': 'See More' };
    document.head.innerHTML = '';
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });

    // Mock Android user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      configurable: true,
    });
  });

  afterEach(() => {
    window.placeholders = undefined;
    document.body.innerHTML = '';
  });

  it('renders button with both fork-cta-1 and fork-cta-2 metadata', async () => {
    setDocumentMetadata(true);
    await buildAutoBlocks();
    const b = document.querySelector('.floating-button');

    await decorate(b);

    const blockWrapper = document.querySelector('.floating-button.block');
    const rows = blockWrapper.querySelectorAll('.mobile-gating-row');

    expect(rows.length).to.equal(2);

    const firstRow = rows[0];
    expect(firstRow.querySelector('a').textContent).to.equal('Get Free App');
    expect(firstRow.querySelector('.mobile-gating-text').textContent).to.equal('Adobe Express');

    const secondRow = rows[1];
    expect(secondRow.querySelector('a').textContent).to.equal('Free Version');
    expect(secondRow.querySelector('.mobile-gating-text').textContent).to.equal('Test');
  });

  it('renders button with both fork-cta-1 and fork-cta-2 metadata and fork-cta-3 metadata', async () => {
    setDocumentMetadata(true, true);
    const b = setMobileDom();

    await decorate(b);

    const blockWrapper = document.querySelector('.floating-button.block');
    const rows = blockWrapper.querySelectorAll('.mobile-gating-row');

    expect(rows.length).to.equal(2);

    const firstRow = rows[0];
    expect(firstRow.querySelector('a').textContent).to.equal('Get Free App');
    expect(firstRow.querySelector('.mobile-gating-text').textContent).to.equal('Adobe Express');

    const secondRow = rows[1];
    expect(secondRow.querySelector('a').textContent).to.equal('Free Version');
    expect(secondRow.querySelector('.mobile-gating-text').textContent).to.equal('Test');

    const closeButton = blockWrapper.querySelector('.mweb-close');
    expect(closeButton).to.exist;
    expect(document.body.style.overflow).to.equal('hidden');
    closeButton.click();
    expect(document.body.style.overflow).to.equal('');
    const newWrapper = document.querySelector('.floating-button.meta-powered');
    expect(newWrapper).to.exist;
  });

  it('builds the dismissible close button and overlay on iOS', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    setDocumentMetadata(true);
    const b = setMobileDom();

    await decorate(b);

    const blockWrapper = document.querySelector('.floating-button.block');
    const closeButton = blockWrapper.querySelector('.mweb-close');
    expect(closeButton).to.exist;
    expect(document.body.style.overflow).to.equal('hidden');
    closeButton.click();
    expect(document.body.style.overflow).to.equal('');
    const newWrapper = document.querySelector('.floating-button.meta-powered');
    expect(newWrapper).to.exist;
  });

  it('falls back to normal floating button on iOS when fork-eligibility-check is on', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });
    setDocumentMetadata(true, false, true);
    const b = setMobileDom();

    await decorate(b);

    const closeButton = document.querySelector('.mweb-close');
    expect(closeButton).to.not.exist;
  });
});
