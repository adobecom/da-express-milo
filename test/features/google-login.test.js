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

  beforeEach(() => {
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
    window.DISABLE_PAGE_RELOAD = true;
  });

  afterEach(() => {
    sinon.restore();
    delete window.google;
    delete window.adobeIMS;
    delete window.adobeid;
    delete window.DISABLE_PAGE_RELOAD;
    document.body.classList.remove('google-one-tap-active');
    document.body.innerHTML = '';
  });

  it('does not load Google for a signed-in user', async () => {
    window.adobeIMS.isSignedInUser.returns(true);

    const loaded = await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(loaded).to.be.false;
    expect(loadScript.notCalled).to.be.true;
    expect(document.body.classList.contains('google-one-tap-active')).to.be.false;
  });

  it('initializes One Tap and marks the prompt active', async () => {
    getMetadata.withArgs('google-yolo-zero-tap').returns('on');

    const loaded = await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);

    expect(loaded).to.be.true;
    expect(loadScript.calledOnceWithExactly('https://accounts.google.com/gsi/client')).to.be.true;
    expect(document.querySelector('.feds-profile > #feds-googleLogin')).to.exist;
    expect(initialize.firstCall.args[0]).to.include({
      client_id: '530526366930-l874a90ipfkn26naa71r010u8epp39jt.apps.googleusercontent.com',
      prompt_parent_id: 'feds-googleLogin',
      cancel_on_tap_outside: false,
      auto_select: true,
    });
    expect(prompt.calledOnce).to.be.true;
    expect(document.body.classList.contains('google-one-tap-active')).to.be.true;
  });

  it('restores floating CTAs when Google skips the prompt', async () => {
    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);
    const momentListener = prompt.firstCall.args[0];

    momentListener({
      isNotDisplayed: () => false,
      isSkippedMoment: () => true,
      isDismissedMoment: () => false,
    });

    expect(document.body.classList.contains('google-one-tap-active')).to.be.false;
  });

  it('restores floating CTAs when Google dismisses the prompt', async () => {
    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);
    const momentListener = prompt.firstCall.args[0];

    momentListener({
      isNotDisplayed: () => false,
      isSkippedMoment: () => false,
      isDismissedMoment: () => true,
    });

    expect(document.body.classList.contains('google-one-tap-active')).to.be.false;
  });

  it('authenticates an existing Adobe user with the Google credential', async () => {
    getMetadata.withArgs('google-login-accepted-tou-list').returns('ADOBE_MASTER');
    await initGoogleLogin(loadIms, getMetadata, loadScript, getConfig);
    const { callback } = initialize.firstCall.args[0];

    await callback({ credential: 'google-token' });

    expect(window.adobeIMS.socialHeadlessSignIn.calledOnceWithExactly({
      provider_id: 'google',
      idp_token: 'google-token',
      client_id: 'adobe-client',
      scope: 'adobe-scope',
      accepted_tou_list: 'ADOBE_MASTER',
    })).to.be.true;
  });
});
