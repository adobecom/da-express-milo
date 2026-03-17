import { createTag, getLibs } from '../../utils.js';
import { createSwatchRailAdapter, createColorEditAdapter } from '../adapters/litComponentAdapters.js';
import { initFloatingToolbar } from '../toolbar/createFloatingToolbar.js';
import { trapFocus } from '../spectrum/utils/a11y.js';

const CREATOR_PLACEHOLDER_PATH = '/express/code/scripts/color-shared/modal/images/creator-placeholder.png';

let contentStylesLoaded = false;
export async function ensurePaletteContentStyles() {
  if (contentStylesLoaded) return;
  try {
    const { loadStyle, getConfig } = (await import(`${getLibs()}/utils/utils.js`));
    const codeRoot = getConfig?.()?.codeRoot || '/express/code';
    await Promise.all([
      loadStyle(`${codeRoot}/scripts/color-shared/modal/modal-palette-content.css`),
      loadStyle(`${codeRoot}/scripts/color-shared/components/strips/color-strip.css`),
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
  const likesCount = options.likesCount ?? palette?.likes ?? '1.2K';
  const creatorName = options.creatorName ?? palette?.creator?.name ?? palette?.creatorName ?? 'creator';
  const creatorImageUrl = options.creatorImageUrl
    ?? palette?.creator?.imageUrl
    ?? palette?.creatorImageUrl
    ?? CREATOR_PLACEHOLDER_PATH;
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
  const likeBtn = createTag('button', { type: 'button', class: 'like-icon', 'aria-label': 'Like palette' });
  const likeTheme = createTag('sp-theme', { system: 'spectrum-two', color: 'light', scale: 'medium' });
  let liked = false;
  likeTheme.appendChild(createTag('sp-icon-heart', { size: 'm', 'aria-hidden': 'true' }));
  likeBtn.appendChild(likeTheme);
  likeBtn.addEventListener('click', () => {
    liked = !liked;
    likeTheme.replaceChildren();
    likeTheme.appendChild(createTag(liked ? 'sp-icon-heart-filled' : 'sp-icon-heart', { size: 'm', 'aria-hidden': 'true' }));
    likeBtn.setAttribute('aria-label', liked ? 'Unlike palette' : 'Like palette');
    likeBtn.classList.toggle('is-liked', liked);
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
  const thumbnailImg = createTag('img', { class: 'thumbnail-image', alt: creatorName, src: creatorImageUrl });
  thumbnailWrap.appendChild(thumbnailImg);
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

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1199px)';
const mobileMql = typeof window !== 'undefined' ? window.matchMedia?.(MOBILE_BREAKPOINT_QUERY) : null;

function getAnchorFromEvent(event, fallback) {
  const path = event.composedPath?.() || [];
  const anchor = path.find((node) => (
    node instanceof HTMLElement
    && (node.tagName === 'BUTTON' || node.classList?.contains('hex-code'))
  ));
  return anchor || fallback;
}

function resolveAnchorRect(anchorEl, rectFromDetail) {
  if (rectFromDetail && Number.isFinite(rectFromDetail.left)) return rectFromDetail;
  return anchorEl.getBoundingClientRect();
}

function positionPopover(popover, anchorRect) {
  const gap = 8;
  const popRect = popover.getBoundingClientRect();
  let top = anchorRect.bottom + gap;
  if (top + popRect.height > window.innerHeight) top = anchorRect.top - popRect.height - gap;
  top = Math.max(gap, top);
  let left = anchorRect.left + (anchorRect.width - popRect.width) / 2;
  left = Math.max(gap, Math.min(left, window.innerWidth - popRect.width - gap));
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

export function createPaletteSwatchesModalContent(palette, options = {}) {
  const {
    ctaText = 'Open in Adobe Express',
    swatchFeatures = {
      copy: true,
      colorPicker: true,
      hexCode: true,
      baseColor: true,
    },
    verticalMaxPerRow,
  } = options;

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
  const railWrap = createTag('div', { class: 'modal-color-rail-wrap strip-container' });
  const railAdapter = createSwatchRailAdapter(normalizedPalette, {
    orientation: 'vertical-responsive',
    swatchFeatures,
    ...(Number.isFinite(verticalMaxPerRow) ? { verticalMaxPerRow } : {}),
  });
  railWrap.appendChild(railAdapter.element);
  railSection.appendChild(railWrap);
  root.appendChild(railSection);

  let activeColorEditor = null;
  const isMobile = () => mobileMql?.matches === true;

  function closeColorEdit() {
    if (!activeColorEditor) return;
    const {
      adapter, popover, mobile, outsideHandler, escapeHandler, scrollHandler, anchor,
    } = activeColorEditor;
    if (outsideHandler) document.removeEventListener('click', outsideHandler, true);
    if (escapeHandler) document.removeEventListener('keydown', escapeHandler, true);
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler, true);
    if (mobile) {
      try { adapter.hide?.(); } catch (_) { /* no-op */ }
    }
    adapter.destroy?.();
    popover?.remove();
    activeColorEditor = null;
    anchor?.focus();
  }

  railAdapter.rail.addEventListener('color-swatch-rail-edit', (e) => {
    e.preventDefault();
    closeColorEdit();

    const index = Number(e.detail?.index);
    if (!Number.isInteger(index) || index < 0) return;

    const mobile = isMobile();
    const state = railAdapter.controller.getState();
    const paletteColors = state.swatches.map((s) => s.hex);

    const adapter = createColorEditAdapter({
      palette: paletteColors,
      selectedIndex: index,
      colorMode: 'HEX',
      showPalette: true,
      mobile,
    }, {
      onColorChange: ({ hex, index: i }) => {
        const current = railAdapter.controller.getState();
        const swatches = current.swatches.map((s, si) => (si === i ? { ...s, hex } : s));
        railAdapter.controller.setState({ swatches });
      },
      onClose: () => closeColorEdit(),
    });

    const editorElement = adapter.getElement?.() || adapter.element;

    if (mobile) {
      document.body.appendChild(editorElement);
      adapter.show?.();
      activeColorEditor = { adapter, mobile: true };
      return;
    }

    const anchor = getAnchorFromEvent(e, railWrap);
    const anchorRect = resolveAnchorRect(anchor, e.detail?.anchorRect || null);

    const popover = document.createElement('div');
    popover.className = 'swatches-color-edit-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Edit color');
    popover.style.position = 'fixed';
    popover.style.zIndex = '10002';
    popover.appendChild(editorElement);
    document.body.appendChild(popover);
    requestAnimationFrame(() => positionPopover(popover, anchorRect));

    Promise.resolve(editorElement.updateComplete).then(() => {
      positionPopover(popover, anchorRect);
      const panel = editorElement.shadowRoot?.querySelector('.color-edit-panel');
      const firstFocusable = panel?.querySelector('sp-textfield')
        || panel?.querySelector('button, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
      trapFocus(panel);
    }).catch(() => {});

    const outsideHandler = (evt) => {
      if (!popover.contains(evt.target) && !anchor.contains(evt.target)) closeColorEdit();
    };
    const escapeHandler = (evt) => {
      if (evt.key !== 'Escape') return;
      evt.stopPropagation();
      closeColorEdit();
    };
    const scrollHandler = () => closeColorEdit();

    document.addEventListener('click', outsideHandler, true);
    document.addEventListener('keydown', escapeHandler, true);
    window.addEventListener('scroll', scrollHandler, true);

    activeColorEditor = {
      adapter, popover, mobile: false, outsideHandler, escapeHandler, scrollHandler, anchor,
    };
  });

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
    destroy: () => {
      closeColorEdit();
      railAdapter.destroy?.();
    },
  };
}
