/**
 * Filters Component (Shared) - Spectrum Web Components V2
 * 
 * Used By: Strips (Palettes), Gradients
 * Not Used By: Extract (no filters needed)
 * 
 * Architecture Decision:
 * - Shared component used by multiple renderers
 * - Uses Spectrum Web Components V2 (sp-picker pattern)
 * - Vanilla JS wrapper (no Lit dependency)
 * - Components preloaded in head.html via static script tag
 * - Each renderer includes this in their layout
 * - Emits filter-change events back to renderer
 * 
 * Filters:
 * - Type: All, Linear, Radial, Conic (for gradients)
 * - Category: All, Nature, Abstract, Vibrant, etc.
 * - Time: All, Recent, Popular, Trending
 */

import { createTag } from '../../../scripts/utils.js';

/**
 * Create filters component
 * @param {Object} options - Configuration
 * @param {Array} options.filters - Array of filter configs
 * @param {Function} options.onFilterChange - Filter change callback
 * @param {string} options.variant - Variant type (strips, gradients)
 * @returns {Object} Filters component with { element, getValues, reset }
 */

export async function createFiltersComponent(options = {}) {
  const {
    filters = [],
    onFilterChange,
    variant = 'strips',
  } = options;
  
  // Current filter values
  const filterValues = {};

  /**
   * Load Spectrum Web Components dynamically
   * Using locally bundled Spectrum Web Components
   */
  async function loadSpectrumComponents() {
    console.log('[Spectrum] loadSpectrumComponents called');
    
    // Check if already loaded
    if (window.customElements.get('sp-theme') && 
        window.customElements.get('sp-picker') && 
        window.customElements.get('sp-menu') && 
        window.customElements.get('sp-menu-item')) {
      console.log('[Spectrum] Components already loaded');
      return true;
    }
    
    console.log('[Spectrum] Components not loaded, starting import...');
    
    // Suppress known Spectrum internal errors that are non-fatal
    // This error occurs in menu.js when menuCascade WeakMap is undefined
    // It's a known issue but doesn't prevent components from working
    const originalErrorHandler = window.onerror;
    const suppressedErrors = new Set();
    window.onerror = function(message, source, lineno, colno, error) {
      // Suppress menuCascade WeakMap errors (non-fatal)
      if (message && (
        message.includes('Cannot read properties of undefined') && 
        message.includes('reading \'set\'') ||
        message.includes('Cannot read properties of undefined') && 
        message.includes('reading \'get\'')
      )) {
        if (source && source.includes('menu.js')) {
          // Only log once per error type
          const errorKey = `${source}:${lineno}`;
          if (!suppressedErrors.has(errorKey)) {
            suppressedErrors.add(errorKey);
            console.warn('[Spectrum] Suppressed non-fatal menu error (known Spectrum issue):', message);
          }
          return true; // Suppress error
        }
      }
      // Call original error handler for other errors
      if (originalErrorHandler) {
        return originalErrorHandler.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Wrap custom element registration to handle duplicates gracefully
    const originalDefine = window.customElements.define.bind(window.customElements);
    window.customElements.define = function(name, constructor, options) {
      if (window.customElements.get(name)) {
        console.log(`[Spectrum] Custom element ${name} already registered, skipping...`);
        return;
      }
      return originalDefine(name, constructor, options);
    };
    
    try {
      console.log('[Spectrum] Loading bundled Spectrum Web Components...');
      // Using esbuild-bundled Spectrum Web Components
      // Bundles handle all internal imports and CSS module registration
      
      // Import bundled components in order
      // Lit must be imported first (base.js depends on it)
      console.log('[Spectrum] Step 1: Importing lit (base dependency)...');
      const litModule = await import('../../../scripts/widgets/spectrum/dist/lit.js');
      // Store adoptStyles function for later use
      window.__SpectrumAdoptStyles = litModule.adoptStyles;
      console.log('[Spectrum] Lit imported, adoptStyles available:', typeof litModule.adoptStyles === 'function');
      
      // Base must be imported next (provides css, html, etc. from lit)
      console.log('[Spectrum] Step 2: Importing base (provides css from lit)...');
      await import('../../../scripts/widgets/spectrum/dist/base.js');
      console.log('[Spectrum] Base imported');
      
      // Theme must be imported next to register CSS fragments
      console.log('[Spectrum] Step 3: Importing theme (includes CSS registration)...');
      const themeModule = await import('../../../scripts/widgets/spectrum/dist/theme.js');
      console.log('[Spectrum] Theme imported');
      // Wait a bit for CSS fragments to register
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reactive controllers needed by overlay
      console.log('[Spectrum] Step 4: Importing reactive-controllers (needed by overlay)...');
      await import('../../../scripts/widgets/spectrum/dist/reactive-controllers.js');
      console.log('[Spectrum] Reactive-controllers imported');
      
      // Shared utilities needed by components
      console.log('[Spectrum] Step 5: Importing shared utilities...');
      await import('../../../scripts/widgets/spectrum/dist/shared.js');
      console.log('[Spectrum] Shared imported');
      
      console.log('[Spectrum] Step 6: Importing icons (must be loaded before components)...');
      await import('../../../scripts/widgets/spectrum/dist/icons-ui.js');
      await import('../../../scripts/widgets/spectrum/dist/icons-workflow.js');
      console.log('[Spectrum] Icons imported');
      
      console.log('[Spectrum] Step 7: Importing overlay and popover (menu dependencies)...');
      await import('../../../scripts/widgets/spectrum/dist/overlay.js');
      await import('../../../scripts/widgets/spectrum/dist/popover.js');
      console.log('[Spectrum] Overlay and popover imported');
      
      console.log('[Spectrum] Step 8: Importing menu components...');
      await import('../../../scripts/widgets/spectrum/dist/menu.js');
      console.log('[Spectrum] Menu imported');
      
      console.log('[Spectrum] Step 9: Importing picker...');
      await import('../../../scripts/widgets/spectrum/dist/picker.js');
      console.log('[Spectrum] Picker imported');
      
      // Wait for custom elements to register
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const themeRegistered = window.customElements.get('sp-theme');
      const pickerRegistered = window.customElements.get('sp-picker');
      const menuRegistered = window.customElements.get('sp-menu');
      const menuItemRegistered = window.customElements.get('sp-menu-item');
      
      console.log('[Spectrum] Registration status:', {
        theme: !!themeRegistered,
        picker: !!pickerRegistered,
        menu: !!menuRegistered,
        menuItem: !!menuItemRegistered,
      });
      
      // Restore original define
      window.customElements.define = originalDefine;
      
      if (themeRegistered && pickerRegistered && menuRegistered && menuItemRegistered) {
        console.log('[Spectrum] ✅ All components registered successfully!');
        return true;
      } else {
        const missing = [];
        if (!themeRegistered) missing.push('sp-theme');
        if (!pickerRegistered) missing.push('sp-picker');
        if (!menuRegistered) missing.push('sp-menu');
        if (!menuItemRegistered) missing.push('sp-menu-item');
        throw new Error(`Components failed to register: ${missing.join(', ')}`);
      }
    } catch (error) {
      // Restore original define on error
      if (window.customElements.define !== originalDefine) {
        window.customElements.define = originalDefine;
      }
      console.error('[Spectrum] ❌ Failed to load components:', error);
      console.error('[Spectrum] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      if (window.lana) {
        window.lana.log('Spectrum Web Components load failed', { 
          error: error.message, 
          stack: error.stack 
        }, { errorType: 'e' });
      }
      
      throw error;
    } finally {
      // Restore original error handler
      if (originalErrorHandler !== undefined) {
        window.onerror = originalErrorHandler;
      } else {
        window.onerror = null;
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create a single Spectrum Picker filter
   * Components are preloaded in head.html, so we just need to create the HTML
   * @param {Object} filter - Filter config
   * @returns {Promise<HTMLElement>} Picker element
   */
  async function createFilterPicker(filter) {
    const { id, label, options: filterOptions } = filter;

    // Load Spectrum components dynamically
    await loadSpectrumComponents();

    const wrapper = createTag('div', { class: 'filter-dropdown' });

    const selectedOption = filterOptions.find(opt => opt.value === filterValues[id]) || filterOptions[0];
    filterValues[id] = selectedOption.value;

    // Simple approach: Create picker with menu items inline
    // Spectrum will handle initialization automatically
    const pickerHTML = `
      <sp-theme system="spectrum-two" color="light" scale="medium">
        <sp-picker 
          id="filter-${id}" 
          label="${escapeHtml(label)}" 
          aria-label="Filter by ${escapeHtml(label)}"
          class="filter-picker"
          value="${escapeHtml(selectedOption.value)}">
          <sp-menu slot="options">
            ${filterOptions.map((opt) => `
              <sp-menu-item 
                value="${escapeHtml(opt.value)}" 
                ${opt.value === selectedOption.value ? 'selected' : ''}>
                ${escapeHtml(opt.label)}
              </sp-menu-item>
            `).join('')}
          </sp-menu>
        </sp-picker>
      </sp-theme>
    `;

    wrapper.innerHTML = pickerHTML;
    
    const picker = wrapper.querySelector('sp-picker');

    if (!picker) {
      throw new Error(`Failed to create sp-picker for filter ${id}`);
    }

    // Wait for custom elements to upgrade
    await customElements.whenDefined('sp-picker');
    await customElements.whenDefined('sp-theme');
    
    // Simple wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add change event listener
    picker.addEventListener('change', (e) => {
      const newValue = e.target.value;
      filterValues[id] = newValue;
      onFilterChange?.(filterValues);
    });

    return wrapper;
  }

  /**
   * Get default filters based on variant
   * Matching Figma design: "Color gradients", "All", "All time"
   */
  function getDefaultFilters() {
    if (variant === 'gradients') {
      return [
        {
          id: 'type',
          label: 'Color gradients',
          options: [
            { label: 'Color gradients', value: 'all' },
            { label: 'Linear', value: 'linear' },
            { label: 'Radial', value: 'radial' },
            { label: 'Conic', value: 'conic' },
            { label: 'Diagonal', value: 'diagonal' },
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
            { label: 'Angled', value: 'angled' },
          ],
        },
        {
          id: 'category',
          label: 'All',
          options: [
            { label: 'All', value: 'all' },
            { label: 'Nature', value: 'nature' },
            { label: 'Abstract', value: 'abstract' },
            { label: 'Vibrant', value: 'vibrant' },
            { label: 'Pastel', value: 'pastel' },
            { label: 'Warm', value: 'warm' },
            { label: 'Cool', value: 'cool' },
            { label: 'Neutral', value: 'neutral' },
            { label: 'Bold', value: 'bold' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Metallic', value: 'metallic' },
          ],
        },
        {
          id: 'time',
          label: 'All time',
          options: [
            { label: 'All time', value: 'all' },
            { label: 'Recent', value: 'recent' },
            { label: 'Popular', value: 'popular' },
            { label: 'Trending', value: 'trending' },
          ],
        },
      ];
    }
    
    // Default filters for strips
    return [
      {
        id: 'type',
        label: 'All',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Solid', value: 'solid' },
          { label: 'Gradient', value: 'gradient' },
        ],
      },
      {
        id: 'category',
        label: 'All',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Nature', value: 'nature' },
          { label: 'Abstract', value: 'abstract' },
          { label: 'Vibrant', value: 'vibrant' },
        ],
      },
      {
        id: 'time',
        label: 'All time',
        options: [
          { label: 'All time', value: 'all' },
          { label: 'Recent', value: 'recent' },
          { label: 'Popular', value: 'popular' },
        ],
      },
    ];
  }

  // 1. Create container (no results count - it's in the header title)
  const container = createTag('div', { class: 'filters-container' });
  console.log('[Filters] Container created');

  // 2. Create Pickers (matching Figma: three pickers horizontally aligned)
  console.log(`[Filters] Getting filters for variant: ${variant}, provided filters: ${filters.length}`);
  const filtersToUse = filters.length > 0 ? filters : getDefaultFilters();
  console.log(`[Filters] Using ${filtersToUse.length} filters:`, filtersToUse.map(f => f.id));
  
  try {
    for (const filter of filtersToUse) {
      try {
        console.log(`[Filters] Creating picker for filter: ${filter.id}`);
        const picker = await createFilterPicker(filter);
        if (picker) {
          container.appendChild(picker);
          console.log(`[Filters] Picker ${filter.id} added to container`);
        } else {
          console.warn(`[Filters] Picker ${filter.id} created but is null`);
        }
      } catch (pickerError) {
        console.error(`[Spectrum] Failed to create picker for filter ${filter.id}:`, pickerError);
        console.error(`[Spectrum] Picker error stack:`, pickerError.stack);
        // Continue with other pickers even if one fails
        if (window.lana) {
          window.lana.log(`Failed to create picker for filter ${filter.id}: ${pickerError.message}`, {
            tags: 'color-explorer,filters',
          });
        }
      }
    }
    console.log(`[Filters] All pickers created, container has ${container.children.length} children`);
  } catch (error) {
    console.error('[Spectrum] Failed to create filters component:', error);
    console.error('[Spectrum] Filters error stack:', error.stack);
    if (window.lana) {
      window.lana.log(`Failed to create filters component: ${error.message}`, {
        tags: 'color-explorer,filters',
      });
    }
    // Return empty container rather than throwing - allows block to render without filters
  }

  // 4. Public API
  return {
    element: container,
    getValues: () => ({ ...filterValues }),
    reset: () => {
      Object.keys(filterValues).forEach((key) => {
        delete filterValues[key];
      });
    },
  };
}
