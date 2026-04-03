import { createSpectrumIcon } from '../utils/icons.js';
import { createTag } from '../../utils.js';

/* ── Tag text helpers ─────────────────────────────────────────── */

export function normalizeTagText(t) {
  if (typeof t === 'string') return t;
  return t?.tag ?? t?.name ?? '';
}

/* ── Tag pill (selected tag inside field) ─────────────────────── */

export function createTagPill(text, { onRemove, removeLabel } = {}) {
  const pill = createTag('div', { class: 'ax-tag-pill', 'data-tag-value': text });

  const label = createTag('span', { class: 'ax-tag-pill-label' }, text);

  const closeBtn = createTag('button', {
    type: 'button',
    class: 'ax-tag-pill-close',
    'aria-label': removeLabel || `Remove ${text}`,
  });
  const closeIcon = createSpectrumIcon('Close');
  closeIcon.setAttribute('aria-hidden', 'true');
  closeBtn.appendChild(closeIcon);

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pill.remove();
    onRemove?.();
  });

  pill.append(label, closeBtn);
  return pill;
}

/* ── Tag value extraction ─────────────────────────────────────── */

export function getTagValues(container) {
  return [...container.querySelectorAll('.ax-tag-pill')]
    .map((el) => el.dataset.tagValue ?? '')
    .filter(Boolean);
}

/* ── State sync ───────────────────────────────────────────────── */

export function syncTagFieldState(field, input, tagsContainer, helpText) {
  const hasTags = tagsContainer.children.length > 0;
  const hasFocus = field.contains(document.activeElement);

  field.classList.toggle('ax-tag-field-active', hasFocus || hasTags);
  field.classList.toggle('ax-tag-field-has-tags', hasTags);

  if (hasTags || input.value.trim()) {
    input.removeAttribute('placeholder');
  } else {
    input.setAttribute('placeholder', input.dataset.placeholder || '');
  }

  if (helpText) {
    helpText.hidden = !(hasFocus || hasTags);
  }
}

/* ── Add tag from input ───────────────────────────────────────── */

export function addTagFromInput(input, tagsContainer, { onStateChange, removeLabel } = {}) {
  const text = input.value.trim();
  if (!text) return;
  const existing = getTagValues(tagsContainer)
    .map((v) => v.toLowerCase());
  if (existing.includes(text.toLowerCase())) {
    input.value = '';
    input.focus();
    return;
  }
  input.value = '';
  const pill = createTagPill(text, {
    removeLabel,
    onRemove: () => onStateChange?.(),
  });
  tagsContainer.appendChild(pill);
  input.focus();
  onStateChange?.();
}

/* ── Main factory ─────────────────────────────────────────────── */

export function createTagField(label, tags, placeholder, {
  helpTextStr,
  removeLabel,
} = {}) {
  const wrapper = createTag('div', { class: 'ax-drawer-tag-section' });

  const inputId = 'ax-tag-field-input';
  const helpId = 'ax-tag-field-help';

  const labelEl = createTag('label', {
    class: 'ax-drawer-field-label',
    for: inputId,
  }, label);

  const field = createTag('div', { class: 'ax-tag-field' });
  const tagsContainer = createTag('div', { class: 'ax-tag-field-tags' });
  const input = createTag('input', {
    type: 'text',
    class: 'ax-tag-field-input',
    id: inputId,
    placeholder,
    'data-placeholder': placeholder,
    'aria-label': placeholder,
    'aria-describedby': helpId,
  });

  const doSync = () => syncTagFieldState(field, input, tagsContainer, helpText);

  (tags ?? []).forEach((t) => {
    const text = normalizeTagText(t);
    if (text) {
      tagsContainer.appendChild(createTagPill(text, {
        removeLabel,
        onRemove: doSync,
      }));
    }
  });

  field.append(tagsContainer, input);

  const helpText = createTag('span', {
    class: 'ax-tag-field-help',
    id: helpId,
    hidden: '',
  }, helpTextStr || '');

  field.addEventListener('click', (e) => {
    if (e.target === field || e.target === tagsContainer) {
      input.focus();
    }
  });

  input.addEventListener('focus', doSync);
  input.addEventListener('blur', () => {
    requestAnimationFrame(doSync);
  });
  input.addEventListener('input', doSync);

  wrapper.append(labelEl, field, helpText);

  doSync();

  return {
    wrapper,
    field,
    tagsContainer,
    input,
    helpText,
    syncState: doSync,
  };
}
