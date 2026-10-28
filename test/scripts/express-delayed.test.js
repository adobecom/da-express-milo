import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../express/code/scripts/utils.js';

const sessionKey = 'express.prewarm.ready';
const expressOrigin = 'https://express.adobe.com';
const frameSelector = 'iframe[title="Adobe Express preload"]';
let moduleId = 0;

describe('Express delayed pre-warm', () => {
  let sandbox;
  let clock;
  let loadDelayed;
  let metadata;
  let readyState;
  let saveData;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    clock = sandbox.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    readyState = 'complete';
    saveData = false;
    sandbox.stub(navigator, 'userAgentData').value({
      brands: [{ brand: 'Chromium' }, { brand: 'Google Chrome' }],
      mobile: false,
      platform: 'macOS',
    });
    sandbox.stub(navigator.connection, 'saveData').get(() => saveData);
    sandbox.stub(document, 'readyState').get(() => readyState);
    sessionStorage.removeItem(sessionKey);
    metadata = document.createElement('meta');
    metadata.name = 'prewarm-express';
    metadata.content = 'on';
    document.head.append(metadata);
    setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
    moduleId += 1;
    ({ default: loadDelayed } = await import(`/express/code/scripts/express-delayed.js?prewarm-test=${moduleId}`));
  });

  afterEach(() => {
    window.dispatchEvent(new Event('load'));
    clock.tick(65000);
    document.querySelectorAll(frameSelector).forEach((element) => element.remove());
    metadata.remove();
    sessionStorage.removeItem(sessionKey);
    sandbox.restore();
  });

  const getFrame = () => document.querySelector(frameSelector);
  const sendDone = (frame, status = 'ready', overrides = {}) => {
    window.dispatchEvent(new MessageEvent('message', {
      source: frame.contentWindow,
      origin: expressOrigin,
      data: { type: 'express-prewarm-done', status },
      ...overrides,
    }));
  };

  it('does nothing without page metadata', async () => {
    metadata.remove();
    await loadDelayed();
    expect(getFrame()).to.equal(null);
  });

  ['off', 'false', 'true', ''].forEach((value) => {
    it(`does nothing when metadata is "${value}"`, async () => {
      metadata.content = value;
      await loadDelayed();
      expect(getFrame()).to.equal(null);
    });
  });

  it('accepts "on" case-insensitively with surrounding whitespace', async () => {
    metadata.content = ' ON ';
    await loadDelayed();
    expect(getFrame()).not.to.equal(null);
  });

  it('waits for page load, then creates one hidden, non-focusable iframe', async () => {
    readyState = 'loading';
    await loadDelayed();
    expect(getFrame()).to.equal(null);
    window.dispatchEvent(new Event('load'));
    const frame = getFrame();
    expect(frame.src).to.equal(`${expressOrigin}/static/preload.html`);
    expect(frame.style.display).to.equal('none');
    expect(frame.getAttribute('aria-hidden')).to.equal('true');
    expect(frame.tabIndex).to.equal(-1);
    await loadDelayed();
    expect(document.querySelectorAll(frameSelector).length).to.equal(1);
  });

  it('starts immediately when the page has already loaded', async () => {
    await loadDelayed();
    expect(getFrame()).not.to.equal(null);
  });

  it('accepts only a matching completion message and remembers ready for the session', async () => {
    await loadDelayed();
    const frame = getFrame();
    sendDone(frame, 'ready', { origin: 'https://example.com' });
    sendDone(frame, 'ready', { source: window });
    sendDone(frame, 'ready', { data: { type: 'other', status: 'ready' } });
    sendDone(frame, 'unknown');
    expect(getFrame()).to.equal(frame);
    sendDone(frame);
    expect(getFrame()).to.equal(null);
    expect(sessionStorage.getItem(sessionKey)).to.equal('true');
  });

  ['error', 'unsupported'].forEach((status) => {
    it(`removes the iframe on ${status} without marking a successful pre-warm`, async () => {
      await loadDelayed();
      sendDone(getFrame(), status);
      expect(getFrame()).to.equal(null);
      expect(sessionStorage.getItem(sessionKey)).to.equal(null);
    });
  });

  it('removes the iframe after sixty seconds without a completion message', async () => {
    await loadDelayed();
    clock.tick(59999);
    expect(getFrame()).not.to.equal(null);
    clock.tick(1);
    expect(getFrame()).to.equal(null);
    expect(sessionStorage.getItem(sessionKey)).to.equal(null);
  });

  it('skips pre-warming after a successful pre-warm earlier in the session', async () => {
    sessionStorage.setItem(sessionKey, 'true');
    await loadDelayed();
    expect(getFrame()).to.equal(null);
  });

  ['mobile', 'non-Chromium browser', 'Android tablet', 'iPad', 'data saver'].forEach((reason) => {
    it(`skips pre-warming for ${reason}`, async () => {
      const chromium = [{ brand: 'Chromium' }, { brand: 'Google Chrome' }];
      if (reason === 'mobile') {
        Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { brands: chromium, mobile: true, platform: 'Android' } });
      } else if (reason === 'non-Chromium browser') {
        Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: undefined });
      } else if (reason === 'Android tablet') {
        Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { brands: chromium, mobile: false, platform: 'Android' } });
      } else if (reason === 'iPad') {
        Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { brands: chromium, mobile: false, platform: 'iOS' } });
      } else {
        saveData = true;
      }
      await loadDelayed();
      expect(getFrame()).to.equal(null);
    });
  });

  it('supports desktop Edge', async () => {
    Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { brands: [{ brand: 'Chromium' }, { brand: 'Microsoft Edge' }], mobile: false, platform: 'Windows' } });
    await loadDelayed();
    expect(getFrame()).not.to.equal(null);
  });

  it('still pre-warms and cleans up when session storage access is denied', async () => {
    const { getItem, setItem } = Storage.prototype;
    sandbox.stub(Storage.prototype, 'getItem').callsFake(function readStorage(storageKey) {
      if (storageKey === sessionKey) throw new DOMException('Blocked', 'SecurityError');
      return getItem.call(this, storageKey);
    });
    sandbox.stub(Storage.prototype, 'setItem').callsFake(function writeStorage(storageKey, value) {
      if (storageKey === sessionKey) throw new DOMException('Blocked', 'SecurityError');
      return setItem.call(this, storageKey, value);
    });
    await loadDelayed();
    const frame = getFrame();
    expect(frame).not.to.equal(null);
    sendDone(frame);
    expect(getFrame()).to.equal(null);
  });
});
