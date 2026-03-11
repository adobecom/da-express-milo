# Color-Shared Shell

> Layout and context infrastructure for Adobe Express color tools.

## Overview

The Shell provides a standardized foundation for building color tool blocks. It handles:

- **Reactive Context** — A key-value store with subscriptions for state management
- **Dependency Resolution** — Preloading CSS and service plugins
- **Slot-Based Layouts** — Semantic DOM structure with responsive behavior
- **Loading States** — Built-in support for loading feedback and placeholders

## Quick Start

```javascript
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';

const layout = await createColorToolLayout(blockElement, {
  palette: { colors: [...], name: 'My Palette' },
  toolbar: { /* toolbar options */ },
  dependencies: { css: ['path/to/styles.css'], services: ['kuler'] },
  content: { heading: 'Color Tool', paragraph: 'Description text' },
});

// Access slots
layout.slots.canvas.appendChild(myComponent);

// Use reactive context
layout.context.set('palette', newPalette);
layout.context.on('palette', (value) => console.log('Palette changed:', value));

// Cleanup
layout.destroy();
```

## Architecture

```
shell/
├── createShell.js           # Shell factory (context + dependencies)
├── contextProvider.js       # Reactive key-value store
├── dependencyTracker.js     # CSS and service preloading
├── shell-base.css           # Base host styles
└── layouts/
    ├── createColorToolLayout.js   # Primary layout for color tools
    └── styles/
        └── color-tool-layout.css  # Layout styles
```

## Layouts

### Color Tool Layout

The primary layout for color tool blocks. Creates a slot-based DOM structure with semantic roles.

#### Slots

| Slot | Role | Purpose |
|------|------|---------|
| `topbar` | `banner` | Top navigation, sticky on mobile |
| `sidebar` | `complementary` | Tool controls, text content |
| `canvas` | `main` | Primary interactive area |
| `footer` | `contentinfo` | Floating toolbar, sticky |

#### Configuration

```javascript
createColorToolLayout(container, {
  // Initial palette for toolbar
  palette: {
    colors: [{ r: 255, g: 128, b: 64 }, ...],
    name: 'Palette Name',
  },

  // Toolbar options (forwarded to initFloatingToolbar)
  toolbar: {
    type: 'palette',
    variant: 'standalone',
  },

  // Dependencies to preload
  dependencies: {
    css: ['path/to/custom.css'],
    services: ['kuler'],
  },

  // Mobile slot order (default: topbar, sidebar, canvas, footer)
  mobileOrder: ['topbar', 'canvas', 'sidebar', 'footer'],

  // Sidebar text content
  content: {
    icon: true,           // Show Adobe Express logo
    heading: 'Headline',
    paragraph: 'Body text',
  },
});
```

#### Responsive Behavior

- **Desktop (≥600px)**: CSS Grid with sidebar (1fr) and main area (2fr)
- **Mobile (<600px)**: Flex column with configurable order via `mobileOrder`

#### CSS Variable Customization

The layout exposes CSS variables for common customizations. Override these on your block class instead of writing CSS overrides:

| Variable | Default | Description |
|----------|---------|-------------|
| `--ax-layout-gap` | `var(--spacing-m)` | Gap between slots in mobile flex layout |
| `--ax-grid-columns` | `1fr 2fr` | Grid column template for desktop |
| `--ax-grid-areas` | (see above) | Grid area template for desktop |
| `--ax-area-*` | slot name | Grid area name for each slot |
| `--ax-bg-*` | varies | Background color for each slot |
| `--ax-padding-*-mobile` | `var(--spacing-m)` | Padding for slots on mobile |
| `--ax-padding-*-desktop` | varies | Padding for slots on desktop |
| `--ax-z-topbar` | `20` | Z-index for sticky topbar |
| `--ax-z-footer` | `10` | Z-index for sticky footer |
| `--ax-sticky-topbar-top` | `0` | Top position for sticky topbar |
| `--ax-sticky-footer-bottom` | `0` | Bottom position for sticky footer |
| `--ax-footer-margin-top` | `var(--spacing-300)` | Top margin for footer slot |
| `--ax-focus-outline-*` | varies | Focus indicator styling |
| `--ax-logo-icon-size` | `29.25px` | Logo icon block size |
| `--ax-text-content-gap` | `var(--spacing-200)` | Gap in text content block |
| `--ax-text-body-gap` | `var(--spacing-100)` | Gap in text body section |
| `--ax-logo-gap` | `var(--spacing-100)` | Gap between logo icon and text |

