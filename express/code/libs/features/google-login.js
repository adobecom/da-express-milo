const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_ID = '530526366930-l874a90ipfkn26naa71r010u8epp39jt.apps.googleusercontent.com';
const PLACEHOLDER = 'feds-googleLogin';
const WRAPPER = 'feds-profile';

const getDestination = async (getMetadata, getConfig) => {
  const redirect = getMetadata('google-login-redirect')?.trim();
  if (redirect) {
    try {
      return new URL(redirect).href;
    } catch {
      window.lana?.log(`Invalid google-login-redirect: ${redirect}`, { tags: 'google-login', severity: 'error' });
    }
  }

  try {
    return await getConfig()?.googleLoginURLCallback?.();
  } catch (error) {
    window.lana?.log(`Google login redirect callback failed: ${error?.message || error}`, { tags: 'google-login', severity: 'error' });
    return undefined;
  }
};

const onToken = async (getMetadata, getConfig, data) => {
  const acceptedTouList = getMetadata('google-login-accepted-tou-list')?.trim();
  const destination = await getDestination(getMetadata, getConfig);

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
    await window.adobeIMS.signInWithSocialProvider('google', { redirect_uri: destination || window.location.href });
    return;
  }

  if (window.DISABLE_PAGE_RELOAD === true) return;
  // Existing account
  if (destination) {
    window.location.assign(destination);
  } else {
    window.location.reload();
  }
};

export default async function initGoogleLogin(loadIms, getMetadata, loadScript, getConfig) {
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

  window.google?.accounts?.id?.initialize({
    client_id: GOOGLE_ID,
    callback: (data) => onToken(getMetadata, getConfig, data),
    ...(placeholder && { prompt_parent_id: PLACEHOLDER }),
    cancel_on_tap_outside: false,
    auto_select: getMetadata('google-yolo-zero-tap')?.toLowerCase() === 'on',
  });
  window.google?.accounts?.id?.prompt();
}
