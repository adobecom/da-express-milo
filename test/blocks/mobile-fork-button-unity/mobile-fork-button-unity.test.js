/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { buildAutoBlocks, setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/test/mocks/libs', { hostname: 'example.com', search: '' });

const { default: decorate } = await import('../../../express/code/blocks/mobile-fork-button-unity/mobile-fork-button-unity.js');

const ANDROID_USER_AGENT = 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36';
const IOS_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

function setDocumentMetadata(overrides = {}) {
  const metadata = {
    'floating-cta-live': 'Y',
    'show-floating-cta': 'yes',
    'mobile-floating-cta': 'mobile-fork-button-unity',
    'desktop-floating-cta': 'floating-button',
    'main-cta-link': 'https://www.adobe.com/express/create',
    'main-cta-text': 'Get the full experience in the app.',
    'floating-cta-device-and-ram-check': 'no',
    'fallback-text': '((mobile-gating-fallback-text))',
    'fork-button-header': 'Default header',
    'android-fork-button-header': 'Android header',
    'android-fork-cta-1-link': 'https://play.google.com/store/apps/unity',
    'android-fork-cta-1-text': 'Get Android App',
    'android-fork-cta-2-link': 'https://unity.com/web',
    'android-fork-cta-2-text': 'Continue on web',
    'ios-fork-button-header': 'iOS header',
    'ios-fork-cta-1-link': 'https://apps.apple.com/unity',
    'ios-fork-cta-1-text': 'Get iOS App',
    'ios-fork-cta-2-link': 'https://unity.com/web',
    'ios-fork-cta-2-text': 'Continue on web',
    ...overrides,
  };

  Object.entries(metadata).forEach(([name, content]) => {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  });
}

async function render(userAgent, metadataOverrides = {}) {
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
  setDocumentMetadata(metadataOverrides);
  const block = document.createElement('div');
  block.className = 'floating-button meta-powered';
  block.innerHTML = '<div>mobile</div>';
  document.querySelector('main .section').append(block);
  await decorate(block);
}

describe('Mobile Fork Button Unity', () => {
  beforeEach(async () => {
    window.isTestEnv = true;
    window.hlx = {};
    window.floatingCta = [{ path: 'default', live: 'Y' }];
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
    Object.defineProperty(navigator, 'userAgent', { value: ANDROID_USER_AGENT, configurable: true });
    setDocumentMetadata();

    await buildAutoBlocks();

    const block = document.querySelector('.mobile-fork-button-unity');
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
    expect(rows[0].querySelector('a').href).to.equal('https://play.google.com/store/apps/unity');
    expect(rows[1].querySelector('a').textContent).to.equal('Continue on web');
    expect(rows[1].querySelector('a').href).to.equal('https://unity.com/web');
  });

  it('renders iOS-prefixed fork metadata for iOS', async () => {
    await render(IOS_USER_AGENT);

    const blockWrapper = document.querySelector('.floating-button.block');
    const rows = blockWrapper.querySelectorAll('.mobile-gating-row');
    expect(blockWrapper.querySelector('.mobile-gating-header').textContent).to.equal('iOS header');
    expect(rows.length).to.equal(2);
    expect(rows[0].querySelector('a').textContent).to.equal('Get iOS App');
    expect(rows[0].querySelector('a').href).to.equal('https://apps.apple.com/unity');
    expect(rows[1].querySelector('a').textContent).to.equal('Continue on web');
    expect(rows[1].querySelector('a').href).to.equal('https://unity.com/web');
  });

  it('renders no icon or icon-text elements in action rows', async () => {
    await render(ANDROID_USER_AGENT);

    const rows = document.querySelectorAll('.mobile-gating-row');
    rows.forEach((row) => {
      expect(row.querySelector('.icon')).to.not.exist;
      expect(row.querySelector('.mobile-gating-icon-empty')).to.not.exist;
      expect(row.querySelector('.mobile-gating-text')).to.not.exist;
    });
  });

  it('dispatches linkspopulated with both CTA anchors', async () => {
    const linksPopulated = new Promise((resolve) => {
      document.addEventListener('linkspopulated', (event) => {
        if (event.detail.length === 2) resolve(event.detail);
      });
    });

    await render(ANDROID_USER_AGENT);

    const links = await linksPopulated;
    expect(links.length).to.equal(2);
    expect(links[0].textContent).to.equal('Get Android App');
    expect(links[1].textContent).to.equal('Continue on web');
  });

  it('delegates #unity-upload click to upload target on Android', async () => {
    let uploadClicks = 0;
    const uploadButton = document.createElement('button');
    uploadButton.id = 'unity-upload';
    uploadButton.addEventListener('click', () => { uploadClicks += 1; });
    document.body.append(uploadButton);

    await render(ANDROID_USER_AGENT, { 'android-fork-cta-1-link': '#unity-upload' });

    document.querySelectorAll('.mobile-gating-row')[0].querySelector('a').click();

    expect(uploadClicks).to.equal(1);
  });

  it('delegates #unity-upload click to upload target on iOS', async () => {
    let uploadClicks = 0;
    const uploadButton = document.createElement('button');
    uploadButton.id = 'unity-upload';
    uploadButton.addEventListener('click', () => { uploadClicks += 1; });
    document.body.append(uploadButton);

    await render(IOS_USER_AGENT, { 'ios-fork-cta-1-link': '#unity-upload' });

    document.querySelectorAll('.mobile-gating-row')[0].querySelector('a').click();

    expect(uploadClicks).to.equal(1);
  });

  it('falls back to unprefixed fork metadata when OS-prefixed metadata is missing', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: ANDROID_USER_AGENT, configurable: true });
    setDocumentMetadata({
      'fork-cta-1-text': 'Default CTA 1',
      'fork-cta-1-link': 'https://example.com/default-1',
      'fork-cta-2-text': 'Default CTA 2',
      'fork-cta-2-link': 'https://example.com/default-2',
    });
    ['android-fork-cta-1-text', 'android-fork-cta-1-link', 'android-fork-cta-2-text', 'android-fork-cta-2-link', 'android-fork-button-header'].forEach((name) => {
      document.head.querySelector(`meta[name="${name}"]`)?.remove();
    });
    const block = document.createElement('div');
    block.className = 'floating-button meta-powered';
    block.innerHTML = '<div>mobile</div>';
    document.querySelector('main .section').append(block);
    await decorate(block);

    const blockWrapper = document.querySelector('.floating-button.block');
    const rows = blockWrapper.querySelectorAll('.mobile-gating-row');
    expect(blockWrapper.querySelector('.mobile-gating-header').textContent).to.equal('Default header');
    expect(rows[0].querySelector('a').textContent).to.equal('Default CTA 1');
    expect(rows[0].querySelector('a').href).to.equal('https://example.com/default-1');
    expect(rows[1].querySelector('a').textContent).to.equal('Default CTA 2');
    expect(rows[1].querySelector('a').href).to.equal('https://example.com/default-2');
  });

  it('falls back to floating-button when fork-eligibility-check is on and OS is not mobile', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: DESKTOP_USER_AGENT, configurable: true });
    setDocumentMetadata({ 'fork-eligibility-check': 'on' });
    const block = document.createElement('div');
    block.className = 'floating-button meta-powered';
    block.innerHTML = '<div>mobile</div>';
    document.querySelector('main .section').append(block);

    await decorate(block);

    expect(document.querySelector('.multifunction')).to.not.exist;
  });

  it('renders empty header when fork-button-header metadata is absent', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: ANDROID_USER_AGENT, configurable: true });
    [
      ['android-fork-cta-1-link', 'https://play.google.com/store/apps/unity'],
      ['android-fork-cta-1-text', 'Get Android App'],
      ['android-fork-cta-2-link', 'https://unity.com/web'],
      ['android-fork-cta-2-text', 'Continue on web'],
      ['floating-cta-device-and-ram-check', 'no'],
      ['fallback-text', '((mobile-gating-fallback-text))'],
    ].forEach(([name, content]) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
    const block = document.createElement('div');
    block.className = 'floating-button meta-powered';
    block.innerHTML = '<div>mobile</div>';
    document.querySelector('main .section').append(block);
    await decorate(block);

    const header = document.querySelector('.mobile-gating-header');
    expect(header).to.exist;
    expect(header.textContent).to.equal('');
  });
});
