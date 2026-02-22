import { createTag } from '../../../utils.js';
import { createGradientSection } from './createGradientSection.js';

const SIZES = ['s', 'm', 'l'];

export function createGradientDetailSection(data, options = {}) {
  const size = SIZES.includes(options.size) ? options.size : 'l';
  const defaultGrad = { type: 'linear', angle: 90, colorStops: [{ color: '#000', position: 0 }, { color: '#fff', position: 1 }] };
  const gradient = data?.gradient ?? defaultGrad;

  const wrapper = createTag('div', {
    class: `ax-color-gradient-detail-section ax-color-gradient-detail-section--${size}`,
    'data-size': size,
  });

  const barSection = createGradientSection(gradient, { showStops: true });
  barSection.classList.add('ax-color-gradient-detail-section-bar-wrap');
  wrapper.appendChild(barSection);

  return wrapper;
}
