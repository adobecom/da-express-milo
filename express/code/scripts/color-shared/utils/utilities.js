import { createTag } from '../../utils.js';

export function isMobileViewport() {
  return window.matchMedia('(max-width: 599px)').matches;
}

export function createCurtain(className, onClose) {
  const curtain = createTag('div', { class: className, 'aria-hidden': 'true' });
  if (onClose) curtain.addEventListener('click', onClose);
  return curtain;
}
