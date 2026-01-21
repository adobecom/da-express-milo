import { html } from '../../../scripts/vendors/htm-preact.js';
import { useStore } from './Contexts.js';

export function CheckboxSelector({ attribute }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, name } = attribute;
  const isChecked = selectedOptionValue === selector.checkedValue;

  const handleChange = () => {
    const nextValue = isChecked ? selector.uncheckedValue : selector.checkedValue;
    actions.selectOption(name, nextValue);
  };

  return html`
    <div class="pdpx-standard-selector-container">
      <label>
        <input
          type="checkbox"
          name="${name}"
          checked="${isChecked}"
          onChange=${handleChange}
        />
        <span>${selector.title}${selector.priceDelta ? ` ${selector.priceDelta}` : ''}</span>
      </label>
    </div>
  `;
}

export function DropdownSelector({ attribute }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, title } = attribute;

  const handleChange = (event) => {
    actions.selectOption(attribute.name, event.target.value);
  };

  return html`
    <div class="pdpx-standard-selector-container">
      <label class="pdpx-standard-selector-label">${title}</label>
      <select
        class="pdpx-standard-selector"
        name="${attribute.name}"
        value="${selectedOptionValue}"
        onChange=${handleChange}
      >
        ${selector.options.map((option) => html`
          <option key="${option.value}" value="${option.value}">
            ${option.title}${option.priceDelta ? ` ${option.priceDelta}` : ''}
          </option>
        `)}
      </select>
      ${selector.message && html`
        <div class="pdpx-standard-selector-message">${selector.message}</div>
      `}
    </div>
  `;
}

export function QuantitySelector() {
  const { state, actions } = useStore();

  if (!state) {
    return null;
  }

  const { quantity, quantityOptions } = state;

  const handleChange = (event) => {
    const nextQuantity = parseInt(event.target.value, 10);
    actions.selectQuantity(nextQuantity);
  };

  return html`
    <div class="pdpx-standard-selector-container">
      <label class="pdpx-standard-selector-label">Quantity</label>
      <select
        class="pdpx-standard-selector"
        name="qty"
        value="${quantity}"
        onChange=${handleChange}
      >
        ${quantityOptions.map((option) => html`
          <option key="${option.quantity}" value="${option.quantity}">
            ${option.label}${option.discount ? ` (Save ${option.discount})` : ''}
          </option>
        `)}
      </select>
    </div>
  `;
}

