import { createTag, getIconElementDeprecated, convertToInlineSVG } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import { createGradientCardElements } from '../../../scripts/color-shared/components/gradients/createGradientCardElements.js';

function getHardcodedGradients() {
  return [
    { id: 'g1', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g2', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g3', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g4', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g5', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g6', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g7', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g8', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g9', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g10', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g11', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g12', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g13', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g14', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g15', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g16', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g17', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g18', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g19', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g20', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g21', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g22', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g23', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g24', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g25', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g26', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g27', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g28', name: 'Eternal Sunshine of the Spotless Mind', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g29', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g30', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g31', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g32', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
    { id: 'g33', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(123, 158, 166, 1) 0%, rgba(208, 236, 242, 1) 25%, rgba(89, 57, 29, 1) 50%, rgba(217, 144, 102, 1) 75%, rgba(243, 72, 34, 1) 100%)' },
    { id: 'g34', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(243, 22, 40, 1) 0%, rgba(33, 115, 165, 1) 25%, rgba(241, 187, 19, 1) 50%, rgba(243, 163, 16, 1) 75%, rgba(166, 4, 2, 1) 100%)' },
    { id: 'g35', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(166, 160, 148, 1) 0%, rgba(191, 186, 180, 1) 25%, rgba(242, 239, 232, 1) 50%, rgba(63, 53, 41, 1) 75%, rgba(139, 126, 109, 1) 100%)' },
    { id: 'g36', name: 'Palette name lorem ipsum', gradient: 'linear-gradient(90deg, rgba(240, 125, 242, 1) 0%, rgba(106, 101, 217, 1) 25%, rgba(0, 3, 38, 1) 50%, rgba(24, 37, 115, 1) 75%, rgba(29, 100, 242, 1) 100%)' },
  ];
}

const PAGINATION = {
  INITIAL_COUNT: 24,
  LOAD_MORE_INCREMENT: 12,
};

export function createGradientsRenderer(options) {
  const { container, data = [], config = {}, modalManager } = options;

  const base = createBaseRenderer(options);
  const { emit, setData } = base;

  let allGradients = [];
  let displayedCount = PAGINATION.INITIAL_COUNT;
  let gridElement = null;
  let gradientsSection = null;
  let liveRegion = null;
  let loadMoreContainer = null;
  let focusedCardIndex = -1;
  let gridNavigationEnabled = true;

  let announcementTimeout = null;
  let blurTimeout = null;
  let resizeTimeout = null;
  let resizeHandler = null;

  const ARROW_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']);
  const NAVIGATION_KEYS = new Set([...ARROW_KEYS, 'Home', 'End', 'PageUp', 'PageDown']);

  function loadGradients() {
    if (data && data.length > 0) {
      allGradients = data.map((gradient) => {
        if (!gradient.gradient && gradient.colorStops && Array.isArray(gradient.colorStops)) {
          const stops = gradient.colorStops.map((stop) => {
            const position = Math.round(stop.position * 100);
            return `${stop.color} ${position}%`;
          }).join(', ');
          const angle = gradient.angle || 90;
          return {
            ...gradient,
            gradient: `linear-gradient(${angle}deg, ${stops})`,
          };
        }
        return gradient;
      });
    } else {
      allGradients = getHardcodedGradients();
    }

    setData(allGradients);
  }

  loadGradients();

  function transformGradientForModal(gradient) {
    if (gradient.colorStops && Array.isArray(gradient.colorStops)) {
      return gradient;
    }

    const gradientStr = gradient.gradient || '';
    const matches = gradientStr.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);

    if (matches) {
      const angle = parseInt(matches[1], 10);
      const stopsStr = matches[2];

      const stopMatches = stopsStr.matchAll(/(rgba?\([^)]+\)|#[0-9A-Fa-f]{3,8})\s+(\d+)%/g);
      const colorStops = [];

      for (const match of stopMatches) {
        colorStops.push({
          color: match[1],
          position: parseInt(match[2], 10) / 100,
        });
      }

      return {
        ...gradient,
        type: 'linear',
        angle,
        colorStops: colorStops.length > 0 ? colorStops : [
          { color: '#000000', position: 0 },
          { color: '#FFFFFF', position: 1 },
        ],
      };
    }

    return {
      ...gradient,
      type: 'linear',
      angle: 90,
      colorStops: [
        { color: '#000000', position: 0 },
        { color: '#FFFFFF', position: 1 },
      ],
    };
  }

  function openGradientModal(gradient) {
    if (!gradient || !modalManager) {
      return;
    }

    try {
      const modalGradient = transformGradientForModal(gradient);

      import('../modal/createGradientModal.js').then(({ createGradientModal }) => {
        try {
          const gradientModal = createGradientModal(modalGradient, {
            onSave: (updatedGradient) => {
              emit('gradient-saved', { gradient: updatedGradient });
            },
            onColorEdit: (color, stopIndex) => {
              emit('color-edit', { color, stopIndex, gradient });
            },
          });

          if (!gradientModal || !gradientModal.element) {
            throw new Error('Failed to create gradient modal');
          }

          modalManager.open({
            type: config.modalType || 'full-screen',
            title: `Edit Gradient: ${gradient.name}`,
            content: gradientModal.element,
            actions: {
              cancelLabel: 'Cancel',
              confirmLabel: 'Save to Library',
              onCancel: () => {},
              onConfirm: () => {
                const updatedGradient = gradientModal.getGradient();
                emit('gradient-save-to-library', { gradient: updatedGradient });
                modalManager.close();
              },
            },
            onClose: () => {
              gradientModal.destroy();
            },
          });
        } catch (error) {
          if (window.lana) {
            window.lana.log(`Gradient modal creation error: ${error.message}`, {
              tags: 'color-explore,modal',
            });
          }
          emit('error', { message: 'Failed to open gradient modal', error });
        }
      }).catch((error) => {
        if (window.lana) {
          window.lana.log(`Gradient modal import error: ${error.message}`, {
            tags: 'color-explore,modal',
          });
        }
        emit('error', { message: 'Failed to open gradient modal', error });
      });
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Gradient modal error: ${error.message}`, {
          tags: 'color-explore,modal',
        });
      }
      emit('error', { message: 'Failed to open gradient modal', error });
    }
  }

  function handleCardActivation(gradient) {
    emit('gradient-click', { gradient });

    if (modalManager) {
      openGradientModal(gradient);
    }
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
          window.lana.log(`Focus failed on Escape: ${error.message}`, { tags: 'color-explore' });
        }
      }
      const gradient = allGradients.find((g) => g.id === gradientId);
      if (gradient) {
        announceToScreenReader(
          `Returned to grid navigation. ${gradient.name}. Use arrow keys to navigate.`,
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

  function handleArrowNavigation(key, currentGradientId, event = null) {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));
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
          window.lana.log(`Focus failed in arrow navigation: ${error.message}`, { tags: 'color-explore' });
        }
        return;
      }

      const gradientId = nextCard.getAttribute('data-gradient-id');
      const gradient = allGradients.find((g) => g.id === gradientId);
      if (gradient) {
        const columns = getGridColumns();
        const gradientIndex = allGradients.findIndex((g) => g.id === gradientId);
        const rowIndex = Math.floor(gradientIndex / columns) + 1;
        const colIndex = (gradientIndex % columns) + 1;
        announceToScreenReader(`Navigated to ${gradient.name}, row ${rowIndex}, column ${colIndex}`, 1000);
      }
    }
  }

  function updateCardTabIndexes() {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));

    if (focusedCardIndex === -1 && cards.length > 0) {
      focusedCardIndex = 0;
    }

    cards.forEach((card, index) => {
      card.setAttribute('tabindex', index === focusedCardIndex ? '0' : '-1');
    });
  }

  function updateCardAriaAttributes() {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));
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

  function updateGridAriaAttributes() {
    if (!gridElement) return;

    const columns = getGridColumns();
    const totalRows = Math.ceil(allGradients.length / columns);

    gridElement.setAttribute('aria-colcount', columns.toString());
    gridElement.setAttribute('aria-rowcount', totalRows.toString());
  }

  const CARD_OPTIONS = {
    onExpandClick: (g) => handleCardActivation(g),
    iconSrc: '/express/code/icons/open-in-20-n.svg',
  };

  function attachCardListeners(card, gradient) {
    const openInBtn = card.querySelector('.gradient-action-btn');
    if (openInBtn) {
      openInBtn.addEventListener('keydown', (e) => {
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
          try { card.focus(); } catch (err) { if (window.lana) window.lana.log(`Focus failed from button: ${err.message}`, { tags: 'color-explore' }); }
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
          try { card.focus(); } catch (err) { if (window.lana) window.lana.log(`Focus failed from button navigation: ${err.message}`, { tags: 'color-explore' }); }
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
          try { card.focus(); } catch (err) { if (window.lana) window.lana.log(`Focus failed on card navigation: ${err.message}`, { tags: 'color-explore' }); }
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
        const firstWidget = card.querySelector('.gradient-action-btn');
        if (firstWidget) {
          try {
            firstWidget.focus();
            announceToScreenReader('Button focused. Press Escape to return to grid navigation, or Tab to exit grid.', 2000);
          } catch (err) { if (window.lana) window.lana.log(`Focus failed on Enter: ${err.message}`, { tags: 'color-explore' }); }
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleCardActivation(gradient);
      } else if (NAVIGATION_KEYS.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        handleArrowNavigation(e.key, gradient.id, e);
      }
    });

    card.addEventListener('focus', () => {
      if (blurTimeout) { clearTimeout(blurTimeout); blurTimeout = null; }
      const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));
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
            ? `Entered gradient grid. ${g.name}, row ${rowIndex}, column ${colIndex} of ${allGradients.length}. Use arrow keys to navigate, Enter to access button, Tab to exit.`
            : `${g.name}, row ${rowIndex}, column ${colIndex}`;
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
      if (!e.target.closest('.gradient-action-btn')) handleCardActivation(gradient);
    });
  }

  function createGradientCard(gradient) {
    if (!gradient || !gradient.id || !gradient.name) {
      const errorCard = createTag('div', { class: 'gradient-card-error' });
      errorCard.textContent = 'Invalid gradient data';
      return errorCard;
    }
    const cards = createGradientCardElements([gradient], CARD_OPTIONS);
    const card = cards[0];
    if (!card) return createTag('div', { class: 'gradient-card-error' });
    card.setAttribute('role', 'gridcell');
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-label', `View ${gradient.name} gradient`);
    attachCardListeners(card, gradient);
    return card;
  }

  function updateCards() {
    if (!gridElement) return;

    const cardsToShow = allGradients.slice(0, displayedCount);
    const existingCards = Array.from(gridElement.querySelectorAll('.gradient-card'));
    const existingCount = existingCards.length;
    const newCount = cardsToShow.length;

    updateGridAriaAttributes();

    if (newCount > existingCount) {
      const fragment = document.createDocumentFragment();
      cardsToShow.slice(existingCount).forEach((gradient) => {
        const card = createGradientCard(gradient);
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
          const newCard = createGradientCard(gradient);
          card.replaceWith(newCard);
        }
      });
    }

    updateCardTabIndexes();
    updateCardAriaAttributes();
  }

  function updateTitle() {
    const title = container?.querySelector('.gradients-title');
    if (title) {
      title.textContent = `${allGradients.length} color gradients`;
    }
  }

  function updateLiveRegion() {
    if (!liveRegion) return;

    const totalCount = allGradients.length;
    const remaining = totalCount - displayedCount;
    liveRegion.textContent = remaining > 0
      ? `Showing ${displayedCount} of ${totalCount} gradients. ${remaining} more available.`
      : `Showing all ${totalCount} gradients`;
  }

  async function createLoadMoreButton() {
    const container = createTag('div', { class: 'load-more-container' });
    const button = createTag('button', {
      class: 'gradient-load-more-btn',
      type: 'button',
      'aria-label': 'Load more gradients',
    });

    const iconImg = getIconElementDeprecated('plus-icon');
    iconImg.classList.add('load-more-icon');
    const icon = await convertToInlineSVG(iconImg);
    const paths = icon.querySelectorAll('path');
    paths.forEach((path) => {
      path.setAttribute('stroke', 'currentColor');
    });

    const text = createTag('span');
    text.textContent = 'Load more';

    button.appendChild(icon);
    button.appendChild(text);

    button.addEventListener('click', () => {
      const remaining = allGradients.length - displayedCount;
      const increment = Math.min(PAGINATION.LOAD_MORE_INCREMENT, remaining);
      displayedCount += increment;
      updateCards();
      updateLiveRegion();
      updateLoadMoreButton();
      emit('load-more', { displayedCount, totalCount: allGradients.length });
    });

    container.appendChild(button);
    return container;
  }

  function updateLoadMoreButton() {
    if (!loadMoreContainer) return;

    const remaining = allGradients.length - displayedCount;
    if (remaining <= 0) {
      loadMoreContainer.style.display = 'none';
    } else {
      loadMoreContainer.style.display = 'flex';
      const button = loadMoreContainer.querySelector('.gradient-load-more-btn');
      if (button) {
        button.setAttribute('aria-label', `Load ${remaining} more gradients`);
      }
    }
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
      container.innerHTML = '';

      gradientsSection = createTag('section', { class: 'gradients-main-section' });

      const header = createTag('div', { class: 'gradients-header' });
      const title = createTag('div', { class: 'gradients-title' });
      title.textContent = `${allGradients.length} color gradients`;

      header.appendChild(title);
      gradientsSection.appendChild(header);

      const columns = getGridColumns();
      const rows = Math.ceil(allGradients.length / columns);
      gridElement = createTag('div', {
        class: 'gradients-grid',
        role: 'grid',
        'aria-label': `Color gradients, ${allGradients.length} gradients available`,
        'aria-roledescription': 'gradient grid',
        'aria-colcount': columns.toString(),
        'aria-rowcount': rows.toString(),
      });
      gradientsSection.appendChild(gridElement);

      liveRegion = createTag('div', {
        class: 'visually-hidden',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        'aria-label': 'Gradient updates',
      });
      gradientsSection.appendChild(liveRegion);

      loadMoreContainer = await createLoadMoreButton();
      gradientsSection.appendChild(loadMoreContainer);

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

      displayedCount = Math.min(PAGINATION.INITIAL_COUNT, allGradients.length);
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
      allGradients = newData;
      setData(allGradients);
      displayedCount = Math.min(PAGINATION.INITIAL_COUNT, allGradients.length);
    }

    render();
  }

  async function refresh() {
    render();
  }

  function destroy() {
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
