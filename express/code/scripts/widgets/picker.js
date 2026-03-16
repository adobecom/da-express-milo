import { getLibs, createTag } from '../utils.js';

let stylesLoaded = false;
let loadStyle;
let getConfig;

async function initUtils() {
  if (!loadStyle) {
    const utils = await import(`${getLibs()}/utils/utils.js`);
    ({ loadStyle, getConfig } = utils);
  }
}

async function loadPickerStyles() {
  if (stylesLoaded) return;
  await initUtils();
  const config = getConfig();
  loadStyle(`${config.codeRoot}/scripts/widgets/picker.css`);
  stylesLoaded = true;
}

export async function createPicker({
  id,
  name,
  label = '',
  required = false,
  helpText = '',
  options = [],
  defaultValue = null,
  onChange = null,
  disabled = false,
  size = 'm',
  variant = 'default',
  labelPosition = 'top',
  ariaLabel = '',
  ariaDescribedBy = '',
  maintainFocusAfterChange = false,
} = {}) {
  await loadPickerStyles();

  let currentValue = defaultValue || (options.length > 0 ? options[0].value : '');
  let isOpen = false;
  let focusedOptionIndex = -1;
  let optionElements = [];
  let focusObserver = null;
  let cleanupObserver = null;

  const container = createTag('div', { class: 'picker-container' });

  if (size && size !== 'm') {
    container.classList.add(`size-${size}`);
  }
  if (variant && variant !== 'default') {
    container.classList.add(variant);
  }
  if (labelPosition === 'side') {
    container.classList.add('side');
  }

  const labelId = `${id}-label`;
  const inputId = `${id}-input`;
  if (label) {
    const labelEl = createTag('label', {
      class: `picker-label${required ? ' required' : ''}`,
      id: labelId,
    });
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  const buttonWrapperAttrs = {
    class: 'picker-button-wrapper',
    id,
    role: 'combobox',
    tabindex: disabled ? '-1' : '0',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-activedescendant': '',
  };

  if (required) {
    buttonWrapperAttrs['aria-required'] = 'true';
  }

  if (label) {
    buttonWrapperAttrs['aria-labelledby'] = labelId;
  } else if (ariaLabel) {
    buttonWrapperAttrs['aria-label'] = ariaLabel;
  }

  if (ariaDescribedBy) buttonWrapperAttrs['aria-describedby'] = ariaDescribedBy;

  const buttonWrapper = createTag('div', buttonWrapperAttrs);

  const currentValueSpan = createTag('span', { class: 'picker-current-value' });
  const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));
  currentValueSpan.textContent = selectedOption ? selectedOption.text : '';

  const chevron = createTag('img', {
    class: 'picker-chevron',
    src: '/express/code/icons/drop-down-arrow.svg',
    alt: '',
    'aria-hidden': 'true',
  });

  buttonWrapper.appendChild(currentValueSpan);
  buttonWrapper.appendChild(chevron);

  const optionsWrapper = createTag('ul', {
    class: 'picker-options-wrapper',
    role: 'listbox',
  });

  const hiddenInput = createTag('input', {
    type: 'hidden',
    name: name || id,
    value: currentValue,
    id: inputId,
  });

  const statusRegion = createTag('div', {
    'aria-live': 'polite',
    'aria-atomic': 'true',
    class: 'visually-hidden',
  });

  const openDropdown = () => {
    if (container.classList.contains('disabled')) return;
    isOpen = true;
    container.classList.add('opened');
    buttonWrapper.setAttribute('aria-expanded', 'true');
    focusedOptionIndex = -1;
  };

  const closeDropdown = () => {
    isOpen = false;
    container.classList.remove('opened');
    buttonWrapper.setAttribute('aria-expanded', 'false');
    focusedOptionIndex = -1;
    optionsWrapper.querySelectorAll('.picker-option-button').forEach((opt) => {
      opt.classList.remove('focused');
    });
  };

  const toggleDropdown = () => {
    if (container.classList.contains('disabled')) return;
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const createOptionButtons = (opts) => {
    optionsWrapper.innerHTML = '';
    optionElements = [];
    opts.forEach(({ value, text, disabled: optionDisabled }, index) => {
      const isActive = String(value) === String(currentValue);
      const optionId = `${id}-option-${index}`;
      const optionButton = createTag('li', {
        class: `picker-option-button${isActive ? ' active' : ''}${optionDisabled ? ' disabled' : ''}`,
        'data-value': value,
        id: optionId,
        role: 'option',
        'aria-selected': isActive ? 'true' : 'false',
      });

      if (isActive) {
        const checkmark = createTag('img', {
          class: 'picker-option-checkmark',
          src: '/express/code/icons/checkmark.svg',
          alt: '',
          'aria-hidden': 'true',
        });
        optionButton.appendChild(checkmark);
      }

      const textSpan = createTag('span', { class: 'picker-option-text' });
      textSpan.textContent = text;
      optionButton.appendChild(textSpan);

      if (!optionDisabled) {
        optionButton.addEventListener('click', () => {
          if (String(currentValue) !== String(value)) {
            currentValue = value;
            currentValueSpan.textContent = text;
            hiddenInput.value = value;

            optionElements.forEach((opt) => {
              opt.classList.remove('active');
              opt.setAttribute('aria-selected', 'false');
              const existingCheckmark = opt.querySelector('.picker-option-checkmark');
              if (existingCheckmark) {
                existingCheckmark.remove();
              }
            });

            optionButton.classList.add('active');
            optionButton.setAttribute('aria-selected', 'true');
            const checkmark = createTag('img', {
              class: 'picker-option-checkmark',
              src: '/express/code/icons/checkmark.svg',
              alt: '',
              'aria-hidden': 'true',
            });
            optionButton.insertBefore(checkmark, optionButton.firstChild);

            statusRegion.textContent = `Selected: ${text}`;
            setTimeout(() => { statusRegion.textContent = ''; }, 1000);

            if (onChange) {
              if (maintainFocusAfterChange) {
                if (focusObserver) focusObserver.disconnect();

                focusObserver = new MutationObserver((mutations, obs) => {
                  const newButton = document.getElementById(id);
                  if (newButton && newButton !== buttonWrapper) {
                    newButton.focus();
                    obs.disconnect();
                    focusObserver = null;
                  }
                });

                const observeTarget = container.parentElement || document.body;
                focusObserver.observe(observeTarget, { childList: true, subtree: true });
                onChange(value, { target: { value } });

                setTimeout(() => {
                  if (focusObserver) {
                    focusObserver.disconnect();
                    focusObserver = null;
                  }
                }, 2000);
              } else {
                onChange(value, { target: { value } });
              }
            }
          }
          closeDropdown();
        });
      }

      optionElements.push(optionButton);
      optionsWrapper.appendChild(optionButton);
    });
  };

  createOptionButtons(options);

  buttonWrapper.addEventListener('click', toggleDropdown);

  const updateFocusedOption = () => {
    const opts = optionElements.filter((opt) => !opt.classList.contains('disabled'));
    opts.forEach((opt, idx) => {
      if (idx === focusedOptionIndex) {
        opt.classList.add('focused');
        opt.scrollIntoView({ block: 'nearest' });
        buttonWrapper.setAttribute('aria-activedescendant', opt.id);
      } else {
        opt.classList.remove('focused');
      }
    });

    if (focusedOptionIndex === -1) {
      buttonWrapper.setAttribute('aria-activedescendant', '');
    }
  };

  buttonWrapper.addEventListener('keydown', (e) => {
    const opts = optionElements.filter((opt) => !opt.classList.contains('disabled'));

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && focusedOptionIndex >= 0) {
        opts[focusedOptionIndex]?.click();
      } else {
        toggleDropdown();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      buttonWrapper.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        focusedOptionIndex = 0;
      } else {
        focusedOptionIndex = Math.min(focusedOptionIndex + 1, opts.length - 1);
      }
      updateFocusedOption();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        focusedOptionIndex = opts.length - 1;
      } else {
        focusedOptionIndex = Math.max(focusedOptionIndex - 1, 0);
      }
      updateFocusedOption();
    } else if (e.key === 'Home' && isOpen) {
      e.preventDefault();
      focusedOptionIndex = 0;
      updateFocusedOption();
    } else if (e.key === 'End' && isOpen) {
      e.preventDefault();
      focusedOptionIndex = opts.length - 1;
      updateFocusedOption();
    } else if (e.key === 'Tab') {
      if (isOpen) {
        closeDropdown();
      }
    }
  });

  const handleClickOutside = (e) => {
    if (isOpen && !container.contains(e.target)) {
      closeDropdown();
    }
  };
  document.addEventListener('click', handleClickOutside);

  cleanupObserver = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      container.destroy();
      if (cleanupObserver) cleanupObserver.disconnect();
    }
  });
  cleanupObserver.observe(document.body, { childList: true, subtree: true });

  const componentWrapper = labelPosition === 'side'
    ? createTag('div', { class: 'picker-wrapper' })
    : container;

  componentWrapper.appendChild(buttonWrapper);
  componentWrapper.appendChild(optionsWrapper);
  componentWrapper.appendChild(hiddenInput);
  componentWrapper.appendChild(statusRegion);

  if (labelPosition === 'side') {
    container.appendChild(componentWrapper);
  }

  if (helpText) {
    const helpTextId = `${id}-help`;
    const helpTextEl = createTag('div', {
      class: 'picker-help-text',
      id: helpTextId,
    });
    helpTextEl.textContent = helpText;
    componentWrapper.appendChild(helpTextEl);

    if (!ariaDescribedBy) {
      buttonWrapper.setAttribute('aria-describedby', helpTextId);
    }
  }

  container.setPicker = (value) => {
    const option = options.find((opt) => String(opt.value) === String(value));
    if (option) {
      currentValue = value;
      currentValueSpan.textContent = option.text;
      hiddenInput.value = value;

      optionElements.forEach((opt) => {
        opt.classList.remove('active');
        opt.setAttribute('aria-selected', 'false');
        const existingCheckmark = opt.querySelector('.picker-option-checkmark');
        if (existingCheckmark) {
          existingCheckmark.remove();
        }

        if (String(opt.getAttribute('data-value')) === String(value)) {
          opt.classList.add('active');
          opt.setAttribute('aria-selected', 'true');
          const checkmark = createTag('img', {
            class: 'picker-option-checkmark',
            src: '/express/code/icons/checkmark.svg',
            alt: '',
            'aria-hidden': 'true',
          });
          opt.insertBefore(checkmark, opt.firstChild);
        }
      });

      statusRegion.textContent = `Selected: ${option.text}`;
      setTimeout(() => { statusRegion.textContent = ''; }, 1000);

      if (onChange) {
        onChange(value, { target: { value } });
      }
    }
  };

  container.getPicker = () => currentValue;

  container.setOptions = (newOptions) => {
    createOptionButtons(newOptions);
    if (!newOptions.find((opt) => String(opt.value) === String(currentValue))) {
      currentValue = newOptions[0]?.value || '';
      currentValueSpan.textContent = newOptions[0]?.text || '';
      hiddenInput.value = currentValue;
    }
  };

  container.setDisabled = (isDisabled) => {
    if (isDisabled) {
      buttonWrapper.setAttribute('tabindex', '-1');
      container.classList.add('disabled');
      closeDropdown();
    } else {
      buttonWrapper.setAttribute('tabindex', '0');
      container.classList.remove('disabled');
    }
  };

  container.setError = (errorMessage) => {
    container.classList.add('error');
    const helpTextEl = container.querySelector('.picker-help-text');
    if (helpTextEl) {
      helpTextEl.textContent = errorMessage;
    } else if (errorMessage) {
      const helpTextId = `${id}-help`;
      const newHelpText = createTag('div', {
        class: 'picker-help-text',
        id: helpTextId,
      });
      newHelpText.textContent = errorMessage;
      componentWrapper.appendChild(newHelpText);
      buttonWrapper.setAttribute('aria-describedby', helpTextId);
    }
  };

  container.clearError = () => {
    container.classList.remove('error');
    const helpTextEl = container.querySelector('.picker-help-text');
    if (helpTextEl) {
      if (helpText) {
        helpTextEl.textContent = helpText;
      } else {
        helpTextEl.remove();
      }
    }
  };

  container.setLoading = (isLoading) => {
    if (isLoading) {
      container.classList.add('loading');
      container.setDisabled(true);
    } else {
      container.classList.remove('loading');
      if (!disabled) {
        container.setDisabled(false);
      }
    }
  };

  container.destroy = () => {
    document.removeEventListener('click', handleClickOutside);
    if (focusObserver) {
      focusObserver.disconnect();
      focusObserver = null;
    }
    if (cleanupObserver) {
      cleanupObserver.disconnect();
    }
  };

  if (disabled) {
    container.setDisabled(true);
  }

  return container;
}

export default function decorate(block) {
  const config = {};

  const rows = [...block.children];
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();

      if (key === 'id') config.id = value;
      if (key === 'name') config.name = value;
      if (key === 'label') config.label = value;
      if (key === 'required') config.required = value === 'true';
      if (key === 'help text') config.helpText = value;
      if (key === 'size') config.size = value;
      if (key === 'variant') config.variant = value;
      if (key === 'disabled') config.disabled = value === 'true';
      if (key === 'default') config.defaultValue = value;
      if (key === 'options') {
        config.options = value.split(',').map((opt) => {
          const [optValue, optText] = opt.trim().split('|');
          return {
            value: optValue.trim(),
            text: optText ? optText.trim() : optValue.trim(),
          };
        });
      }
    }
  });

  if (!config.id) config.id = `picker-${Math.random().toString(36).slice(2, 9)}`;
  if (!config.options) config.options = [];

  const picker = createPicker(config);
  block.innerHTML = '';
  block.appendChild(picker);
}
