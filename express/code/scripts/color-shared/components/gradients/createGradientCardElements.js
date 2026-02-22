import { createTag } from '../../../utils.js';

const DEFAULT_ICON_SRC = '/express/code/icons/open-in-20-n.svg';

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
  const { onExpandClick, iconSrc = DEFAULT_ICON_SRC } = options;
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
