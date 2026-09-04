import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../express/code/scripts/utils.js';
import martechLoadedCB from '../../express/code/scripts/instrument.js';

const TEST_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const TEST_PLATFORM = 'MacIntel';

function setNavigatorValue(key, value) {
  Object.defineProperty(navigator, key, {
    value,
    configurable: true,
  });
}

function setMeta(name, content) {
  const existing = document.querySelector(`meta[name="${name}"]`);
  if (existing) existing.remove();
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.setAttribute('content', content);
  document.head.append(meta);
}

function findProperty(custom, propertyName) {
  return custom.find((entry) => entry.propertyName === propertyName);
}

function getCorpnewPayload(payload) {
  // eslint-disable-next-line no-underscore-dangle
  const { _adobe_corpnew: corpnew } = payload.data;
  return corpnew;
}

describe('instrument mini-editor analytics', () => {
  let trackStub;
  let fetchStub;
  let clock;
  let originalUserAgent;
  let originalPlatform;
  let originalUserAgentData;

  beforeEach(() => {
    trackStub = sinon.stub();
    clock = sinon.useFakeTimers(new Date('2026-09-01T20:25:45.426Z'));
    originalUserAgent = navigator.userAgent;
    originalPlatform = navigator.platform;
    originalUserAgentData = navigator.userAgentData;

    setNavigatorValue('userAgent', TEST_USER_AGENT);
    setNavigatorValue('platform', TEST_PLATFORM);
    Object.defineProperty(navigator, 'userAgentData', {
      value: { platform: TEST_PLATFORM },
      configurable: true,
    });

    setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

    setMeta('pagetype', 'mini-editor');

    // eslint-disable-next-line no-underscore-dangle
    window._satellite = { track: trackStub };
    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => ({ country: 'IN' }),
    });
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccountType: sinon.stub().returns('free'),
      getProfile: sinon.stub().returns({ userId: 'user-123' }),
    };
    window.ecid = 'ECID-456';
  });

  afterEach(() => {
    document.head.querySelectorAll('meta[name="messagetype"]').forEach((meta) => meta.remove());
    // eslint-disable-next-line no-underscore-dangle
    delete window._satellite;
    fetchStub.restore();
    delete window.adobeIMS;
    delete window.ecid;
    setNavigatorValue('userAgent', originalUserAgent);
    setNavigatorValue('platform', originalPlatform);
    Object.defineProperty(navigator, 'userAgentData', {
      value: originalUserAgentData,
      configurable: true,
    });
    clock.restore();
    sinon.restore();
  });

  it('uses the page messagetype metadata when provided', async () => {
    setMeta('messagetype', 'social');

    await martechLoadedCB();
    await clock.tickAsync(0);
    await Promise.resolve();

    const [, payload] = trackStub.firstCall.args;
    const { custom } = getCorpnewPayload(payload);
    expect(findProperty(custom, 'custom.task.name')).to.deep.equal({
      propertyName: 'custom.task.name',
      propertyValue: 'social',
      propertyType: 'string',
    });
  });

  it('adds the mini-editor-only analytics fields', async () => {
    await martechLoadedCB();
    await clock.tickAsync(0);
    await Promise.resolve();

    expect(trackStub.calledOnce).to.be.true;
    const [eventName, payload] = trackStub.firstCall.args;
    expect(eventName).to.equal('event');

    const corpnew = getCorpnewPayload(payload);
    const { sdm, custom } = corpnew;
    expect(sdm.event).to.deep.include({
      pagename: 'view-acom-express-features',
      event_date: '2026-09-01',
      guid: sdm.event.guid,
      user_guid: 'user-123',
      mcid_guid: 'ECID-456',
      user_agent: TEST_USER_AGENT,
      is_authenticated: true,
      category: 'WEB',
      subcategory: 'operations',
      type: 'render',
      subtype: 'acom',
      workflow: 'lifecycle',
    });
    expect(sdm.source).to.deep.equal({
      name: 'CCEX',
      client_id: 'projectx_webapp',
    });
    expect(sdm.hz).to.deep.equal({
      source_platform_type: 'desktop-web',
      device_name: 'Macintosh; Intel Mac OS X 10_15_7',
      user: {
        access_country: 'IN',
        os_name: 'macOS',
        os_version: '10.15.7',
        account_type: 'free',
      },
    });
    expect(sdm.event.aa.page_name).to.equal('adobe.com:');
    expect(sdm.user.aa.post_page_url).to.equal(window.location.href);
    expect(findProperty(custom, 'event_date')).to.deep.equal({
      propertyName: 'event_date',
      propertyValue: '2026-09-01',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'event.guid')).to.have.property('propertyType', 'string');
    expect(findProperty(custom, 'event.user_guid')).to.deep.equal({
      propertyName: 'event.user_guid',
      propertyValue: 'user-123',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'hz.device_name')).to.deep.equal({
      propertyName: 'hz.device_name',
      propertyValue: 'Macintosh; Intel Mac OS X 10_15_7',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'hz.user.os_name')).to.deep.equal({
      propertyName: 'hz.user.os_name',
      propertyValue: 'macOS',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'hz.user.access_country')).to.deep.equal({
      propertyName: 'hz.user.access_country',
      propertyValue: 'IN',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'event.mcid_guid')).to.deep.equal({
      propertyName: 'event.mcid_guid',
      propertyValue: 'ECID-456',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'hz.user.os_version')).to.deep.equal({
      propertyName: 'hz.user.os_version',
      propertyValue: '10.15.7',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'event.aa.page_name')).to.deep.equal({
      propertyName: 'event.aa.page_name',
      propertyValue: 'adobe.com:',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'user.aa.post_page_url')).to.deep.equal({
      propertyName: 'user.aa.post_page_url',
      propertyValue: window.location.href,
      propertyType: 'string',
    });
    expect(findProperty(custom, 'source.name')).to.deep.equal({
      propertyName: 'source.name',
      propertyValue: 'CCEX',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'source.client_id')).to.deep.equal({
      propertyName: 'source.client_id',
      propertyValue: 'projectx_webapp',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'hz.source_platform_type')).to.deep.equal({
      propertyName: 'hz.source_platform_type',
      propertyValue: 'desktop-web',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'custom.displayedLanguage')).to.deep.equal({
      propertyName: 'custom.displayedLanguage',
      propertyValue: 'en',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'custom.task.name')).to.deep.equal({
      propertyName: 'custom.task.name',
      propertyValue: 'quote',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'custom.ui.location')).to.equal(undefined);
  });
});