export function RadioSelector({ attribute }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, name, title } = attribute;

  const handleChange = (value) => {
    if (value !== selectedOptionValue) {
      actions.selectOption(name, value);
    }
  };

  return html`
    <div class="pdpx-standard-selector-container">
      <label class="pdpx-standard-selector-label">${title}</label>
      <div class="pdpx-radio-selector-options">
        ${selector.options.map((option) => html`
          <label key="${option.value}">
            <input
              type="radio"
              name="${name}"
              value="${option.value}"
              checked="${option.value === selectedOptionValue}"
              onChange=${() => handleChange(option.value)}
            />
            <span>${option.title}${option.priceDelta ? ` ${option.priceDelta}` : ''}</span>
          </label>
        `)}
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
  return selector.optionGroups.flatMap(
    (group) => (group.options || []).map((option) => ({ ...option, groupTitle: group.title })),
  );
}

export function ThumbnailSelector({ attribute, onRequestDrawer }) {
  const { actions } = useStore();
  const { selector, selectedOptionValue, title, helpLink } = attribute;

  const allOptions = flattenOptionGroups(selector);
  const selectedOption = allOptions
    .find((option) => option.value === selectedOptionValue) || allOptions[0];
  const selectedOptionTitle = selectedOption?.title || '';

  if (!allOptions.length) {
    return null;
  }

  const isMiniPill = attribute.name === 'color' || attribute.name === 'media';
  const hasDrawerLink = typeof onRequestDrawer === 'function' && helpLink?.type === 'dialog' && helpLink.dialogType;

  const handleOptionClick = (option) => {
    if (option.value !== selectedOptionValue) {
      actions.selectOption(attribute.name, option.value);
    }
  };

  const triggerDrawer = () => {
    if (hasDrawerLink) {
      onRequestDrawer({ type: helpLink.dialogType, payload: { attribute, helpLink } });
    }
  };

  if (isMiniPill) {
    return html`
      <div class="pdpx-pill-selector-container">
        <div class="pdpx-pill-selector-label-container">
          <div class="pdpx-pill-selector-label-name-container">
            <span class="pdpx-pill-selector-label-label">${title}:</span>
            <span class="pdpx-pill-selector-label-name">${selectedOptionTitle}</span>
          </div>
          ${hasDrawerLink && html`
            <button
              class="pdpx-pill-selector-label-compare-link"
              type="button"
              onClick=${triggerDrawer}
            >
              ${helpLink.label}
            </button>
          `}
        </div>
        <div class="pdpx-mini-pill-selector-options-container">
          <select class="pdpx-hidden-select-input" name="${attribute.name}" id="${attribute.name}">
            ${allOptions.map((option) => html`
              <option key="${option.value}" value="${option.value}" selected="${option.value === selectedOptionValue}">
                ${option.title}
              </option>
            `)}
          </select>
          ${allOptions.map((option) => {
            const thumbnailUrl = updateImageUrl(option.imageUrl, 48);
            const isSelected = option.value === selectedOptionValue;
            return html`
              <div key="${option.value}" class="pdpx-mini-pill-container">
                <button
                  class="pdpx-mini-pill-image-container ${isSelected ? 'selected' : ''}"
                  type="button"
                  data-name="${option.value}"
                  data-title="${option.title}"
                  onClick=${() => handleOptionClick(option)}
                >
                  <img class="pdpx-mini-pill-image" src="${thumbnailUrl}" alt="${option.title}" />
                </button>
                <div class="pdpx-mini-pill-text-container">
                  ${option.priceDelta && html`<span class="pdpx-mini-pill-price">${option.priceDelta}</span>`}
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  return html`
    <div class="pdpx-pill-selector-container">
      <span class="pdpx-pill-selector-label">${title}</span>
      <div class="pdpx-pill-selector-options-container">
        <select class="pdpx-hidden-select-input" name="${attribute.name}" id="${attribute.name}">
          ${allOptions.map((option) => html`
            <option key="${option.value}" value="${option.value}" selected="${option.value === selectedOptionValue}">
              ${option.title}
            </option>
          `)}
        </select>
        ${selector.optionGroups?.map((group) => html`
          <div key="${group.title || 'group'}">
            ${group.title && html`<div class="pdpx-option-group-title">${group.title}</div>`}
            ${(group.options || []).map((option) => {
              const thumbnailUrl = updateImageUrl(option.imageUrl);
              const isSelected = option.value === selectedOptionValue;
              return html`
                <button
                  key="${option.value}"
                  class="pdpx-pill-container ${isSelected ? 'selected' : ''}"
                  type="button"
                  data-name="${option.value}"
                  onClick=${() => handleOptionClick(option)}
                >
                  <div class="pdpx-pill-image-container">
                    <img class="pdpx-pill-image" src="${thumbnailUrl}" alt="${option.title}" />
                  </div>
                  <div class="pdpx-pill-text-container">
                    <span class="pdpx-pill-text-name">${option.title}</span>
                    ${option.priceDelta && html`
                      <span class="pdpx-pill-text-price">${option.priceDelta}</span>
                    `}
                  </div>
                </button>
              `;
            })}
          </div>
        `)}
      </div>
      ${selector.preview && html`
        <div class="pdpx-preview-container">
          <img src="${updateImageUrl(selector.preview.imageUrl, 192)}" alt="${selector.preview.optionTitle}" />
          <div dangerouslySetInnerHTML=${{ __html: selector.preview.descriptionHTML }} />
        </div>
      `}
    </div>
  `;
}

function renderAttribute(attribute, onRequestDrawer) {
  switch (attribute.selector.type) {
  case 'thumbnails':
    return html`<${ThumbnailSelector} attribute=${attribute} onRequestDrawer=${onRequestDrawer} />`;
  case 'dropdown':
    return html`<${DropdownSelector} attribute=${attribute} />`;
  case 'radio':
    return html`<${RadioSelector} attribute=${attribute} />`;
  case 'checkbox':
    return html`<${CheckboxSelector} attribute=${attribute} />`;
  default:
    return null;
  }
}

export function CustomizationInputs({ onRequestDrawer }) {
  const { state } = useStore();

  if (!state) {
    return null;
  }

  const productAttributes = (state.attributes || []).filter((attribute) => attribute.name !== 'quantity');

  return html`
    <div class="pdpx-customization-inputs-container" id="pdpx-customization-inputs-container">
      <form class="pdpx-customization-inputs-form" id="pdpx-customization-inputs-form">
        ${productAttributes.map((attribute) => html`
          <div key="${attribute.name}">
            ${renderAttribute(attribute, onRequestDrawer)}
          </div>
        `)}
        <${QuantitySelector} />
      </form>
    </div>
  `;
}
