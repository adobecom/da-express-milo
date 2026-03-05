import {
  html,
  useEffect,
  useRef,
} from '../../../scripts/vendors/htm-preact.js';
import { useStore } from './Contexts.js';
import createSimpleCarousel from '../../../scripts/widgets/simple-carousel.js';
import { createPicker } from '../../../scripts/widgets/picker.js';

function toDomIdPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function positionTooltip(target, tooltipText) {
  const pill = target.getBoundingClientRect();
  const pillTop = pill.top;
  const tooltipWidth = (tooltipText.length * 3) + 12;
  const pillCenter = pill.left + (pill.width / 2);
  const drawer = target.closest('.pdpx-drawer');
  const drawerOffsetLeft = drawer ? drawer.getBoundingClientRect().left : 0;
  target.style.setProperty('--tooltip-top', `${pillTop - 42}px`);
  target.style.setProperty('--tooltip-left', `${pillCenter - tooltipWidth - drawerOffsetLeft}px`);
  target.style.setProperty('--arrow-top', `${pillTop - 6}px`);
  target.style.setProperty('--arrow-left', `${pillCenter - drawerOffsetLeft}px`);
}

export function CheckboxSelector({ attribute }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, name } = attribute;
  const isChecked = selectedOptionValue === selector.checkedValue;
  const checkboxId = `pdpx-checkbox-${toDomIdPart(name)}`;

  const handleChange = () => {
    const nextValue = isChecked
      ? selector.uncheckedValue
      : selector.checkedValue;
    actions.selectOption(name, nextValue);
  };

  return html`
    <div class="pdpx-standard-selector-container">
      <label htmlFor="${checkboxId}">
        <input
          id="${checkboxId}"
          type="checkbox"
          name="${name}"
          checked="${isChecked}"
          onChange=${handleChange}
        />
        <span
          >${selector.title}${selector.priceDelta
  ? ` ${selector.priceDelta}`
  : ''}</span
        >
      </label>
    </div>
  `;
}

export function DropdownSelector({ attribute }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, title } = attribute;
  const pickerHostRef = useRef(null);
  const pickerRef = useRef(null);
  const pickerIdRef = useRef(`pdpx-picker-${attribute.name}`);
  const options = selector.options || [];
  const optionsSignature = options
    .map((option) => `${option.value}:${option.title}:${option.priceDelta || ''}`)
    .join('|');

  useEffect(() => {
    let cancelled = false;

    async function mountPicker() {
      if (!pickerHostRef.current) {
        return;
      }

      if (pickerRef.current?.destroy) {
        pickerRef.current.destroy();
        pickerRef.current = null;
      }

      pickerHostRef.current.innerHTML = '';
      const pickerOptions = options.map((option) => ({
        value: option.value,
        text: `${option.title}${option.priceDelta ? ` ${option.priceDelta}` : ''}`,
      }));

      const picker = await createPicker({
        id: pickerIdRef.current,
        name: attribute.name,
        label: title,
        labelPosition: 'side',
        options: pickerOptions,
        defaultValue: selectedOptionValue,
        onChange: (value) => {
          actions.selectOption(attribute.name, value);
        },
      });

      if (cancelled || !pickerHostRef.current) {
        picker?.destroy?.();
        return;
      }

      pickerHostRef.current.appendChild(picker);
      pickerRef.current = picker;
    }

    mountPicker();

    return () => {
      cancelled = true;
      if (pickerRef.current?.destroy) {
        pickerRef.current.destroy();
        pickerRef.current = null;
      }
      if (pickerHostRef.current) {
        pickerHostRef.current.innerHTML = '';
      }
    };
  }, [attribute.name, title, optionsSignature]);

  useEffect(() => {
    if (!pickerRef.current?.getPicker || !pickerRef.current?.setPicker) {
      return;
    }
    if (String(pickerRef.current.getPicker()) !== String(selectedOptionValue)) {
      pickerRef.current.setPicker(selectedOptionValue);
    }
  }, [selectedOptionValue]);

  return html`
    <div class="pdpx-standard-selector-container">
      <div ref=${pickerHostRef} />
      ${selector.message
      && html`
        <div class="pdpx-standard-selector-message">${selector.message}</div>
      `}
    </div>
  `;
}

