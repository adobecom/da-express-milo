import { createTag, getLibs } from '../../utils.js';

const DEFAULT_CARD_COUNT = 6;
const LANA_TAGS = 'color-explore,loading-screen';
let stylesLoadPromise = null;

export function loadLoadingScreenStyles() {
  if (stylesLoadPromise) return stylesLoadPromise;
  stylesLoadPromise = import(`${getLibs()}/utils/utils.js`)
    .then(({ loadStyle, getConfig }) => {
      const codeRoot = getConfig?.()?.codeRoot || '/express/code';
      return loadStyle(`${codeRoot}/scripts/color-shared/components/createLoadingScreenComponent.css`);
    })
    .catch((error) => {
      stylesLoadPromise = null;
      window.lana?.log(`Failed to load loading screen styles: ${error?.message}`, {
        tags: LANA_TAGS,
        severity: 'error',
      });
      return null;
    });

  return stylesLoadPromise;
}

function createCard() {
  const card = createTag('div', { class: 'ax-color-loading-card' });
  const visual = createTag('div', { class: 'ax-color-loading-shimmer ax-color-loading-card__visual' });
  const meta = createTag('div', { class: 'ax-color-loading-card__meta' });
  const text = createTag('div', { class: 'ax-color-loading-shimmer ax-color-loading-card__text' });
  const icon = createTag('div', { class: 'ax-color-loading-shimmer ax-color-loading-card__icon' });

  meta.append(text, icon);
  card.append(visual, meta);
  return card;
}

export function createLoadingScreenComponent(options = {}) {
  const {
    variant = 'gradients',
    cardCount = DEFAULT_CARD_COUNT,
  } = options;
  const isGradientsVariant = variant === 'gradients';

  const root = createTag('div', {
    class: 'ax-color-loading',
    'aria-hidden': 'true',
    role: 'presentation',
  });
  const grid = createTag('div', {
    class: [
      'ax-color-loading__grid',
      isGradientsVariant ? 'gradients-grid' : 'palettes-grid',
    ].join(' '),
  });

  loadLoadingScreenStyles();

  root.style.display = 'none';
  root.setAttribute('hidden', '');

  root.appendChild(grid);

  const setVariant = (nextVariant) => {
    root.setAttribute('data-variant', nextVariant || variant);
  };

  const setCardCount = (nextCount) => {
    grid.innerHTML = '';
    const count = Number.isFinite(nextCount) && nextCount > 0 ? nextCount : DEFAULT_CARD_COUNT;
    for (let i = 0; i < count; i += 1) {
      grid.appendChild(createCard());
    }
  };

  setVariant(variant);
  setCardCount(cardCount);

  return {
    element: root,
    setVariant,
    setCardCount,
    async show() {
      await loadLoadingScreenStyles();
      root.dataset.loadingVisible = 'true';
      root.setAttribute('aria-hidden', 'true');
      root.style.display = 'block';
      root.removeAttribute('hidden');
    },
    hide() {
      root.dataset.loadingVisible = 'false';
      root.setAttribute('aria-hidden', 'true');
      root.style.display = 'none';
      root.setAttribute('hidden', '');
    },
  };
}

export default createLoadingScreenComponent;
