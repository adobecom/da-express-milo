import { createTag } from '../../../scripts/utils.js';
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

  function createGradientCard(gradient) {
    if (!gradient || !gradient.id || !gradient.name) {
      const errorCard = createTag('div', { class: 'gradient-card-error' });
      errorCard.textContent = 'Invalid gradient data';
      return errorCard;
    }

    const card = createTag('article', {
      class: 'gradient-card',
      'data-gradient-id': gradient.id,
      tabindex: '0',
      'aria-label': `View ${gradient.name} gradient`,
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleCardActivation(gradient);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.target !== card && e.target.closest('button')) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleCardActivation(gradient);
      }
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

    if (newCount > existingCount) {
      const fragment = document.createDocumentFragment();
      cardsToShow.slice(existingCount).forEach((gradient) => {
        const card = createGradientCard(gradient);
        fragment.appendChild(card);
      });
      gridElement.appendChild(fragment);
    } else if (newCount < existingCount) {
      existingCards.slice(newCount).forEach((card) => card.remove());
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

  function createLoadMoreButton() {
    const container = createTag('div', { class: 'load-more-container' });
    const button = createTag('button', {
      class: 'gradient-load-more-btn',
      type: 'button',
      'aria-label': 'Load more gradients',
    });

    const icon = createTag('span', { class: 'load-more-icon' });
    icon.textContent = '+';

    const text = createTag('span', { class: 'load-more-text' });
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

      gridElement = createTag('div', { class: 'gradients-grid' });
      gradientsSection.appendChild(gridElement);

      liveRegion = createTag('div', {
        class: 'visually-hidden',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        'aria-label': 'Gradient updates',
      });
      gradientsSection.appendChild(liveRegion);

      loadMoreContainer = createLoadMoreButton();
      gradientsSection.appendChild(loadMoreContainer);

      container.appendChild(gradientsSection);

      // Reset displayed count only on initial render
      displayedCount = Math.min(PAGINATION.INITIAL_COUNT, allGradients.length);
    }

    updateTitle();
    updateCards();
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
