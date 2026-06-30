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

/**
 * Creates a single font preview card.
 *
 * Returns `{ element, update }` so FontCardGrid can update in place on state changes
 * without destroying and recreating DOM nodes.
 *
 * @param {{
 *   previewText: string,
 *   fontSize: number,
 *   fontDef: import('./unicodeEngine.js').FontDef,
 *   prodBaseUrl?: string,
 *   labels?: { cta?: string, copy?: string, copied?: string }
 * }} props
 */
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

  // Current glyph string — updated via update()
  let currentGlyph = transformText(previewText, fontDef);

  // ── Layout ───────────────────────────────────────────────────────────────
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

  // ── Copy button ──────────────────────────────────────────────────────────
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

  // ── Design-with-style CTA ────────────────────────────────────────────────
  const ctaBtn = createTag('button', {
    class: 'fg-card-btn fg-card-cta',
    type: 'button',
  });
  ctaBtn.textContent = ctaLabel;

  ctaBtn.addEventListener('click', () => {
    handleOpenInExpress({ styleId: fontDef.id, glyphString: currentGlyph }, prodBaseUrl);
  });

  // ── Assemble ─────────────────────────────────────────────────────────────
  actions.append(copyBtn, ctaBtn);
  footer.append(nameEl, actions);
  card.append(preview, footer);

  // ── Update (called by FontCardGrid on state change) ───────────────────────
  function update({ previewText: newText, fontSize: newSize }) {
    currentGlyph = transformText(newText, fontDef);
    preview.textContent = currentGlyph;
    preview.style.fontSize = `${newSize}px`;
  }

  return { element: card, update };
}
