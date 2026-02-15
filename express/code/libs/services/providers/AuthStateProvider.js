import BaseProvider from './BaseProvider.js';

export default class AuthStateProvider extends BaseProvider {
  /** @type {{ isLoggedIn: boolean, token: string|null }} */
  #state = { isLoggedIn: false, token: null };

  /** @type {Set<Function>} */
  #listeners = new Set();

  /** @type {string[]} */
  static IMS_EVENTS = ['onAccessToken', 'onAccessTokenHasExpired', 'onLogout'];

  constructor() {
    super(null);
    this.#syncState();
    this.#bridgeImsEvents();
  }

  /** @returns {{ isLoggedIn: boolean, token: string|null }} */
  getState() {
    return { ...this.#state };
  }

  /** @returns {boolean} */
  get isLoggedIn() {
    return this.#state.isLoggedIn;
  }

  /**
   * @param {(state: { isLoggedIn: boolean, token: string|null }) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('subscribe() requires a function callback');
    }
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  /** @private */
  #syncState() {
    const ims = window?.adobeIMS;
    this.#state = {
      isLoggedIn: ims?.isSignedInUser?.() || false,
      token: ims?.getAccessToken?.()?.token || null,
    };
  }

  /** @private */
  #bridgeImsEvents() {
    const ims = window?.adobeIMS;
    if (!ims?.addEventListener) return;

    const handler = () => this.#handleImsEvent();

    AuthStateProvider.IMS_EVENTS.forEach((event) => {
      ims.addEventListener(event, handler);
    });
  }

  /** @private */
  #handleImsEvent() {
    const prevLoggedIn = this.#state.isLoggedIn;
    this.#syncState();

    if (this.#state.isLoggedIn !== prevLoggedIn) {
      this.#notify();
    }
  }

  /** @private */
  #notify() {
    const snapshot = this.getState();
    this.#listeners.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('AuthStateProvider subscriber error:', error);
      }
    });
  }
}
