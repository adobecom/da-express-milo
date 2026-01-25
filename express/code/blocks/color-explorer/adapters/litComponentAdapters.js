/**
 * Lit Component Adapters
 * 
 * WIREFRAME FILE - Shows adapter pattern
 * 
 * Purpose: Wrap Lit Web Components in functional API
 * Pattern: Each adapter returns an object with:
 *   - element: The DOM element to append
 *   - methods: Functional API (update, destroy, etc.)
 *   - events: Converted from Lit events to callbacks
 * 
 * Responsibilities:
 * - Import Lit components dynamically
 * - Convert Lit events to functional callbacks
 * - Provide clean functional API
 * - Hide Lit implementation details
 * 
 * Does NOT:
 * - Contain layout logic
 * - Contain business logic
 * - Fetch data
 * 
 * Components Source: express/code/libs/color-components/ (from color-poc)
 */

/**
 * Create color palette adapter
 * Wraps <color-palette> Lit component
 * 
 * @param {Object} paletteData - Palette data { id, name, colors: [...] }
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onSelect - Called when palette is selected
 * @returns {Object} Adapter with { element, update, destroy }
 */
export function createPaletteAdapter(paletteData, callbacks = {}) {
  console.log('[Adapter] Creating palette adapter:', paletteData.name);

  // 1. Dynamically import Lit component
  // This ensures component is registered before use
  import('../../../libs/color-components/components/color-palette/index.js');

  // 2. Create element
  const element = document.createElement('color-palette');

  // 3. Set properties (Lit reactive properties)
  element.palette = paletteData;
  element.setAttribute('show-name-tooltip', 'true');
  element.setAttribute('palette-aria-label', `Palette {hex}, color {index}`);

  // 4. Convert Lit events to callbacks
  element.addEventListener('ac-palette-select', (e) => {
    console.log('[Adapter] Palette selected:', e.detail);
    callbacks.onSelect?.(e.detail.palette);
  });

  // 5. Return functional API
  return {
    // DOM element to append
    element,

    // Update palette data
    update: (newData) => {
      console.log('[Adapter] Updating palette:', newData.name);
      element.palette = newData;
    },

    // Cleanup
    destroy: () => {
      console.log('[Adapter] Destroying palette adapter');
      element.remove();
    },
  };
}

/**
 * Create search adapter
 * Wraps <color-search> Lit component
 * 
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onSearch - Called when search query changes
 * @returns {Object} Adapter with { element, setQuery, clear, destroy }
 */
export function createSearchAdapter(callbacks = {}) {
  console.log('[Adapter] Creating search adapter');

  // 1. Import component
  import('../../../libs/color-components/components/color-search/index.js');

  // 2. Create element
  const element = document.createElement('color-search');

  // 3. Set properties
  element.setAttribute('placeholder', 'Search colors...');

  // 4. Convert Lit events to callbacks
  element.addEventListener('color-search', (e) => {
    console.log('[Adapter] Search query:', e.detail.query);
    callbacks.onSearch?.(e.detail.query);
  });

  // 5. Return functional API
  return {
    element,

    // Set search query programmatically
    setQuery: (query) => {
      console.log('[Adapter] Setting query:', query);
      element.value = query;
    },

    // Clear search
    clear: () => {
      console.log('[Adapter] Clearing search');
      element.value = '';
    },

    destroy: () => {
      console.log('[Adapter] Destroying search adapter');
      element.remove();
    },
  };
}

/**
 * Create color wheel adapter
 * Wraps <color-wheel> Lit component
 * 
 * @param {string} initialColor - Starting color (hex)
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onChange - Called when color changes
 * @param {Function} callbacks.onChangeEnd - Called when interaction ends
 * @returns {Object} Adapter with { element, setColor, destroy }
 */
export function createColorWheelAdapter(initialColor, callbacks = {}) {
  console.log('[Adapter] Creating color wheel adapter:', initialColor);

  // 1. Import component
  import('../../../libs/color-components/components/color-wheel/index.js');

  // 2. Create element
  const element = document.createElement('color-wheel');

  // 3. Set properties
  element.color = initialColor;
  element.setAttribute('aria-label', 'Color Wheel');
  element.setAttribute('wheel-marker-size', '21');

  // 4. Convert Lit events to callbacks
  element.addEventListener('change', (e) => {
    callbacks.onChange?.(e.detail);
  });

  element.addEventListener('change-end', (e) => {
    callbacks.onChangeEnd?.(e.detail);
  });

  // 5. Return functional API
  return {
    element,

    // Update color
    setColor: (color) => {
      console.log('[Adapter] Setting wheel color:', color);
      element.color = color;
    },

    destroy: () => {
      console.log('[Adapter] Destroying wheel adapter');
      element.remove();
    },
  };
}

/**
 * Create color swatch adapter
 * Wraps <ac-color-swatch> Lit component
 * 
 * @param {string} color - Hex color
 * @param {Object} callbacks - Event callbacks
 * @returns {Object} Adapter with { element, setColor, destroy }
 */
export function createColorSwatchAdapter(color, callbacks = {}) {
  console.log('[Adapter] Creating swatch adapter:', color);

  // 1. Import component
  import('../../../libs/color-components/components/ac-color-swatch/index.js');

  // 2. Create element
  const element = document.createElement('ac-color-swatch');

  // 3. Set properties
  element.color = color;

  // 4. Events
  element.addEventListener('click', () => {
    callbacks.onClick?.(color);
  });

  // 5. Return functional API
  return {
    element,

    setColor: (newColor) => {
      console.log('[Adapter] Updating swatch color:', newColor);
      element.color = newColor;
    },

    destroy: () => {
      console.log('[Adapter] Destroying swatch adapter');
      element.remove();
    },
  };
}

/**
 * TODO: Additional adapters to create
 * - createSwatchRailAdapter() - <color-swatch-rail>
 * - createHarmonyToolbarAdapter() - <color-harmony-toolbar>
 * - createBrandLibrariesAdapter() - <ac-brand-libraries-color-picker>
 * - createPaletteListAdapter() - <color-palette-list>
 */
