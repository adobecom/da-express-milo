# Spectrum Component API Reference

Detailed API for each Express Spectrum wrapper component.

---

## createExpressPicker

**Import:** `import { createExpressPicker } from '../spectrum/components/express-picker.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | **Required.** Visible label and aria-label |
| `value` | `string` | first option | Initially selected value |
| `options` | `Array<{value, label}>` | `[]` | Dropdown options |
| `onChange` | `Function` | — | Called with `{ value }` on selection change |
| `id` | `string` | — | Optional DOM id suffix |
| `disabled` | `boolean` | `false` | Disable the picker |

### Returns

```js
{
  element: HTMLElement,      // <sp-theme> root — append to DOM
  getValue(): string,        // current selected value
  setValue(v: string): void,  // set selected value
  destroy(): void,           // remove from DOM, clean up
}
```

---

## createExpressButton

**Import:** `import { createExpressButton } from '../spectrum/components/express-button.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | **Required.** Button text |
| `variant` | `'primary'\|'secondary'\|'quiet'\|'danger'` | `'primary'` | Visual variant |
| `size` | `'s'\|'m'\|'l'` | `'m'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `onClick` | `Function` | — | Click handler |
| `iconSlotHtml` | `string` | — | Optional icon HTML |

### Returns

```js
{
  element: HTMLElement,
  setLabel(text: string): void,
  setDisabled(val: boolean): void,
  destroy(): void,
}
```

---

## createExpressTooltip

**Import:** `import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetEl` | `HTMLElement` | — | **Required.** Element the tooltip describes |
| `content` | `string` | — | **Required.** Tooltip text |
| `placement` | `'top'\|'bottom'\|'left'\|'right'` | `'top'` | Position |
| `delay` | `number` | `300` | Show delay (ms) |

### Returns

```js
{
  element: HTMLElement,
  setContent(text: string): void,
  destroy(): void,           // removes tooltip and ARIA link
}
```

### Behavior
- Shows on hover (after delay) and on keyboard focus
- Hides on pointer leave and focus out
- ESC closes when target is focused
- Manages `aria-describedby` automatically

---

## createExpressDialog

**Import:** `import { createExpressDialog } from '../spectrum/components/express-dialog.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | **Required.** Dialog heading |
| `body` | `string\|HTMLElement` | — | Body content |
| `actions` | `Array<{label, variant?, action}>` | `[]` | Footer buttons |
| `dismissable` | `boolean` | `true` | Show X / allow ESC close |

### Returns

```js
{
  element: HTMLElement,
  open(): void,              // show dialog
  close(): void,             // hide dialog
  on(action: string, cb: Function): void,  // listen for action events
  destroy(): void,           // close + remove from DOM
}
```

### Actions
Each action has an `action` string. When the button is clicked:
1. The `action` event fires (via `dialog.on(action, callback)`)
2. The dialog closes

The special `'dismiss'` action fires when the user clicks the backdrop, presses ESC, or clicks the X button.

### Accessibility
- Focus is trapped inside the dialog
- ESC key closes (if dismissable)
- Background scroll is locked
- Focus returns to the previously focused element on close

---

## showExpressToast

**Import:** `import { showExpressToast } from '../spectrum/components/express-toast.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | — | **Required.** Toast text |
| `variant` | `'positive'\|'negative'\|'info'\|'neutral'` | `'info'` | Color variant |
| `timeout` | `number` | `4000` | Auto-dismiss ms (0 = manual) |
| `onClose` | `Function` | — | Called when dismissed |

### Returns

```js
{
  close(): void,             // manually dismiss
}
```

### Behavior
- Toasts stack at the bottom center of the viewport
- Maximum 3 visible at once
- Announces to screen readers via `aria-live`
- `negative` variant uses `assertive` priority

---

## createExpressTag

**Import:** `import { createExpressTag } from '../spectrum/components/express-tag.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | **Required.** Visible text |
| `value` | `string` | `''` | Programmatic value |
| `selectable` | `boolean` | `false` | Toggle selection on click |
| `selected` | `boolean` | `false` | Initial selected state |
| `removable` | `boolean` | `false` | Show delete button |
| `disabled` | `boolean` | `false` | Disable interaction |
| `onToggle` | `Function` | — | `({ value, selected })` on toggle |
| `onRemove` | `Function` | — | `({ value })` on remove |

