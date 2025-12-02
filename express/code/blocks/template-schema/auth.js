/**
 * Authentication module for Template Schema block
 *
 * Handles SUSI (Sign Up Sign In) flow for authoring access.
 * - Checks for existing IMS token or 'code' URL parameter
 * - Displays SUSI login if no valid token
 * - Reminds users to use Adobe Experience Cloud Skyline profile
 */

import { getLibs } from '../../scripts/utils.js';
import { state } from './state.js';

const DCTX_ID_STAGE = 'v:2,s,dcp-r,bg:express2024,bf31d610-dd5f-11ee-abfd-ebac9468bc58';
const DCTX_ID_PROD = 'v:2,s,dcp-r,bg:express2024,45faecb0-e687-11ee-a865-f545a8ca5d2c';
const SUSI_CLIENT_ID = 'AdobeExpressWeb';

const usp = new URLSearchParams(window.location.search);

let loadScript;
let loadIms;
let getConfig;
let createTag;
let isStage;

/**
 * Load required Milo utilities and determine environment
 */
async function loadMiloUtils() {
  if (!loadScript) {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    loadScript = utils.loadScript;
    loadIms = utils.loadIms;
    getConfig = utils.getConfig;
    createTag = utils.createTag;

    // Determine stage vs prod environment (same logic as susi-light.js)
    // env=prod forces prod, otherwise use config
    const envParam = usp.get('env');
    isStage = (envParam && envParam !== 'prod') || getConfig().env?.name !== 'prod';
  }
}

/**
 * Load SUSI scripts from Adobe identity CDN (stage or prod)
 */
export async function loadSUSIScripts() {
  await loadMiloUtils();
  // Use stage or prod CDN based on environment
  const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
  console.log('DaaS Auth: Loading SUSI scripts from:', CDN_URL, isStage ? '(stage)' : '(prod)');
  return loadScript(CDN_URL);
}

/**
 * Try to get access token from IMS
 * @returns {Promise<string|null>} The access token or null
 */
async function getIMSToken() {
  try {
    await loadMiloUtils();

    if (window.adobeIMS?.getAccessToken) {
      const tokenData = await window.adobeIMS.getAccessToken();
      if (tokenData?.token) {
        return tokenData.token;
      }
    }

    // Try loading IMS if not available
    await loadIms();
    if (window.adobeIMS?.getAccessToken) {
      const tokenData = await window.adobeIMS.getAccessToken();
      if (tokenData?.token) {
        return tokenData.token;
      }
    }
  } catch (err) {
    console.warn('DaaS Auth: Could not get IMS token:', err.message);
  }
  return null;
}

/**
 * Get token from URL parameters (code or access_token)
 * @returns {{token: string|null, type: string|null}} Token and its type
 */
function getTokenFromURL() {
  const usp = new URLSearchParams(window.location.search);

  // Check for access_token in query string
  const accessToken = usp.get('access_token');
  if (accessToken) {
    return { token: accessToken, type: 'access_token' };
  }

  // Check for authorization code
  const code = usp.get('code');
  if (code) {
    return { token: code, type: 'code' };
  }

  return { token: null, type: null };
}

/**
 * Get access token from URL hash (IMS implicit flow callback)
 * @returns {string|null} The access token or null
 */
function getTokenFromHash() {
  if (!window.location.hash) return null;

  // Parse hash parameters (format: #access_token=xxx&token_type=bearer&...)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  return hashParams.get('access_token') || null;
}

/**
 * Clean up auth params from URL after capturing token
 */
function cleanupAuthParamsFromURL() {
  const url = new URL(window.location.href);
  let changed = false;

  // Clean query params
  ['code', 'access_token', 'token_type', 'expires_in', 'state'].forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  });

  // Clean hash
  if (url.hash) {
    url.hash = '';
    changed = true;
  }

  if (changed) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * Check authentication status and retrieve token
 * Checks URL params/hash first (callback), then IMS (already signed in)
 * @returns {Promise<{authenticated: boolean, token: string|null, source: string|null}>}
 */
export async function checkAuth() {
  // First check URL hash for access_token (IMS implicit flow callback)
  const hashToken = getTokenFromHash();
  if (hashToken) {
    state.authToken = hashToken;
    state.authSource = 'hash';
    cleanupAuthParamsFromURL();
    console.log('DaaS Auth: Token found in URL hash');
    return { authenticated: true, token: hashToken, source: 'hash' };
  }

  // Check URL params (access_token or code)
  const urlToken = getTokenFromURL();
  if (urlToken.token) {
    state.authToken = urlToken.token;
    state.authSource = urlToken.type;
    cleanupAuthParamsFromURL();
    console.log('DaaS Auth: Token found in URL params:', urlToken.type);
    return { authenticated: true, token: urlToken.token, source: urlToken.type };
  }

  // Try IMS token (already signed in)
  try {
    const imsToken = await getIMSToken();
    if (imsToken) {
      state.authToken = imsToken;
      state.authSource = 'ims';
      console.log('DaaS Auth: Token retrieved from IMS');
      return { authenticated: true, token: imsToken, source: 'ims' };
    }
  } catch (err) {
    console.warn('DaaS Auth: IMS token check failed:', err.message);
  }

  return { authenticated: false, token: null, source: null };
}

/**
 * Get the current redirect URI for SUSI
 * @returns {string} The redirect URI
 */
