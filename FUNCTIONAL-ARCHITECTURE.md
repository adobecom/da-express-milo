# 🎯 Color Explorer Architecture
## Functional Factory Pattern

**Date:** January 12, 2026  
**Pattern:** Factory Functions, Closures, Composition

---

## 🏗️ Architecture

```
color-explorer.js (Entry Point)
├── parseConfig(block) → config
├── fetchColorData(config) → data
├── createColorRenderer(variant, data, config) → renderer
└── renderAndConnect(block, renderer)

factory/
└── createColorRenderer(variant, options)
    ├── Renderer registry (object)
    └── Returns renderer functions

renderers/
├── createBaseRenderer(options) → { render, update, on, emit }
├── createGradientsRenderer(options) → extends base
├── createStripsRenderer(options) → extends base
└── createExtractRenderer(options) → extends base

services/
└── createColorDataService(config) → { fetch, fetchById, clearCache }

modal/
└── createColorModalManager(options) → { open, close }
```

---

## 📐 Complete Functional Implementation

### 1. Entry Point (color-explorer.js)

```javascript
// express/code/blocks/color-explorer/color-explorer.js

import { createTag } from '../../scripts/utils.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import { createColorDataService } from './services/createColorDataService.js';
import { createColorModalManager } from './modal/createColorModalManager.js';
import ColorThemeController from '../../libs/color-components/controllers/ColorThemeController.js';

/**
 * Parse block configuration from authoring
 */
function parseConfig(block) {
  const config = {
    variant: 'strips', // default
    apiEndpoint: '/api/color/palettes',
    limit: 24,
    searchEnabled: true,
    modalType: 'drawer',
    filters: [],
  };

  // Extract variant from class
  if (block.classList.contains('gradients')) config.variant = 'gradients';
  if (block.classList.contains('strips')) config.variant = 'strips';
  if (block.classList.contains('extract')) config.variant = 'extract';

  // Parse table rows for additional config
  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cells = row.querySelectorAll('div');
    if (cells.length === 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();

      if (key.includes('api')) config.apiEndpoint = value;
      if (key.includes('limit')) config.limit = parseInt(value, 10);
      if (key.includes('search')) config.searchEnabled = value === 'true';
      if (key.includes('modal')) config.modalType = value;
      if (key.includes('filter')) config.filters = value.split(',').map(f => f.trim());
    }
  });

  return config;
}

/**
 * Main decorator function
 */
export default async function decorate(block) {
  // 1. Parse configuration
  const config = parseConfig(block);

  // 2. Initialize data service
  const dataService = createColorDataService(config);

  // 3. Fetch initial data
  const initialData = await dataService.fetch({
    limit: config.limit,
    filters: config.filters,
  });

  // 4. Initialize state controller (from color-poc library)
  const stateController = new ColorThemeController({
    name: 'Color Explorer',
    config: {
      analyticsChannel: 'color-explorer',
      variant: config.variant,
    },
  });

  // 5. Create renderer using factory
  const renderer = createColorRenderer(config.variant, {
    data: initialData,
    controller: stateController,
    config,
  });

  // 6. Create modal manager
  const modalManager = createColorModalManager({
    type: config.modalType,
    controller: stateController,
  });

  // 7. Render the variant
  const content = await renderer.render(block);

  // 8. Connect interactions
  renderer.on('item-click', (item) => {
    modalManager.open(item, config.variant);
  });

  renderer.on('search', async (query) => {
    const results = await dataService.fetch({ query, limit: config.limit });
    renderer.update(results);
  });

  // 9. Subscribe to state changes
  stateController.subscribe((state) => {
    // Analytics, persistence, etc.
    window.dispatchEvent(new CustomEvent('color-explorer:state-change', {
      detail: state,
    }));
  });

  block.innerHTML = '';
  block.append(content);
}
```

---

### 2. Factory (Functional)

