/**
 * Authentication module for Template Schema block
 *
 * Simple IMS authentication flow:
 * - Uses window.adobeIMS.signIn() for sign-in
 * - Uses window.adobeIMS.getAccessToken() to check auth status
 * - Requires ?env=prod URL param for production environment
 */

import { getLibs } from '../../scripts/utils.js';
import { state, STORAGE_KEY } from './state.js';

const usp = new URLSearchParams(window.location.search);

let createTag;
let getConfig;
let loadIms;

/**
 * Load required Milo utilities
 */
async function loadMiloUtils() {
  if (!createTag) {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    createTag = utils.createTag;
    getConfig = utils.getConfig;
    loadIms = utils.loadIms;
  }
}

/**
 * Check if env=prod is set (required for Skyline profile access)
 */
function isProdEnv() {
  const envParam = usp.get('env');
  return envParam === 'prod';
}

/**
 * Wait for IMS to be fully ready
 * loadIms() is memoized and resolves when onReady callback fires
 */
async function waitForIMSReady() {
  // Always await loadIms() - it's memoized so safe to call multiple times
  // It resolves when the onReady callback fires, meaning IMS is truly ready
  await loadIms();
  return window.adobeIMS;
}

/**
 * Try to get access token from IMS
 * Waits for IMS to be fully ready first
 */
async function getIMSToken() {
  try {
    const ims = await waitForIMSReady();

    if (ims?.getAccessToken) {
      const tokenData = await ims.getAccessToken();
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
 * Save auth token to sessionStorage
 */
function saveTokenToStorage(token) {
  try {
    const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    storedData.authToken = token;
    storedData.authTimestamp = new Date().toISOString();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  } catch (err) {
    console.warn('DaaS Auth: Could not save token to sessionStorage:', err);
  }
}

/**
 * Clear auth token from sessionStorage
 */
export function clearAuthToken() {
  try {
    const storedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    delete storedData.authToken;
    delete storedData.authTimestamp;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    state.authToken = null;
  } catch (err) {
    console.warn('DaaS Auth: Could not clear token from sessionStorage:', err);
  }
}

/**
 * Trigger IMS sign-in
 * Waits for IMS to be ready before calling signIn
 */
async function triggerSignIn() {
  await loadMiloUtils();

  try {
    const ims = await waitForIMSReady();

    if (ims?.signIn) {
      ims.signIn();
    } else {
      console.error('DaaS Auth: IMS signIn not available');
    }
  } catch (err) {
    console.error('DaaS Auth: Failed to trigger sign-in:', err);
  }
}

/**
 * Check authentication status via IMS
 */
export async function checkAuth() {
  await loadMiloUtils();

  const token = await getIMSToken();

  if (token) {
    state.authToken = token;
    saveTokenToStorage(token);
    return { authenticated: true, token };
  }

  return { authenticated: false, token: null };
}

/**
 * Create the authentication UI
 */
export async function createAuthUI() {
  await loadMiloUtils();

  const container = createTag('div', { class: 'daas-auth-container' });

  // Logo
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

  // Subtitle
  const subtitle = createTag('p', { class: 'daas-auth-subtitle' });
  subtitle.textContent = 'Sign in with your Adobe account to access the authoring form.';

  // Check if env=prod is set
  const isProd = isProdEnv();

  if (!isProd) {
    // Show warning if env=prod is not set
    const warning = createTag('div', { class: 'daas-auth-warning' });
    warning.innerHTML = `
      <strong>⚠️ Production environment required</strong><br>
      Add <code>?env=prod</code> to the URL to enable sign-in with the Skyline profile.
    `;
    container.appendChild(logo);
    container.appendChild(title);
    container.appendChild(warning);
    return container;
  }

  // Profile reminder
  const reminder = createTag('div', { class: 'daas-auth-reminder' });
  reminder.innerHTML = `💡 Choose the <strong>"Adobe Experience Cloud Skyline"</strong> profile when signing in.`;

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
  signInBtn.addEventListener('click', triggerSignIn);

  // Assemble
  container.appendChild(logo);
  container.appendChild(title);
  container.appendChild(subtitle);
  container.appendChild(reminder);
  container.appendChild(signInBtn);

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
