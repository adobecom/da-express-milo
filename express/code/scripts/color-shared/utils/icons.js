import { createTag } from '../../utils.js';

const CUSTOM_ICON_TAGS = {
  CCLibrary: 'x-icon-cclibrary',
};

function toKebabCase(str) {
  return str.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Creates a Spectrum 2 icon custom element (e.g. `<sp-icon-download>`).
 * Falls back to project-specific custom elements for non-standard icons.
 */
export function createSpectrumIcon(name) {
  const customTag = CUSTOM_ICON_TAGS[name];
  const tagName = customTag || `sp-icon-${toKebabCase(name)}`;
  return document.createElement(tagName);
}

/** @deprecated Prefer createSpectrumIcon for S2 icons. */
export function createIconImg(name, size = 20) {
  return createTag('img', {
    src: `/express/code/icons/S2_Icon_${name}_${size}_N.svg`,
    alt: '',
    width: size,
    height: size,
  });
}

export function createSVGIcon(svgMarkup, size = 20) {
  return createTag('span', {
    class: 'ax-icon',
    'aria-hidden': 'true',
    style: `width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;color:currentColor`,
  }, svgMarkup);
}

/**
 * Styled icon button with native tooltip via `title`.
 * Uses Spectrum 2 icon custom elements.
 */
export function createIconButton({ icon, label, onClick }) {
  const iconEl = createTag('span', { class: 'ax-icon', 'aria-hidden': 'true' });
  iconEl.appendChild(createSpectrumIcon(icon));
  const btn = createTag('button', {
    type: 'button',
    class: 'ax-action-btn',
    'aria-label': label,
    title: label,
  }, iconEl);
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
