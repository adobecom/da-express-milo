import { getMobileOperatingSystem } from '../../scripts/utils.js';

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_ID = '530526366930-l874a90ipfkn26naa71r010u8epp39jt.apps.googleusercontent.com';
const PLACEHOLDER = 'feds-googleLogin';
const WRAPPER = 'feds-profile';
const MOBILE_FORK_RESOLVED_EVENT = 'mobileforkresolved';
const REGULAR_CTA_PENDING_CLASS = 'google-login-prompt-pending';
const REGULAR_CTA_SUPPRESSION_MS = 1000;

const resolveDestination = (getMetadata) => {
  const redirect = getMetadata('google-login-redirect')?.trim();
  if (redirect) {
    try {
      return new URL(redirect).href;
    } catch {
      window.lana?.log(`Invalid google-login-redirect: ${redirect}`, { tags: 'google-login', severity: 'error' });
    }
  }

  return window.location.href;
};

const onToken = async (getMetadata, data) => {
  const acceptedTouList = getMetadata('google-login-accepted-tou-list')?.trim();
  const destination = resolveDestination(getMetadata);

  try {
    await window.adobeIMS.socialHeadlessSignIn({
      provider_id: 'google',
      idp_token: data?.credential,
      client_id: window.adobeid?.client_id,
      scope: window.adobeid?.scope,
      accepted_tou_list: acceptedTouList || '',
    });
  } catch {
    // New account
    await window.adobeIMS.signInWithSocialProvider('google', { redirect_uri: destination });
    return;
  }

  if (window.DISABLE_PAGE_RELOAD === true) return;
  // Existing account
  window.location.assign(destination);
};

const promptGoogleLogin = (hideRegularCta = false) => {
  if (hideRegularCta) document.body.classList.add(REGULAR_CTA_PENDING_CLASS);
  try {
    window.google?.accounts?.id?.prompt();
  } finally {
    if (hideRegularCta) {
      window.setTimeout(() => {
        document.body.classList.remove(REGULAR_CTA_PENDING_CLASS);
      }, REGULAR_CTA_SUPPRESSION_MS);
    }
  }
};

export default async function initGoogleLogin(loadIms, getMetadata, loadScript) {
  const os = getMobileOperatingSystem();
  if (os === 'iOS') return;
  try {
    await loadIms();
  } catch {
    return;
  }
  if (window.adobeIMS?.isSignedInUser()) return;

  await loadScript(GOOGLE_SCRIPT);
  const wrapper = document.querySelector(`.${WRAPPER}`);
  let placeholder;
  if (wrapper) {
    placeholder = document.getElementById(PLACEHOLDER) || document.createElement('div');
    placeholder.id = PLACEHOLDER;
    wrapper.append(placeholder);
  }

  const autoSelect = getMetadata('google-yolo-zero-tap')?.toLowerCase() === 'on';
  window.google?.accounts?.id?.initialize({
    client_id: GOOGLE_ID,
    callback: (data) => onToken(getMetadata, data),
    ...(placeholder && { prompt_parent_id: PLACEHOLDER }),
    cancel_on_tap_outside: false,
    itp_support: true,
    auto_select: autoSelect,
  });

  if (document.querySelector('.mobile-fork-button.mweb-mobile-fork')) {
    document.addEventListener(MOBILE_FORK_RESOLVED_EVENT, () => {
      promptGoogleLogin(true);
    }, { once: true });
  } else {
    promptGoogleLogin();
  }
}
