import { createTag } from '../../../utils.js';

const DEFAULT_STOPS = [
  { color: '#000000', position: 0 },
  { color: '#ffffff', position: 1 },
];

function normalizeGradient(gradient) {
  const colorStops = Array.isArray(gradient?.colorStops) && gradient.colorStops.length >= 2
    ? gradient.colorStops.map((s) => ({
      color: typeof s.color === 'string' ? s.color : '#808080',
      position: Math.max(0, Math.min(1, Number(s.position) ?? 0.5)),
    }))
    : [...DEFAULT_STOPS];
  return {
    type: ['linear', 'radial', 'conic'].includes(gradient?.type) ? gradient.type : 'linear',
    angle: Math.max(0, Math.min(360, Number(gradient?.angle) ?? 90)),
    colorStops,
  };
}

function gradientToCSS(data) {
  const { type = 'linear', angle = 90, colorStops = [] } = data;
  if (colorStops.length === 0) return 'linear-gradient(90deg, #ccc, #999)';
  const stops = colorStops
    .map((s) => `${s.color} ${(s.position ?? 0) * 100}%`)
    .join(', ');
  if (type === 'radial') return `radial-gradient(circle, ${stops})`;
  if (type === 'conic') return `conic-gradient(from ${angle}deg, ${stops})`;
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function createGradientSection(gradient, options = {}) {
  const showStops = options.showStops === true;
  const defaultStops = [{ color: '#000', position: 0 }, { color: '#fff', position: 1 }];
  const data = typeof gradient === 'string'
    ? { type: 'linear', angle: 90, colorStops: defaultStops }
    : normalizeGradient(gradient);

  const wrapper = createTag('div', { class: 'ax-color-gradient-section' });

  const bar = createTag('div', {
    class: 'ax-color-gradient-section-bar',
    'aria-label': options.ariaLabel ?? 'Gradient preview',
  });
  bar.style.background = gradientToCSS(data);

  if (showStops && data.colorStops && data.colorStops.length > 0) {
    const stopsWrap = createTag('div', { class: 'ax-color-gradient-section-bar-stops' });
    data.colorStops.forEach((stop) => {
      const circle = createTag('div', {
        class: 'ax-color-gradient-section-bar-stop',
        'aria-hidden': 'true',
      });
      circle.style.left = `${(stop.position ?? 0) * 100}%`;
      circle.style.backgroundColor = typeof stop.color === 'string' ? stop.color : '#808080';
      stopsWrap.appendChild(circle);
    });
    bar.appendChild(stopsWrap);
  }

  wrapper.appendChild(bar);
  return wrapper;
}
