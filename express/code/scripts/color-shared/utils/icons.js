import { createTag } from '../../utils.js';

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
    style: `width:${size}px;height:${size}px;display:inline-flex`,
  }, svgMarkup);
}

/**
 * Styled icon button with native tooltip via `title`.
 */
export function createIconButton({ icon, label, onClick }) {
  const iconEl = createTag('span', { class: 'ax-icon', 'aria-hidden': 'true' }, createIconImg(icon));
  const btn = createTag('button', {
    type: 'button',
    class: 'ax-action-btn',
    'aria-label': label,
    title: label,
  }, iconEl);
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