```javascript
// express/code/blocks/color-explorer/factory/createColorRenderer.js

import { createGradientsRenderer } from '../renderers/createGradientsRenderer.js';
import { createStripsRenderer } from '../renderers/createStripsRenderer.js';
import { createExtractRenderer } from '../renderers/createExtractRenderer.js';

/**
 * Renderer registry (mapper pattern like Northstar)
 */
const rendererRegistry = {
  gradients: {
    create: createGradientsRenderer,
    defaultConfig: { searchEnabled: true, modalType: 'full-screen' },
  },
  strips: {
    create: createStripsRenderer,
    defaultConfig: { searchEnabled: true, modalType: 'drawer' },
  },
  extract: {
    create: createExtractRenderer,
    defaultConfig: { searchEnabled: false, modalType: 'full-screen' },
  },
  default: {
    create: createStripsRenderer,
    defaultConfig: { searchEnabled: true, modalType: 'drawer' },
  },
};

/**
 * Create color renderer based on variant
 * @param {string} variant - Renderer type (gradients, strips, extract)
 * @param {Object} options - Configuration options
 * @returns {Object} Renderer instance with { render, update, on, emit }
 */
export function createColorRenderer(variant, options) {
  const rendererConfig = rendererRegistry[variant] || rendererRegistry.default;
  
  const mergedConfig = {
    ...rendererConfig.defaultConfig,
    ...options.config,
  };

  return rendererConfig.create({
    ...options,
    config: mergedConfig,
  });
}

/**
 * Register new renderer type (for plugins/extensions)
 * @param {string} variant - Variant name
 * @param {Function} createFn - Factory function
 * @param {Object} defaultConfig - Default configuration
 */
export function registerRenderer(variant, createFn, defaultConfig = {}) {
  rendererRegistry[variant] = {
    create: createFn,
    defaultConfig,
  };
}

/**
 * Get available variants
 * @returns {Array<string>} List of variant names
 */
export function getAvailableVariants() {
  return Object.keys(rendererRegistry).filter(k => k !== 'default');
}
```

---

### 3. Base Renderer (Functional with Closures)

```javascript
// express/code/blocks/color-explorer/renderers/createBaseRenderer.js

import { createTag } from '../../../scripts/utils.js';

/**
 * Create base renderer with common functionality
 * Uses closures for encapsulation
 * Returns object with methods
 */
export function createBaseRenderer(options) {
  // Private state (closure)
  let data = options.data || [];
  let controller = options.controller;
  let config = options.config;
  const eventListeners = new Map();

  /**
   * Event emitter pattern
   */
  function on(event, callback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
  }

  function emit(event, eventData) {
    const listeners = eventListeners.get(event) || [];
    listeners.forEach(callback => callback(eventData));
  }

  /**
   * Common utilities
   */
  function createCard(item) {
    const card = createTag('div', {
      class: 'color-card',
      'data-id': item.id,
      tabindex: '0',
      role: 'button',
      'aria-label': item.name,
    });
    return card;
  }

  function createGrid() {
    return createTag('div', { class: 'color-grid' });
  }

  /**
   * Get current data
   */
  function getData() {
    return data;
  }

  /**
   * Update data
   */
  function setData(newData) {
    data = newData;
  }

  /**
   * Get config
   */
  function getConfig() {
    return config;
  }

  /**
   * Get controller
   */
  function getController() {
    return controller;
  }

  // Return public API (methods that renderers can use/override)
  return {
    // Required methods (must be overridden by specific renderers)
    render: () => {
      throw new Error('render() must be implemented by specific renderer');
    },
    update: () => {
      throw new Error('update() must be implemented by specific renderer');
    },

    // Utility methods (available to all renderers)
    on,
    emit,
    createCard,
    createGrid,
    getData,
    setData,
    getConfig,
    getController,
  };
}
```

---

### 4. Gradients Renderer (Functional Composition)

