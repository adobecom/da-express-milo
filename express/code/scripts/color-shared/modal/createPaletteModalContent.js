import { createTag } from '../../utils.js';
import loadMiloStyle from '../utils/loadMiloStyle.js';
import { createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';

const DEFAULT_CREATOR_NAME = 'nicolagilroy';

let contentStylesLoaded = false;
export async function ensurePaletteContentStyles() {
  if (contentStylesLoaded) return;
  try {
    await Promise.all([
      loadMiloStyle('scripts/color-shared/modal/modal-palette-content.css'),
      loadMiloStyle('scripts/color-shared/components/strips/color-strip.css'),
    ]);
    contentStylesLoaded = true;
  } catch {
    contentStylesLoaded = true;
  }
}

function getPaletteColors(palette = {}) {
  if (Array.isArray(palette.colors) && palette.colors.length) {
    return palette.colors
      .map((c) => String(c || '').trim())
      .filter(Boolean)
      .map((c) => (c.startsWith('#') ? c : `#${c}`));
  }
  if (Array.isArray(palette.colorStops) && palette.colorStops.length) {
    return palette.colorStops
      .map((s) => String(s?.color || '').trim())
      .filter(Boolean)
      .map((c) => (c.startsWith('#') ? c : `#${c}`));
  }
  return [];
}

function normalizeLikesCount(rawValue) {
  if (rawValue == null) return '0';
  const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
  if (value === '') return '0';
  return String(value);
}

function normalizeCreatorName(rawValue) {
  if (typeof rawValue === 'string' && rawValue.trim()) return rawValue.trim();
  return DEFAULT_CREATOR_NAME;
}

export function createSimplePaletteContent(palette) {
  const wrap = createTag('div', { class: 'color-modal-simple-palette' });
  const name = createTag('p', { class: 'color-modal-simple-palette-name' });
  name.textContent = palette?.name ? `Palette: ${palette.name}` : 'Palette';
  wrap.appendChild(name);
  if (palette?.description) {
    const desc = createTag('p', { class: 'color-modal-simple-description' });
    desc.textContent = palette.description;
    wrap.appendChild(desc);
  }
  const colors = palette?.colors || palette?.colorStops?.map((s) => s?.color) || [];
  if (colors.length) {
    const list = createTag('div', { class: 'color-modal-simple-swatches' });
    colors.forEach((hex) => {
      const swatch = createTag('div', {
        class: 'color-modal-simple-swatch',
        style: `background-color: ${hex}; min-width: 24px; height: 24px; border-radius: 4px;`,
        title: hex,
      });
      list.appendChild(swatch);
    });
    wrap.appendChild(list);
  }
  return wrap;
}

export function createSimpleGradientContent(gradient) {
  const wrap = createTag('div', { class: 'color-modal-simple-gradient' });
  const name = createTag('p', { class: 'color-modal-simple-gradient-name' });
  name.textContent = gradient?.name ? `Gradient: ${gradient.name}` : 'Gradient';
  wrap.appendChild(name);
  if (gradient?.description) {
    const desc = createTag('p', { class: 'color-modal-simple-description' });
    desc.textContent = gradient.description;
    wrap.appendChild(desc);
  }
  const stops = gradient?.colorStops || [];
  const angle = gradient?.angle ?? 90;
  const type = gradient?.type || 'linear';
  let css = `linear-gradient(${angle}deg, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
  if (type === 'radial') css = `radial-gradient(circle, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
  if (type === 'conic') css = `conic-gradient(from ${angle}deg, ${stops.map((s) => s?.color || '#ccc').join(', ')})`;
  const preview = createTag('div', {
    class: 'color-modal-simple-gradient-preview',
    style: `background: ${stops.length ? css : 'linear-gradient(90deg, #ccc, #999)'}; height: 80px; border-radius: 8px;`,
  });
  wrap.appendChild(preview);
  return wrap;
}

export function createFullPaletteModalContent(palette, options = {}) {
  const { onSave, onEditColor } = options;
  const colors = palette?.colors || palette?.colorStops?.map((s) => s?.color) || [];
  const container = createTag('div', { class: 'color-modal-full-palette' });

  const header = createTag('div', { class: 'color-modal-full-palette-header' });
  const title = createTag('h2', { class: 'color-modal-full-palette-title' });
  title.textContent = palette?.name || 'Palette';
  header.appendChild(title);
  if (palette?.description) {
    const desc = createTag('p', { class: 'color-modal-full-palette-description' });
    desc.textContent = palette.description;
    header.appendChild(desc);
  }
  container.appendChild(header);

  const colorsSection = createTag('div', { class: 'color-modal-full-palette-colors' });
  const colorsTitle = createTag('h3', { class: 'color-modal-full-palette-section-title' });
  colorsTitle.textContent = 'Colors';
  colorsSection.appendChild(colorsTitle);
  const grid = createTag('div', { class: 'color-modal-full-palette-swatches-grid' });

  colors.forEach((hex, index) => {
    const card = createTag('div', { class: 'color-modal-full-palette-swatch-card' });
    const preview = createTag('div', {
      class: 'color-modal-full-palette-swatch-preview',
      style: `background-color: ${hex}`,
      title: hex,
    });
    const hexEl = createTag('div', { class: 'color-modal-full-palette-swatch-hex' });
    hexEl.textContent = hex;
    const actions = createTag('div', { class: 'color-modal-full-palette-swatch-actions' });

    const copyBtn = createTag('button', { type: 'button', class: 'color-modal-full-palette-btn' });
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', `Copy ${hex}`);
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(hex).then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      });
    });

    const editBtn = createTag('button', { type: 'button', class: 'color-modal-full-palette-btn' });
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit color ${hex}`);
    editBtn.addEventListener('click', () => {
      onEditColor?.(hex, index);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(editBtn);
    card.appendChild(preview);
    card.appendChild(hexEl);
    card.appendChild(actions);
    grid.appendChild(card);
  });

  colorsSection.appendChild(grid);
  container.appendChild(colorsSection);

  const infoSection = createTag('div', { class: 'color-modal-full-palette-info' });
  const nameLabel = createTag('label', { for: 'palette-name-input' });
  nameLabel.textContent = 'Palette name';
  const nameInput = createTag('input', {
    id: 'palette-name-input',
    type: 'text',
    class: 'color-modal-full-palette-name-input',
    value: palette?.name || '',
    placeholder: 'Enter palette name',
  });
  infoSection.appendChild(nameLabel);
  infoSection.appendChild(nameInput);
  container.appendChild(infoSection);

  const saveSection = createTag('div', { class: 'color-modal-full-palette-save' });
  const saveBtn = createTag('button', { type: 'button', class: 'color-modal-full-palette-save-btn' });
  saveBtn.textContent = 'Save to Adobe Libraries';
  saveBtn.addEventListener('click', () => {
    onSave?.({ name: nameInput.value, colors });
  });
  saveSection.appendChild(saveBtn);
  container.appendChild(saveSection);

  return container;
}

function createPaletteMetaSection(palette = {}, options = {}) {
  const likesCount = normalizeLikesCount(
    options.likesCount ?? palette?.likes ?? palette?.likesCount,
  );
  const creatorName = normalizeCreatorName(
    options.creatorName ?? palette?.creator?.name ?? palette?.creatorName,
  );
  const creatorImageUrl = options.creatorImageUrl
    ?? palette?.creator?.imageUrl
    ?? palette?.creatorImageUrl
    ?? null;
  const hasOptionTags = Array.isArray(options.tags) && options.tags.length;
  const hasItemTags = Array.isArray(palette?.tags) && palette.tags.length;
  let tags = ['Color', 'Palette'];
  if (hasOptionTags) tags = options.tags;
  else if (hasItemTags) tags = palette.tags;

  const section = createTag('section', { class: 'modal-palette-name-tags' });

  const nameLikesRow = createTag('div', { class: 'modal-palette-name-likes' });
  const nameEl = createTag('h1', { class: 'modal-palette-name' });
  nameEl.textContent = palette?.name || 'Palette';
  nameLikesRow.appendChild(nameEl);

  const likesWrap = createTag('div', { class: 'modal-palette-likes' });
  const likeBtn = createTag('button', { type: 'button', class: 'like-icon', 'aria-label': 'Add to favorites' });
  const likeTheme = createTag('sp-theme', { system: 'spectrum-two', color: 'light', scale: 'medium' });
  let liked = options.liked ?? palette?.liked ?? false;
  const updateLikeState = () => {
    likeTheme.replaceChildren();
    likeTheme.appendChild(createTag(liked ? 'sp-icon-heart-filled' : 'sp-icon-heart', { size: 'm', 'aria-hidden': 'true' }));
    likeBtn.setAttribute('aria-label', liked ? 'Remove from favorites' : 'Add to favorites');
    likeBtn.classList.toggle('is-liked', liked);
  };
  updateLikeState();
  likeBtn.appendChild(likeTheme);
  let likeTooltip = null;
  createExpressTooltip({ targetEl: likeBtn, content: liked ? 'Remove from favorites' : 'Add to favorites', placement: 'bottom' })
    .then((t) => { likeTooltip = t; })
    .catch(() => {});
  likeBtn.addEventListener('click', () => {
    const previousLiked = liked;
    liked = !liked;
    updateLikeState();
    likeTooltip?.setContent(liked ? 'Remove from favorites' : 'Add to favorites');
    options.onLikeToggle?.({ id: palette?.id, liked: previousLiked })?.catch?.((error) => {
      liked = previousLiked;
      updateLikeState();
      likeTooltip?.setContent(liked ? 'Remove from favorites' : 'Add to favorites');
      window.lana?.log(`[PaletteModal] Like toggle error: ${error?.message}`, {
        tags: 'color-modal,like',
        severity: 'warning',
      });
    });
  });
  const likesText = createTag('p', { class: 'modal-likes-count' });
  likesText.textContent = String(likesCount);
  likesWrap.appendChild(likeBtn);
  likesWrap.appendChild(likesText);
  nameLikesRow.appendChild(likesWrap);
  section.appendChild(nameLikesRow);

  const thumbTagsRow = createTag('div', { class: 'modal-palette-thumb-tags' });

  const thumbnailContainer = createTag('div', { class: 'modal-thumbnail-container' });
  const thumbnailWrap = createTag('div', { class: 'modal-thumbnail' });
  if (creatorImageUrl) {
    const thumbnailImg = createTag('img', { class: 'thumbnail-image', alt: creatorName, src: creatorImageUrl });
    thumbnailWrap.appendChild(thumbnailImg);
  } else {
    const initial = createTag('span', { class: 'thumbnail-initial', 'aria-hidden': 'true' });
    initial.textContent = creatorName.charAt(0).toUpperCase();
    thumbnailWrap.appendChild(initial);
  }
  const creatorNameEl = createTag('p', { class: 'modal-creator-name' });
  creatorNameEl.textContent = creatorName;
  thumbnailContainer.appendChild(thumbnailWrap);
  thumbnailContainer.appendChild(creatorNameEl);
  thumbTagsRow.appendChild(thumbnailContainer);

  const tagsContainer = createTag('div', { class: 'modal-tags-container', 'aria-label': 'Tags', role: 'list' });
  tags.forEach((tag) => {
    const tagEl = createTag('span', { class: 'modal-tag', role: 'listitem' });
    tagEl.textContent = String(tag);
    tagsContainer.appendChild(tagEl);
  });
  thumbTagsRow.appendChild(tagsContainer);
  section.appendChild(thumbTagsRow);

  return section;
}

function setupSwatchColumnNav(container) {
  let colCache = [];

  function initTabIndexes() {
    colCache = Array.from(container.querySelectorAll('.swatch-column'));
    if (!colCache.length) {
      requestAnimationFrame(initTabIndexes);
      return;
    }
    // Only the first column is in tab order; component owns Enter/Escape/Tab-in-action-mode
    colCache.forEach((col, i) => col.setAttribute('tabindex', i === 0 ? '0' : '-1'));
  }

  // CAPTURE: ArrowDown/Up navigates between columns from anywhere inside them
  // (including action-mode buttons). Fires before the component's own handlers.
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const cols = colCache;
    const activeEl = document.activeElement;
    const ctxIdx = cols.findIndex((c) => c === activeEl || c.contains(activeEl));
    if (ctxIdx < 0) return;

    e.preventDefault();
    e.stopPropagation();

    const next = e.key === 'ArrowDown' ? ctxIdx + 1 : ctxIdx - 1;
    if (next >= 0 && next < cols.length) {
      // If in action mode, reset the button tabindexes before leaving
      if (cols[ctxIdx] !== activeEl) {
        cols[ctxIdx].querySelectorAll('.swatch-column-focusable')
          .forEach((btn) => btn.setAttribute('tabindex', '-1'));
      }
      cols.forEach((c, i) => c.setAttribute('tabindex', i === next ? '0' : '-1'));
      cols[next].focus();
    }
  }, true); // capture — fires before component handlers

  // CAPTURE: Tab when focus is directly on a column (not action mode)
  // → ensure only this column is tabindex=0 so Tab exits the rail instead of
  //   moving to the next swatch-column (which the component leaves at tabindex=0).
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const cols = colCache;
    const idx = cols.indexOf(document.activeElement);
    if (idx < 0) return; // in action mode — let component's Tab trap handle cycling
    cols.forEach((c, i) => c.setAttribute('tabindex', i === idx ? '0' : '-1'));
    // no preventDefault: Tab exits the rail to the next focusable section
  }, true); // capture

  // FOCUSIN: keep roving tabindex correct whenever focus lands on a column.
  // This repairs any tabindex=0 reset the Lit component does on re-render.
  container.addEventListener('focusin', (e) => {
    const cols = colCache;
    const idx = cols.indexOf(e.target);
    if (idx < 0) return;
    cols.forEach((c, i) => c.setAttribute('tabindex', i === idx ? '0' : '-1'));
  });

  return { initTabIndexes };
}

export function createPaletteSwatchesModalContent(palette, options = {}) {
  const {
    ctaText = 'Create with color palette',
    swatchFeatures: inputSwatchFeatures = {},
    verticalMaxPerRow,
  } = options;
  // Modal strips are read-only by contract: do not enable in-place color editing.
  const swatchFeatures = {
    copy: true,
    copyFromHex: false,
    colorPicker: false,
    hexCode: true,
    baseColor: false,
    ...inputSwatchFeatures,
  };
  swatchFeatures.colorPicker = false;
  swatchFeatures.baseColor = false;

  const normalizedPalette = {
    ...palette,
    colors: getPaletteColors(palette),
  };

  const colorCount = normalizedPalette.colors.length;
  const root = createTag('main', { class: 'modal-content' });

  const railSection = createTag('section', {
    class: 'modal-palette-container modal-palette-container--color-rail',
    'aria-label': `Selected color palette, ${colorCount} color${colorCount !== 1 ? 's' : ''}`,
  });
  const colorCountRange = colorCount <= 5 ? 'small' : 'large';
  const railWrap = createTag('div', { class: 'modal-color-rail-wrap strip-container', 'data-color-count-range': colorCountRange });
  const railAdapter = createSwatchRailAdapter(normalizedPalette, {
    orientation: 'vertical-responsive',
    swatchFeatures,
    ...(Number.isFinite(verticalMaxPerRow) ? { verticalMaxPerRow } : {}),
  });
  railWrap.appendChild(railAdapter.element);
  railSection.appendChild(railWrap);
  root.appendChild(railSection);

  if (colorCountRange === 'large') {
    const updateFade = () => {
      const noOverflow = railWrap.scrollHeight <= railWrap.clientHeight;
      const atBottom = !noOverflow
        && railWrap.scrollHeight - railWrap.scrollTop - railWrap.clientHeight < 2;
      railSection.classList.toggle('scrolled-to-bottom', noOverflow || atBottom);
    };
    railWrap.addEventListener('scroll', updateFade, { passive: true });
    (async () => {
      try {
        await customElements.whenDefined('color-swatch-rail');
        const rail = railWrap.querySelector('color-swatch-rail');
        if (rail?.updateComplete) await rail.updateComplete;
      } catch { /* noop */ }
      requestAnimationFrame(() => {
        updateFade();
        const ro = new ResizeObserver(updateFade);
        ro.observe(railWrap);
        new MutationObserver((_, mo) => {
          if (!document.contains(railSection)) {
            ro.disconnect();
            railWrap.removeEventListener('scroll', updateFade);
            mo.disconnect();
          }
        }).observe(document.body, { childList: true, subtree: true });
      });
    })();
  }

  const { initTabIndexes } = setupSwatchColumnNav(railWrap);

  root.appendChild(createPaletteMetaSection(normalizedPalette, options));

  const toolbarMount = createTag('nav', { class: 'modal-palette-toolbar', 'aria-label': 'Palette actions' });
  root.appendChild(toolbarMount);

  initFloatingToolbar(toolbarMount, {
    palette: { id: palette?.id ?? '', name: palette?.name ?? 'Palette', colors: normalizedPalette.colors },
    type: 'palette',
    ctaText,
    showPaletteName: false,
  }).catch((error) => {
    window.lana?.log(`Palette modal toolbar init failed: ${error?.message}`, {
      tags: 'color-modal,toolbar',
      severity: 'error',
    });
  });

  return {
    element: root,
    initNav: initTabIndexes,
    destroy: () => {
      railAdapter.destroy?.();
    },
  };
}
