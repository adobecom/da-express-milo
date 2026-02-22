import { createTag } from '../../../utils.js';

const DEFAULT_ICON_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M15 10.5V15.5C15 16.0523 14.5523 16.5 14 16.5H4.5C3.94772 16.5 3.5 16.0523 3.5 15.5V6C3.5 5.44772 3.94772 5 4.5 5H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<path d="M12.5 3.5H16.5V7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<path d="M16.5 3.5L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function gradientToBackgroundImage(gradient) {
  if (gradient.gradient && typeof gradient.gradient === 'string') {
    return gradient.gradient;
  }
  if (gradient.colorStops && Array.isArray(gradient.colorStops)) {
    const stops = gradient.colorStops
      .map((stop) => `${stop.color} ${Math.round((stop.position ?? 0) * 100)}%`)
      .join(', ');
    const angle = gradient.angle ?? 90;
    return `linear-gradient(${angle}deg, ${stops})`;
  }
  return 'linear-gradient(90deg, #ccc, #999)';
}

function createGradientCard(gradient, options = {}) {
  const { onExpandClick, iconSrc } = options;
  const card = createTag('article', {
    class: 'gradient-card',
    'data-gradient-id': gradient.id,
  });

  const visual = createTag('div', { class: 'gradient-visual' });
  visual.setAttribute('aria-label', `${gradient.name ?? 'Gradient'} gradient visual`);
  visual.style.backgroundImage = gradientToBackgroundImage(gradient);

  const info = createTag('div', { class: 'gradient-info' });
  const nameEl = createTag('p', { class: 'gradient-name' });
  nameEl.textContent = gradient.name ?? 'Gradient';
  info.appendChild(nameEl);

  const actions = createTag('div', { class: 'gradient-actions' });
  const actionBtn = createTag('button', {
    type: 'button',
    class: 'gradient-action-btn',
    'aria-label': `Open ${gradient.name ?? 'Gradient'} in modal`,
    tabindex: '-1',
  });

  if (iconSrc) {
    const wrapper = createTag('div', { class: 'action-icon-wrapper' });
    const img = createTag('img', {
      src: iconSrc,
      alt: 'Open in modal',
      width: '20',
      height: '20',
      'aria-hidden': 'true',
      class: 'action-icon',
    });
    wrapper.appendChild(img);
    actionBtn.appendChild(wrapper);
  } else {
    actionBtn.innerHTML = DEFAULT_ICON_SVG;
    const icon = actionBtn.querySelector('svg');
    if (icon) icon.classList.add('action-icon');
  }

  if (typeof onExpandClick === 'function') {
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onExpandClick(gradient);
    });
  }

  actions.appendChild(actionBtn);
  info.appendChild(actions);
  card.appendChild(visual);
  card.appendChild(info);

  return card;
}

export function createGradientCardElements(gradients, options = {}) {
  if (!Array.isArray(gradients) || gradients.length === 0) return [];
  return gradients.map((g) => createGradientCard(g, options));
}
