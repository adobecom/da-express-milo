/**
 * Mini Editor Widget
 *
 * A configurable in-page editing surface: a right-aligned top action bar
 * (e.g. Share / Edit / Download), a center preview canvas (generic content
 * slot + optional prev/next nav), and a bottom control bar (Font selectors +
 * Background color swatches). The caller decides which actions/controls to
 * include. Built on the shared Express Spectrum wrappers.
 *
 * Usage:
 *   import createMiniEditorWidget from '../mini-editor-widget/mini-editor-widget.js';
 *
 *   const editor = await createMiniEditorWidget({
 *     content: myPreviewEl,
 *     topActions: [
 *       { id: 'share', type: 'button', label: 'Share', onClick: onShare },
 *       { id: 'edit', type: 'action', iconOnly: true, ariaLabel: 'Edit', onClick: onEdit },
 *       { id: 'download', type: 'action', iconOnly: true, ariaLabel: 'Download', onClick: onDownload },
 *     ],
 *     fontOptions: [
 *       { id: 'sans', label: 'A', ariaLabel: 'Sans serif', selected: true, onSelect: applyFont },
 *       { id: 'serif', label: 'A', ariaLabel: 'Serif', onSelect: applyFont },
 *     ],
 *     backgrounds: { colors: ['#7FD4FF', '#8E5BFF'], labels: ['Sky', 'Violet'], onChange: applyBg },
 *   });
 *   container.appendChild(editor.element);
 */

import {
  createExpressButton,
  createExpressActionButton,
  createExpressSwatchGroup,
  createThemeWrapper,
  loadActionButton,
} from '../../shared/spectrum/index.js';
import { attachRovingTabIndex } from '../../shared/spectrum/utils/a11y.js';

const STYLESHEET_HREF = '/express/code/scripts/widgets/mini-editor-widget/mini-editor-widget.css';
const ICONS_BASE = '/express/code/icons';

// Default icons for well-known action ids; callers may override per action.
const DEFAULT_ICONS = {
  share: `${ICONS_BASE}/S2_Icon_ShareAndroid_20_N.svg`,
  download: `${ICONS_BASE}/S2_Icon_Download_20_N.svg`,
  edit: `${ICONS_BASE}/edit-22-n.svg`,
  font: `${ICONS_BASE}/fonts-22.svg`,
};

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || document.querySelector(`link[href="${STYLESHEET_HREF}"]`)) return;
  stylesInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_HREF;
  document.head.appendChild(link);
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// Build an <img> icon element from a URL, or pass through a caller-provided
// element/HTML string. Returns null when there is no icon.
function resolveIcon(icon, fallbackUrl) {
  if (icon) return icon;
  if (!fallbackUrl) return null;
  const img = el('img', null, { src: fallbackUrl, alt: '', 'aria-hidden': 'true' });
  return img;
}

function iconAsHtml(icon) {
  if (!icon) return undefined;
  if (typeof icon === 'string') return icon;
  return icon.outerHTML;
}

/**
 * @param {Object} config
 * @param {HTMLElement} [config.content] — preview element for the center canvas
 * @param {Array}  [config.topActions=[]] — top-bar action descriptors
 * @param {Array}  [config.fontOptions=[]] — bottom-bar font toggle descriptors
 * @param {Object} [config.backgrounds] — { colors, labels, selected, onChange }
 * @param {HTMLElement[]} [config.bottomControls=[]] — extra control elements
 * @param {Object} [config.navigation] — { onPrev, onNext, prevLabel, nextLabel }
 * @param {Object} [config.strings={}] — a11y/label strings
 * @returns {Promise<{element:HTMLElement, setActiveFont:(id:string)=>void,
 *   setActiveBackground:(values:string[])=>void, destroy:()=>void}>}
 */
