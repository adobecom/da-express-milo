import { DEFAULT_CONFIG } from './constants.js';
import { validateOptions } from './validation.js';
import { mergeConfig, createDefaultWrapper } from './helpers.js';

/**
 * Creates sticky behavior for an element using IntersectionObserver
 *
 * Supports two modes:
 * - Clone mode: Pass `createClone` function to create a duplicate element
 * - Relocate mode: Pass `element` to move the original element (no cloning)
 *
 * @param {import('./constants.js').StickyBehaviorOptions} options - Configuration options
 * @returns {import('./constants.js').StickyBehaviorAPI} Public API for controlling sticky behavior
 */
export function createStickyBehavior(options) {
  // Validate required options
  validateOptions(options);

  // Merge configuration with defaults
  const config = mergeConfig(DEFAULT_CONFIG, options);

  const isRelocateMode = config.element instanceof HTMLElement;

  const state = {
    isVisible: false,
    isTransitioning: false, // Prevents oscillation during animations
    isInitialized: false,
    stickyElement: null, // The clone (clone mode) or wrapper (relocate mode)
    placeholder: null, // Only used in relocate mode
    originalParent: null, // Only used in relocate mode
    originalNextSibling: null, // Only used in relocate mode
    intersectionObserver: null,
    leaveAnimationTimeout: null,
  };

  /**
   * Clears any pending leave animation timeout
   * Prevents race conditions during rapid show/hide cycles
   */
  function clearLeaveAnimation() {
    if (state.leaveAnimationTimeout) {
      clearTimeout(state.leaveAnimationTimeout);
      state.leaveAnimationTimeout = null;
      state.isTransitioning = false;
    }
  }

  /**
   * Resolves the container element for the sticky element
   * @returns {HTMLElement} Container element
   */
  function resolveContainer() {
    return typeof config.appendTo === 'function'
      ? config.appendTo()
      : config.appendTo;
  }

  /**
   * Creates and appends the sticky clone element (clone mode - lazy initialization)
   * @returns {HTMLElement} The clone element
   * @throws {Error} If createClone doesn't return an element
   */
  function ensureClone() {
    if (state.stickyElement) return state.stickyElement;

    state.stickyElement = config.createClone();

    if (!state.stickyElement || !(state.stickyElement instanceof HTMLElement)) {
      throw new Error('stickyBehavior: createClone must return an HTMLElement');
    }

    state.stickyElement.classList.add(config.stickyClass);

    const container = resolveContainer();
    container.appendChild(state.stickyElement);

    return state.stickyElement;
  }

  /**
   * Creates the sticky wrapper and placeholder (relocate mode - lazy initialization)
   * Does NOT move the element yet - that happens in show()
   * @returns {HTMLElement} The wrapper element
   */
  function ensureWrapper() {
    if (state.stickyElement) return state.stickyElement;

    // Store original position info for restoration
    state.originalParent = config.element.parentNode;
    state.originalNextSibling = config.element.nextSibling;

    // Create placeholder to maintain document flow when element is relocated
    state.placeholder = document.createElement('div');
    state.placeholder.className = 'sticky-placeholder';
    state.placeholder.setAttribute('aria-hidden', 'true');
    state.placeholder.style.cssText = 'display: none;';

    // Insert placeholder right after the element (will swap positions when showing)
    config.element.after(state.placeholder);

    // Create wrapper (use custom or default)
    state.stickyElement = config.createWrapper
      ? config.createWrapper()
      : createDefaultWrapper();

    if (!state.stickyElement || !(state.stickyElement instanceof HTMLElement)) {
      throw new Error('stickyBehavior: createWrapper must return an HTMLElement');
    }

    state.stickyElement.classList.add(config.stickyClass);

    // Append wrapper to container (empty for now, element moves in on show)
    const container = resolveContainer();
    container.appendChild(state.stickyElement);

    return state.stickyElement;
  }

  /**
   * Moves element into sticky wrapper (relocate mode)
   */
  function relocateToSticky() {
    if (!isRelocateMode || !state.stickyElement) return;

    // Show placeholder to maintain space
    state.placeholder.style.display = 'block';

    // Move element into sticky wrapper
    state.stickyElement.appendChild(config.element);
  }

  /**
   * Moves element back to original position (relocate mode)
   */
  function relocateToOriginal() {
    if (!isRelocateMode || !state.placeholder) return;

    // Add returning class for fade-in animation
    config.element.classList.add('is-returning');

    // Move element back before placeholder
    state.placeholder.before(config.element);

    // Hide placeholder
    state.placeholder.style.display = 'none';

    // Remove the class after animation completes
    setTimeout(() => {
      config.element?.classList.remove('is-returning');
    }, config.animation.duration);
  }

  /**
   * Ensures the sticky element exists (mode-agnostic)
   * @returns {HTMLElement} The sticky element
   */
  function ensureStickyElement() {
    return isRelocateMode ? ensureWrapper() : ensureClone();
  }

  /**
   * Handles intersection observer entries
   * Single entry point for visibility changes
   * @param {IntersectionObserverEntry[]} entries - Observer entries
   */
  function handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hide();
      } else {
        show();
      }
    });
  }

  /**
   * Shows the sticky element with enter animation
   */
  function show() {
    // Guard against showing when already visible or transitioning
    if (state.isVisible || state.isTransitioning) return;

    clearLeaveAnimation();

    const stickyEl = ensureStickyElement();

    // Sync state before showing (clone mode only)
    if (!isRelocateMode) {
      config.onSync?.(stickyEl);
    }

    // Move element to sticky position (relocate mode)
    if (isRelocateMode) {
      relocateToSticky();
    }

    stickyEl.classList.remove(config.animation.leavingClass);
    stickyEl.classList.add(config.animation.visibleClass);

    state.isVisible = true;
    config.onShow?.(isRelocateMode ? config.element : stickyEl);
  }

  /**
   * Hides the sticky element with leave animation
   */
  function hide() {
    if (!state.stickyElement || !state.isVisible || state.isTransitioning) return;

    clearLeaveAnimation();

    state.isTransitioning = true;
    state.stickyElement.classList.add(config.animation.leavingClass);

    // Move element back immediately (relocate mode) so fade-in starts with slide-down
    if (isRelocateMode) {
      // Lock wrapper dimensions before removing element to prevent shrinking
      const { width, height } = state.stickyElement.getBoundingClientRect();
      state.stickyElement.style.width = `${width}px`;
      state.stickyElement.style.height = `${height}px`;

      relocateToOriginal();
    }

    state.leaveAnimationTimeout = setTimeout(() => {
      if (state.stickyElement) {
        state.stickyElement.classList.remove(
          config.animation.visibleClass,
          config.animation.leavingClass,
        );
        // Clear locked dimensions after animation
        state.stickyElement.style.width = '';
        state.stickyElement.style.height = '';
      }
      state.isTransitioning = false;
      state.leaveAnimationTimeout = null;
    }, config.animation.duration);

    state.isVisible = false;
    config.onHide?.(isRelocateMode ? config.element : state.stickyElement);
  }

  /**
   * Initializes the intersection observer
   * Can be called multiple times safely (destroys previous observer)
   * @param {HTMLElement|null} [scrollRoot] - Optional scroll container override
   */
  function init(scrollRoot = config.observer.root) {
    // Clean up existing observer if re-initializing
    if (state.isInitialized) {
      destroy();
    }

    state.intersectionObserver = new IntersectionObserver(handleIntersection, {
      root: scrollRoot,
      rootMargin: config.observer.rootMargin,
      threshold: config.observer.threshold,
    });

    state.intersectionObserver.observe(config.sentinel);
    state.isInitialized = true;
  }

  /**
   * Syncs current state to the sticky element (clone mode only)
   * In relocate mode, this is a no-op since the element is the same
   */
  function sync() {
    if (!isRelocateMode && state.stickyElement) {
      config.onSync?.(state.stickyElement);
    }
  }

  /**
   * Destroys and cleans up all resources
   * Safe to call multiple times
   */
  function destroy() {
    clearLeaveAnimation();

    if (state.intersectionObserver) {
      state.intersectionObserver.disconnect();
      state.intersectionObserver = null;
    }

    if (isRelocateMode) {
      // Relocate mode: ensure element is back in original position
      if (state.placeholder && config.element) {
        // Move element back if it's in the sticky wrapper
        if (state.stickyElement?.contains(config.element)) {
          state.placeholder.before(config.element);
        }
        state.placeholder.remove();
        state.placeholder = null;
      }
      if (state.stickyElement) {
        state.stickyElement.remove();
      }
    } else if (state.stickyElement) {
        state.stickyElement.remove();
    }

    state.stickyElement = null;
    state.isVisible = false;
    state.isTransitioning = false;
    state.isInitialized = false;
  }

  return Object.freeze({
    init,
    destroy,
    show,
    hide,
    sync,
    getElement: () => (isRelocateMode ? config.element : state.stickyElement),
    getWrapper: () => state.stickyElement,
    isVisible: () => state.isVisible,
    isInitialized: () => state.isInitialized,
  });
}

