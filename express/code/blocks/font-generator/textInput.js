import { createTag } from '../../scripts/utils.js';
import { setState, getState } from './state.js';

const DEBOUNCE_MS = 300;

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

/**
 * Initialises the text input area and syncs it with state.
 *
 * @param {HTMLElement} container - The `.fg-text-input` div to populate.
 * @param {{ inputLabel?: string, placeholder?: string }} labels
 */
export function init(container, { inputLabel = 'Preview text', placeholder = 'Type something...' } = {}) {
  let debounceTimer;

  const label = createTag('label', { class: 'fg-input-label', for: 'fg-preview-input' });
  label.textContent = inputLabel;

  const input = createTag('input', {
    id: 'fg-preview-input',
    class: 'fg-input',
    type: 'text',
    'aria-label': inputLabel,
    maxlength: '200',
  });
  input.value = getState().previewText;
  input.placeholder = placeholder;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setState({ previewText: input.value });
      emitAnalytics('font_generator_preview_text_change');
    }, DEBOUNCE_MS);
  });

  container.append(label, input);
}
