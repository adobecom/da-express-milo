/**
 * @typedef {Object} AnimationConfig
 * @property {number} [duration=200] - Animation duration in milliseconds
 * @property {string} [visibleClass='is-visible'] - Class applied when sticky is visible
 * @property {string} [leavingClass='is-leaving'] - Class applied during hide animation
 */

/**
 * @typedef {Object} ObserverConfig
 * @property {HTMLElement|null} [root=null] - Scroll container (null = viewport)
 * @property {string} [rootMargin='0px'] - Margin around root for intersection calculation
 * @property {number} [threshold=0] - Visibility threshold to trigger callback
 */

/**
 * @typedef {Object} StickyBehaviorOptions
 * @property {HTMLElement} sentinel - Element to observe for intersection
 * @property {Function} [createClone] - Factory function that returns the clone element (clone mode)
 * @property {HTMLElement} [element] - Element to relocate (relocate mode)
 * @property {Function} [createWrapper] - Factory function that returns the sticky wrapper (relocate mode)
 * @property {Function} [onShow] - Callback invoked when sticky becomes visible
 * @property {Function} [onHide] - Callback invoked when sticky is hidden
 * @property {Function} [onSync] - Callback to sync state (clone mode only)
 * @property {AnimationConfig} [animation] - Animation configuration
 * @property {ObserverConfig} [observer] - IntersectionObserver configuration
 * @property {string} [stickyClass='is-sticky-clone'] - Class added to sticky element/wrapper
 * @property {Function|HTMLElement} [appendTo] - Container for sticky wrapper (default: document.body)
 */

/**
 * @typedef {Object} StickyBehaviorAPI
 * @property {Function} init - Initialize the intersection observer
 * @property {Function} destroy - Clean up all resources
 * @property {Function} show - Manually show the sticky element
 * @property {Function} hide - Manually hide the sticky element
 * @property {Function} sync - Sync state (clone mode only)
 * @property {Function} getElement - Get the sticky element reference
 * @property {Function} isVisible - Check if sticky is currently visible
 * @property {Function} isInitialized - Check if observer is active
 */

/**
 * Default configuration merged with user options
 */
export const DEFAULT_CONFIG = {
  animation: {
    duration: 200,
    visibleClass: 'is-visible',
    leavingClass: 'is-leaving',
  },
  observer: {
    root: null,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0,
  },
  stickyClass: 'is-sticky-clone',
  appendTo: () => document.body,
};