### Returns

```js
{
  element: HTMLElement,
  getSelected(): boolean,
  setSelected(val: boolean): void,
  destroy(): void,
}
```

---

## createExpressTextfield

**Import:** `import { createExpressTextfield } from '../spectrum/components/express-textfield.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `''` | Visible label above the field |
| `placeholder` | `string` | `''` | Placeholder text |
| `value` | `string` | `''` | Initial value |
| `multiline` | `boolean` | `false` | Textarea mode |
| `quiet` | `boolean` | `false` | Underline-only variant |
| `disabled` | `boolean` | `false` | Disable the field |
| `required` | `boolean` | `false` | Mark as required |
| `readonly` | `boolean` | `false` | Prevent editing |
| `size` | `'s'\|'m'\|'l'\|'xl'` | `'m'` | Field size |
| `pattern` | `string` | — | Validation regex pattern |
| `maxlength` | `number` | — | Max character count |
| `onInput` | `Function` | — | `({ value })` on every keystroke |
| `onChange` | `Function` | — | `({ value })` on blur / commit |

### Returns

```js
{
  element: HTMLElement,
  getValue(): string,
  setValue(text: string): void,
  setDisabled(val: boolean): void,
  destroy(): void,
}
```

---

## createExpressSearch

**Import:** `import { createExpressSearch } from '../spectrum/components/express-search.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `'Search'` | Accessible label |
| `placeholder` | `string` | `'Search'` | Placeholder text |
| `value` | `string` | `''` | Initial value |
| `quiet` | `boolean` | `false` | Underline-only variant |
| `disabled` | `boolean` | `false` | Disable the field |
| `size` | `'s'\|'m'\|'l'\|'xl'` | `'m'` | Field size |
| `action` | `string` | — | Form action URL |
| `method` | `string` | — | Form method |
| `onInput` | `Function` | — | `({ value })` on every keystroke |
| `onSubmit` | `Function` | — | `({ value })` when Enter is pressed |
| `onClear` | `Function` | — | `()` when clear button is clicked |

### Returns

```js
{
  element: HTMLElement,
  getValue(): string,
  setValue(text: string): void,
  clear(): void,
  setDisabled(val: boolean): void,
  destroy(): void,
}
```

### Behavior
- Built-in search icon and clear button
- Enter key triggers `onSubmit`
- Clear button resets the value and fires `onClear`
- Extends textfield — inherits the same theming and accessibility

---

## createExpressMenu

**Import:** `import { createExpressMenu } from '../spectrum/components/express-menu.js';`

### Config

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `'Menu'` | Accessible label |
| `items` | `MenuItem[]` | `[]` | Menu entries (see below) |
| `selects` | `'single'\|'multiple'\|undefined` | — | Selection mode |
| `onSelect` | `Function` | — | `({ value })` when an item is chosen |

#### MenuItem Shape

```js
{
  value: string,      // programmatic value
  label: string,      // visible text
  disabled?: boolean,  // grey out the item
  selected?: boolean,  // initially selected
  divider?: boolean,   // renders a divider instead of an item
}
```

### Returns

```js
{
  element: HTMLElement,
  getSelected(): string | string[],  // depends on selects mode
  setItems(items: MenuItem[]): void, // replace items dynamically
  destroy(): void,
}
```

### Behavior
- Standalone menu for action lists, settings panels, etc.
- For dropdown menus, use `createExpressPicker` instead
- Supports single and multiple selection modes
- Keyboard navigation is handled by Spectrum
