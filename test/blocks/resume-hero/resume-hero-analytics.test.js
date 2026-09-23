/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import initAnalytics, { createEventObject } from '../../../express/code/blocks/resume-hero/resume-hero-analytics.js';

const getUserData = () => {
  const event = createEventObject(
    'landing:shown',
    'resume-builder',
    {},
    { appReferrer: '', trackingId: '' },
    true,
  );
  // eslint-disable-next-line no-underscore-dangle
  return event.data._adobe_corpnew.digitalData.dcweb.user;
};

describe('resume-hero analytics', () => {
  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
    delete window.lana;
    // eslint-disable-next-line no-underscore-dangle
    delete window._satellite;
  });

  it('omits the session ID when IMS is unavailable', () => {
    expect(getUserData().id).to.be.undefined;
  });

  it('omits the session ID when IMS throws or returns a malformed token', () => {
    window.adobeIMS = {
      getAccessToken: sinon.stub().throws(new Error('IMS unavailable')),
      isSignedInUser: sinon.stub().returns(false),
    };
    expect(getUserData().id).to.be.undefined;

    window.adobeIMS.getAccessToken = sinon.stub().returns({ token: 'malformed-token' });
    expect(getUserData().id).to.be.undefined;
  });

  it('reads the session ID from a valid token', () => {
    const payload = btoa(JSON.stringify({ sub: 'session-id' }));
    window.adobeIMS = {
      getAccessToken: sinon.stub().returns({ token: `header.${payload}.signature` }),
      isSignedInUser: sinon.stub().returns(true),
    };

    expect(getUserData().id).to.equal('session-id');
  });

  it('stops polling and logs when Satellite does not load within ten seconds', async () => {
    const clock = sinon.useFakeTimers();
    window.lana = { log: sinon.stub() };

    initAnalytics('landing:shown', 'resume-builder', {});
    await clock.tickAsync(10000);

    expect(window.lana.log.calledOnceWithExactly(
      'ensureSatelliteReady: _satellite not available after timeout',
      { sampleRate: 0.1, tags: 'express,analytics', severity: 'warn' },
    )).to.be.true;
  });
});
