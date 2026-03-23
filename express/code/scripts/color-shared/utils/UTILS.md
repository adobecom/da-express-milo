# Utility Functions

Shared utility functions for the Color Explorer block.

---

## Keyboard Navigation

### `createKeyboardNavigation(container, options)`

Creates keyboard navigation for a list container. Handles arrow key navigation, selection, and focus management.

```javascript
const nav = createKeyboardNavigation(listElement, {
  itemSelector: '.suggestion-item',
  selectedClass: 'is-selected',
  onSelect: (item, index) => handleSelection(item),
  onNavigate: (item, index) => updateAriaState(index),
});

// Attach to input for keyboard control
nav.attach(inputElement);
```

### `attachItemNavigation(container, options)`

Attaches item-level keyboard navigation to list items. Enables arrow key navigation when items themselves are focused.

```javascript
const cleanup = attachItemNavigation(list, {
  itemSelector: '.suggestion-item',
  onSelect: (item, index) => selectSuggestion(index),
});

// Call cleanup when done
cleanup();
```

---

## Sticky Behavior

Creates sticky behavior for elements using IntersectionObserver. Supports two modes.

### Clone Mode

Creates a clone element when sentinel scrolls out of view:

```javascript
const sticky = createStickyBehavior({
  sentinel: document.querySelector('.search-sentinel'),
  createClone: () => originalElement.cloneNode(true),
  onSync: (clone) => {
    clone.querySelector('input').value = originalInput.value;
  },
});
```

### Relocate Mode (Recommended)

Moves the original element into a sticky wrapper (no duplication):

```javascript
const sticky = createStickyBehavior({
  sentinel: document.querySelector('.search-sentinel'),
  element: searchContainer,
  createWrapper: () => { /* return wrapper element */ },
  onShow: () => {
    placeholder.style.display = 'block';
  },
  onHide: () => {
    placeholder.style.display = 'none';
  },
});
```

### Auto-Initializing Sticky Behavior

Wrapper that auto-initializes when element connects to DOM:

```javascript
const sticky = createAutoStickyBehavior({
  sentinel: mySentinel,
  createClone: () => element.cloneNode(true),
});
// Will auto-initialize when sentinel is connected to DOM
```

---

## Suggestions Dropdown

Creates a reusable autocomplete suggestions dropdown for search inputs.

```javascript
const dropdown = await createSuggestionsDropdown(
  { id: 'search-suggestions', headerText: 'Suggestions' },
  {
    onSelect: (suggestion) => handleSelection(suggestion),
    onHover: (suggestion, index) => updatePreview(suggestion),
  }
);

// Attach to input for keyboard navigation
dropdown.attachKeyboardNavigation(inputElement);

// Update suggestions
dropdown.setSuggestions([
  { label: 'Blue', type: 'term', typeLabel: 'Color' },
  { label: '#0000FF', type: 'hex', typeLabel: 'Hex Code' },
]);
```

---

## CSS Lazy Loading

### `loadComponentStyles(cssPath, baseUrl)`

Lazily loads a CSS file for a component. Ensures each CSS file is only loaded once.

```javascript
await loadComponentStyles('./component.css', import.meta.url);
```

### `preloadCSS(cssFiles)`

Preload multiple CSS files in parallel.

```javascript
await preloadCSS([
  { path: './header.css', baseUrl: import.meta.url },
  { path: './footer.css', baseUrl: import.meta.url },
]);
```

---

## Autocomplete

### `createAutocomplete(onSuggestions, options)`

Creates an autocomplete handler with throttle and debounce support.

```javascript
const autocomplete = createAutocomplete(
  (suggestions) => updateDropdown(suggestions),
  {
    throttleDelay: 300,
    debounceDelay: 500,
    minLength: 2,
  }
);

// Use with input events
input.addEventListener('input', autocomplete.inputHandler);

// Or programmatically
autocomplete.handleInput('blue');

// Clear suggestions
autocomplete.clear();
```

### `generateSuggestions(query)`

Generate suggestions based on user input. Creates term, tag, and (optionally) hex suggestions.

```javascript
const suggestions = generateSuggestions('blue');
// Returns array of { label, type, typeLabel, value, typeOfQuery }
```

