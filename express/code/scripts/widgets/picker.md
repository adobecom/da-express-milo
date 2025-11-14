# Picker Widget - Developer Guide

## Overview

The Picker widget is a custom dropdown component that provides full control over styling and interaction. It replaces native `<select>` elements with a fully accessible, keyboard-navigable custom implementation.

## Location

- **JavaScript**: `express/code/scripts/widgets/picker.js`
- **CSS**: `express/code/scripts/widgets/picker.css`
- **Tests**: `test/scripts/widgets/picker.test.js`

## Usage

### Basic Example

```javascript
import { createPicker } from '../../../../scripts/widgets/picker.js';

const picker = await createPicker({
  id: 'size-selector',
  name: 'size',
  label: 'Size',
  options: [
    { value: 's', text: 'Small' },
    { value: 'm', text: 'Medium' },
    { value: 'l', text: 'Large' },
  ],
  defaultValue: 'm',
  onChange: (value) => {
    console.log('Selected:', value);
  },
});

document.body.appendChild(picker);
```

### With All Options

```javascript
const picker = await createPicker({
  id: 'product-selector',
  name: 'product',
  label: 'Choose Product',
  required: true,
  helpText: 'Select a product to continue',
  options: [
    { value: '1', text: 'Product 1' },
    { value: '2', text: 'Product 2', disabled: true },
    { value: '3', text: 'Product 3' },
  ],
  defaultValue: '1',
  onChange: (value, event) => {
    console.log('New value:', value);
  },
  disabled: false,
  size: 'm',
  variant: 'default',
  labelPosition: 'side',
  ariaLabel: 'Product selection',
  ariaDescribedBy: 'product-help',
  maintainFocusAfterChange: false,
});
```

## Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | `string` | *required* | Unique ID for the picker |
| `name` | `string` | `id` value | Name for the hidden input field |
| `label` | `string` | `''` | Label text displayed above/beside picker |
| `required` | `boolean` | `false` | Adds asterisk to label if true |
| `helpText` | `string` | `''` | Help text displayed below picker |
| `options` | `Array<{value, text, disabled}>` | `[]` | Array of option objects |
| `defaultValue` | `string\|number` | First option | Initially selected value |
| `onChange` | `Function(value, event)` | `null` | Called when selection changes |
| `disabled` | `boolean` | `false` | Disables the entire picker |
| `size` | `string` | `'m'` | Size variant: `'s'`, `'m'`, `'l'`, `'xl'` |
| `variant` | `string` | `'default'` | Visual variant: `'default'`, `'quiet'` |
| `labelPosition` | `string` | `'top'` | Label position: `'top'`, `'side'` |
| `ariaLabel` | `string` | `''` | ARIA label for accessibility |
| `ariaDescribedBy` | `string` | `''` | ARIA described-by attribute |
| `maintainFocusAfterChange` | `boolean` | `false` | Auto-restore focus when picker is re-created after `onChange` |

## Public API Methods

### `setPicker(value)`

Programmatically set the selected value.

```javascript
picker.setPicker('l');
```

### `getPicker()`

Get the currently selected value.

```javascript
const currentValue = picker.getPicker();
```

### `setOptions(newOptions)`

Replace all options with new ones.

```javascript
picker.setOptions([
  { value: 'xs', text: 'Extra Small' },
  { value: 's', text: 'Small' },
  { value: 'm', text: 'Medium' },
]);
```

### `setDisabled(boolean)`

Enable or disable the picker.

```javascript
picker.setDisabled(true);  // Disable
picker.setDisabled(false); // Enable
```

### `setError(message)`

Set error state and message.

```javascript
picker.setError('Please select a valid option');
```

### `clearError()`

Clear error state and restore original help text.

```javascript
picker.clearError();
```

### `setLoading(boolean)`

Set loading state (also disables picker).

```javascript
picker.setLoading(true);  // Start loading
picker.setLoading(false); // Stop loading
```

### `destroy()`

Clean up event listeners.

