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
const CHECK_SVG = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false">
  <path d="M3.50115 9.50298C3.20135 9.50298 2.91717 9.36821 2.72674 9.13579L0.276542 6.13579C-0.0730679 5.70806 -0.00958785 5.07817 0.418142 4.72856C0.845872 4.37797 1.47673 4.44243 1.82537 4.87016L3.4826 6.89946L8.16228 0.888716C8.50115 0.453166 9.12908 0.372116 9.5656 0.713916C10.0012 1.05279 10.0793 1.68169 9.7404 2.11724L4.2902 9.11724C4.10368 9.35747 3.81754 9.49908 3.51286 9.50298H3.50115Z" fill="currentColor"/>
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
    const checkIcon = createTag('span', { class: 'color-extract-mood-option-check', 'aria-hidden': 'true' });
    checkIcon.innerHTML = CHECK_SVG;
    const optionText = createTag('span', { class: 'color-extract-mood-option-text' }, MOOD_LABELS[mood]);
    const option = createTag('button', {
      class: `color-extract-mood-option ${mood === currentMood ? 'is-selected' : ''}`,
      type: 'button',
      role: 'option',
      'aria-selected': mood === currentMood ? 'true' : 'false',
      'data-mood': mood,
    }, [checkIcon, optionText]);

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
    const pOptions = getOptions();
    const focused = document.activeElement;
    const index = pOptions.indexOf(focused);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusOption(pOptions[(index + 1) % pOptions.length]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusOption(pOptions[(index - 1 + pOptions.length) % pOptions.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusOption(pOptions[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusOption(pOptions[pOptions.length - 1]);
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
