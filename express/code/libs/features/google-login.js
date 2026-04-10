const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_ID = '530526366930-l874a90ipfkn26naa71r010u8epp39jt.apps.googleusercontent.com';
const PLACEHOLDER = 'feds-googleLogin';
const WRAPPER = 'feds-profile';

const onToken = async (getMetadata, getConfig, data) => {
  const acceptedTouList = getMetadata('google-login-accepted-tou-list')?.trim();
  let destination;
  try {
    destination = new URL(getMetadata('google-login-redirect'))?.href || await getConfig()?.googleLoginURLCallback?.()  ;
  } catch {
    window.lana?.log('[local] error parsing google-login-redirect', getMetadata('google-login-redirect'), { tags: 'google-login', severity: 'error' });
  }

  await window.adobeIMS.socialHeadlessSignIn({
    provider_id: 'google',
    idp_token: data?.credential,
    client_id: window.adobeid?.client_id,
    scope: window.adobeid?.scope,
    accepted_tou_list: acceptedTouList || '',
  }).then(() => {
    if (window.DISABLE_PAGE_RELOAD === true) return;
    // Existing account
    if (destination) {
      window.location.assign(destination);
    } else {
      window.location.reload();
    }
  }).catch(() => {
    // New account
    window.adobeIMS.signInWithSocialProvider('google', { redirect_uri: destination || window.location.href });
  });
};

export default async function initGoogleLogin(loadIms, getMetadata, loadScript, getConfig) {
  try {
    await loadIms();
  } catch {
    return;
  }
  if (window.adobeIMS?.isSignedInUser()) return;

  await loadScript(GOOGLE_SCRIPT);
  const placeholder = document.createElement('div');
  placeholder.id = PLACEHOLDER;
  document.querySelector(`.${WRAPPER}`)?.append(placeholder);

  window.google?.accounts?.id?.initialize({
    client_id: GOOGLE_ID,
    callback: (data) => onToken(getMetadata, getConfig, data),
    prompt_parent_id: PLACEHOLDER,
    cancel_on_tap_outside: false,
    auto_select: getMetadata('google-yolo-zero-tap')?.toLowerCase() === 'on',
  });
  window.google?.accounts?.id?.prompt();
}
