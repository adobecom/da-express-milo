import { createTag } from '../../scripts/utils.js';
import { initFromUrl, subscribe } from './state.js';
import { init as initFontCardGrid } from './fontCardGrid.js';
import { init as initTextInput } from './textInput.js';
import { init as initToolbar } from './toolbar.js';
import { init as initFilters } from './filters.js';

function emitAnalytics(eventName) {
  const send = () => {
    window._satellite?.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: { webInteraction: { name: eventName, linkClicks: { value: 1 }, type: 'other' } },
        _adobe_corpnew: { digitalData: { primaryEvent: { eventInfo: { eventName } } } },
      },
    });
  };
  if (window._satellite?.track) send();
  else window.addEventListener('alloy_sendEvent', send, { once: true });
}

function readAuthoredConfig(block) {
  const rows = block.querySelectorAll(':scope > div');
  const config = {};
  rows.forEach((row) => {
    const [keyEl, valEl] = row.querySelectorAll(':scope > div');
    if (!keyEl || !valEl) return;
    const key = keyEl.textContent?.trim().toLowerCase();
    const val = valEl.textContent?.trim();
    if (!key || !val) return;
    switch (key) {
      case 'prod-base-url': config.prodBaseUrl = val; break;
      case 'cta-label': config.ctaLabel = val; break;
      case 'copy-label': config.copyLabel = val; break;
      case 'load-more-label': config.loadMoreLabel = val; break;
      case 'input-label': config.inputLabel = val; break;
      case 'placeholder': config.placeholder = val; break;
      case 'grid-label': config.gridLabel = val; break;
      case 'list-label': config.listLabel = val; break;
      case 'size-label': config.sizeLabel = val; break;
      case 'filters': config.filterLabels = val.split(',').map((s) => s.trim()).filter(Boolean); break;
      default: break;
    }
  });
  return config;
}

export default function decorate(block) {
  const config = readAuthoredConfig(block);

  initFromUrl();

  block.innerHTML = '';
  block.classList.add('loading');

  const container = createTag('section', { class: 'fg-container' });

  const toolbarEl = createTag('div', { class: 'fg-toolbar' });
  initToolbar(toolbarEl, {
    gridLabel: config.gridLabel,
    listLabel: config.listLabel,
    sizeLabel: config.sizeLabel,
  });

  const textInputEl = createTag('div', { class: 'fg-text-input' });
  initTextInput(textInputEl, {
    inputLabel: config.inputLabel,
    placeholder: config.placeholder,
  });

  const sidebar = createTag('aside', { class: 'fg-sidebar' });
  if (config.filterLabels?.length) {
    initFilters(sidebar, config.filterLabels);
  }

  const main = createTag('div', { class: 'fg-main' });
  const cardGridEl = createTag('div', { class: 'fg-card-grid' });
  main.append(cardGridEl);

  container.append(toolbarEl, textInputEl, sidebar, main);
  block.append(container);

  initFontCardGrid(cardGridEl, {
    prodBaseUrl: config.prodBaseUrl,
    labels: {
      cta: config.ctaLabel,
      copy: config.copyLabel,
      loadMore: config.loadMoreLabel,
    },
  });

  subscribe((state) => {
    const grid = cardGridEl.querySelector('.fg-grid');
    if (grid) grid.classList.toggle('layout-list', state.layout === 'list');
  });

  block.classList.remove('loading');

  emitAnalytics('font_generator_landing_impression');

  import('./fontTextUpload.js').then((mod) => mod.prewarmAcpUpload()).catch(() => {});
}
