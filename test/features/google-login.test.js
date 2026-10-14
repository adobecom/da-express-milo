import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import initGoogleLogin from '../../express/code/libs/features/google-login.js';

const ctaStyles = document.createElement('link');
ctaStyles.rel = 'stylesheet';
ctaStyles.href = new URL('../../express/code/scripts/widgets/floating-cta.css', import.meta.url).href;
await new Promise((resolve, reject) => {
  ctaStyles.addEventListener('load', resolve, { once: true });
  ctaStyles.addEventListener('error', reject, { once: true });
  document.head.append(ctaStyles);
});

describe('Google login', () => {
  let initialize;
  let prompt;
  let loadIms;
  let loadScript;
  let getMetadata;
  let originalUserAgent;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    originalUserAgent = navigator.userAgent;
    document.body.innerHTML = '<div class="feds-profile"></div>';
    initialize = sinon.stub();
    prompt = sinon.stub();
    loadIms = sinon.stub().resolves();
    loadScript = sinon.stub().resolves();
    getMetadata = sinon.stub().returns('');
    window.google = { accounts: { id: { initialize, prompt } } };
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
      socialHeadlessSignIn: sinon.stub().resolves(),
      signInWithSocialProvider: sinon.stub().resolves(),
    };
    window.adobeid = { client_id: 'adobe-client', scope: 'adobe-scope' };
    window.lana = { log: sinon.stub() };
    window.DISABLE_PAGE_RELOAD = true;
    document.body.classList.remove('google-login-prompt-pending');
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
    document.body.classList.remove('google-login-prompt-pending');
    document.body.innerHTML = '';
  });

  it('does not load Google for a signed-in user', async () => {
    window.adobeIMS.isSignedInUser.returns(true);
    document.body.classList.add('google-login-prompt-pending');

    await initGoogleLogin(loadIms, getMetadata, loadScript);

    expect(loadIms.calledOnce).to.be.true;
    expect(loadScript.notCalled).to.be.true;
    expect(initialize.notCalled).to.be.true;
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
  });

  it('does not change the iPhone experience', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    document.body.classList.add('google-login-prompt-pending');
    await initGoogleLogin(loadIms, getMetadata, loadScript);

    expect(loadIms.notCalled).to.be.true;
    expect(loadScript.notCalled).to.be.true;
    expect(initialize.notCalled).to.be.true;
    expect(prompt.notCalled).to.be.true;
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
  });

  it('initializes One Tap in the profile container', async () => {
    getMetadata.withArgs('google-yolo-zero-tap').returns('on');

    await initGoogleLogin(loadIms, getMetadata, loadScript);

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

  it('shows One Tap before every non-dismissable floating CTA', async () => {
    document.body.insertAdjacentHTML('beforeend', `<main>
      <div class="floating-button-wrapper"></div>
      <div class="floating-button-wrapper mobile-fork-button"></div>
      <div class="floating-button-wrapper mobile-fork-button-frictionless"></div>
      <div class="floating-button-wrapper mobile-fork-button-os-split"></div>
      <div class="floating-button-wrapper mobile-fork-button-unity"></div>
    </main>`);
    document.body.classList.add('google-login-prompt-pending');
    const floatingCtas = [...document.querySelectorAll('.floating-button-wrapper')];
    let ctasHiddenWhenPrompted = false;
    prompt.callsFake(() => {
      ctasHiddenWhenPrompted = floatingCtas
        .every((cta) => getComputedStyle(cta).visibility === 'hidden');
    });

    await initGoogleLogin(loadIms, getMetadata, loadScript);

    expect(prompt.calledOnce).to.be.true;
    expect(ctasHiddenWhenPrompted).to.be.true;
    floatingCtas.forEach((cta) => {
      expect(getComputedStyle(cta).visibility).to.equal('hidden');
    });

    clock.tick(999);
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.true;

    clock.tick(1);
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
    floatingCtas.forEach((cta) => {
      expect(getComputedStyle(cta).visibility).to.equal('visible');
    });
  });

  it('defers One Tap until the dismissable mobile fork resolves', async () => {
    document.body.insertAdjacentHTML('beforeend', `<main>
      <div class="floating-button-wrapper"></div>
      <div class="floating-button-wrapper mobile-fork-button mweb-mobile-fork"></div>
    </main>`);
    document.body.classList.add('google-login-prompt-pending');
    const regularCta = document.querySelector('main .floating-button-wrapper:not(.mobile-fork-button)');
    const dismissableFork = document.querySelector('.mweb-mobile-fork');
    let regularCtaHiddenWhenPrompted = false;
    prompt.callsFake(() => {
      regularCtaHiddenWhenPrompted = getComputedStyle(regularCta).visibility === 'hidden';
    });

    await initGoogleLogin(loadIms, getMetadata, loadScript);

    expect(initialize.calledOnce).to.be.true;
    expect(prompt.notCalled).to.be.true;
    expect(getComputedStyle(regularCta).visibility).to.equal('hidden');
    expect(getComputedStyle(dismissableFork).visibility).to.equal('visible');

    document.dispatchEvent(new CustomEvent('mobileforkresolved', {
      detail: { action: 'continue' },
    }));
    document.dispatchEvent(new CustomEvent('mobileforkresolved', {
      detail: { action: 'continue' },
    }));

    expect(prompt.calledOnce).to.be.true;
    expect(regularCtaHiddenWhenPrompted).to.be.true;
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.true;

    clock.tick(999);
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.true;

    clock.tick(1);
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
    expect(getComputedStyle(regularCta).visibility).to.equal('visible');
  });

  it('releases floating CTAs when IMS cannot load', async () => {
    document.body.classList.add('google-login-prompt-pending');
    loadIms.rejects(new Error('IMS unavailable'));

    await initGoogleLogin(loadIms, getMetadata, loadScript);

    expect(prompt.notCalled).to.be.true;
    expect(document.body.classList.contains('google-login-prompt-pending')).to.be.false;
  });

  it('uses default prompt placement when the profile container is absent', async () => {
    document.body.innerHTML = '';

    await initGoogleLogin(loadIms, getMetadata, loadScript);

    expect(initialize.firstCall.args[0]).not.to.have.property('prompt_parent_id');
  });

  it('uses the current page when redirect metadata is absent', async () => {
    window.adobeIMS.socialHeadlessSignIn.rejects(new Error('new account'));
    getMetadata.withArgs('google-login-accepted-tou-list').returns('  express-tou  ');
    await initGoogleLogin(loadIms, getMetadata, loadScript);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.socialHeadlessSignIn.calledOnceWithExactly({
      provider_id: 'google',
      idp_token: 'google-token',
      client_id: 'adobe-client',
      scope: 'adobe-scope',
      accepted_tou_list: 'express-tou',
    })).to.be.true;
    expect(window.adobeIMS.signInWithSocialProvider.calledOnceWithExactly('google', {
      redirect_uri: window.location.href,
    })).to.be.true;
  });

  it('uses authored redirect metadata for a new account', async () => {
    window.adobeIMS.socialHeadlessSignIn.rejects(new Error('new account'));
    getMetadata.withArgs('google-login-redirect').returns('https://www.adobe.com/express/');
    await initGoogleLogin(loadIms, getMetadata, loadScript);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.signInWithSocialProvider.calledOnceWithExactly('google', {
      redirect_uri: 'https://www.adobe.com/express/',
    })).to.be.true;
  });

  it('resolves authored relative redirect metadata against the current page', async () => {
    window.adobeIMS.socialHeadlessSignIn.rejects(new Error('new account'));
    getMetadata.withArgs('google-login-redirect').returns('/express/templates/');
    await initGoogleLogin(loadIms, getMetadata, loadScript);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.signInWithSocialProvider.calledOnceWithExactly('google', {
      redirect_uri: `${window.location.origin}/express/templates/`,
    })).to.be.true;
  });

  it('falls back to the current page and logs malformed redirect metadata', async () => {
    window.adobeIMS.socialHeadlessSignIn.rejects(new Error('new account'));
    getMetadata.withArgs('google-login-redirect').returns('http://[');
    await initGoogleLogin(loadIms, getMetadata, loadScript);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.signInWithSocialProvider.calledOnceWithExactly('google', {
      redirect_uri: window.location.href,
    })).to.be.true;
    expect(window.lana.log.calledOnce).to.be.true;
  });

  it('falls back to the current page for a non-HTTP redirect', async () => {
    window.adobeIMS.socialHeadlessSignIn.rejects(new Error('new account'));
    getMetadata.withArgs('google-login-redirect').returns('ftp://example.com/file');
    await initGoogleLogin(loadIms, getMetadata, loadScript);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.signInWithSocialProvider.calledOnceWithExactly('google', {
      redirect_uri: window.location.href,
    })).to.be.true;
    expect(window.lana.log.calledOnce).to.be.true;
  });
});
