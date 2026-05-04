import { createTag } from '../../../scripts/utils.js';
import { MOOD_LIST, MOODS } from './constants.js';
import { DEFAULT_PLACEHOLDERS as COLOR_EXTRACT_DEFAULTS } from '../../../scripts/color-shared/i18n/loadColorExtractPlaceholders.js';

function buildMoodLabels(strings) {
  return {
    [MOODS.COLORFUL]: strings.moodColorful,
    [MOODS.BRIGHT]: strings.moodBright,
    [MOODS.MUTED]: strings.moodMuted,
    [MOODS.DEEP]: strings.moodDeep,
    [MOODS.DARK]: strings.moodDark,
    [MOODS.NONE]: strings.moodNone,
  };
}

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
export default function createMoodSelector(initialMood, onChange, options = {}) {
  const strings = { ...COLOR_EXTRACT_DEFAULTS, ...(options.strings || {}) };
  const MOOD_LABELS = buildMoodLabels(strings);

  const wrapper = createTag('div', { class: 'color-extract-mood' });
  const label = createTag('span', { class: 'color-extract-mood-label' }, strings.moodLabel);

  let currentMood = initialMood || MOODS.COLORFUL;

  const dropdown = createTag('div', { class: 'color-extract-mood-dropdown' });
  const trigger = createTag('button', {
    class: 'color-extract-mood-trigger',
    type: 'button',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-label': strings.moodTriggerAria,
  });
  const triggerText = createTag('span', { class: 'color-extract-mood-trigger-text' }, MOOD_LABELS[currentMood] || MOOD_LABELS[MOODS.COLORFUL]);
  const triggerChevron = createTag('span', { class: 'color-extract-mood-chevron' });
  triggerChevron.innerHTML = CHEVRON_SVG;
  trigger.append(triggerText, triggerChevron);

  const popover = createTag('div', {
    class: 'color-extract-mood-popover',
    role: 'listbox',
    'aria-label': strings.moodPopoverAria,
  });
  popover.hidden = true;

  function closePopover() {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('is-open');
  }

  function setMood(mood) {
    currentMood = mood;
    triggerText.textContent = MOOD_LABELS[mood] || mood;

    popover.querySelectorAll('.color-extract-mood-option').forEach((opt) => {
      const isSelected = opt.dataset.mood === mood;
      opt.classList.toggle('is-selected', isSelected);
      opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function getOptions() {
    return [...popover.querySelectorAll('.color-extract-mood-option')];
  }

  function focusOption(option) {
    if (option) option.focus();
  }

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
        trigger.focus();
        return;
      }
      setMood(mood);
      onChange(mood);
      closePopover();
      trigger.focus();
    });

    popover.append(option);
  });

  dropdown.append(trigger, popover);

  function openPopover() {
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.classList.add('is-open');
    const selected = popover.querySelector('.color-extract-mood-option.is-selected')
      || getOptions()[0];
    focusOption(selected);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (popover.hidden) openPopover();
    else closePopover();
  });

  document.addEventListener('click', () => closePopover());

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePopover();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (popover.hidden) openPopover();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (popover.hidden) {
        e.preventDefault();
        openPopover();
      }
    }
  });

  popover.addEventListener('keydown', (e) => {
    const options = getOptions();
    const focused = document.activeElement;
    const index = options.indexOf(focused);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusOption(options[(index + 1) % options.length]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusOption(options[(index - 1 + options.length) % options.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusOption(options[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusOption(options[options.length - 1]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePopover();
      trigger.focus();
    } else if (e.key === 'Tab') {
      closePopover();
    }
  });

  wrapper.append(label, dropdown);

  return { element: wrapper, setMood };
}