export default async function createMiniEditorWidget(config = {}) {
  const {
    content,
    topActions = [],
    fontOptions = [],
    backgrounds,
    bottomControls = [],
    navigation,
    strings = {},
  } = config;

  injectStyles();
  // Ensures sp-theme (and core deps) are registered before createThemeWrapper.
  await loadActionButton();

  const children = [];
  const theme = createThemeWrapper();
  theme.classList.add('mini-editor-theme');
  const root = el('div', 'mini-editor');
  theme.appendChild(root);

  // ── Top action bar ─────────────────────────────────────────────────────
  const actionsBar = el('div', 'mini-editor-actions');
  if (strings.actionsLabel) actionsBar.setAttribute('aria-label', strings.actionsLabel);

  // Promise.all preserves caller order for appending.
  const builtActions = await Promise.all(topActions.map(async (action) => {
    const {
      id, type = 'action', label, ariaLabel, variant = 'secondary',
      size = 'm', icon, iconOnly = false, onClick,
    } = action;
    const resolvedIcon = resolveIcon(icon, DEFAULT_ICONS[id]);

    if (type === 'button') {
      return createExpressButton({
        label, variant, size, onClick, iconSlotHtml: iconAsHtml(resolvedIcon),
      });
    }
    return createExpressActionButton({
      label: ariaLabel || label, size, quiet: true, iconOnly, icon: resolvedIcon, onClick,
    });
  }));
  builtActions.forEach((control, i) => {
    control.element.dataset.actionId = topActions[i].id;
    children.push(control);
    actionsBar.appendChild(control.element);
  });

  root.appendChild(actionsBar);

  // ── Center canvas ──────────────────────────────────────────────────────
  const canvas = el('div', 'mini-editor-canvas');
  if (navigation) {
    const prev = await createExpressActionButton({
      label: navigation.prevLabel || strings.prevLabel,
      quiet: true,
      iconOnly: true,
      onClick: navigation.onPrev,
    });
    prev.element.classList.add('mini-editor-nav', 'is-prev');
    const next = await createExpressActionButton({
      label: navigation.nextLabel || strings.nextLabel,
      quiet: true,
      iconOnly: true,
      onClick: navigation.onNext,
    });
    next.element.classList.add('mini-editor-nav', 'is-next');
    children.push(prev, next);
    canvas.append(prev.element, next.element);
  }
  const contentSlot = el('div', 'mini-editor-content');
  if (content) contentSlot.appendChild(content);
  canvas.appendChild(contentSlot);
  root.appendChild(canvas);

  // ── Bottom control bar ─────────────────────────────────────────────────
  const controlsBar = el('div', 'mini-editor-controls');

  // Font toggle group (single-select).
  let fontButtons = [];
  if (fontOptions.length) {
    const fontGroup = el('div', 'mini-editor-fonts', { role: 'group' });
    if (strings.fontGroupLabel) fontGroup.setAttribute('aria-label', strings.fontGroupLabel);

    // Build bare toggle buttons; set the accessible name + visible glyph
    // ourselves so the aria label (font name) differs from the shown "A".
    const built = await Promise.all(fontOptions.map((opt) => createExpressActionButton({
      icon: opt.label ? undefined : resolveIcon(opt.icon, DEFAULT_ICONS.font),
      iconOnly: !opt.label,
      quiet: true,
      selected: Boolean(opt.selected),
    })));

    fontButtons = built.map((control, i) => {
      const opt = fontOptions[i];
      children.push(control);
      const btn = control.element.querySelector('sp-action-button');
      btn.setAttribute('aria-label', opt.ariaLabel || opt.label || opt.id);
      if (opt.label) {
        const glyph = el('span', 'mini-editor-font-glyph');
        glyph.textContent = opt.label;
        if (opt.fontFamily) glyph.style.fontFamily = opt.fontFamily;
        btn.append(glyph);
      }
      btn.dataset.fontId = opt.id;
      fontGroup.appendChild(control.element);
      btn.addEventListener('click', () => {
        fontButtons.forEach((b) => b.removeAttribute('selected'));
        btn.setAttribute('selected', '');
        opt.onSelect?.(opt.id);
      });
      return btn;
    });

    const activeIndex = Math.max(0, fontOptions.findIndex((o) => o.selected));
    attachRovingTabIndex(fontGroup, fontButtons, activeIndex);
    controlsBar.appendChild(fontGroup);
  }

  // Background swatches.
  let bgGroup = null;
  if (backgrounds?.colors?.length) {
    if (fontOptions.length) controlsBar.appendChild(el('div', 'mini-editor-divider'));
    bgGroup = await createExpressSwatchGroup({
      colors: backgrounds.colors,
      labels: backgrounds.labels,
      selects: 'single',
      size: 's',
      selected: backgrounds.selected,
      onChange: backgrounds.onChange,
    });
    children.push(bgGroup);
    // Circular swatches per spec.
    bgGroup.element.querySelectorAll('sp-swatch').forEach((s) => s.setAttribute('rounding', 'full'));
    const bgWrap = el('div', 'mini-editor-backgrounds');
    if (strings.backgroundsLabel) bgWrap.setAttribute('aria-label', strings.backgroundsLabel);
    bgWrap.appendChild(bgGroup.element);
    controlsBar.appendChild(bgWrap);
  }

  // Any extra caller-provided controls.
  bottomControls.forEach((ctrl) => {
    if (ctrl) controlsBar.appendChild(ctrl);
  });

  if (controlsBar.childElementCount) root.appendChild(controlsBar);

  return {
    element: theme,

    setActiveFont(id) {
      fontButtons.forEach((btn) => {
        if (btn.dataset.fontId === id) btn.setAttribute('selected', '');
        else btn.removeAttribute('selected');
      });
    },

    setActiveBackground(values) {
      bgGroup?.setSelected(values);
    },

    destroy() {
      children.forEach((c) => c.destroy?.());
      theme.remove();
    },
  };
}
