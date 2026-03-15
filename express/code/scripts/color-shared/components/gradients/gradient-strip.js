import { createTag } from '../../../utils.js';

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

function createGradientStrip(gradient, options = {}) {
  const {
    onExpandClick,
    iconElement,
    iconSrc,
    analytics,
    actionLabel = `Open ${gradient.name ?? 'Gradient'} in modal`,
  } = options;
  const strip = createTag('article', {
    class: 'gradient-strip',
    'data-gradient-id': gradient.id,
  });

  const visual = createTag('div', { class: 'gradient-strip-visual' });
  visual.setAttribute('aria-label', `${gradient.name ?? 'Gradient'} gradient visual`);
  visual.style.backgroundImage = gradientToBackgroundImage(gradient);

  const info = createTag('div', { class: 'gradient-strip-info' });
  const nameEl = createTag('p', { class: 'gradient-strip-name' });
  nameEl.textContent = gradient.name ?? 'Gradient';
  info.appendChild(nameEl);

  const actions = createTag('div', { class: 'gradient-strip-actions' });
  const actionBtn = createTag('button', {
    type: 'button',
    class: 'gradient-strip-action-btn',
    'aria-label': actionLabel,
    title: actionLabel,
    tabindex: '-1',
  });
  if (typeof analytics?.getDaaLl === 'function') {
    const daaLl = analytics.getDaaLl('View details', analytics.linkIndex);
    if (daaLl) {
      actionBtn.setAttribute('daa-ll', daaLl);
      actionBtn.setAttribute('data-ll', daaLl);
    }
  }

  const wrapper = createTag('div', { class: 'action-icon-wrapper' });
  if (iconElement) {
    const icon = iconElement.cloneNode(true);
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('action-icon');
    wrapper.appendChild(icon);
  } else if (iconSrc) {
    const img = createTag('img', {
      src: iconSrc,
      alt: 'Open in modal',
      width: '20',
      height: '20',
      'aria-hidden': 'true',
      class: 'action-icon',
    });
    wrapper.appendChild(img);
  } else {
    const icon = createTag('sp-icon-open-in', {
      size: 'm',
      'aria-hidden': 'true',
      class: 'action-icon',
    });
    wrapper.appendChild(icon);
  }
  actionBtn.appendChild(wrapper);

  if (typeof onExpandClick === 'function') {
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onExpandClick(gradient);
    });
  }

  actions.appendChild(actionBtn);
  info.appendChild(actions);
  strip.appendChild(visual);
  strip.appendChild(info);

  return strip;
}

export function createGradientStripElements(gradients, options = {}) {
  if (!Array.isArray(gradients) || gradients.length === 0) return [];
  const { analytics: baseAnalytics } = options;
  return gradients.map((g, i) => {
    const cardOptions = { ...options };
    if (baseAnalytics && (baseAnalytics.linkIndex != null
      || baseAnalytics.headerText != null
      || baseAnalytics.startIndex != null)) {
      let linkIndex = null;
      if (baseAnalytics.linkIndex != null) {
        linkIndex = baseAnalytics.linkIndex;
      } else if (baseAnalytics.startIndex != null) {
        linkIndex = baseAnalytics.startIndex + i + 1;
      }
      cardOptions.analytics = {
        ...baseAnalytics,
        linkIndex,
        headerText: baseAnalytics.headerText ?? '',
      };
    }
    return createGradientStrip(g, cardOptions);
  });
}

export default createGradientStripElements;
