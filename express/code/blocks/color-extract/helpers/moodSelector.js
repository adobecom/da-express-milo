import { createTag } from '../../../scripts/utils.js';
import createDropdown from '../../../scripts/color-shared/components/dropdown/dropdown.js';
import { MOOD_LIST, MOODS } from './constants.js';
import { DEFAULT_PLACEHOLDERS as COLOR_EXTRACT_DEFAULTS } from '../../../scripts/color-shared/i18n/loadColorExtractPlaceholders.js';

export default function createMoodSelector(initialMood, onChange, options = {}) {
  const strings = { ...COLOR_EXTRACT_DEFAULTS, ...(options.strings || {}) };
  const labels = {
    [MOODS.COLORFUL]: strings.moodColorful,
    [MOODS.BRIGHT]: strings.moodBright,
    [MOODS.MUTED]: strings.moodMuted,
    [MOODS.DEEP]: strings.moodDeep,
    [MOODS.DARK]: strings.moodDark,
    [MOODS.NONE]: strings.moodNone,
  };
  const wrapper = createTag('div', { class: 'color-extract-mood' });
  const label = createTag('span', { class: 'color-extract-mood-label' });
  label.textContent = strings.moodLabel;
  const dropdown = createDropdown({
    items: MOOD_LIST.map((value) => ({ value, label: labels[value] })),
    value: initialMood || MOODS.COLORFUL,
    onChange,
    ariaLabel: strings.moodTriggerAria,
    popoverLabel: strings.moodPopoverAria,
    classPrefix: 'color-extract-mood',
    dataAttribute: 'mood',
  });
  wrapper.append(label, dropdown.element);
  return { element: wrapper, setMood: dropdown.setValue, destroy: dropdown.destroy };
}
