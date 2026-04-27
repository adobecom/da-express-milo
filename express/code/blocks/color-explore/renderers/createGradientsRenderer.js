import { createTag } from '../../../scripts/utils.js';
import createBaseRenderer from './createBaseRenderer.js';
import { createGradientStripElements } from '../../../scripts/color-shared/components/gradients/gradient-strip.js';
import { createLoadMoreComponent } from '../../../scripts/color-shared/components/createLoadMoreComponent.js';
import { loadIconsRail } from '../../../scripts/color-shared/spectrum/load-spectrum.js';
import { createExpressTooltip } from '../../../scripts/color-shared/spectrum/components/express-tooltip.js';
import { decorateAnalyticsAttributes, interpolate } from '../../../scripts/color-shared/utils/utilities.js';
import { createLoadingScreenComponent } from '../../../scripts/color-shared/components/createLoadingScreenComponent.js';
import { createColorExplorePlaceholders } from '../../../scripts/color-shared/i18n/loadColorExplorePlaceholders.js';

const PAGINATION = {
  INITIAL_COUNT: 24,
  LOAD_MORE_INCREMENT: 12,
};

export function createGradientsRenderer(options) {
  const {
    container, data = [], config = {}, placeholders = createColorExplorePlaceholders(),
  } = options;

  const base = createBaseRenderer(options);
  const { emit, setData } = base;

  const initialCount = Number.isFinite(config.initialLoad)
    ? Math.max(1, config.initialLoad)
    : PAGINATION.INITIAL_COUNT;
  const loadMoreIncrement = Number.isFinite(config.loadMoreIncrement)
    ? Math.max(1, config.loadMoreIncrement)
    : PAGINATION.LOAD_MORE_INCREMENT;
  const useInternalLoadMore = config.useInternalLoadMore !== false;

  let allGradients = [];
  let displayedCount = initialCount;
  let gridElement = null;
  let gradientsSection = null;

  let liveRegion = null;
  let loadMoreContainer = null;
  let loadMoreComponent = null;
  let focusedCardIndex = -1;
  let gridNavigationEnabled = true;
  let suppressActivationUntil = Number.isFinite(config?.initialActivationSuppressUntil)
    ? Number(config.initialActivationSuppressUntil)
    : 0;

  let announcementTimeout = null;
  let blurTimeout = null;
  let resizeTimeout = null;
  let resizeHandler = null;
  const tooltipControllers = new Map();
  const titleGuardCleanups = new Set();
  let tooltipInitToken = 0;

  const ARROW_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']);
  const NAVIGATION_KEYS = new Set([...ARROW_KEYS, 'Home', 'End', 'PageUp', 'PageDown']);

  const FILTER_CLICK_SUPPRESS_MS = 250;

  function getAnalyticsHeaderText() {
    const titleText = container?.querySelector('.gradients-title')?.textContent?.trim();
    return titleText || placeholders.gridTitle;
  }

  function isActivationSuppressed() {
    return Date.now() < suppressActivationUntil;
  }

  function onFilterInteraction() {
    suppressActivationUntil = Date.now() + FILTER_CLICK_SUPPRESS_MS;
  }

  function normalizeGradient(gradient) {
    if (!gradient || typeof gradient !== 'object') return null;
    if (gradient.gradient) return gradient;
    if (gradient.colorStops && Array.isArray(gradient.colorStops)) {
      const stops = gradient.colorStops.map((stop) => {
        const rawPosition = stop.position ?? 0;
        const normalized = rawPosition > 1 ? rawPosition / 100 : rawPosition;
        const position = Math.round(normalized * 100);
        return `${stop.color} ${position}%`;
      }).join(', ');
      const angle = gradient.angle || 90;
      return {
        ...gradient,
        gradient: `linear-gradient(${angle}deg, ${stops})`,
      };
    }
    if (Array.isArray(gradient.colors) && gradient.colors.length > 0) {
      const angle = gradient.angle || 90;
      const stops = gradient.colors
        .filter(Boolean)
        .map((color, index, arr) => {
          const position = arr.length === 1
            ? 0
            : Math.round((index / (arr.length - 1)) * 100);
          return `${color} ${position}%`;
        })
        .join(', ');
      return {
        ...gradient,
        gradient: `linear-gradient(${angle}deg, ${stops})`,
      };
    }
    return gradient;
  }

  function normalizeGradientList(items) {
    return (Array.isArray(items) ? items : [])
      .map(normalizeGradient)
      .filter(Boolean);
  }

  function destroyTooltipForTarget(targetEl) {
    const controller = tooltipControllers.get(targetEl);
    if (!controller) return;
    controller.destroy?.();
    tooltipControllers.delete(targetEl);
  }

  function ensureTitleGuardForTarget(targetEl) {
    if (!targetEl || targetEl.dataset?.spectrumTooltipTitleGuard === 'true') return;
    const clearNativeTitle = () => targetEl.removeAttribute('title');
    targetEl.addEventListener('mouseenter', clearNativeTitle);
    targetEl.addEventListener('focusin', clearNativeTitle);
    targetEl.dataset.spectrumTooltipTitleGuard = 'true';
    clearNativeTitle();
    titleGuardCleanups.add(() => {
      targetEl.removeEventListener('mouseenter', clearNativeTitle);
      targetEl.removeEventListener('focusin', clearNativeTitle);
      delete targetEl.dataset.spectrumTooltipTitleGuard;
    });
  }

  function clearGridTooltips() {
    titleGuardCleanups.forEach((cleanup) => cleanup?.());
    titleGuardCleanups.clear();
    tooltipControllers.forEach((controller) => controller?.destroy?.());
    tooltipControllers.clear();
  }

  async function initGradientCardTooltips(gridEl, token) {
    const buttons = gridEl?.querySelectorAll?.('.gradient-strip-action-btn[data-tooltip-content]') || [];
    for (const button of buttons) {
      if (token !== tooltipInitToken) return;
      const content = button.getAttribute('data-tooltip-content') || '';
      if (content) {
        destroyTooltipForTarget(button);
        ensureTitleGuardForTarget(button);
        try {
          // eslint-disable-next-line no-await-in-loop
          const tip = await createExpressTooltip({ targetEl: button, content, placement: 'top' });
          if (token !== tooltipInitToken || !button.isConnected || !gridEl?.isConnected) {
            tip?.destroy?.();
            return;
          }
          tooltipControllers.set(button, tip);
        } catch {
          // Non-blocking: card interactions must work even if tooltip setup fails.
        }
      }
    }
  }

  function scheduleGridTooltips(gridEl) {
    tooltipInitToken += 1;
    const token = tooltipInitToken;
    clearGridTooltips();
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        initGradientCardTooltips(gridEl, token).catch(() => {});
      });
      return;
    }
    setTimeout(() => {
      initGradientCardTooltips(gridEl, token).catch(() => {});
    }, 0);
  }

  function loadGradients(sourceData = data) {
    if (Array.isArray(sourceData) && sourceData.length > 0) {
      allGradients = normalizeGradientList(sourceData);
    } else {
      allGradients = [];
    }

    setData(allGradients);
  }

  loadGradients();

  function handleCardActivation(gradient) {
    if (isActivationSuppressed()) {
      return;
    }

    emit('gradient-click', { gradient });
  }

  function announceToScreenReader(message, duration = 1000) {
    if (announcementTimeout) {
      clearTimeout(announcementTimeout);
      announcementTimeout = null;
    }
    if (liveRegion) {
      liveRegion.textContent = message;
      announcementTimeout = setTimeout(() => {
        if (liveRegion) liveRegion.textContent = '';
        announcementTimeout = null;
      }, duration);
    }
  }

  function handleEscapeKey(card, gradientId) {
    if (!gridNavigationEnabled) {
      gridNavigationEnabled = true;
      try {
        card.focus();
      } catch (error) {
        if (window.lana) {
          window.lana.log(`Focus failed on Escape: ${error.message}`, {
            tags: 'color-explore',
            severity: 'warning',
          });
        }
      }
      const gradient = allGradients.find((g) => g.id === gradientId);
      if (gradient) {
        announceToScreenReader(
          interpolate(placeholders.a11yReturnedToGrid, { name: gradient.name }),
          2000,
        );
      }
      return true;
    }
    return false;
  }

  function getGridColumns() {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= 1200) return 3;
    if (width >= 600) return 2;
    return 1;
  }

  function updateCardTabIndexes() {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-strip'));

    if (focusedCardIndex === -1 && cards.length > 0) {
      focusedCardIndex = 0;
    }

    cards.forEach((card, index) => {
      card.setAttribute('tabindex', index === focusedCardIndex ? '0' : '-1');
    });
  }

  function updateCardAriaAttributes() {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-strip'));
    const totalCount = allGradients.length;
    const columns = getGridColumns();

    cards.forEach((card) => {
      const gradientId = card.getAttribute('data-gradient-id');
      const gradientIndex = allGradients.findIndex((g) => g.id === gradientId);
      if (gradientIndex !== -1) {
        const rowIndex = Math.floor(gradientIndex / columns) + 1;
        const colIndex = (gradientIndex % columns) + 1;

        card.setAttribute('aria-posinset', (gradientIndex + 1).toString());
        card.setAttribute('aria-setsize', totalCount.toString());

        card.setAttribute('aria-rowindex', rowIndex.toString());
        card.setAttribute('aria-colindex', colIndex.toString());
      }
    });
  }

  function handleArrowNavigation(key, currentGradientId, event = null) {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-strip'));
    if (cards.length === 0) return;

    const currentIndex = cards.findIndex((card) => card.getAttribute('data-gradient-id') === currentGradientId);
    if (currentIndex === -1) return;

    const columns = getGridColumns();
    const rows = Math.ceil(cards.length / columns);
    const currentRow = Math.floor(currentIndex / columns);
    const currentCol = currentIndex % columns;

    let nextIndex = -1;

    switch (key) {
      case 'ArrowRight':
        if (currentCol < columns - 1) {
          nextIndex = currentIndex + 1;
        } else if (currentRow < rows - 1) {
          nextIndex = (currentRow + 1) * columns;
        }
        break;
      case 'ArrowLeft':
        if (currentCol > 0) {
          nextIndex = currentIndex - 1;
        } else if (currentRow > 0) {
          nextIndex = (currentRow - 1) * columns + (columns - 1);
        }
        break;
      case 'ArrowDown':
        if (currentRow < rows - 1) {
          const nextRowIndex = (currentRow + 1) * columns + currentCol;
          nextIndex = Math.min(nextRowIndex, cards.length - 1);
        }
        break;
      case 'ArrowUp':
        if (currentRow > 0) {
          nextIndex = (currentRow - 1) * columns + currentCol;
        }
        break;
      case 'Home':
        if (event && event.ctrlKey) {
          nextIndex = 0;
        } else {
          nextIndex = currentRow * columns;
        }
        break;
      case 'End':
        if (event && event.ctrlKey) {
          nextIndex = cards.length - 1;
        } else {
          const lastColInRow = Math.min((currentRow + 1) * columns - 1, cards.length - 1);
          nextIndex = lastColInRow;
        }
        break;
      case 'PageDown':
        if (currentRow < rows - 1) {
          const nextRowIndex = Math.min((currentRow + 1) * columns + currentCol, cards.length - 1);
          nextIndex = nextRowIndex;
        }
        break;
      case 'PageUp':
        if (currentRow > 0) {
          const prevRowIndex = Math.max((currentRow - 1) * columns + currentCol, 0);
          nextIndex = prevRowIndex;
        }
        break;
      default:
        break;
    }

    if (nextIndex >= 0 && nextIndex < cards.length) {
      focusedCardIndex = nextIndex;
      updateCardTabIndexes();
      updateCardAriaAttributes();
      const nextCard = cards[nextIndex];
      try {
        nextCard.focus();
      } catch (error) {
        if (window.lana) {
          window.lana.log(`Focus failed in arrow navigation: ${error.message}`, {
            tags: 'color-explore',
            severity: 'warning',
          });
        }
        return;
      }

      const gradientId = nextCard.getAttribute('data-gradient-id');
      const gradient = allGradients.find((g) => g.id === gradientId);
      if (gradient) {
        const numCols = getGridColumns();
        const gradientIndex = allGradients.findIndex((g) => g.id === gradientId);
        const rowIndex = Math.floor(gradientIndex / numCols) + 1;
        const colIndex = (gradientIndex % numCols) + 1;
        const navMsg = interpolate(
          placeholders.a11yNavigatedTo,
          { name: gradient.name, row: rowIndex, col: colIndex },
        );
        announceToScreenReader(navMsg, 1000);
      }
    }
  }

  function updateGridAriaAttributes() {
    if (!gridElement) return;

    const columns = getGridColumns();
    const totalRows = Math.ceil(allGradients.length / columns);

    gridElement.setAttribute('aria-colcount', columns.toString());
    gridElement.setAttribute('aria-rowcount', totalRows.toString());
  }

  function getCardOptions(linkIndex) {
    return {
      onExpandClick: (g) => handleCardActivation(g),
      analytics: linkIndex != null
        ? {
          linkIndex,
          headerText: getAnalyticsHeaderText(),
          linkLabel: 'View details',
        }
        : undefined,
    };
  }

  function attachCardListeners(card, gradient) {
    const openInBtn = card.querySelector('.gradient-strip-action-btn');
    if (openInBtn) {
      openInBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (!gridNavigationEnabled) {
            e.preventDefault();
            e.stopPropagation();
            announceToScreenReader(placeholders.a11yPressEscape, 1200);
          }
          return;
        }
        if (e.key === 'Escape') {
          if (handleEscapeKey(card, gradient.id)) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
        if (!gridNavigationEnabled && NAVIGATION_KEYS.has(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          gridNavigationEnabled = true;
          try {
            card.focus();
          } catch (err) {
            if (window.lana) {
              window.lana.log(`Focus failed from button: ${err.message}`, {
                tags: 'color-explore',
                severity: 'warning',
              });
            }
          }
          handleArrowNavigation(e.key, gradient.id, e);
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleCardActivation(gradient);
        } else if (NAVIGATION_KEYS.has(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          try {
            card.focus();
          } catch (err) {
            if (window.lana) {
              window.lana.log(`Focus failed from button navigation: ${err.message}`, {
                tags: 'color-explore',
                severity: 'warning',
              });
            }
          }
          handleArrowNavigation(e.key, gradient.id, e);
        }
      });
    }

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') return;
      if (e.key === 'Escape') {
        if (handleEscapeKey(card, gradient.id)) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (!gridNavigationEnabled && NAVIGATION_KEYS.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        gridNavigationEnabled = true;
        if (document.activeElement !== card) {
          try {
            card.focus();
          } catch (err) {
            if (window.lana) {
              window.lana.log(`Focus failed on card navigation: ${err.message}`, {
                tags: 'color-explore',
                severity: 'warning',
              });
            }
          }
        }
        handleArrowNavigation(e.key, gradient.id, e);
        return;
      }
      if (e.target !== card && e.target.closest('button')) {
        if (NAVIGATION_KEYS.has(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          handleArrowNavigation(e.key, gradient.id, e);
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        gridNavigationEnabled = false;
        const firstWidget = card.querySelector('.gradient-strip-action-btn');
        if (firstWidget) {
          try {
            firstWidget.focus();
            announceToScreenReader(placeholders.a11yButtonFocused, 2000);
          } catch (err) {
            if (window.lana) {
              window.lana.log(`Focus failed on Enter: ${err.message}`, {
                tags: 'color-explore',
                severity: 'warning',
              });
            }
          }
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        gridNavigationEnabled = false;
        const firstWidget = card.querySelector('.gradient-strip-action-btn');
        if (firstWidget) {
          try {
            firstWidget.focus();
            announceToScreenReader(placeholders.a11yButtonFocused, 2000);
          } catch (err) {
            if (window.lana) {
              window.lana.log(`Focus failed on Space: ${err.message}`, {
                tags: 'color-explore',
                severity: 'warning',
              });
            }
          }
        }
      } else if (NAVIGATION_KEYS.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        handleArrowNavigation(e.key, gradient.id, e);
      }
    });

    card.addEventListener('focus', () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
      const cards = Array.from(gridElement.querySelectorAll('.gradient-strip'));
      const previousIndex = focusedCardIndex;
      focusedCardIndex = cards.indexOf(card);
      updateCardTabIndexes();
      gridNavigationEnabled = true;
      if (previousIndex === -1 || previousIndex !== focusedCardIndex) {
        const gradientId = card.getAttribute('data-gradient-id');
        const g = allGradients.find((item) => item.id === gradientId);
        if (g) {
          const columns = getGridColumns();
          const gradientIndex = allGradients.findIndex((item) => item.id === gradientId);
          const rowIndex = Math.floor(gradientIndex / columns) + 1;
          const colIndex = (gradientIndex % columns) + 1;
          const announcement = previousIndex === -1
            ? interpolate(placeholders.a11yEnteredGrid, {
              name: g.name, row: rowIndex, col: colIndex, total: allGradients.length,
            })
            : interpolate(placeholders.a11yCardPosition, {
              name: g.name, row: rowIndex, col: colIndex,
            });
          announceToScreenReader(announcement, previousIndex === -1 ? 3000 : 1000);
        }
      }
    });

    card.addEventListener('blur', () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => {
        if (!gridElement || !gridElement.contains(document.activeElement)) {
          focusedCardIndex = -1;
          updateCardTabIndexes();
        }
        blurTimeout = null;
      }, 0);
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.gradient-strip-action-btn')) return;
      handleCardActivation(gradient);
    });
  }

  function createGradientCard(gradient, linkIndex) {
    if (!gradient || !gradient.id || !gradient.name) {
      const errorCard = createTag('div', { class: 'gradient-strip-error' });
      errorCard.textContent = placeholders.gridInvalidData;
      return errorCard;
    }
    const cards = createGradientStripElements([gradient], getCardOptions(linkIndex));
    const card = cards[0];
    if (!card) return createTag('div', { class: 'gradient-strip-error' });
    card.setAttribute('role', 'gridcell');
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-label', interpolate(placeholders.gridCardAria, { name: gradient.name }));
    decorateAnalyticsAttributes(card, { linkLabel: 'View gradient' });
    attachCardListeners(card, gradient);
    return card;
  }

  function updateCards() {
    if (!gridElement) return;

    const cardsToShow = allGradients.slice(0, displayedCount);
    const existingCards = Array.from(gridElement.querySelectorAll('.gradient-strip'));
    const existingCount = existingCards.length;
    const newCount = cardsToShow.length;

    updateGridAriaAttributes();

    if (newCount > existingCount) {
      const fragment = document.createDocumentFragment();
      cardsToShow.slice(existingCount).forEach((gradient, i) => {
        const linkIndex = existingCount + i + 1;
        const card = createGradientCard(gradient, linkIndex);
        fragment.appendChild(card);
      });
      gridElement.appendChild(fragment);
    } else if (newCount < existingCount) {
      existingCards.slice(newCount).forEach((card) => card.remove());
      if (focusedCardIndex >= newCount) {
        focusedCardIndex = Math.max(0, newCount - 1);
        updateCardTabIndexes();
        updateCardAriaAttributes();
      }
    }

    if (existingCount !== newCount) {
      existingCards.slice(0, Math.min(existingCount, newCount)).forEach((card, index) => {
        const gradient = cardsToShow[index];
        if (gradient && card.getAttribute('data-gradient-id') !== gradient.id) {
          const newCard = createGradientCard(gradient, index + 1);
          card.replaceWith(newCard);
        }
      });
    }

    updateCardTabIndexes();
    updateCardAriaAttributes();
    scheduleGridTooltips(gridElement);
  }

  function updateTitle() {
    const title = container?.querySelector('.gradients-title');
    if (title) {
      title.textContent = placeholders.gridTitle;
    }
  }

  function updateLiveRegion() {
    if (!liveRegion) return;

    const totalCount = allGradients.length;
    const remaining = totalCount - displayedCount;
    liveRegion.textContent = remaining > 0
      ? interpolate(placeholders.gridShowingPartial, {
        displayed: displayedCount, total: totalCount, remaining,
      })
      : interpolate(placeholders.gridShowingAll, { total: totalCount });
  }

  function updateLoadMoreButton() {
    if (!useInternalLoadMore || !loadMoreContainer || !loadMoreComponent) return;

    const remaining = allGradients.length - displayedCount;
    loadMoreComponent.updateRemaining(Math.max(0, remaining));
    if (remaining > 0) loadMoreContainer.style.display = 'flex';
  }

  function createLoadMoreButton() {
    loadMoreComponent = createLoadMoreComponent({
      remaining: Math.max(0, allGradients.length - displayedCount),
      label: placeholders.loadMore,
      buttonClass: 'gradient-load-more-btn',
      onLoadMore: async () => {
        const remaining = allGradients.length - displayedCount;
        const increment = Math.min(loadMoreIncrement, remaining);
        displayedCount += increment;
        updateCards();
        updateLiveRegion();
        updateLoadMoreButton();
        emit('load-more', { displayedCount, totalCount: allGradients.length });
      },
    });
    return loadMoreComponent.element;
  }

  async function render() {
    if (!container) {
      return;
    }

    if (allGradients.length === 0) {
      loadGradients();
    }

    const isInitialRender = !gradientsSection;

    if (isInitialRender) {
      container.addEventListener('color-explore:filter-interaction', onFilterInteraction);
      container.replaceChildren();

      gradientsSection = createTag('section', { class: 'explore-main-section' });
      const loadingScreen = createLoadingScreenComponent({ variant: 'strips', cardCount: 6 });
      gradientsSection.appendChild(loadingScreen.element);
      loadingScreen.show();
      container.appendChild(gradientsSection);

      await loadIconsRail();

      const header = createTag('div', { class: 'explore-header' });
      const title = createTag('h2', { class: 'gradients-title' });
      title.textContent = placeholders.gridTitle;
      header.appendChild(title);
      container.insertBefore(header, gradientsSection);

      gradientsSection.replaceChildren();

      const columns = getGridColumns();
      const rows = Math.ceil(allGradients.length / columns);
      gridElement = createTag('div', {
        class: 'gradients-grid',
        role: 'grid',
        'aria-label': interpolate(placeholders.gridAria, { count: allGradients.length }),
        'aria-roledescription': placeholders.gridRoleDesc,
        'aria-colcount': columns.toString(),
        'aria-rowcount': rows.toString(),
      });
      gradientsSection.appendChild(gridElement);

      liveRegion = createTag('div', {
        class: 'visually-hidden',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        'aria-label': placeholders.gridLiveRegion,
      });
      gradientsSection.appendChild(liveRegion);

      loadMoreContainer = createLoadMoreButton();
      if (useInternalLoadMore) {
        gradientsSection.appendChild(loadMoreContainer);
      }

      container.appendChild(gradientsSection);

      resizeHandler = () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
          if (gridElement) {
            updateGridAriaAttributes();
            updateCardAriaAttributes();
          }
          resizeTimeout = null;
        }, 150);
      };
      window.addEventListener('resize', resizeHandler);

      displayedCount = Math.min(initialCount, allGradients.length);
    }

    updateTitle();
    updateCards();
    updateCardAriaAttributes();
    updateGridAriaAttributes();
    updateLiveRegion();
    updateLoadMoreButton();
  }

  async function update(newData) {
    if (newData && Array.isArray(newData)) {
      loadGradients(newData);
      displayedCount = Math.min(initialCount, allGradients.length);
    }

    await render();
  }

  async function refresh() {
    await render();
  }

  function destroy() {
    container?.removeEventListener?.('color-explore:filter-interaction', onFilterInteraction);
    tooltipInitToken += 1;
    clearGridTooltips();

    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }

    if (announcementTimeout) {
      clearTimeout(announcementTimeout);
      announcementTimeout = null;
    }
    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }

    gridElement = null;
    gradientsSection = null;
    liveRegion = null;
    loadMoreContainer = null;
    loadMoreComponent = null;
  }

  return {
    ...base,
    render,
    update,
    refresh,
    destroy,

    getAllGradients: () => allGradients,
    getMaxGradients: () => allGradients.length,
  };
}

export default createGradientsRenderer;
