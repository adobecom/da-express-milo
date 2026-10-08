const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_ID = '530526366930-l874a90ipfkn26naa71r010u8epp39jt.apps.googleusercontent.com';
const PLACEHOLDER = 'feds-googleLogin';
const WRAPPER = 'feds-profile';
const MOBILE_FORK_RESOLVED_EVENT = 'mobileforkresolved';
const REGULAR_CTA_PENDING_CLASS = 'google-login-prompt-pending';
const DIAGNOSTIC_PREFIX = '[MWPW-188779][Google One Tap]';
const REGULAR_CTA_SUPPRESSION_MS = 1000;

const diagnosticLog = (message, details = {}) => {
  // eslint-disable-next-line no-console
  console.log(DIAGNOSTIC_PREFIX, message, { atMs: Math.round(performance.now()), ...details });
};

const getRegularCtaDiagnostics = () => (
  [...document.querySelectorAll('.floating-button-wrapper:not(.mobile-fork-button)')]
    .map((cta, index) => {
      const style = window.getComputedStyle(cta);
      return {
        index,
        className: cta.className,
        connected: cta.isConnected,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        audience: cta.dataset.audience,
        sectionStatus: cta.dataset.sectionStatus,
      };
    })
);

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

const promptGoogleLogin = (hideRegularCta = false) => {
  diagnosticLog('Prompt requested', {
    hideRegularCta,
    pendingClassBefore: document.body.classList.contains(REGULAR_CTA_PENDING_CLASS),
    regularCtasBefore: getRegularCtaDiagnostics(),
    googlePromptAvailable: typeof window.google?.accounts?.id?.prompt === 'function',
  });
  if (hideRegularCta) {
    document.body.classList.add(REGULAR_CTA_PENDING_CLASS);
    diagnosticLog('Regular CTA suppression applied', {
      pendingClass: document.body.classList.contains(REGULAR_CTA_PENDING_CLASS),
      regularCtas: getRegularCtaDiagnostics(),
    });
  }
  try {
    window.google?.accounts?.id?.prompt();
    diagnosticLog('Google prompt invoked', {
      pendingClass: document.body.classList.contains(REGULAR_CTA_PENDING_CLASS),
      regularCtas: getRegularCtaDiagnostics(),
    });
  } catch (error) {
    diagnosticLog('Google prompt threw', { message: error?.message || String(error) });
    throw error;
  } finally {
    if (hideRegularCta) {
      diagnosticLog('Regular CTA suppression release scheduled', {
        delayMs: REGULAR_CTA_SUPPRESSION_MS,
      });
      window.setTimeout(() => {
        document.body.classList.remove(REGULAR_CTA_PENDING_CLASS);
        diagnosticLog('Regular CTA suppression removed', {
          pendingClass: document.body.classList.contains(REGULAR_CTA_PENDING_CLASS),
          regularCtas: getRegularCtaDiagnostics(),
        });
      }, REGULAR_CTA_SUPPRESSION_MS);
    }
  }
};

export default async function initGoogleLogin(loadIms, getMetadata, loadScript, getConfig) {
  diagnosticLog('Initialization started', {
    googleLogin: getMetadata('google-login')?.trim().toLowerCase(),
    expressGoogleLogin: getMetadata('express-google-login')?.trim().toLowerCase(),
    zeroTap: getMetadata('google-yolo-zero-tap')?.trim().toLowerCase(),
    hasMobileFork: Boolean(document.querySelector('.mobile-fork-button.mweb-mobile-fork')),
    hasProfileWrapper: Boolean(document.querySelector(`.${WRAPPER}`)),
  });
  try {
    await loadIms();
    diagnosticLog('IMS load completed', {
      hasAdobeIms: Boolean(window.adobeIMS),
      signedIn: Boolean(window.adobeIMS?.isSignedInUser()),
    });
  } catch (error) {
    diagnosticLog('IMS load failed', { message: error?.message || String(error) });
    return;
  }
  if (window.adobeIMS?.isSignedInUser()) {
    diagnosticLog('Initialization stopped for signed-in user');
    return;
  }

  diagnosticLog('Loading Google GSI script', { src: GOOGLE_SCRIPT });
  await loadScript(GOOGLE_SCRIPT);
  diagnosticLog('Google GSI script load completed', {
    hasGoogleIdApi: Boolean(window.google?.accounts?.id),
  });
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
    callback: (data) => onToken(getMetadata, getConfig, data),
    ...(placeholder && { prompt_parent_id: PLACEHOLDER }),
    cancel_on_tap_outside: false,
    itp_support: true,
    auto_select: autoSelect,
  });
  diagnosticLog('Google GSI initialized', {
    autoSelect,
    hasPromptParent: Boolean(placeholder),
    hasMobileFork: Boolean(document.querySelector('.mobile-fork-button.mweb-mobile-fork')),
  });

  if (document.querySelector('.mobile-fork-button.mweb-mobile-fork')) {
    diagnosticLog('Waiting for mobile fork resolution');
    document.addEventListener(MOBILE_FORK_RESOLVED_EVENT, (event) => {
      diagnosticLog('Received mobileforkresolved', {
        detail: event.detail,
        regularCtas: getRegularCtaDiagnostics(),
      });
      promptGoogleLogin(true);
    }, { once: true });
  } else {
    diagnosticLog('No dismissable mobile fork found; prompting immediately');
    promptGoogleLogin();
  }
}
