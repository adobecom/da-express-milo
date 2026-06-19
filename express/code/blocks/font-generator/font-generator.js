import { getLibs } from '../../scripts/utils.js';
import { createSidePanel } from './side-panel/output/side-panel.js';
import { createFilterPanel } from './side-panel/output/filter-panel.js';
import { getState, setState, subscribe } from './state.js';

const CATEGORY_STYLES = { all: 'bold-script', glitch: 'strikethrough', 'symbol': 'weights' };

let filterPanelCount = 0;

// Reads the side-panel copy from the authored block. The first paragraph holds
// comma-separated preview suggestions; the link is the promo CTA; the remaining
// paragraph is the promo title. Order-independent so authoring stays forgiving.
function extractContent(block) {
  const paragraphs = [...block.querySelectorAll('p')];
  const ctaLink = block.querySelector('a');
  const ctaParagraph = ctaLink?.closest('p');
  const suggestionsParagraph = paragraphs[0];
  const promoTitleParagraph = paragraphs.find(
    (p) => p !== suggestionsParagraph && p !== ctaParagraph,
  );

  return {
    suggestions: (suggestionsParagraph?.textContent ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    promoTitle: promoTitleParagraph?.textContent.trim() ?? '',
    promoCta: ctaLink
      ? { text: ctaLink.textContent.trim(), href: ctaLink.href }
      : null,
  };
}

async function getPlaceholder(key) {
  const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { replaceKey } = await import(`${getLibs()}/features/placeholders.js`);
  return replaceKey(key, getConfig());
}

// Async-enhances the trigger label from placeholders so it stays translatable;
// keeps the authored fallback if the 'filter' placeholder is not defined.
async function localizeFilterTrigger(button) {
  try {
    const label = await getPlaceholder('filter');
    if (label) {
      button.textContent = label;
      button.setAttribute('aria-label', label);
    }
  } catch (e) {
    // Placeholder lookup unavailable — keep the fallback label.
  }
}

// The drawer close button is icon-only; localize its accessible name, keeping
// the 'Close' fallback if the placeholder is undefined.
async function localizeCloseButton(button) {
  try {
    const label = await getPlaceholder('close');
    if (label) button.setAttribute('aria-label', label);
  } catch (e) {
    // Placeholder lookup unavailable — keep the fallback label.
  }
}

// The Filter trigger lives outside the side-panel component. It toggles the
// shared filter panel through state (state.filtersOpen); the panel subscribes
// to that flag for its open/closed slide. Hidden via CSS at >=1440px where
// filters are inline.
function createFilterTrigger(panelId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'font-generator-filter-trigger';
  button.textContent = 'Filter';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panelId);

  button.addEventListener('click', () => {
    setState({ filtersOpen: !getState().filtersOpen });
  });
  subscribe(({ filtersOpen }) => {
    button.setAttribute('aria-expanded', String(Boolean(filtersOpen)));
  });

  localizeFilterTrigger(button);
  return button;
}

export default function decorate(block) {
  setState({ loading: true });
  subscribe(({ loading }) => block.classList.toggle('loading', loading));

  const content = extractContent(block);

  const grid = document.createElement('div');
  grid.className = 'font-generator-grid';

  const sideCol = document.createElement('div');
  sideCol.className = 'font-generator-col font-generator-col--side';

  const panelId = `font-generator-filters-${(filterPanelCount += 1)}`;
  const filterPanel = createFilterPanel({
    promoTitle: content.promoTitle,
    promoCta: content.promoCta,
    categoryStyles: CATEGORY_STYLES,
  });
  filterPanel.id = panelId;

  const closeButton = filterPanel.querySelector('.filter-panel-close');
  if (closeButton) localizeCloseButton(closeButton);

  sideCol.append(
    createSidePanel({ suggestions: content.suggestions }),
    createFilterTrigger(panelId),
    filterPanel,
  );

  const mainCol = document.createElement('div');
  mainCol.className = 'font-generator-col font-generator-col--main';

  const auxCol = document.createElement('div');
  auxCol.className = 'font-generator-col font-generator-col--aux';

  grid.append(sideCol, mainCol, auxCol);
  block.replaceChildren(grid);
  setState({ loading: false });
}
