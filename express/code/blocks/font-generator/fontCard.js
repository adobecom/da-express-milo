import { createTag } from '../../scripts/utils.js';
import { transformText } from './unicodeEngine.js';
import { handleOpenInExpress } from './expressHandoff.js';

function emitAnalytics(eventName, extra = {}) {
  const send = () => {
    window._satellite?.track('event', {
      xdm: {},
      data: {
        eventType: 'web.webinteraction.linkClicks',
        web: {
          webInteraction: {
            name: eventName,
            linkClicks: { value: 1 },
            type: 'other',
          },
        },
        _adobe_corpnew: {
          digitalData: {
            primaryEvent: {
              eventInfo: { eventName, ...extra },
            },
          },
        },
      },
    });
  };

  if (window._satellite?.track) {
    send();
  } else {
    window.addEventListener('alloy_sendEvent', send, { once: true });
  }
}

export function createFontCard({
  previewText,
  fontSize,
  fontDef,
  prodBaseUrl,
  labels = {},
}) {
  const ctaLabel = labels.cta ?? 'Design with style';
  const copyLabel = labels.copy ?? 'Copy';
  const copiedLabel = labels.copied ?? 'Copied!';

  let currentGlyph = transformText(previewText, fontDef);

  const card = createTag('div', {
    class: 'fg-card',
    'data-style-id': fontDef.id,
    role: 'article',
  });

  const preview = createTag('p', { class: 'fg-card-preview' });
  preview.textContent = currentGlyph;
  preview.style.fontSize = `${fontSize}px`;

  const footer = createTag('div', { class: 'fg-card-footer' });

  const nameEl = createTag('span', { class: 'fg-card-name' });
  nameEl.textContent = fontDef.name;

  const actions = createTag('div', { class: 'fg-card-actions' });

  const copyBtn = createTag('button', {
    class: 'fg-card-btn fg-card-copy',
    type: 'button',
    'aria-label': copyLabel,
  });
  copyBtn.textContent = copyLabel;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentGlyph);
      copyBtn.textContent = copiedLabel;
      emitAnalytics('font_generator_copy_text', { styleId: fontDef.id });
      setTimeout(() => { copyBtn.textContent = copyLabel; }, 2000);
    } catch (err) {
      window.lana?.log(`Font generator copy failed: ${err.message}`, {
        tags: 'font-generator,copy',
        severity: 'warn',
      });
    }
  });

  const ctaBtn = createTag('button', {
    class: 'fg-card-btn fg-card-cta',
    type: 'button',
  });
  ctaBtn.textContent = ctaLabel;

  ctaBtn.addEventListener('click', () => {
    handleOpenInExpress({ styleId: fontDef.id, glyphString: currentGlyph }, prodBaseUrl);
  });

  actions.append(copyBtn, ctaBtn);
  footer.append(nameEl, actions);
  card.append(preview, footer);

  function update({ previewText: newText, fontSize: newSize }) {
    currentGlyph = transformText(newText, fontDef);
    preview.textContent = currentGlyph;
    preview.style.fontSize = `${newSize}px`;
  }

  return { element: card, update };
}
