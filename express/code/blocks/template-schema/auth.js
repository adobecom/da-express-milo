/**
 * Authentication module for Template Schema block
 *
 * Implements SUSI (Sign Up Sign In) flow matching susi-light.js behavior.
 * - Uses ?env=prod URL param to force production SUSI environment
 * - Redirects back to current page with code=<bearer token>
 * - Requires Adobe Experience Cloud Skyline profile for authoring access
 */

import { getLibs } from '../../scripts/utils.js';
import { state } from './state.js';

// Same DCTX IDs as susi-light.js
const DCTX_ID_STAGE = 'v:2,s,dcp-r,bg:express2024,bf31d610-dd5f-11ee-abfd-ebac9468bc58';
const DCTX_ID_PROD = 'v:2,s,dcp-r,bg:express2024,45faecb0-e687-11ee-a865-f545a8ca5d2c';

// Client ID - using same as susi-light examples
const SUSI_CLIENT_ID = 'AdobeExpressWeb';

const usp = new URLSearchParams(window.location.search);

let createTag;
let loadScript;
let getConfig;
let isStage;

/**
 * Load SUSI scripts from Adobe identity CDN (matching susi-light.js)
 */
async function loadSUSIScripts() {
  if (!loadScript) {
    ({ loadScript, createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));
    // Environment detection - same logic as susi-light.js line 401
    // env=prod forces prod, otherwise check config
    isStage = (usp.get('env') && usp.get('env') !== 'prod') || getConfig().env?.name !== 'prod';
  }

  const CDN_URL = `https://auth-light.identity${isStage ? '-stage' : ''}.adobe.com/sentry/wrapper.js`;
  console.log('DaaS Auth: Loading SUSI from', CDN_URL, isStage ? '(stage)' : '(prod)');
  return loadScript(CDN_URL);
}

/**
 * Handle SUSI redirect event (matching susi-light.js onRedirect)
 */
function onRedirect(e) {
  console.log('DaaS Auth: Redirecting to:', e.detail);
  setTimeout(() => {
    window.location.assign(e.detail);
  }, 100);
}

/**
 * Handle SUSI error event
 */
function onError(e) {
  console.error('DaaS Auth: SUSI error:', e.detail);
  window.lana?.log('DaaS Auth SUSI error:', e);
}

/**
 * Get the redirect URI - current page URL without code param
 */
function getRedirectURI() {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  return url.toString();
}

/**
 * Create SUSI component (matching susi-light.js createSUSIComponent)
 */
function createSUSIComponent(locale) {
  const susi = createTag('susi-sentry-light');

  // Build authParams matching susi-light.js buildSUSIParams
  susi.authParams = {
    dt: false,
    locale,
    response_type: 'code',
    client_id: SUSI_CLIENT_ID,
    scope: 'AdobeID,openid',
    redirect_uri: getRedirectURI(),
    dctx_id: isStage ? DCTX_ID_STAGE : DCTX_ID_PROD,
  };

  // Config matching susi-light.js b2b variant with email-only
  susi.config = {
    consentProfile: 'free',
    fullWidth: true,
    title: '',
    hideIcon: true,
    layout: 'emailOnly',
  };

  // Set stage attribute if staging (matching susi-light.js line 106)
  if (isStage) {
    susi.stage = 'true';
  }

  susi.variant = 'standard';

  // Add event listeners (matching susi-light.js)
  susi.addEventListener('redirect', onRedirect);
  susi.addEventListener('on-error', onError);

  console.log('DaaS Auth: SUSI component created, redirect_uri:', susi.authParams.redirect_uri);
  return susi;
}

/**
 * Check if code param exists in URL (returned from SUSI after sign-in)
 */
function getCodeFromURL() {
  return usp.get('code') || null;
}

/**
 * Clean up code param from URL after capturing
 */
function cleanupCodeFromURL() {
  const url = new URL(window.location.href);
  if (url.searchParams.has('code')) {
    url.searchParams.delete('code');
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * Check authentication status
 * Returns true if code param exists (user signed in via SUSI)
 */
export async function checkAuth() {
  // Check for code param from SUSI redirect
  const code = getCodeFromURL();
  if (code) {
    state.authToken = code;
    state.authSource = 'code';
    cleanupCodeFromURL();
    console.log('DaaS Auth: Token found in URL code param');
    return { authenticated: true, token: code, source: 'code' };
  }

  return { authenticated: false, token: null, source: null };
}

/**
 * Create the authentication UI with SUSI component
 * Matches the susi-light.js b2b email-only variant layout
 */
export async function createAuthUI() {
  await loadSUSIScripts();

  const locale = getConfig()?.locale?.ietf?.toLowerCase() || 'en-us';

  const container = createTag('div', { class: 'daas-auth-container' });

  // Logo (similar to susi-light.js createLogo)
  const logo = createTag('div', { class: 'daas-auth-logo' });
  logo.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#EB1000"/>
      <path d="M15.5 8h9v24h-9V8z" fill="#fff"/>
      <path d="M8 15.5h24v9H8v-9z" fill="#fff"/>
    </svg>
  `;

  // Title
  const title = createTag('h2', { class: 'daas-auth-title' }, 'Sign in to continue');

  // Subtitle with profile reminder
  const subtitle = createTag('p', { class: 'daas-auth-subtitle' });
  subtitle.innerHTML = `Sign in to access the authoring form.`;

  // Profile reminder - important for Skyline access
  const reminder = createTag('div', { class: 'daas-auth-reminder' });
  reminder.innerHTML = `💡 <strong>Important:</strong> Choose the <strong>"Adobe Experience Cloud Skyline"</strong> profile during sign-in.`;

  // Environment indicator
  const envIndicator = createTag('div', { class: 'daas-auth-env' });
  envIndicator.textContent = isStage ? '🔧 Stage Environment' : '🌐 Production Environment';
  if (isStage) {
    envIndicator.innerHTML += '<br><small>Add <code>?env=prod</code> to URL for production.</small>';
  }

  // SUSI component wrapper (matching susi-light.js susi-wrapper)
  const susiWrapper = createTag('div', { class: 'daas-susi-wrapper' });
  const susi = createSUSIComponent(locale);
  susiWrapper.appendChild(susi);

  // Assemble layout (similar to susi-light.js susi-layout)
  container.appendChild(logo);
  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(reminder);
  container.appendChild(susiWrapper);
  container.appendChild(envIndicator);

  return container;
}

/**
 * Get the stored auth token
 */
export function getAuthToken() {
  return state.authToken || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!state.authToken;
}

/**
 * Get the auth source
 */
export function getAuthSource() {
  return state.authSource || null;
}
