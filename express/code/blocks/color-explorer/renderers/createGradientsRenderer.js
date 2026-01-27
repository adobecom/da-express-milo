import { createTag, getIconElementDeprecated, convertToInlineSVG } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';

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
  let gridNavigationEnabled = true; // Track if grid navigation is active (disabled when Enter is pressed inside a cell)

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

  // Load gradients immediately
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
              tags: 'color-explorer,modal',
            });
          }
          emit('error', { message: 'Failed to open gradient modal', error });
        }
      }).catch((error) => {
        if (window.lana) {
          window.lana.log(`Gradient modal import error: ${error.message}`, {
            tags: 'color-explorer,modal',
          });
        }
        emit('error', { message: 'Failed to open gradient modal', error });
      });
    } catch (error) {
      if (window.lana) {
        window.lana.log(`Gradient modal error: ${error.message}`, {
          tags: 'color-explorer,modal',
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

  /**
   * Grid Navigation Behavior
   * 
   * This implementation follows ARIA grid best practices for keyboard navigation:
   * 
   * Navigation Keys:
   * - Arrow keys (↑↓←→) - Navigate between grid cells
   * - Home/End - Jump to first/last item in row (Ctrl+Home/End for first/last overall)
   * - PageUp/PageDown - Navigate by rows
   * - Tab/Shift+Tab - Exit the grid (moves to next/previous focusable element on the page)
   * - Enter - Disables grid navigation, focuses first widget in cell (action button)
   * - Escape - Restores grid navigation when inside a cell widget
   * 
   * Focus Management:
   * - Only one card has tabindex="0" at a time (the focused card)
   * - All other cards have tabindex="-1"
   * - First Tab entry focuses the first grid item
   * - Arrow keys are the primary navigation method within the grid
   * - Tab is not prevented, so it naturally exits the grid
   * 
   * Grid Navigation States:
   * - gridNavigationEnabled = true: Arrow keys navigate between cells
   * - gridNavigationEnabled = false: Arrow keys navigate within cell widgets (after Enter)
   */

  function getGridColumns() {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width >= 1200) return 3;
    if (width >= 768) return 2;
    return 1;
  }

  function handleArrowNavigation(key, currentGradientId, event = null) {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));
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
        // Jump to first item in current row, or first item overall if Ctrl+Home
        if (event && event.ctrlKey) {
          nextIndex = 0;
        } else {
          nextIndex = currentRow * columns;
        }
        break;
      case 'End':
        // Jump to last item in current row, or last item overall if Ctrl+End
        if (event && event.ctrlKey) {
          nextIndex = cards.length - 1;
        } else {
          const lastColInRow = Math.min((currentRow + 1) * columns - 1, cards.length - 1);
          nextIndex = lastColInRow;
        }
        break;
      case 'PageDown':
        // Jump down by one page (one full row)
        if (currentRow < rows - 1) {
          const nextRowIndex = Math.min((currentRow + 1) * columns + currentCol, cards.length - 1);
          nextIndex = nextRowIndex;
        }
        break;
      case 'PageUp':
        // Jump up by one page (one full row)
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
      nextCard.focus();
      
      // Announce navigation to screen readers
      if (liveRegion) {
        const gradientId = nextCard.getAttribute('data-gradient-id');
        const gradient = allGradients.find((g) => g.id === gradientId);
        if (gradient) {
          const columns = getGridColumns();
          const gradientIndex = allGradients.findIndex((g) => g.id === gradientId);
          const rowIndex = Math.floor(gradientIndex / columns) + 1;
          const colIndex = (gradientIndex % columns) + 1;
          liveRegion.textContent = `Navigated to ${gradient.name}, row ${rowIndex}, column ${colIndex}`;
          // Clear announcement after a delay
          setTimeout(() => {
            if (liveRegion) liveRegion.textContent = '';
          }, 1000);
        }
      }
    }
  }

  function updateCardTabIndexes() {
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));
    
    // If no card is focused yet, set first card as focusable (for initial Tab entry)
    if (focusedCardIndex === -1 && cards.length > 0) {
      focusedCardIndex = 0;
    }
    
    cards.forEach((card, index) => {
      // Only one card is focusable at a time (tabindex="0")
      // Arrow keys navigate between cells, Tab enters/exits the grid
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
        // Calculate row and column position (1-indexed for ARIA)
        const rowIndex = Math.floor(gradientIndex / columns) + 1;
        const colIndex = (gradientIndex % columns) + 1;
        
        // Set position in set (for screen reader announcements)
        card.setAttribute('aria-posinset', (gradientIndex + 1).toString());
        card.setAttribute('aria-setsize', totalCount.toString());
        
        // Set grid position (helps screen readers understand grid structure)
        card.setAttribute('aria-rowindex', rowIndex.toString());
        card.setAttribute('aria-colindex', colIndex.toString());
      }
    });
  }

  function updateGridAriaAttributes() {
    if (!gridElement) return;

    const columns = getGridColumns();
    // Use allGradients.length for accurate total row count (not just displayed cards)
    const totalRows = Math.ceil(allGradients.length / columns);

    gridElement.setAttribute('aria-colcount', columns.toString());
    gridElement.setAttribute('aria-rowcount', totalRows.toString());
  }

  function createGradientCard(gradient) {
    if (!gradient || !gradient.id || !gradient.name) {
      const errorCard = createTag('div', { class: 'gradient-card-error' });
      errorCard.textContent = 'Invalid gradient data';
      return errorCard;
    }

    const card = createTag('article', {
      class: 'gradient-card',
      'data-gradient-id': gradient.id,
      role: 'gridcell',
      tabindex: '-1',
      'aria-label': `View ${gradient.name} gradient`,
      // aria-posinset, aria-setsize, aria-rowindex, aria-colindex will be set by updateCardAriaAttributes()
    });

    const gradientVisual = createTag('div', { class: 'gradient-visual' });
    gradientVisual.setAttribute('aria-label', `${gradient.name} gradient visual`);

    if (gradient.gradient) {
      gradientVisual.style.backgroundImage = gradient.gradient;
    } else if (gradient.colorStops && Array.isArray(gradient.colorStops)) {
      const stops = gradient.colorStops.map((stop) => {
        const position = Math.round(stop.position * 100);
        return `${stop.color} ${position}%`;
      }).join(', ');
      const angle = gradient.angle || 90;
      gradientVisual.style.backgroundImage = `linear-gradient(${angle}deg, ${stops})`;
    }

    const info = createTag('div', { class: 'gradient-info' });

    const name = createTag('p', { class: 'gradient-name' });
    name.textContent = gradient.name;

    const actions = createTag('div', { class: 'gradient-actions' });

    const openInBtn = createTag('button', {
      class: 'gradient-action-btn',
      type: 'button',
      'aria-label': `Open ${gradient.name} in modal`,
      tabindex: '-1', // Not in Tab sequence - only focusable via Enter key or programmatically
    });

    const openInIconWrapper = createTag('div', { class: 'action-icon-wrapper' });
    const openInIconImg = createTag('img', {
      src: '/express/code/icons/open-in-20-n.svg',
      alt: 'Open in modal',
      width: '20',
      height: '20',
      'aria-hidden': 'true',
      class: 'action-icon',
    });
    openInIconWrapper.appendChild(openInIconImg);
    openInBtn.appendChild(openInIconWrapper);

    openInBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCardActivation(gradient);
    });

    openInBtn.addEventListener('keydown', (e) => {
      // Tab and Shift+Tab: Exit the grid (don't prevent, allow natural Tab navigation)
      if (e.key === 'Tab') {
        // Tab exits the grid naturally - don't prevent default
        return;
      }

      // Handle Escape: restore grid navigation
      if (e.key === 'Escape') {
        if (!gridNavigationEnabled) {
          e.preventDefault();
          e.stopPropagation();
          gridNavigationEnabled = true;
          card.focus(); // Return focus to the card
          return;
        }
      }

      // If grid navigation is disabled (button is focused), arrow keys restore grid navigation
      // and navigate to next/previous card
      if (!gridNavigationEnabled) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
          // Restore grid navigation and navigate to next/previous card
          e.preventDefault();
          e.stopPropagation();
          gridNavigationEnabled = true;
          // Focus back to card first, then navigate
          card.focus();
          handleArrowNavigation(e.key, gradient.id, e);
          return;
        }
        // Enter/Space activate the button
        // Tab exits grid (handled above)
        return;
      }

      // Grid navigation is enabled
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleCardActivation(gradient);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
        // Allow navigation keys to move between grid cells even when focus is on button
        e.preventDefault();
        e.stopPropagation();
        // Focus back to card first, then navigate with arrow keys
        card.focus();
        handleArrowNavigation(e.key, gradient.id, e);
      }
    });

    card.addEventListener('keydown', (e) => {
      // Tab and Shift+Tab: Exit the grid (don't prevent, allow natural Tab navigation)
      if (e.key === 'Tab') {
        // Tab exits the grid naturally - don't prevent default
        // When Tab leaves, reset focusedCardIndex so next Tab entry focuses first card
        return;
      }

      // Handle Escape: restore grid navigation
      if (e.key === 'Escape') {
        if (!gridNavigationEnabled) {
          e.preventDefault();
          e.stopPropagation();
          gridNavigationEnabled = true;
          card.focus(); // Return focus to the card
          return;
        }
      }

      // If grid navigation is disabled (button is focused), arrow keys restore grid navigation
      // and navigate to next/previous card
      if (!gridNavigationEnabled) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
          // Restore grid navigation and navigate to next/previous card
          e.preventDefault();
          e.stopPropagation();
          gridNavigationEnabled = true;
          // Ensure card is focused, then navigate
          if (document.activeElement !== card) {
            card.focus();
          }
          handleArrowNavigation(e.key, gradient.id, e);
          return;
        }
        return;
      }

      // Grid navigation is enabled - arrow keys navigate between grid cells
      if (e.target !== card && e.target.closest('button')) {
        // If focus is on button, only handle navigation keys (let button handle Enter/Space)
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
          e.preventDefault();
          e.stopPropagation();
          handleArrowNavigation(e.key, gradient.id, e);
        }
        return;
      }

      if (e.key === 'Enter') {
        // Enter: Disable grid navigation and focus first widget inside cell
        // Button has tabindex="-1" so it's not in Tab sequence, but can be focused programmatically
        e.preventDefault();
        e.stopPropagation();
        gridNavigationEnabled = false;
        const firstWidget = card.querySelector('.gradient-action-btn');
        if (firstWidget) {
          firstWidget.focus();
        }
      } else if (e.key === ' ') {
        // Space: Activate the card (open modal)
        e.preventDefault();
        e.stopPropagation();
        handleCardActivation(gradient);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        e.stopPropagation();
        handleArrowNavigation(e.key, gradient.id, e);
      }
    });

    card.addEventListener('focus', () => {
      const cards = Array.from(gridElement.querySelectorAll('.gradient-card'));
      focusedCardIndex = cards.indexOf(card);
      updateCardTabIndexes();
      // Reset grid navigation when focus moves to a new card
      gridNavigationEnabled = true;
    });

    card.addEventListener('blur', () => {
      // When focus leaves a card, reset focusedCardIndex so next Tab entry focuses first card
      // Only reset if focus is leaving the entire grid (not moving to another card)
      setTimeout(() => {
        if (!gridElement || !gridElement.contains(document.activeElement)) {
          // Focus has left the grid entirely
          focusedCardIndex = -1;
          updateCardTabIndexes();
        }
      }, 0);
    });

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.gradient-action-btn')) {
        handleCardActivation(gradient);
      }
    });

    actions.appendChild(openInBtn);
    info.appendChild(name);
    info.appendChild(actions);

    card.appendChild(gradientVisual);
    card.appendChild(info);

    return card;
  }

  function updateCards() {
    if (!gridElement) return;

    const cardsToShow = allGradients.slice(0, displayedCount);
    const existingCards = Array.from(gridElement.querySelectorAll('.gradient-card'));
    const existingCount = existingCards.length;
    const newCount = cardsToShow.length;

    // Update grid ARIA attributes when cards change
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
      // Reset focus if focused card was removed
      if (focusedCardIndex >= newCount) {
        focusedCardIndex = Math.max(0, newCount - 1);
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

    // Update tabindexes and ARIA attributes after cards are updated
    // Note: focusedCardIndex will be set to 0 in updateCardTabIndexes() if it's -1
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

    // Ensure gradients are loaded
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

      // Reset displayed count only on initial render
      displayedCount = Math.min(PAGINATION.INITIAL_COUNT, allGradients.length);

      // Handle window resize to update grid columns
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (gridElement) {
            updateGridAriaAttributes();
            updateCardAriaAttributes();
          }
        }, 150);
      };
      window.addEventListener('resize', handleResize);
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

  return {
    ...base,
    render,
    update,
    refresh,

    getAllGradients: () => allGradients,
    getMaxGradients: () => allGradients.length,
  };
}