> **Note:** Use CSS variables for layout adjustments. Only write CSS class overrides when you need additional styling beyond what variables provide.

#### Layout API

```javascript
{
  slots,              // { topbar, sidebar, canvas, footer }
  context,            // Reactive context (get/set/on/off)
  getSlot(name),      // Returns slot element or null
  getSlotNames(),     // ['topbar', 'sidebar', 'canvas', 'footer']
  hasSlot(name),      // Boolean check
  clearSlot(name),    // Clear slot contents
  destroy(),          // Cleanup all resources
}
```

## Context Provider

The context provider is a reactive key-value store with subscription support.

### API

```javascript
const { context } = layout;

// Set a value
context.set('palette', { colors: [...], name: 'My Palette' });

// Get a value
const palette = context.get('palette');

// Subscribe to changes
context.on('palette', (value) => {
  console.log('Palette updated:', value);
});

// Subscribe to nested paths
context.on('palette.colors', (colors) => {
  console.log('Colors changed:', colors);
});

// Unsubscribe
context.off('palette', callback);
```

### Features

- **Dot-notation selectors**: Subscribe to nested paths like `palette.colors`
- **Change detection**: Callbacks only fire when values actually change
- **Event emission**: Changes emit CustomEvents on the host element
- **Error isolation**: Listener errors are caught and logged via `lana`

## Loading States and Placeholders

The shell provides built-in support for loading states and placeholder content. This ensures a smooth user experience while dependencies load.

### Shell States

Apply the `ax-shell-host` class to your block container and use `data-shell-state` to control loading feedback:

```html
<div class="my-color-tool ax-shell-host" data-shell-state="loading">
  <!-- Layout mounts here -->
</div>
```

| State | Attribute | Behavior |
|-------|-----------|----------|
| Loading | `data-shell-state="loading"` | Cursor shows wait, children are non-interactive (`pointer-events: none`) |
| Ready | `data-shell-state="ready"` | Normal interaction enabled |
| Error | `data-shell-state="error"` | Default cursor, ready for error UI |

### Using Loading States

```javascript
export default async function decorate(block) {
  // 1. Set loading state immediately
  block.classList.add('ax-shell-host');
  block.dataset.shellState = 'loading';

  try {
    // 2. Create layout (dependencies load here)
    const layout = await createColorToolLayout(block, {
      dependencies: { services: ['kuler'] },
    });

    // 3. Mount your components
    await mountMyComponent(layout.slots.canvas);

    // 4. Mark as ready
    block.dataset.shellState = 'ready';
  } catch (error) {
    // 5. Handle errors
    block.dataset.shellState = 'error';
    showErrorUI(block, error);
  }
}
```

### Placeholder Content

For better perceived performance, show placeholder content while loading. The shell preserves `[aria-live]` elements during loading state for accessibility.

#### Skeleton Placeholders

```javascript
function createSkeletonPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'ax-skeleton-placeholder';
  placeholder.setAttribute('aria-live', 'polite');
  placeholder.setAttribute('aria-busy', 'true');
  placeholder.innerHTML = `
    <div class="ax-skeleton-bar" style="width: 60%; height: 24px;"></div>
    <div class="ax-skeleton-bar" style="width: 100%; height: 200px;"></div>
  `;
  return placeholder;
}

export default async function decorate(block) {
  block.classList.add('ax-shell-host');
  block.dataset.shellState = 'loading';

  // Show placeholder immediately
  const placeholder = createSkeletonPlaceholder();
  block.appendChild(placeholder);

  const layout = await createColorToolLayout(block, config);

  // Remove placeholder and show content
  placeholder.remove();
  block.dataset.shellState = 'ready';
}
```

#### Preserving Accessible Content During Load

Elements with `[aria-live]` remain interactive during loading state. Use this for:

- Loading announcements for screen readers
- Cancel buttons
- Progress indicators

