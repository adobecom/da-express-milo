import { createTag } from '../../../scripts/utils.js';
import { MOOD_LIST, MOODS } from './constants.js';

const MOOD_LABELS = {
  [MOODS.COLORFUL]: 'Colorful',
  [MOODS.BRIGHT]: 'Bright',
  [MOODS.MUTED]: 'Muted',
  [MOODS.DEEP]: 'Deep',
  [MOODS.DARK]: 'Dark',
  [MOODS.NONE]: 'None',
};

const CHEVRON_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
  <path d="M3 3.5L5 5.5L7 3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * Build a mood selector dropdown.
 *
 * @param {string} initialMood
 * @param {(mood: string) => void} onChange
 * @returns {{ element: HTMLElement, setMood: (mood: string) => void }}
 */
export function createMoodSelector(initialMood, onChange) {
  const wrapper = createTag('div', { class: 'color-extract-mood' });
  const label = createTag('span', { class: 'color-extract-mood-label' }, 'Color mood');

  let currentMood = initialMood || MOODS.COLORFUL;

  const dropdown = createTag('div', { class: 'color-extract-mood-dropdown' });
  const trigger = createTag('button', {
    class: 'color-extract-mood-trigger',
    type: 'button',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-label': 'Select color mood',
  });
  const triggerText = createTag('span', { class: 'color-extract-mood-trigger-text' }, MOOD_LABELS[currentMood] || 'Colorful');
  const triggerChevron = createTag('span', { class: 'color-extract-mood-chevron' });
  triggerChevron.innerHTML = CHEVRON_SVG;
  trigger.append(triggerText, triggerChevron);

  const popover = createTag('div', {
    class: 'color-extract-mood-popover',
    role: 'listbox',
    'aria-label': 'Color mood options',
  });
  popover.hidden = true;

  MOOD_LIST.forEach((mood) => {
    const option = createTag('button', {
      class: `color-extract-mood-option ${mood === currentMood ? 'is-selected' : ''}`,
      type: 'button',
      role: 'option',
      'aria-selected': mood === currentMood ? 'true' : 'false',
      'data-mood': mood,
    }, MOOD_LABELS[mood]);

    option.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mood === currentMood) {
        closePopover();
        return;
      }
      setMood(mood);
      onChange(mood);
      closePopover();
    });

    popover.append(option);
  });

  dropdown.append(trigger, popover);

  function openPopover() {
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.classList.add('is-open');
  }

  function closePopover() {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('is-open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (popover.hidden) openPopover();
    else closePopover();
  });

  document.addEventListener('click', () => closePopover());

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopover();
  });

  function setMood(mood) {
    currentMood = mood;
    triggerText.textContent = MOOD_LABELS[mood] || mood;

    popover.querySelectorAll('.color-extract-mood-option').forEach((opt) => {
      const isSelected = opt.dataset.mood === mood;
      opt.classList.toggle('is-selected', isSelected);
      opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  wrapper.append(label, dropdown);

  return { element: wrapper, setMood };
}
