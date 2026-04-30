/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { buildAutoBlocks, setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/test/mocks/libs', { hostname: 'example.com', search: '' });

const { default: decorate } = await import('../../../express/code/blocks/mobile-fork-button-os-split/mobile-fork-button-os-split.js');

const ANDROID_USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36';
const IOS_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function setDocumentMetadata() {
  const metadata = {
    'floating-cta-live': 'Y',
    'show-floating-cta': 'yes',
    'mobile-floating-cta': 'mobile-fork-button-os-split',
    'desktop-floating-cta': 'floating-button',
    'main-cta-link': 'https://www.adobe.com/express/create',
    'main-cta-text': 'Get the full experience in the app.',
    'floating-cta-device-and-ram-check': 'no',
    'fallback-text': '((mobile-gating-fallback-text))',
    'android-fork-button-header': 'Android header',
    'android-fork-cta-1-icon': 'cc-express',
    'android-fork-cta-1-link': 'https://www.google.com?os=android-app',
    'android-fork-cta-1-text': 'Get Android App',
    'android-fork-cta-1-icon-text': 'Android Express',
    'android-fork-cta-2-icon': 'cc-express',
    'android-fork-cta-2-link': 'https://www.google.com?os=android-web',
    'android-fork-cta-2-text': 'Android Web',
    'android-fork-cta-2-icon-text': 'Android Browser',
    'ios-fork-button-header': 'iOS header',
    'ios-fork-cta-1-icon': 'cc-express',
    'ios-fork-cta-1-link': 'https://www.google.com?os=ios-app',
    'ios-fork-cta-1-text': 'Get iOS App',
    'ios-fork-cta-1-icon-text': 'iOS Express',
    'ios-fork-cta-2-icon': 'cc-express',
    'ios-fork-cta-2-link': 'https://www.google.com?os=ios-web',
    'ios-fork-cta-2-text': 'iOS Web',
    'ios-fork-cta-2-icon-text': 'iOS Browser',
  };

  Object.entries(metadata).forEach(([name, content]) => {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  });
}

async function render(userAgent) {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
  setDocumentMetadata();
  const block = document.createElement('div');
  block.className = 'floating-button meta-powered';
  block.innerHTML = '<div>mobile</div>';
  document.querySelector('main .section').append(block);
  await decorate(block);
}

describe('Mobile Fork Button OS Split', () => {
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
    document.body.dataset.device = 'mobile';
  });

  afterEach(() => {
    window.placeholders = undefined;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('creates the auto block from mobile-floating-cta metadata', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: ANDROID_USER_AGENT,
      configurable: true,
    });
    setDocumentMetadata();

    await buildAutoBlocks();

    const block = document.querySelector('.mobile-fork-button-os-split');
    expect(block).to.exist;
    expect(block.classList.contains('meta-powered')).to.be.true;
  });

  it('renders Android-prefixed fork metadata for Android', async () => {
    await render(ANDROID_USER_AGENT);

    const blockWrapper = document.querySelector('.floating-button.block');
    const rows = blockWrapper.querySelectorAll('.mobile-gating-row');
    expect(blockWrapper.querySelector('.mobile-gating-header').textContent).to.equal('Android header');
    expect(rows.length).to.equal(2);
    expect(rows[0].querySelector('a').textContent).to.equal('Get Android App');
    expect(rows[0].querySelector('a').href).to.equal('https://www.google.com/?os=android-app');
    expect(rows[0].querySelector('.mobile-gating-text').textContent).to.equal('Android Express');
    expect(rows[1].querySelector('a').textContent).to.equal('Android Web');
    expect(rows[1].querySelector('a').href).to.equal('https://www.google.com/?os=android-web');
    expect(rows[1].querySelector('.mobile-gating-text').textContent).to.equal('Android Browser');
  });

  it('renders iOS-prefixed fork metadata for iOS', async () => {
    await render(IOS_USER_AGENT);

    const blockWrapper = document.querySelector('.floating-button.block');
    const rows = blockWrapper.querySelectorAll('.mobile-gating-row');
    expect(blockWrapper.querySelector('.mobile-gating-header').textContent).to.equal('iOS header');
    expect(rows.length).to.equal(2);
    expect(rows[0].querySelector('a').textContent).to.equal('Get iOS App');
    expect(rows[0].querySelector('a').href).to.equal('https://www.google.com/?os=ios-app');
    expect(rows[0].querySelector('.mobile-gating-text').textContent).to.equal('iOS Express');
    expect(rows[1].querySelector('a').textContent).to.equal('iOS Web');
    expect(rows[1].querySelector('a').href).to.equal('https://www.google.com/?os=ios-web');
    expect(rows[1].querySelector('.mobile-gating-text').textContent).to.equal('iOS Browser');
  });

  it('dispatches linkspopulated after rendering links', async () => {
    const linksPopulated = new Promise((resolve) => {
      document.addEventListener('linkspopulated', (event) => {
        if (event.detail.length === 2) resolve(event.detail);
      });
    });

    await render(ANDROID_USER_AGENT);

    const links = await linksPopulated;
    expect(links.length).to.equal(2);
    expect(links[0].textContent).to.equal('Get Android App');
    expect(links[1].textContent).to.equal('Android Web');
  });
});
