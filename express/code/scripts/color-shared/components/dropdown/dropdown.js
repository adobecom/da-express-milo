import { createTag } from '../../../utils.js';

const CHEVRON = 'M3 3.5L5 5.5L7 3.5';
const CHECK = 'M3.50115 9.50298C3.20135 9.50298 2.91717 9.36821 2.72674 9.13579L0.276542 6.13579C-0.0730679 5.70806 -0.00958785 5.07817 0.418142 4.72856C0.845872 4.37797 1.47673 4.44243 1.82537 4.87016L3.4826 6.89946L8.16228 0.888716C8.50115 0.453166 9.12908 0.372116 9.5656 0.713916C10.0012 1.05279 10.0793 1.68169 9.7404 2.11724L4.2902 9.11724C4.10368 9.35747 3.81754 9.49908 3.51286 9.50298H3.50115Z';
let nextId = 0;

function icon(check = false) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  Object.entries({
    width: '10', height: '10', viewBox: '0 0 10 10', 'aria-hidden': 'true', focusable: 'false',
  }).forEach(([name, value]) => svg.setAttribute(name, value));
  const path = document.createElementNS(svg.namespaceURI, 'path');
  const attributes = check ? { d: CHECK, fill: 'currentColor' } : {
    d: CHEVRON,
    stroke: 'currentColor',
    'stroke-width': '1.5',
    fill: 'none',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  };
  Object.entries(attributes).forEach(([name, value]) => path.setAttribute(name, value));
  svg.append(path);
  return svg;
}

export default function createDropdown({
  items, value, onChange, ariaLabel, labelledBy, popoverLabel = ariaLabel,
  classPrefix, dataAttribute = 'value',
}) {
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const classes = (part) => `color-dropdown-${part}${classPrefix ? ` ${classPrefix}-${part}` : ''}`;
  const element = createTag('div', {
    class: `color-dropdown${classPrefix ? ` ${classPrefix}-dropdown` : ''}`,
  });
  const trigger = createTag('button', {
    class: classes('trigger'),
    type: 'button',
    'aria-haspopup': 'listbox',
    'aria-expanded': 'false',
    'aria-controls': `color-dropdown-${nextId += 1}`,
    ...(labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': ariaLabel }),
  });
  const text = createTag('span', { class: classes('trigger-text') });
  const chevron = createTag('span', { class: classes('chevron') });
  chevron.append(icon());
  trigger.append(text, chevron);
  const popover = createTag('div', {
    class: classes('popover'),
    id: trigger.getAttribute('aria-controls'),
    role: 'listbox',
    ...(labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': popoverLabel }),
  });
  popover.hidden = true;
  const options = [];

  function close(restoreFocus = false) {
    popover.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    element.classList.remove('is-open');
    if (restoreFocus && !trigger.disabled) trigger.focus();
  }

  function setValue(selected) {
    trigger.value = selected;
    text.textContent = items.find((item) => item.value === selected)?.label || selected;
    options.forEach((option) => {
      const active = option.dataset.value === selected;
      option.classList.toggle('is-selected', active);
      option.setAttribute('aria-selected', String(active));
    });
  }

  items.forEach((item) => {
    const option = createTag('button', {
      class: classes('option'),
      type: 'button',
      role: 'option',
      'data-value': item.value,
      [`data-${dataAttribute}`]: item.value,
    });
    const check = createTag('span', { class: classes('option-check'), 'aria-hidden': 'true' });
    check.append(icon(true));
    const optionText = createTag('span', { class: classes('option-text') });
    optionText.textContent = item.label;
    option.append(check, optionText);
    option.addEventListener('click', (event) => {
      event.stopPropagation();
      if (trigger.disabled) return;
      const changed = trigger.value !== item.value;
      setValue(item.value);
      close(true);
      if (changed) onChange(item.value);
    }, { signal });
    options.push(option);
    popover.append(option);
  });
  setValue(value);

  function open() {
    if (trigger.disabled) return;
    popover.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    element.classList.add('is-open');
    (options.find((option) => option.classList.contains('is-selected')) || options[0])?.focus();
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (popover.hidden) open();
    else close();
  }, { signal });
  document.addEventListener('click', () => close(), { signal });
  // Focus leaving the component also closes it without stealing the new focus.
  element.addEventListener('focusout', (event) => {
    if (!element.contains(event.relatedTarget)) close();
  }, { signal });
  trigger.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key) && popover.hidden) {
      event.preventDefault();
      open();
    } else if (event.key === 'Escape' && !popover.hidden) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  }, { signal });
  popover.addEventListener('keydown', (event) => {
    const index = options.indexOf(document.activeElement);
    let target;
    if (event.key === 'ArrowDown') target = options[(index + 1) % options.length];
    if (event.key === 'ArrowUp') target = options[(index - 1 + options.length) % options.length];
    if (event.key === 'Home') [target] = options;
    if (event.key === 'End') target = options.at(-1);
    if (target) {
      event.preventDefault();
      target.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') {
      // Move from the trigger, not from an option that is about to be hidden.
      close(true);
    }
  }, { signal });
  element.append(trigger, popover);
  return {
    element,
    trigger,
    setValue,
    close,
    get isOpen() { return !popover.hidden; },
    setDisabled(disabled) {
      if (disabled) close();
      trigger.disabled = disabled;
      options.forEach((option) => { option.disabled = disabled; });
    },
    destroy() {
      close();
      lifecycle.abort();
    },
  };
}