```javascript
picker.destroy();
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Open dropdown (when closed) / Select focused option (when open) |
| `Escape` | Close dropdown and return focus to button |
| `ArrowDown` | Open dropdown (closed) / Move focus to next option (open) |
| `ArrowUp` | Open dropdown (closed) / Move focus to previous option (open) |
| `Home` | Focus first option (when open) |
| `End` | Focus last option (when open) |
| `Tab` | Close dropdown and move to next focusable element |

## Accessibility

### ARIA Attributes

The picker implements the following ARIA attributes:

- `role="combobox"` on the trigger button (follows ARIA APG standard for select patterns)
- `role="listbox"` on the options container
- `role="option"` on each option
- `aria-haspopup="listbox"` on the button
- `aria-expanded` (true/false) on the button
- `aria-selected` (true/false) on options
- `aria-activedescendant` (points to focused option ID)
- `aria-labelledby` (links to label element)
- `aria-label` (optional) on the button
- `aria-describedby` (optional) connecting to help text
- `aria-required` (true) when `required` is set

### Focus Management

- Focus ring only appears on keyboard navigation (`:focus-visible`)
- After selection, focus returns to the picker button
- **Optional**: Set `maintainFocusAfterChange: true` to auto-restore focus when the picker is re-created after `onChange` callback
  - Uses `MutationObserver` to track new DOM elements and restore focus
  - Useful when `onChange` triggers a full DOM re-render (not recommended, but supported)
  - Default: `false` (simpler behavior, better for most use cases)

### Screen Reader Support

- Selected value is announced when picker is focused
- Options are properly labeled with `aria-selected`
- Help text is connected via `aria-describedby`

## Styling

### CSS Custom Properties

The picker uses the following CSS variables from the design system:

- `--body-font-family` - Font family
- Standard color values (`#292929`, `#e1e1e1`, `#5c5ce0`, etc.)

### Mobile-First Approach

All styles are mobile-first with desktop overrides:

```css
/* Mobile default */
.picker-options-wrapper {
  width: 100%;
}

/* Desktop (768px+) */
@media (min-width: 768px) {
  .picker-options-wrapper {
    width: max-content;
  }
}
```

### Variants

#### Default Variant

Standard picker with gray background:

```javascript
createPicker({ variant: 'default' })
```

#### Quiet Variant

Minimal styling with bottom border:

```javascript
createPicker({ variant: 'quiet' })
```

### Label Positions

#### Top (Default)

Label appears above the picker:

```javascript
createPicker({ labelPosition: 'top' })
```

#### Side

Label appears to the left of the picker (desktop only):

```javascript
createPicker({ labelPosition: 'side' })
```

## Layout Integration

### Picker Group

For multiple related pickers (e.g., Size and Quantity):

```css
.picker-group {
  display: flex;
  gap: 16px;
  width: 208px; /* Desktop width */
}
```

### Picker with Link

For pickers with associated links (e.g., "Size chart"):

```css
.picker-with-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  max-width: 400px;
}
```

## Technical Details

### DOM Structure

```html
<div class="picker-container">
  <label class="picker-label">Size</label>
  <div class="picker-wrapper">
    <div class="picker-button-wrapper" role="button" aria-expanded="false">
      <span class="picker-current-value">Medium</span>
      <img class="picker-chevron" src="/express/code/icons/drop-down-arrow.svg" />
    </div>
    <div class="picker-options-wrapper" role="listbox">
      <div class="picker-option-button active" role="option" aria-selected="true">
        <img class="picker-option-checkmark" src="/express/code/icons/checkmark.svg" />
        <span class="picker-option-text">Medium</span>
      </div>
      <!-- More options -->
    </div>
    <input type="hidden" name="size" value="m" />
  </div>
</div>
```

### State Management

The picker maintains internal state using closures:

- `currentValue` - Currently selected value
- `isOpen` - Dropdown open/closed state
- `focusedOptionIndex` - Index of keyboard-focused option
- `disabled` - Original disabled state (immutable)

### Event Handling

#### Click Outside

The picker automatically closes when clicking outside:

```javascript
const handleClickOutside = (e) => {
  if (isOpen && !container.contains(e.target)) {
    closeDropdown();
  }
};
document.addEventListener('click', handleClickOutside);
```

Remember to call `picker.destroy()` to clean up this event listener.

#### onChange Callback

The `onChange` callback receives:

1. `value` - The new selected value
2. `event` - Event object with `{ target: { value } }`

```javascript
onChange: (value, event) => {
  console.log('Value:', value);
  console.log('Event:', event);
}
```

### Focus Restoration

When `onChange` triggers a DOM re-render (e.g., in React-like environments), the picker uses `MutationObserver` to detect when the new picker button is added to the DOM and automatically restores focus:

```javascript
const observer = new MutationObserver((mutations, obs) => {
  const newButton = document.getElementById(id);
  if (newButton && newButton !== buttonWrapper) {
    newButton.focus();
    obs.disconnect();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
```

The observer auto-disconnects after 2 seconds as a fallback.

## Testing

Run the test suite:

```bash
npm test -- --grep "Picker Widget"
```

Tests cover:

- ✅ Initialization and rendering
- ✅ Click and keyboard interactions
- ✅ Value management and onChange callbacks
- ✅ Public API methods
- ✅ Accessibility (ARIA attributes)
- ✅ Disabled state
- ✅ Error handling
- ✅ Edge cases

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Common Use Cases

### Product Selector

```javascript
createPicker({
  id: 'product',
  label: 'Product',
  options: productsArray.map(p => ({ value: p.id, text: p.name })),
  onChange: (id) => {
    loadProductDetails(id);
  },
});
```

### Size and Quantity Selectors

```javascript
const sizeSelector = createPicker({
  id: 'size',
  label: 'Size',
  options: [
    { value: 's', text: 'Small' },
    { value: 'm', text: 'Medium' },
    { value: 'l', text: 'Large' },
  ],
  onChange: updatePrice,
});

const qtySelector = createPicker({
  id: 'qty',
  label: 'Quantity',
  options: Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    text: String(i + 1),
  })),
  onChange: updatePrice,
});

const pickerGroup = createTag('div', { class: 'picker-group' });
pickerGroup.appendChild(sizeSelector);
pickerGroup.appendChild(qtySelector);
```

### Dynamic Options

```javascript
const picker = createPicker({
  id: 'category',
  label: 'Category',
  options: [{ value: '', text: 'Loading...' }],
  disabled: true,
});

fetchCategories().then(categories => {
  picker.setOptions(categories.map(c => ({ value: c.id, text: c.name })));
  picker.setDisabled(false);
});
```

## Troubleshooting

### Issue: Dropdown appears off-screen on mobile

**Solution**: Ensure parent containers don't have `overflow: hidden` or `display: contents`.

### Issue: onChange callback not firing

**Solution**: Check that you're passing `onChange` in the config object, not as a separate parameter.

### Issue: Value resets after re-render

**Solution**: Store the value externally and use `setPicker()` to restore it after re-render, or ensure your `onChange` callback properly updates your state management.

### Issue: Focus not returning after selection

**Solution**: The picker automatically handles this with `MutationObserver`. If issues persist, ensure the new picker element has the same `id`.

## Performance Considerations

- Styles are loaded once per page (cached)
- Event listeners are attached at the container level where possible
- MutationObserver auto-disconnects to prevent memory leaks
- Always call `destroy()` when removing pickers dynamically

## Future Enhancements

Potential improvements for future versions:

- Multi-select support
- Search/filter functionality
- Grouped options (optgroup)
- Custom option templates
- Virtual scrolling for large option lists
- Animation transitions

## Related Components

- **Tooltip Widget**: `scripts/widgets/tooltip.js`
- **Button Components**: See design system
- **Form Components**: Various form widgets in `scripts/widgets/`

## Support

For issues or questions:
- Check test file: `test/scripts/widgets/picker.test.js`
- Review existing implementations in `blocks/print-product-detail`
- Consult Figma designs for visual specifications