```javascript
// express/code/blocks/color-explorer/renderers/createGradientsRenderer.js

import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import '../../../libs/color-components/components/color-palette/index.js';
import '../../../libs/color-components/components/color-search/index.js';

/**
 * Create gradients renderer
 * Composes base renderer with gradient-specific functionality
 */
export function createGradientsRenderer(options) {
  // Create base renderer
  const base = createBaseRenderer(options);
  
  // Get base utilities
  const { createCard, createGrid, getData, getConfig, emit } = base;
  
  // Private state
  let gridElement = null;

  /**
   * Build gradient CSS string
   */
  function buildGradientCSS(gradient) {
    const stops = gradient.colorStops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');
    return `linear-gradient(90deg, ${stops})`;
  }

  /**
   * Create gradient card
   */
  function createGradientCard(gradient) {
    const card = createCard(gradient);

    // Gradient visual
    const gradientVisual = createTag('div', { class: 'gradient-visual' });
    gradientVisual.style.background = buildGradientCSS(gradient);

    // Use color-palette component for colors
    const palette = createTag('color-palette', {
      palette: JSON.stringify({
        id: gradient.id,
        name: gradient.name,
        colors: gradient.coreColors,
      }),
    });

    // Metadata
    const metadata = createTag('div', { class: 'gradient-metadata' });
    const heading = createTag('h3', {}, gradient.name);
    const description = createTag('p', {}, 
      `${gradient.type} gradient • ${gradient.coreColors.length} colors`
    );
    metadata.append(heading, description);

    card.append(gradientVisual, palette, metadata);

    // Click handler
    card.addEventListener('click', () => emit('item-click', gradient));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        emit('item-click', gradient);
      }
    });

    return card;
  }

  /**
   * Create search UI
   */
  async function createSearchUI() {
    const config = getConfig();
    if (!config.searchEnabled) return null;

    const searchContainer = createTag('div', { class: 'search-container' });

    const searchUI = createTag('color-search', {
      'placeholder': 'Search gradients...',
      'data-source': 'gradients',
      'debounce': '300',
    });

    searchUI.addEventListener('color-search-query', (e) => {
      emit('search', e.detail.query);
    });

    searchContainer.append(searchUI);
    return searchContainer;
  }

  /**
   * Render function (overrides base)
   */
  async function render(container) {
    const wrapper = createTag('div', { class: 'gradients-renderer' });

    // Add search if enabled
    const searchUI = await createSearchUI();
    if (searchUI) wrapper.append(searchUI);

    // Create grid
    const grid = createGrid();
    const data = getData();
    
    data.forEach(gradient => {
      const card = createGradientCard(gradient);
      grid.append(card);
    });

    wrapper.append(grid);
    gridElement = grid;
    
    return wrapper;
  }

  /**
   * Update function (overrides base)
   */
  function update(newData) {
    base.setData(newData);
    
    if (!gridElement) return;

    gridElement.innerHTML = '';
    newData.forEach(gradient => {
      const card = createGradientCard(gradient);
      gridElement.append(card);
    });
  }

  // Return public API (extends base with gradient-specific methods)
  return {
    ...base,
    render,
    update,
    createGradientCard, // Expose if needed
    buildGradientCSS,   // Expose if needed
  };
}
```

---

### 5. Strips Renderer (Functional)

```javascript
// express/code/blocks/color-explorer/renderers/createStripsRenderer.js

import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';
import '../../../libs/color-components/components/color-palette/index.js';

export function createStripsRenderer(options) {
  const base = createBaseRenderer(options);
  const { createCard, createGrid, getData, emit } = base;
  
  let gridElement = null;

  function createPaletteCard(palette) {
    const card = createCard(palette);

    const paletteComponent = createTag('color-palette', {
      palette: JSON.stringify(palette),
      'show-name-tooltip': 'true',
    });

    paletteComponent.addEventListener('ac-palette-select', () => {
      emit('item-click', palette);
    });

    card.append(paletteComponent);
    return card;
  }

  async function render(container) {
    const wrapper = createTag('div', { class: 'strips-renderer' });
    const grid = createGrid();
    const data = getData();

    data.forEach(palette => {
      const card = createPaletteCard(palette);
      grid.append(card);
    });

    wrapper.append(grid);
    gridElement = grid;
    return wrapper;
  }

  function update(newData) {
    base.setData(newData);
    
    if (!gridElement) return;

    gridElement.innerHTML = '';
    newData.forEach(palette => {
      const card = createPaletteCard(palette);
      gridElement.append(card);
    });
  }

  return {
    ...base,
    render,
    update,
    createPaletteCard,
  };
}
```

