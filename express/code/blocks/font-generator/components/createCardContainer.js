const PLACEHOLDER = 'Type to preview';

/**
 * Creates the live preview card grid.
 * Updating 56 text nodes per keystroke — throttled via requestAnimationFrame.
 *
 * @param {Array<{id, name, category, transform}>} styles
 * @param {function({id, name, text}): void} onCopy - called after successful clipboard write
 * @returns {{ element: HTMLElement, update: (text: string, categoryId: string) => void, destroy: () => void }}
 */
export default function createCardContainer(styles, onCopy) {
  const container = document.createElement('div');
  container.classList.add('fg-card-container');

  const cardMap = new Map();

  styles.forEach(({ id, name, category, transform }) => {
    const card = document.createElement('div');
    card.classList.add('fg-card');
    card.dataset.category = category;

    const preview = document.createElement('div');
    preview.classList.add('fg-card-preview');
    preview.textContent = PLACEHOLDER;

    const footer = document.createElement('div');
    footer.classList.add('fg-card-footer');

    const nameEl = document.createElement('span');
    nameEl.classList.add('fg-card-name');
    nameEl.textContent = name;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.classList.add('fg-card-copy', 'button', 'accent');
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', `Copy ${name} style`);
    copyBtn.addEventListener('click', () => {
      const currentText = preview.dataset.rawTransformed;
      if (!currentText) return;
      navigator.clipboard?.writeText(currentText).then(() => {
        onCopy?.({ id, name, text: currentText });
      }).catch(() => {});
    });

    footer.append(nameEl, copyBtn);
    card.append(preview, footer);
    container.append(card);
    cardMap.set(id, { cardEl: card, previewEl: preview, transform });
  });

  let rafId = null;

  const update = (rawText, categoryId = 'all') => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      cardMap.forEach(({ cardEl, previewEl, transform }) => {
        const category = cardEl.dataset.category;
        const visible = categoryId === 'all' || category === categoryId;
        cardEl.hidden = !visible;
        if (!visible) return;

        if (!rawText) {
          previewEl.textContent = PLACEHOLDER;
          delete previewEl.dataset.rawTransformed;
        } else {
          const transformed = transform(rawText);
          previewEl.textContent = transformed;
          previewEl.dataset.rawTransformed = transformed;
        }
      });
    });
  };

  return {
    element: container,
    update,
    destroy: () => {
      cancelAnimationFrame(rafId);
      container.remove();
    },
  };
}