```html
<div class="ax-shell-host" data-shell-state="loading">
  <!-- This remains interactive -->
  <div aria-live="polite" class="loading-status">
    Loading color tool...
    <button onclick="cancelLoad()">Cancel</button>
  </div>
  
  <!-- These are non-interactive during load -->
  <div class="tool-content">...</div>
</div>
```

### CSS for Loading States

The `shell-base.css` provides these loading behaviors:

```css
/* Loading state: wait cursor */
.ax-shell-host[data-shell-state="loading"] {
  cursor: wait;
}

/* Children non-interactive except aria-live elements */
.ax-shell-host[data-shell-state="loading"] *:not([aria-live]) {
  pointer-events: none;
}
```

Add your own skeleton styles:

```css
.ax-skeleton-bar {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .ax-skeleton-bar {
    animation: none;
    background: var(--color-gray-200);
  }
}
```

### Progressive Loading Pattern

For complex tools, load content progressively:

```javascript
export default async function decorate(block) {
  block.classList.add('ax-shell-host');
  block.dataset.shellState = 'loading';

  // Phase 1: Create layout with minimal dependencies
  const layout = await createColorToolLayout(block, {
    content: { heading: 'Color Tool' },
  });

  // Phase 2: Show basic UI, mark as ready
  block.dataset.shellState = 'ready';

  // Phase 3: Load heavy dependencies in background
  await layout.context.set('loading', true);
  
  const kuler = await serviceManager.getProvider('kuler');
  const themes = await kuler.exploreThemes({ filter: 'public' });
  
  layout.context.set('themes', themes);
  layout.context.set('loading', false);
}
```

## Dependency Preloading

The shell preloads CSS and service plugins before rendering.

```javascript
// Via layout config
createColorToolLayout(container, {
  dependencies: {
    css: ['scripts/color-shared/custom.css'],
    services: ['kuler'],
  },
});

// Via shell directly
import createShell from './shell/createShell.js';
const shell = createShell(hostElement);
await shell.preload({
  css: ['path/to/styles.css'],
  services: ['kuler'],
});
```

### Service Loading

Services are loaded via `ServiceManager.init()`. The dependency tracker deduplicates concurrent requests for the same service combination.

## Host Styling

Apply the `ax-shell-host` class to your block container for base styles:

```html
<div class="contrast-checker ax-shell-host">
  <!-- Layout mounts here -->
</div>
```

### Base Styles Include

- Font family and smoothing
- Box-sizing inheritance
- Loading/ready/error state styling
- `.sr-only` utility for screen-reader-only content
- `prefers-reduced-motion` support (disables animations)
- Print media adjustments

## Creating Custom Layouts

To create a new layout:

1. Import `createShell` from `../createShell.js`
2. Build your slot structure with semantic roles
3. Preload layout CSS and dependencies
4. Return an API object with `slots`, `context`, and `destroy()`

```javascript
import createShell from '../createShell.js';

export default async function createMyLayout(container, config = {}) {
  const shell = createShell(container);
  
  await shell.preload({
    css: ['path/to/my-layout.css'],
    services: config.dependencies?.services,
  });

  // Build DOM structure
  const root = document.createElement('div');
  const slots = { main: document.createElement('div') };
  root.appendChild(slots.main);
  container.appendChild(root);

  return {
    slots,
    context: shell.context,
    destroy() {
      root.remove();
      shell.destroy();
    },
  };
}
```

## Integration with Services

The shell integrates with the ServiceManager for plugin loading. Common services:

- **kuler**: Adobe Color themes and gradients (see [Kuler README](../../../libs/services/plugins/kuler/README.md))

```javascript
// Preload kuler service
await createColorToolLayout(container, {
  dependencies: { services: ['kuler'] },
});

// Use kuler provider in your tool
const kuler = await serviceManager.getProvider('kuler');
const themes = await kuler.searchThemes('sunset');
```

## Accessibility

The shell and layouts are built with accessibility in mind:

- **Semantic roles**: All slots have appropriate ARIA roles and labels
- **Focus management**: Slots show focus indicators when focused within
- **Screen reader support**: `.sr-only` utility for visually hidden content
- **Reduced motion**: Animations disabled when `prefers-reduced-motion` is set
- **Loading states**: `aria-live` regions remain interactive during loading
- **Print styles**: Footer hidden, layout linearized for printing