---

### 6. Extract Renderer (Functional)

```javascript
// express/code/blocks/color-explorer/renderers/createExtractRenderer.js

import { createTag } from '../../../scripts/utils.js';
import { createBaseRenderer } from './createBaseRenderer.js';

export function createExtractRenderer(options) {
  const base = createBaseRenderer(options);
  const { createCard, emit } = base;
  
  let resultsArea = null;

  function createUploadArea() {
    const area = createTag('div', { class: 'upload-area' });
    
    const prompt = createTag('div', { class: 'upload-prompt' });
    prompt.innerHTML = `
      <h3>Upload an image</h3>
      <p>Extract colors and create palettes from your photos</p>
    `;

    const fileInput = createTag('input', {
      type: 'file',
      accept: 'image/*',
      hidden: true,
    });

    area.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImageUpload);

    area.append(prompt, fileInput);
    return area;
  }

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    resultsArea.innerHTML = '<progress-circle size="large"></progress-circle>';

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/color/extract', {
        method: 'POST',
        body: formData,
      });

      const { palettes, image } = await response.json();
      renderExtractedPalettes(palettes, image);
      emit('extract-complete', { palettes, image });

    } catch (error) {
      resultsArea.innerHTML = '<p>Failed to extract colors. Please try again.</p>';
      window.lana?.log(`Extract error: ${error.message}`);
    }
  }

  function renderExtractedPalettes(palettes, imageUrl) {
    resultsArea.innerHTML = '';

    const imagePreview = createTag('img', {
      src: imageUrl,
      alt: 'Uploaded image',
      class: 'extracted-image-preview',
    });

    const palettesGrid = createTag('div', { class: 'extracted-palettes-grid' });

    palettes.forEach(palette => {
      const paletteCard = createTag('color-palette', {
        palette: JSON.stringify(palette),
      });
      paletteCard.addEventListener('click', () => emit('item-click', palette));
      palettesGrid.append(paletteCard);
    });

    resultsArea.append(imagePreview, palettesGrid);
  }

  async function render(container) {
    const wrapper = createTag('div', { class: 'extract-renderer' });
    
    const uploadArea = createUploadArea();
    resultsArea = createTag('div', { class: 'extract-results' });

    wrapper.append(uploadArea, resultsArea);
    return wrapper;
  }

  function update(newData) {
    // Extract doesn't use external data updates
  }

  return {
    ...base,
    render,
    update,
  };
}
```

---

### 7. Data Service (Functional)