export function QuantitySelector() {
  const { state, actions } = useStore();
  const pickerHostRef = useRef(null);
  const pickerRef = useRef(null);
  const pickerIdRef = useRef('pdpx-picker-qty');

  if (!state) {
    return null;
  }

  const { quantity, quantityOptions } = state;
  const optionsSignature = quantityOptions
    .map((option) => `${option.quantity}:${option.label}:${option.discount || ''}`)
    .join('|');

  useEffect(() => {
    let cancelled = false;

    async function mountPicker() {
      if (!pickerHostRef.current) {
        return;
      }

      if (pickerRef.current?.destroy) {
        pickerRef.current.destroy();
        pickerRef.current = null;
      }

      pickerHostRef.current.innerHTML = '';
      const pickerOptions = quantityOptions.map((option) => ({
        value: String(option.quantity),
        text: `${option.label}${option.discount ? ` (Save ${option.discount})` : ''}`,
      }));

      const picker = await createPicker({
        id: pickerIdRef.current,
        name: 'qty',
        label: 'Quantity',
        labelPosition: 'side',
        options: pickerOptions,
        defaultValue: String(quantity),
        onChange: (value) => {
          const nextQuantity = parseInt(value, 10);
          if (!Number.isNaN(nextQuantity)) {
            actions.selectQuantity(nextQuantity);
          }
        },
      });

      if (cancelled || !pickerHostRef.current) {
        picker?.destroy?.();
        return;
      }

      pickerHostRef.current.appendChild(picker);
      pickerRef.current = picker;
    }

    mountPicker();

    return () => {
      cancelled = true;
      if (pickerRef.current?.destroy) {
        pickerRef.current.destroy();
        pickerRef.current = null;
      }
      if (pickerHostRef.current) {
        pickerHostRef.current.innerHTML = '';
      }
    };
  }, [optionsSignature]);

  useEffect(() => {
    if (!pickerRef.current?.getPicker || !pickerRef.current?.setPicker) {
      return;
    }
    if (String(pickerRef.current.getPicker()) !== String(quantity)) {
      pickerRef.current.setPicker(String(quantity));
    }
  }, [quantity]);

  return html`
    <div class="pdpx-standard-selector-container">
      <div ref=${pickerHostRef} />
    </div>
  `;
}

export function RadioSelector({ attribute }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, name, title } = attribute;
  const groupLabelId = `pdpx-radio-group-label-${toDomIdPart(name)}`;

  const handleChange = (value) => {
    if (value !== selectedOptionValue) {
      actions.selectOption(name, value);
    }
  };

  return html`
    <div class="pdpx-standard-selector-container">
      <label id="${groupLabelId}" class="pdpx-standard-selector-label">${title}</label>
      <div class="pdpx-radio-selector-options" role="radiogroup" aria-labelledby="${groupLabelId}">
        ${selector.options.map(
    (option) => html`
            <label key="${option.value}" htmlFor="pdpx-radio-${toDomIdPart(name)}-${toDomIdPart(option.value)}">
              <input
                id="pdpx-radio-${toDomIdPart(name)}-${toDomIdPart(option.value)}"
                type="radio"
                name="${name}"
                value="${option.value}"
                checked="${option.value === selectedOptionValue}"
                onChange=${() => handleChange(option.value)}
              />
              <span
                >${option.title}${option.priceDelta
  ? ` ${option.priceDelta}`
  : ''}</span
              >
            </label>
          `,
  )}
      </div>
    </div>
  `;
}

function updateImageUrl(url, maxDim = 54) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('max_dim', String(maxDim));
    return urlObj.toString();
  } catch {
    return url;
  }
}

function flattenOptionGroups(selector) {
  if (!selector.optionGroups || !Array.isArray(selector.optionGroups)) {
    return [];
  }
  return selector.optionGroups.flatMap((group) => (group.options || []).map((option) => ({
    ...option,
    groupTitle: group.title,
  })));
}

/**
 * Mini-pill carousel built imperatively to work with createSimpleCarousel.
 * The carousel mutates the DOM (moves children into a platform, adds faders),
 * which conflicts with Preact's reconciliation. By building the pills in useEffect
 * and not rendering them via Preact, we avoid reconciliation conflicts.
 */
