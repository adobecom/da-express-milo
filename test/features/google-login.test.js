import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import initGoogleLogin from '../../express/code/libs/features/google-login.js';

describe('Google login', () => {
  let initialize;
  let prompt;
  let loadIms;
  let loadScript;
  let getMetadata;
  let getConfig;
  let originalUserAgent;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
    document.body.innerHTML = '<div class="feds-profile"></div>';
    initialize = sinon.stub();
    prompt = sinon.stub();
    loadIms = sinon.stub().resolves();
    loadScript = sinon.stub().resolves();
    getMetadata = sinon.stub().returns('');
    getConfig = sinon.stub().returns({});
    window.google = { accounts: { id: { initialize, prompt } } };
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
      socialHeadlessSignIn: sinon.stub().resolves(),
      signInWithSocialProvider: sinon.stub().resolves(),
    };
    window.adobeid = { client_id: 'adobe-client', scope: 'adobe-scope' };
    window.lana = { log: sinon.stub() };
    window.DISABLE_PAGE_RELOAD = true;
  });

  afterEach(() => {
    sinon.restore();
    delete window.google;
    delete window.adobeIMS;
    delete window.adobeid;
    delete window.lana;
    delete window.DISABLE_PAGE_RELOAD;
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    document.body.innerHTML = '';
  });

  it('does not load Google for a signed-in user', async () => {
    window.adobeIMS.isSignedInUser.returns(true);

    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(loadIms.calledOnce).to.be.true;
    expect(loadScript.notCalled).to.be.true;
    expect(initialize.notCalled).to.be.true;
  });

  it('does not change the iPhone experience', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(loadIms.notCalled).to.be.true;
    expect(loadScript.notCalled).to.be.true;
    expect(initialize.notCalled).to.be.true;
    expect(prompt.notCalled).to.be.true;
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
  });

  it('initializes One Tap in the profile container', async () => {
    getMetadata.withArgs('google-yolo-zero-tap').returns('on');

    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(loadScript.calledOnceWithExactly('https://accounts.google.com/gsi/client')).to.be.true;
    expect(document.querySelector('.feds-profile > #feds-googleLogin')).to.exist;
    expect(initialize.calledOnce).to.be.true;
    expect(initialize.firstCall.args[0]).to.include({
      client_id: '530526366930-l874a90ipfkn26naa71r010u8epp39jt.apps.googleusercontent.com',
      prompt_parent_id: 'feds-googleLogin',
      cancel_on_tap_outside: false,
      itp_support: true,
      auto_select: true,
    });
    expect(prompt.calledOnce).to.be.true;
  });

  it('defers One Tap until the dismissable mobile fork resolves', async () => {
    const clock = sinon.useFakeTimers();
    document.body.innerHTML += '<div class="floating-button-wrapper"></div>'
      + '<div class="mobile-fork-button mweb-mobile-fork"></div>';
    let ctaHiddenWhenPrompted = false;
    prompt.callsFake(() => {
      ctaHiddenWhenPrompted = document.body.classList.contains('google-login-prompt-pending');
    });

    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(initialize.calledOnce).to.be.true;
    expect(prompt.notCalled).to.be.true;

    document.dispatchEvent(new CustomEvent('mobileforkresolved', {
      detail: { action: 'continue' },
    }));
    document.dispatchEvent(new CustomEvent('mobileforkresolved', {
      detail: { action: 'continue' },
    }));

    expect(prompt.calledOnce).to.be.true;
    expect(ctaHiddenWhenPrompted).to.be.true;
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.true;

    clock.tick(999);
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.true;

    clock.tick(1);
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
  });

  it('uses default prompt placement when the profile container is absent', async () => {
    document.body.innerHTML = '';

    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(initialize.firstCall.args[0]).not.to.have.property('prompt_parent_id');
  });

  it('uses the configured redirect callback when redirect metadata is absent', async () => {
    const redirectCallback = sinon.stub().resolves('https://www.adobe.com/express/');
    getConfig.returns({ googleLoginURLCallback: redirectCallback });
    getMetadata.withArgs('google-login-accepted-tou-list').returns('  express-tou  ');
    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(redirectCallback.calledOnce).to.be.true;
    expect(window.adobeIMS.socialHeadlessSignIn.calledOnceWithExactly({
      provider_id: 'google',
      idp_token: 'google-token',
      client_id: 'adobe-client',
      scope: 'adobe-scope',
      accepted_tou_list: 'express-tou',
    })).to.be.true;
  });

  it('falls back to interactive sign-in for a new account', async () => {
    window.adobeIMS.socialHeadlessSignIn.rejects(new Error('new account'));
    getMetadata.withArgs('google-login-redirect').returns('https://www.adobe.com/express/');
    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.signInWithSocialProvider.calledOnceWithExactly('google', {
      redirect_uri: 'https://www.adobe.com/express/',
    })).to.be.true;
  });

  it('falls back to config and logs malformed redirect metadata', async () => {
    const redirectCallback = sinon.stub().resolves('https://www.adobe.com/');
    getConfig.returns({ googleLoginURLCallback: redirectCallback });
    getMetadata.withArgs('google-login-redirect').returns('not a URL');
    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(redirectCallback.calledOnce).to.be.true;
    expect(window.lana.log.calledOnce).to.be.true;
  });
});