```javascript
// express/code/blocks/color-explorer/services/createColorDataService.js

/**
 * Create color data service
 * Uses closure for private state (cache)
 */
export function createColorDataService(config) {
  // Private state (closure)
  const cache = new Map();

  /**
   * Fetch color data from API
   */
  async function fetch(options = {}) {
    const {
      query = '',
      limit = 24,
      cursor = null,
      filters = [],
    } = options;

    const cacheKey = `${query}-${limit}-${filters.join(',')}-${cursor || ''}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(query && { q: query }),
        ...(cursor && { cursor }),
        ...(filters.length > 0 && { filters: filters.join(',') }),
      });

      const response = await fetch(`${config.apiEndpoint}?${params}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      cache.set(cacheKey, data.items);

      trackAnalytics('fetch', {
        endpoint: config.apiEndpoint,
        query,
        resultCount: data.items.length,
      });

      return data.items;

    } catch (error) {
      window.lana?.log(`ColorDataService fetch error: ${error.message}`);

      if (window.location.hostname.includes('localhost')) {
        return getMockData(options);
      }

      return [];
    }
  }

  /**
   * Fetch single item by ID
   */
  async function fetchById(id) {
    const endpoint = `${config.apiEndpoint}/${id}`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      window.lana?.log(`ColorDataService fetchById error: ${error.message}`);
      return null;
    }
  }

  /**
   * Clear cache
   */
  function clearCache() {
    cache.clear();
  }

  /**
   * Track analytics
   */
  function trackAnalytics(action, data) {
    window.dispatchEvent(new CustomEvent('express:color-api-call', {
      bubbles: true,
      detail: {
        action,
        variant: config.variant,
        timestamp: Date.now(),
        ...data,
      },
    }));
  }

  /**
   * Get mock data for development
   */
  function getMockData(options) {
    return [];
  }

  // Return public API
  return {
    fetch,
    fetchById,
    clearCache,
  };
}
```

---

### 8. Modal Manager (Functional)

```javascript
// express/code/blocks/color-explorer/modal/createColorModalManager.js

import { createTag, getLibs } from '../../../scripts/utils.js';

/**
 * Create color modal manager
 */
export function createColorModalManager(options) {
  const { type = 'drawer', controller } = options;
  
  let currentItem = null;

  /**
   * Open modal with item
   */
  async function open(item, variant) {
    currentItem = item;

    const { default: getModal } = await import(`${getLibs()}/blocks/modal/modal.js`);
    const content = await buildModalContent(item, variant);

    const modal = await getModal(
      null,
      () => content,
      {
        class: `color-modal color-modal-${variant}`,
        closeEvent: 'color-modal-close',
      }
    );

    trackAnalytics('open', { variant, itemId: item.id });
    return modal;
  }

  /**
   * Build modal content based on variant
   */
  async function buildModalContent(item, variant) {
    const wrapper = createTag('div', { class: 'color-modal-content' });

    switch (variant) {
      case 'gradients':
        wrapper.append(await buildGradientModal(item));
        break;
      case 'strips':
        wrapper.append(await buildPaletteModal(item));
        break;
      case 'extract':
        wrapper.append(await buildExtractModal(item));
        break;
      default:
        wrapper.append(await buildDefaultModal(item));
    }

    return wrapper;
  }

  /**
   * Build gradient modal
   */
  async function buildGradientModal(gradient) {
    const container = createTag('div', { class: 'gradient-modal-inner' });

    const visual = createTag('div', { class: 'gradient-visual-large' });
    visual.style.background = buildGradientCSS(gradient);

    await import('../../../libs/color-components/components/color-swatch-rail/index.js');
    const swatchRail = createTag('color-swatch-rail');
    swatchRail.controller = controller;

    const actions = createActions(gradient, 'gradient');
    
    const metadata = createTag('div', { class: 'gradient-metadata' });
    metadata.innerHTML = `
      <h2>${gradient.name}</h2>
      <p>${gradient.type} gradient</p>
    `;

    container.append(visual, swatchRail, metadata, actions);
    return container;
  }

  /**
   * Build palette modal
   */
  async function buildPaletteModal(palette) {
    const container = createTag('div', { class: 'palette-modal-inner' });

    await import('../../../libs/color-components/components/color-palette/index.js');
    const paletteComponent = createTag('color-palette', {
      palette: JSON.stringify(palette),
      'show-name-tooltip': 'true',
    });

    const actions = createActions(palette, 'palette');
    
    const metadata = createTag('div', { class: 'palette-metadata' });
    metadata.innerHTML = `<h2>${palette.name}</h2>`;

    container.append(paletteComponent, metadata, actions);
    return container;
  }

  /**
   * Create action buttons
   */
  function createActions(item, itemType) {
    const actions = createTag('div', { class: 'color-actions' });

    const saveButton = createTag('button', {
      class: 'action-button save-button',
      type: 'button',
    }, 'Save to Libraries');

    saveButton.addEventListener('click', async () => {
      await import('../../../libs/color-components/components/ac-brand-libraries-color-picker/index.js');

      const picker = createTag('ac-brand-libraries-color-picker', {
        'theme-name': item.name,
        'initial-colors': JSON.stringify(item.colors || item.coreColors),
      });

      picker.addEventListener('ac-save-complete', () => {
        showToast('Saved to Libraries!');
      });

      actions.append(picker);
    });

    const shareButton = createTag('button', {
      class: 'action-button share-button',
      type: 'button',
    }, 'Share');

    shareButton.addEventListener('click', () => shareItem(item));

    actions.append(saveButton, shareButton);
    return actions;
  }

  /**
   * Helper: Build gradient CSS
   */
  function buildGradientCSS(gradient) {
    const stops = gradient.colorStops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');
    return `linear-gradient(90deg, ${stops})`;
  }

  /**
   * Helper: Share item
   */
  function shareItem(item) {
    const shareURL = `${window.location.origin}${window.location.pathname}?item=${item.id}`;

    if (navigator.share) {
      navigator.share({ title: item.name, url: shareURL });
    } else {
      navigator.clipboard.writeText(shareURL);
      showToast('Link copied!');
    }

    trackAnalytics('share', { itemId: item.id });
  }

  /**
   * Helper: Show toast
   */
  function showToast(message) {
    console.log(message);
  }

  /**
   * Track analytics
   */
  function trackAnalytics(action, data) {
    window.dispatchEvent(new CustomEvent('express:color-modal-action', {
      bubbles: true,
      detail: {
        action,
        timestamp: Date.now(),
        ...data,
      },
    }));
  }

  // Return public API
  return {
    open,
  };
}
```

---

## 🎯 Key Functional Patterns Used

### 1. **Closures for Encapsulation**
```javascript
function createColorDataService(config) {
  const cache = new Map(); // Private via closure
  
  function fetch() {
    cache.get(...); // Access private state
  }
  
  return { fetch }; // Expose public API
}
```

### 2. **Composition Over Inheritance**
```javascript
function createGradientsRenderer(options) {
  const base = createBaseRenderer(options); // Compose base
  const { createCard, emit } = base; // Use base methods
  
  function render() {
    const card = createCard(...); // Use composed methods
  }
  
  return { ...base, render }; // Extend base API
}
```

### 3. **Factory Functions**
```javascript
function createColorRenderer(variant, options) {
  const registry = {
    gradients: createGradientsRenderer,
    strips: createStripsRenderer,
  };
  
  return registry[variant](options);
}
```

### 4. **Pure Functions Where Possible**
```javascript
// Pure - no side effects
function buildGradientCSS(gradient) {
  return `linear-gradient(${gradient.colorStops.map(...).join()})`;
}

// Pure - deterministic
function parseConfig(block) {
  // ... parsing logic
  return config; // New object, no mutations
}
```

---

## 📁 File Structure

```
color-explorer/
├── color-explorer.js                    (main entry, functions)
│
├── factory/
│   └── createColorRenderer.js          (factory function)
│
├── renderers/
│   ├── createBaseRenderer.js           (base via composition)
│   ├── createGradientsRenderer.js      (functional)
│   ├── createStripsRenderer.js         (functional)
│   └── createExtractRenderer.js        (functional)
│
├── services/
│   └── createColorDataService.js       (functional with closure)
│
└── modal/
    └── createColorModalManager.js      (functional with closure)
```

---

## 🎯 Next Steps

1. **Review this functional architecture**
2. **Approve functional approach**
3. **Start implementation**:
   - `color-explorer.js` (entry point)
   - `createColorRenderer.js` (factory)
   - `createBaseRenderer.js` (base composition)
   - `createGradientsRenderer.js` (first variant)

**Ready to code when you are!** 🚀

---

**Pattern:** Factory Functions + Composition + Closures  
**Created:** January 12, 2026