function MiniPillCarousel({ attribute, onRequestDrawer }) {
  const containerRef = useRef(null);
  const carouselCleanupRef = useRef(null);
  const { actions } = useStore();
  const { selector, selectedOptionValue, title, helpLink } = attribute;
  const allOptions = flattenOptionGroups(selector);
  const selectedOption = allOptions.find((option) => option.value === selectedOptionValue)
    || allOptions[0];
  const selectedOptionTitle = selectedOption?.title || '';
  const groupLabelId = `pdpx-mini-pill-label-${toDomIdPart(attribute.name)}`;
  const groupValueId = `pdpx-mini-pill-selected-value-${toDomIdPart(attribute.name)}`;
  const hiddenInputId = `pdpx-hidden-input-${attribute.name}`;
  const hasDrawerLink = typeof onRequestDrawer === 'function'
    && helpLink?.type === 'dialog'
    && helpLink.dialogType;

  const handleOptionClick = (option) => {
    if (option.value !== selectedOptionValue) {
      actions.selectOption(attribute.name, option.value);
    }
  };

  const triggerDrawer = () => {
    if (hasDrawerLink) {
      onRequestDrawer({
        type: helpLink.dialogType,
        payload: { attribute, helpLink },
      });
    }
  };

  // Build pills imperatively and initialize carousel (avoids Preact reconciliation conflict)
  useEffect(() => {
    if (!containerRef.current || !allOptions.length) {
      return undefined;
    }

    const container = containerRef.current;
    container.innerHTML = '';

    allOptions.forEach((option) => {
      const thumbnailUrl = updateImageUrl(option.imageUrl, 48);
      const isSelected = option.value === selectedOptionValue;
      const optionIndex = allOptions.findIndex((candidate) => candidate.value === option.value);

      const pillContainer = document.createElement('div');
      pillContainer.className = 'pdpx-mini-pill-container';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}`;
      button.setAttribute('data-name', option.value);
      button.setAttribute('data-title', option.title);
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-current', isSelected ? 'true' : 'false');
      button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      button.setAttribute('aria-posinset', String(optionIndex + 1));
      button.setAttribute('aria-setsize', String(allOptions.length));
      button.setAttribute('aria-label', option.title);
      button.addEventListener('click', () => handleOptionClick(option));

      const img = document.createElement('img');
      img.className = 'pdpx-mini-pill-image';
      img.src = thumbnailUrl;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      button.appendChild(img);

      pillContainer.addEventListener('mouseenter', (event) => {
        positionTooltip(event.currentTarget, option.title);
      });

      const textContainer = document.createElement('div');
      textContainer.className = 'pdpx-mini-pill-text-container';
      if (option.priceDelta) {
        const priceSpan = document.createElement('span');
        priceSpan.className = 'pdpx-mini-pill-price';
        priceSpan.textContent = option.priceDelta;
        textContainer.appendChild(priceSpan);
      }

      pillContainer.appendChild(button);
      pillContainer.appendChild(textContainer);
      container.appendChild(pillContainer);
    });

    createSimpleCarousel('.pdpx-mini-pill-container', container, {
      ariaLabel: `${title} options`,
      centerActive: true,
      activeClass: 'selected',
    }).then((carousel) => {
      if (carousel) {
        carouselCleanupRef.current = carousel.cleanup;
      }
    });

    return () => {
      if (carouselCleanupRef.current) {
        carouselCleanupRef.current();
        carouselCleanupRef.current = null;
      }
    };
  }, [
    attribute.name,
    title,
    allOptions.map((o) => o.value).join(','),
  ]);

  // Update selected state when selection changes
  useEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll('.pdpx-mini-pill-image-container');
    buttons.forEach((btn) => {
      const value = btn.getAttribute('data-name');
      const isSelected = value === selectedOptionValue;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-current', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }, [selectedOptionValue]);

  return html`
    <div class="pdpx-pill-selector-container">
      <div class="pdpx-pill-selector-label-container">
        <div class="pdpx-pill-selector-label-name-container">
          <span id="${groupLabelId}" class="pdpx-pill-selector-label-label">${title}:</span>
          <span id="${groupValueId}" class="pdpx-pill-selector-label-name">${selectedOptionTitle}</span>
        </div>
        ${hasDrawerLink
    && html`
          <button
            class="pdpx-pill-selector-label-compare-link"
            type="button"
            onClick=${triggerDrawer}
          >
            ${helpLink.label}
          </button>
        `}
      </div>
      <div
        ref=${containerRef}
        class="pdpx-mini-pill-selector-options-container"
        role="radiogroup"
        aria-labelledby="${groupLabelId}"
        aria-describedby="${groupValueId}"
      />
      <select
        class="pdpx-hidden-select-input hidden"
        name="${attribute.name}"
        id="${hiddenInputId}"
        aria-hidden="true"
      >
        ${allOptions.map(
    (option) => html`
            <option
              key="${option.value}"
              value="${option.value}"
              selected="${option.value === selectedOptionValue}"
            >
              ${option.title}
            </option>
          `,
  )}
      </select>
    </div>
  `;
}

export function ThumbnailSelector({ attribute, onRequestDrawer }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, title } = attribute;
  const groupLabelId = `pdpx-pill-label-${toDomIdPart(attribute.name)}`;
  const hiddenInputId = `pdpx-hidden-input-${attribute.name}`;

  const allOptions = flattenOptionGroups(selector);

  if (!allOptions.length) {
    return null;
  }

  const isMiniPill = attribute.name === 'color' || attribute.name === 'media';

  const handleOptionClick = (option) => {
    if (option.value !== selectedOptionValue) {
      actions.selectOption(attribute.name, option.value);
    }
  };

  if (isMiniPill) {
    return html`<${MiniPillCarousel} attribute=${attribute} onRequestDrawer=${onRequestDrawer} />`;
  }

  return html`
    <div class="pdpx-pill-selector-container">
      <span id="${groupLabelId}" class="pdpx-pill-selector-label">${title}</span>
      <div role="radiogroup" aria-labelledby="${groupLabelId}">
        ${selector.optionGroups?.map(
    (group) => html`
            <div
              class="pdpx-pill-selector-options-container"
              key="${group.title || 'group'}"
              role="group"
              aria-label="${group.title || `${title} options`}"
            >
              ${group.title
              && html`<div class="pdpx-option-group-title">${group.title}</div>`}
              ${(group.options || []).map((option) => {
    const thumbnailUrl = updateImageUrl(option.imageUrl);
    const isSelected = option.value === selectedOptionValue;
    const optionIndex = allOptions.findIndex((candidate) => candidate.value === option.value);
    return html`
                  <button
                    key="${option.value}"
                    class="pdpx-pill-container ${isSelected ? 'selected' : ''}"
                    type="button"
                    data-name="${option.value}"
                    data-title="${option.title}"
                    role="radio"
                    aria-label="${option.title}"
                    aria-checked="${isSelected ? 'true' : 'false'}"
                    aria-current="${isSelected ? 'true' : 'false'}"
                    aria-pressed="${isSelected ? 'true' : 'false'}"
                    aria-posinset="${optionIndex + 1}"
                    aria-setsize="${allOptions.length}"
                    onClick=${() => handleOptionClick(option)}
                  >
                    <div class="pdpx-pill-image-container">
                      <img
                        class="pdpx-pill-image"
                        src="${thumbnailUrl}"
                        alt=""
                        aria-hidden="true"
                      />
                    </div>
                    <div class="pdpx-pill-text-container">
                      <span class="pdpx-pill-text-name">${option.title}</span>
                      ${option.priceDelta
                      && html`
                        <span class="pdpx-pill-text-price"
                          >${option.priceDelta}</span
                        >
                      `}
                    </div>
                  </button>
                `;
  })}
            </div>
          `,
  )}
      </div>
      <select
        class="pdpx-hidden-select-input hidden"
        name="${attribute.name}"
        id="${hiddenInputId}"
        aria-hidden="true"
      >
        ${allOptions.map(
    (option) => html`
            <option
              key="${option.value}"
              value="${option.value}"
              selected="${option.value === selectedOptionValue}"
            >
              ${option.title}
            </option>
          `,
  )}
      </select>
      ${selector.preview
      && html`
        <div class="pdpx-preview-container">
          <img
            src="${updateImageUrl(selector.preview.imageUrl, 192)}"
            alt="${selector.preview.optionTitle}"
          />
          <div
            dangerouslySetInnerHTML=${{
    __html: selector.preview.descriptionHTML,
  }}
          />
        </div>
      `}
    </div>
  `;
}

function renderAttribute(attribute, onRequestDrawer, key) {
  switch (attribute.selector.type) {
    case 'thumbnails':
      return html`<${ThumbnailSelector}
        key=${key}
        attribute=${attribute}
        onRequestDrawer=${onRequestDrawer}
      />`;
    case 'dropdown':
      return html`<${DropdownSelector} key=${key} attribute=${attribute} />`;
    case 'radio':
      return html`<${RadioSelector} key=${key} attribute=${attribute} />`;
    case 'checkbox':
      return html`<${CheckboxSelector} key=${key} attribute=${attribute} />`;
    default:
      return null;
  }
}

export function CustomizationInputs({ onRequestDrawer }) {
  const { state } = useStore();

  if (!state) {
    return null;
  }

  const productAttributes = (state.attributes || []).filter(
    (attribute) => attribute.name !== 'quantity',
  );

  return html`
    <div
      class="pdpx-customization-inputs-container"
      id="pdpx-customization-inputs-container"
    >
      <form
        class="pdpx-customization-inputs-form"
        id="pdpx-customization-inputs-form"
        aria-label="Product customization options"
      >
        ${productAttributes.map((attribute) => renderAttribute(
    attribute,
    onRequestDrawer,
    attribute.name,
  ))}
        <${QuantitySelector} />
      </form>
    </div>
  `;
}
