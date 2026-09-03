import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import trackMiniEditorExport from '../../../express/code/scripts/utils/mini-editor-analytics.js';

const TEST_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const TEST_PLATFORM = 'MacIntel';

function setNavigatorValue(key, value) {
  Object.defineProperty(navigator, key, {
    value,
    configurable: true,
  });
}

function findProperty(custom, propertyName) {
  return custom.find((entry) => entry.propertyName === propertyName);
}

function setMeta(name, content) {
  const existing = document.head.querySelector(`meta[name="${name}"]`);
  if (existing) existing.remove();
  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  meta.setAttribute('content', content);
  document.head.append(meta);
}

function getCorpnewPayload(payload) {
  // eslint-disable-next-line no-underscore-dangle
  const { _adobe_corpnew: corpnew } = payload.data;
  return corpnew;
}

describe('mini-editor analytics', () => {
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

    // eslint-disable-next-line no-underscore-dangle
    window._satellite = { track: trackStub };
    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => ({ country: 'IN' }),
    });
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
      getAccountType: sinon.stub().returns('free'),
    };
    window.ecid = 'ECID-123';
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

  it('sends the export payload and attached-format mirror', async () => {
    await trackMiniEditorExport({
      exportMethod: 'copy-clipboard',
      uiLocation: 'seo-discover-page-collapsible-row',
    });

    expect(trackStub.calledOnce).to.be.true;
    const [eventName, payload] = trackStub.firstCall.args;
    expect(eventName).to.equal('event');

    const corpnew = getCorpnewPayload(payload);
    const { sdm, custom } = corpnew;
    expect(sdm.event).to.deep.include({
      pagename: 'export-project-complete-unauth',
      event_date: '2026-09-01',
      dts_start: '2026-09-01T20:25:45.426Z',
      user_agent: TEST_USER_AGENT,
      guid: sdm.event.guid,
      user_guid: '',
      is_authenticated: false,
      mcid_guid: 'ECID-123',
      subtype: 'export-project',
      type: 'success',
      workflow: 'export',
      category: 'WEB',
      subcategory: 'document',
      platform_name: 'desktop-web',
    });
    expect(sdm.source).to.deep.equal({
      name: 'CCEX',
      client_id: 'projectx_webapp',
      platform: TEST_PLATFORM,
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
    expect(sdm.user).to.deep.equal({
      aa: {
        post_page_url: window.location.href,
      },
    });
    expect(sdm.custom).to.deep.equal({
      export_method: 'copy-clipboard',
      ui: {
        location: 'seo-discover-page-collapsible-row',
      },
      displayedLanguage: 'en',
      task: {
        name: 'quote',
      },
    });

    expect(findProperty(custom, 'event_date')).to.deep.equal({
      propertyName: 'event_date',
      propertyValue: '2026-09-01',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'event.guid')).to.have.property('propertyType', 'string');
    expect(findProperty(custom, 'event.user_guid')).to.deep.equal({
      propertyName: 'event.user_guid',
      propertyValue: '',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'source.platform')).to.deep.equal({
      propertyName: 'source.platform',
      propertyValue: TEST_PLATFORM,
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
    expect(findProperty(custom, 'hz.user.os_version')).to.deep.equal({
      propertyName: 'hz.user.os_version',
      propertyValue: '10.15.7',
      propertyType: 'string',
    });
    expect(findProperty(custom, 'event.is_authenticated')).to.deep.equal({
      propertyName: 'event.is_authenticated',
      propertyValue: false,
      propertyType: 'boolean',
    });
    expect(findProperty(custom, 'custom.export_method')).to.deep.equal({
      propertyName: 'custom.export_method',
      propertyValue: 'copy-clipboard',
      propertyType: 'string',
    });
  });

  it('uses the page messagetype metadata when provided', async () => {
    setMeta('messagetype', 'social');

    await trackMiniEditorExport({ exportMethod: 'copy-clipboard' });

    const [, payload] = trackStub.firstCall.args;
    const { sdm } = getCorpnewPayload(payload);
    expect(sdm.custom.task.name).to.equal('social');
  });

  it('stores the signed-in user id when authenticated', async () => {
    window.adobeIMS.isSignedInUser.returns(true);
    window.adobeIMS.getProfile = sinon.stub().returns({ userId: 'user-123' });

    await trackMiniEditorExport({ exportMethod: 'copy-clipboard' });

    const [eventName, payload] = trackStub.firstCall.args;
    expect(eventName).to.equal('event');
    const corpnew = getCorpnewPayload(payload);
    expect(corpnew.sdm.event.user_guid).to.equal('user-123');
  });

  it('does not track when no export method is provided', async () => {
    await trackMiniEditorExport();
    expect(trackStub.called).to.be.false;
  });
});
