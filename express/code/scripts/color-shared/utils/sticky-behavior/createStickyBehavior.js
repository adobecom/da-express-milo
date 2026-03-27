import DEFAULT_CONFIG from './constants.js';
import validateOptions from './validation.js';
import { mergeConfig, createDefaultWrapper } from './helpers.js';

function createStickyBehavior(options) {
  validateOptions(options);
  const config = mergeConfig(DEFAULT_CONFIG, options);
  const isRelocateMode = config.element instanceof HTMLElement;

  const state = {
    isVisible: false,
    isTransitioning: false,
    isInitialized: false,
    stickyElement: null,
    placeholder: null,
    originalParent: null,
    originalNextSibling: null,
    intersectionObserver: null,
    leaveAnimationTimeout: null,
    sentinelInView: true,
    boundaryElement: null,
    boundaryScrollHandler: null,
  };

  function clearLeaveAnimation() {
    if (state.leaveAnimationTimeout) {
      clearTimeout(state.leaveAnimationTimeout);
      state.leaveAnimationTimeout = null;
      state.isTransitioning = false;
    }
  }

  function resolveContainer() {
    return typeof config.appendTo === 'function'
      ? config.appendTo()
      : config.appendTo;
  }

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

  function ensureWrapper() {
    if (state.stickyElement) return state.stickyElement;

    state.originalParent = config.element.parentNode;
    state.originalNextSibling = config.element.nextSibling;

    state.placeholder = document.createElement('div');
    state.placeholder.className = 'sticky-placeholder';
    state.placeholder.setAttribute('aria-hidden', 'true');
    state.placeholder.style.cssText = 'display: none;';

    config.element.after(state.placeholder);

    state.stickyElement = config.createWrapper
      ? config.createWrapper()
      : createDefaultWrapper();

    if (!state.stickyElement || !(state.stickyElement instanceof HTMLElement)) {
      throw new Error('stickyBehavior: createWrapper must return an HTMLElement');
    }

    state.stickyElement.classList.add(config.stickyClass);

    const container = resolveContainer();
    container.appendChild(state.stickyElement);

    return state.stickyElement;
  }

  function relocateToSticky() {
    if (!isRelocateMode || !state.stickyElement) return;

    state.placeholder.style.display = 'block';
    state.stickyElement.appendChild(config.element);
  }

  function relocateToOriginal() {
    if (!isRelocateMode || !state.placeholder) return;

    config.element.classList.add('is-returning');
    state.placeholder.before(config.element);
    state.placeholder.style.display = 'none';
    setTimeout(() => {
      config.element?.classList.remove('is-returning');
    }, config.animation.duration);
  }

  function ensureStickyElement() {
    return isRelocateMode ? ensureWrapper() : ensureClone();
  }

  function hide() {
    if (!state.stickyElement || !state.isVisible || state.isTransitioning) return;

    clearLeaveAnimation();

    state.isTransitioning = true;
    state.stickyElement.classList.add(config.animation.leavingClass);

    if (isRelocateMode) {
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
        state.stickyElement.style.width = '';
        state.stickyElement.style.height = '';
      }
      state.isTransitioning = false;
      state.leaveAnimationTimeout = null;
    }, config.animation.duration);

    state.isVisible = false;
    config.onHide?.(isRelocateMode ? config.element : state.stickyElement);
  }

  function show() {
    if (state.isVisible || state.isTransitioning) return;

    clearLeaveAnimation();

    const stickyEl = ensureStickyElement();

    if (!isRelocateMode) {
      config.onSync?.(stickyEl);
    }

    if (isRelocateMode) {
      relocateToSticky();
    }

    stickyEl.classList.remove(config.animation.leavingClass);
    stickyEl.classList.add(config.animation.visibleClass);

    state.isVisible = true;
    config.onShow?.(isRelocateMode ? config.element : stickyEl);
  }

  function isBoundaryInView() {
    if (!state.boundaryElement) {
      console.log('[sticky] boundary element is null, returning true');
      return true;
    }
    const rect = state.boundaryElement.getBoundingClientRect();
    const inView = rect.bottom > 0;
    console.log('[sticky] boundary rect.bottom:', rect.bottom, 'inView:', inView);
    return inView;
  }

  function updateVisibility() {
    const boundaryInView = isBoundaryInView();
    console.log('[sticky] sentinelInView:', state.sentinelInView, 'boundaryInView:', boundaryInView);
    if (!state.sentinelInView && boundaryInView) {
      show();
    } else {
      hide();
    }
  }

  function handleIntersection(entries) {
    entries.forEach((entry) => {
      state.sentinelInView = entry.isIntersecting;
    });
    updateVisibility();
  }

  function resolveBoundary() {
    return typeof config.boundaryElement === 'function'
      ? config.boundaryElement()
      : config.boundaryElement;
  }

  function onScroll() {
    updateVisibility();
  }

  function initBoundaryScroll() {
    if (!config.boundaryElement) {
      console.log('[sticky] no config.boundaryElement, skipping boundary');
      return;
    }

    state.boundaryElement = resolveBoundary();
    console.log('[sticky] resolved boundary:', state.boundaryElement);

    if (!(state.boundaryElement instanceof HTMLElement)) {
      state.boundaryElement = null;
      const poll = setInterval(() => {
        const el = resolveBoundary();
        if (el instanceof HTMLElement) {
          clearInterval(poll);
          state.boundaryElement = el;
          state.boundaryScrollHandler = onScroll;
          window.addEventListener('scroll', state.boundaryScrollHandler, { passive: true });
          updateVisibility();
        }
      }, 200);
      return;
    }

    state.boundaryScrollHandler = onScroll;
    window.addEventListener('scroll', state.boundaryScrollHandler, { passive: true });
  }

  function destroy() {
    clearLeaveAnimation();

    if (state.intersectionObserver) {
      state.intersectionObserver.disconnect();
      state.intersectionObserver = null;
    }

    if (state.boundaryScrollHandler) {
      window.removeEventListener('scroll', state.boundaryScrollHandler);
      state.boundaryScrollHandler = null;
    }

    if (isRelocateMode) {
      if (state.placeholder && config.element) {
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
    state.boundaryElement = null;
    state.isVisible = false;
    state.isTransitioning = false;
    state.isInitialized = false;
  }

  function init(scrollRoot = config.observer.root) {
    if (state.isInitialized) {
      destroy();
    }

    state.intersectionObserver = new IntersectionObserver(handleIntersection, {
      root: scrollRoot,
      rootMargin: config.observer.rootMargin,
      threshold: config.observer.threshold,
    });

    state.intersectionObserver.observe(config.sentinel);

    initBoundaryScroll();

    state.isInitialized = true;
  }

  function sync() {
    if (!isRelocateMode && state.stickyElement) {
      config.onSync?.(state.stickyElement);
    }
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

export default createStickyBehavior;
