import createBaseRenderer from './createBaseRenderer.js';

export function createGradientsRenderer(options) {
  const { container, data = [], config = {} } = options;
  const base = createBaseRenderer({ ...options, data, config });
  const { getData, setData } = base;

  let displayedCount = Number.isFinite(config.initialLoad)
    ? config.initialLoad
    : 24;
  const loadMoreIncrement = Number.isFinite(config.loadMoreIncrement)
    ? config.loadMoreIncrement
    : 10;
  let doRenderRef = null;
  let renderPending = false;
  let renderInProgress = false;

  function toGradientCss(item) {
    if (typeof item?.gradient === 'string' && item.gradient.trim()) return item.gradient;
    const colors = Array.isArray(item?.colors) ? item.colors.filter(Boolean) : [];
    if (!colors.length) return '';
    return `linear-gradient(90deg, ${colors.join(', ')})`;
  }

  function normalizeGradients(items) {
    return (Array.isArray(items) ? items : [])
      .map((item, index) => ({
        ...item,
        id: item?.id || `gradient-${index + 1}`,
        name: item?.name || `Gradient ${index + 1}`,
        gradient: toGradientCss(item),
      }))
      .filter((item) => item.gradient);
  }

  function setupGradientGridNav(gridEl) {
    let cardCache = [];
    let focusedIdx = 0;
    let gridNavEnabled = true;
    let blurTimer = null;
    const ARROW_KEYS = new Set(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

    function getCols() {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (w >= 1200) return 3;
      if (w >= 600) return 2;
      return 1;
    }

    function getActionBtn(card) {
      return card.querySelector('.gradient-action-btn');
    }

    function initTabIndexes() {
      cardCache = Array.from(gridEl.querySelectorAll('.gradient-card'));
      focusedIdx = Math.min(focusedIdx, Math.max(0, cardCache.length - 1));
      cardCache.forEach((card, i) => {
        card.setAttribute('role', 'gridcell');
        card.setAttribute('tabindex', i === focusedIdx ? '0' : '-1');
        const btn = getActionBtn(card);
        if (btn) btn.setAttribute('tabindex', '-1');
      });
    }

    function moveTo(index) {
      const cards = cardCache;
      if (index < 0 || index >= cards.length) return;
      focusedIdx = index;
      cards.forEach((c, i) => c.setAttribute('tabindex', i === index ? '0' : '-1'));
      cards[index].focus();
    }

    function navigate(key, fromIdx, event) {
      const cards = cardCache;
      const cols = getCols();
      const rows = Math.ceil(cards.length / cols);
      const row = Math.floor(fromIdx / cols);
      const col = fromIdx % cols;
      let next = -1;
      if (key === 'ArrowRight') next = col < cols - 1 ? fromIdx + 1 : -1;
      else if (key === 'ArrowLeft') next = col > 0 ? fromIdx - 1 : -1;
      else if (key === 'ArrowDown') next = row < rows - 1 ? Math.min((row + 1) * cols + col, cards.length - 1) : -1;
      else if (key === 'ArrowUp') next = row > 0 ? (row - 1) * cols + col : -1;
      else if (key === 'Home') next = event?.ctrlKey ? 0 : row * cols;
      else if (key === 'End') next = event?.ctrlKey ? cards.length - 1 : Math.min((row + 1) * cols - 1, cards.length - 1);
      if (next >= 0) moveTo(next);
    }

    gridEl.setAttribute('role', 'grid');

    gridEl.addEventListener('keydown', (e) => {
      const cards = cardCache;
      if (!cards.length) return;

      const isCard = cards.includes(e.target);
      const btn = e.target.classList.contains('gradient-action-btn') ? e.target : null;
      const parentCard = btn ? btn.closest('.gradient-card') : null;
      const cardIdx = (() => {
        if (isCard) return cards.indexOf(e.target);
        if (parentCard) return cards.indexOf(parentCard);
        return -1;
      })();
      if (cardIdx < 0) return;

      if (ARROW_KEYS.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        if (btn) {
          gridNavEnabled = true;
          btn.setAttribute('tabindex', '-1');
        }
        navigate(e.key, cardIdx, e);
        return;
      }

      if ((e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) && isCard && gridNavEnabled) {
        const actionBtn = getActionBtn(e.target);
        if (actionBtn) {
          e.preventDefault();
          gridNavEnabled = false;
          actionBtn.setAttribute('tabindex', '0');
          actionBtn.focus();
        }
        return;
      }

      if (e.key === 'Tab' && btn && parentCard) {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab from button → back to card
          gridNavEnabled = true;
          btn.setAttribute('tabindex', '-1');
          parentCard.focus();
        }
        // Forward Tab with only one button — stay trapped (no-op, focus stays)
        return;
      }

      if (e.key === 'Escape' && btn && parentCard) {
        e.preventDefault();
        gridNavEnabled = true;
        btn.setAttribute('tabindex', '-1');
        parentCard.focus();
      }
    });

    gridEl.addEventListener('focusin', (e) => {
      const idx = cardCache.indexOf(e.target);
      if (idx < 0) return;
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
      focusedIdx = idx;
      gridNavEnabled = true;
      cardCache.forEach((c, i) => c.setAttribute('tabindex', i === idx ? '0' : '-1'));
    });

    gridEl.addEventListener('focusout', () => {
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!gridEl.contains(document.activeElement)) {
          gridNavEnabled = true;
          initTabIndexes();
        }
        blurTimer = null;
      }, 0);
    });

    initTabIndexes();
  }

  function createGradientCard(gradient) {
    const card = document.createElement('div');
    card.className = 'gradient-card';
    card.setAttribute('data-gradient-id', gradient.id);
    card.setAttribute('aria-label', gradient.name);

    const visual = document.createElement('div');
    visual.className = 'gradient-visual';
    visual.style.background = gradient.gradient;
    visual.setAttribute('aria-label', `${gradient.name} visual`);

    const info = document.createElement('div');
    info.className = 'gradient-info';

    const name = document.createElement('p');
    name.className = 'gradient-name';
    name.textContent = gradient.name;

    const actionBtn = document.createElement('button');
    actionBtn.className = 'gradient-action-btn';
    actionBtn.setAttribute('aria-label', 'Open');

    const icon = document.createElement('span');
    icon.className = 'action-icon';
    icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 10.5V15.5C15 16.0523 14.5523 16.5 14 16.5H4.5C3.94772 16.5 3.5 16.0523 3.5 15.5V6C3.5 5.44772 3.94772 5 4.5 5H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.5 3.5H16.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16.5 3.5L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    actionBtn.appendChild(icon);

    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    info.appendChild(name);
    info.appendChild(actionBtn);

    card.appendChild(visual);
    card.appendChild(info);

    return card;
  }

  function createLoadMoreButton() {
    const button = document.createElement('button');
    button.className = 'gradient-load-more-btn';

    const icon = document.createElement('span');
    icon.className = 'load-more-icon';
    icon.textContent = '+';

    const text = document.createElement('span');
    text.textContent = 'Load more';

    button.appendChild(icon);
    button.appendChild(text);

    button.addEventListener('click', () => {
      const maxGradients = normalizeGradients(getData()).length;
      displayedCount = Math.min(displayedCount + loadMoreIncrement, maxGradients);
      if (doRenderRef) doRenderRef();
    });

    return button;
  }

  async function doRender() {
    if (!container) return;
    if (renderInProgress) {
      renderPending = true;
      return;
    }
    renderInProgress = true;
    renderPending = false;

    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'explore-header';

    const title = document.createElement('h2');
    title.className = 'gradients-title';
    title.textContent = 'Color gradients';

    header.appendChild(title);

    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'gradients-grid';

    const gradients = normalizeGradients(getData());
    const gradientList = gradients;
    const maxGradients = gradientList.length;
    const visibleGradients = gradientList.slice(0, displayedCount);
    visibleGradients.forEach((gradient) => {
      const card = createGradientCard(gradient);
      grid.appendChild(card);
    });

    container.appendChild(grid);
    setupGradientGridNav(grid);

    if (displayedCount < maxGradients) {
      const loadMoreBtn = createLoadMoreButton();
      container.appendChild(loadMoreBtn);
    }

    renderInProgress = false;
    if (renderPending) doRender();
  }

  doRenderRef = doRender;

  function update(newData) {
    if (Array.isArray(newData)) setData(newData);
    doRender();
  }

  doRender();

  return {
    ...base,
    render: doRender,
    update,
  };
}

export default createGradientsRenderer;