function getRedirectURI() {
  const url = new URL(window.location.href);
  // Remove any existing code param
  url.searchParams.delete('code');
  return url.toString();
}

/**
 * Handle SUSI redirect event
 * @param {CustomEvent} e - The redirect event
 */
function onSUSIRedirect(e) {
  console.log('DaaS Auth: Redirecting to:', e.detail);
  setTimeout(() => {
    window.location.assign(e.detail);
  }, 100);
}

/**
 * Handle SUSI error event
 * @param {CustomEvent} e - The error event
 */
function onSUSIError(e) {
  console.error('DaaS Auth: SUSI error:', e.detail);
  window.lana?.log('DaaS Auth SUSI error:', e);
}

/**
 * Create the SUSI component (matching susi-light.js approach)
 * @param {string} locale - The locale for SUSI
 * @returns {HTMLElement} The SUSI component
 */
function createSUSIComponent(locale) {
  const susi = createTag('susi-sentry-light');

  const redirectUri = getRedirectURI();

  susi.authParams = {
    dt: false,
    locale,
    response_type: 'code',
    client_id: SUSI_CLIENT_ID,
    scope: 'AdobeID,openid',
    redirect_uri: redirectUri,
    dctx_id: isStage ? DCTX_ID_STAGE : DCTX_ID_PROD,
  };

  susi.config = {
    consentProfile: 'free',
    fullWidth: true,
    title: '',
    hideIcon: true,
  };

  // Set stage attribute if staging environment
  if (isStage) {
    susi.stage = 'true';
  }

  susi.variant = 'standard';

  susi.addEventListener('redirect', onSUSIRedirect);
  susi.addEventListener('on-error', onSUSIError);

  console.log('DaaS Auth: SUSI component created with redirect_uri:', redirectUri);

  return susi;
}

/**
 * Trigger IMS sign-in flow via SUSI
 * Opens Adobe's sign-in page with proper redirect back to current page
 */
async function triggerIMSSignIn() {
  await loadMiloUtils();

  const redirectUri = getRedirectURI();
  const baseUrl = isStage
    ? 'https://auth-light.identity-stage.adobe.com'
    : 'https://auth-light.identity.adobe.com';

  // Construct the auth URL using SUSI's authorize endpoint
  const authUrl = new URL(`${baseUrl}/sentry/authorize`);
  authUrl.searchParams.set('client_id', SUSI_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'AdobeID,openid');
  authUrl.searchParams.set('dctx_id', isStage ? DCTX_ID_STAGE : DCTX_ID_PROD);
  authUrl.searchParams.set('locale', getConfig()?.locale?.ietf?.toLowerCase() || 'en-us');

  console.log('DaaS Auth: Redirecting to SUSI:', authUrl.toString(), isStage ? '(stage)' : '(prod)');
  window.location.assign(authUrl.toString());
}

/**
 * Create the authentication UI with SUSI flow
 * @returns {Promise<HTMLElement>} The auth container element
 */
export async function createAuthUI() {
  await loadMiloUtils();

  const config = getConfig();
  const locale = config?.locale?.ietf?.toLowerCase() || 'en-us';

  const container = createTag('div', { class: 'daas-auth-container' });

  // Logo
  const logo = createTag('div', { class: 'daas-auth-logo' });
  logo.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h32v32H0z" fill="#EB1000"/>
      <path d="M12.5 5h7v22h-7V5z" fill="#fff"/>
      <path d="M5 12.5h22v7H5v-7z" fill="#fff"/>
    </svg>
  `;

  // Title
  const title = createTag('h2', { class: 'daas-auth-title' }, 'Sign in to continue');

  // Subtitle with profile reminder
  const subtitle = createTag('p', { class: 'daas-auth-subtitle' });
  subtitle.innerHTML = `Please sign in to access the authoring form.<br>
    <strong class="daas-auth-reminder">💡 Choose the "Adobe Experience Cloud Skyline" profile during sign-in.</strong>`;

  // Sign-in button
  const signInBtn = createTag('button', {
    class: 'daas-btn daas-btn-primary daas-auth-signin-btn',
    type: 'button',
  });
  signInBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM9 4.5a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5zm0 10.5a6 6 0 01-4.97-2.65c.02-1.65 3.32-2.55 4.97-2.55 1.64 0 4.95.9 4.97 2.55A6 6 0 019 15z" fill="currentColor"/>
    </svg>
    Sign in with Adobe
  `;
  signInBtn.addEventListener('click', triggerIMSSignIn);

  // SUSI component wrapper (as fallback/alternative)
  const susiWrapper = createTag('div', { class: 'daas-susi-wrapper' });

  // Try to load SUSI as an alternative option
  try {
    await loadSUSIScripts();
    const susi = createSUSIComponent(locale);
    susiWrapper.appendChild(susi);
  } catch (err) {
    console.warn('DaaS Auth: SUSI scripts failed to load, using IMS only:', err);
  }

  // Assemble
  container.appendChild(logo);
  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(signInBtn);
  container.appendChild(susiWrapper);

  return container;
}

/**
 * Get the stored auth token
 * @returns {string|null} The auth token or null
 */
export function getAuthToken() {
  return state.authToken || null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  return !!state.authToken;
}

/**
 * Get the auth source (ims or code)
 * @returns {string|null} The auth source or null
 */
export function getAuthSource() {
  return state.authSource || null;
}

