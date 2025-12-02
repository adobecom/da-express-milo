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

const DCTX_ID_PROD = 'v:2,s,dcp-r,bg:express2024,45faecb0-e687-11ee-a865-f545a8ca5d2c';
const SUSI_CLIENT_ID = 'AdobeExpressWeb';

let loadScript;
let loadIms;
let getConfig;
let createTag;

/**
 * Load required Milo utilities
 */
async function loadMiloUtils() {
  if (!loadScript) {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    loadScript = utils.loadScript;
    loadIms = utils.loadIms;
    getConfig = utils.getConfig;
    createTag = utils.createTag;
  }
}

/**
 * Load SUSI scripts from Adobe identity CDN
 */
export async function loadSUSIScripts() {
  await loadMiloUtils();
  const CDN_URL = 'https://auth-light.identity.adobe.com/sentry/wrapper.js';
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
 * Get token from 'code' URL parameter
 * @returns {string|null} The code param value or null
 */
function getCodeFromURL() {
  const usp = new URLSearchParams(window.location.search);
  return usp.get('code') || null;
}

/**
 * Check authentication status and retrieve token
 * Tries IMS first, then falls back to 'code' URL param
 * @returns {Promise<{authenticated: boolean, token: string|null, source: string|null}>}
 */
export async function checkAuth() {
  // First try IMS token
  const imsToken = await getIMSToken();
  if (imsToken) {
    state.authToken = imsToken;
    state.authSource = 'ims';
    return { authenticated: true, token: imsToken, source: 'ims' };
  }

  // Fall back to 'code' URL param
  const codeToken = getCodeFromURL();
  if (codeToken) {
    state.authToken = codeToken;
    state.authSource = 'code';
    // Clean up URL after capturing the code
    cleanupCodeFromURL();
    return { authenticated: true, token: codeToken, source: 'code' };
  }

  return { authenticated: false, token: null, source: null };
}

/**
 * Remove 'code' param from URL to clean up after capturing
 */
function cleanupCodeFromURL() {
  const url = new URL(window.location.href);
  if (url.searchParams.has('code')) {
    url.searchParams.delete('code');
    window.history.replaceState({}, document.title, url.toString());
  }
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
 * Create the SUSI component
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
    dctx_id: DCTX_ID_PROD,
  };

  susi.config = {
    consentProfile: 'free',
    fullWidth: true,
    title: '',
    hideIcon: true,
  };

  susi.variant = 'standard';

  susi.addEventListener('redirect', onSUSIRedirect);
  susi.addEventListener('on-error', onSUSIError);

  return susi;
}

/**
 * Create the authentication UI with SUSI flow
 * @returns {Promise<HTMLElement>} The auth container element
 */
export async function createAuthUI() {
  await loadMiloUtils();
  await loadSUSIScripts();

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

  // SUSI component wrapper
  const susiWrapper = createTag('div', { class: 'daas-susi-wrapper' });
  const susi = createSUSIComponent(locale);
  susiWrapper.appendChild(susi);

  // Assemble
  container.appendChild(logo);
  container.appendChild(title);
  container.appendChild(subtitle);
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

