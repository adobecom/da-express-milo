/**
 * Filters Component (Shared) - Spectrum Web Components V2
 *
 * Used By: Strips (Palettes), Gradients
 * Not Used By: Extract (no filters needed)
 *
 * Architecture Decision:
 * - Shared component used by multiple renderers
 * - Uses Express Picker wrapper (spectrum/components/express-picker.js)
 * - Vanilla JS wrapper (no Lit dependency)
 * - Each renderer includes this in their layout
 * - Emits filter-change events back to renderer
 *
 * Filters:
 * - Type: All, Linear, Radial, Conic (for gradients)
 * - Category: All, Nature, Abstract, Vibrant, etc.
 * - Time: All, Recent, Popular, Trending
 */

import { createTag } from '../../utils.js';
import { createExpressPicker } from '../spectrum/components/express-picker.js';

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
  // Track picker instances for cleanup
  const pickers = [];

  /**
   * Get default filters based on variant
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
          ],
        },
        {
          id: 'time',
          label: 'All time',
          options: [
            { label: 'All time', value: 'all' },
            { label: 'Today', value: 'today' },
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'Recent', value: 'recent' },
            { label: 'Last 30 Days', value: '30days' },
            { label: 'Last 90 Days', value: '90days' },
            { label: 'This Year', value: 'year' },
            { label: 'Popular', value: 'popular' },
            { label: 'Trending', value: 'trending' },
            { label: 'Most Used', value: 'most-used' },
            { label: 'Most Saved', value: 'most-saved' },
            { label: 'Most Downloaded', value: 'most-downloaded' },
            { label: "Editor's Choice", value: 'editors-choice' },
            { label: 'New', value: 'new' },
            { label: 'Featured', value: 'featured' },
          ],
        },
      ];
    }

    // Default filters for strips/palettes
    return [
      {
        id: 'type',
        label: 'All',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Solid Colors', value: 'solid' },
          { label: 'With Gradient', value: 'gradient' },
          { label: '3 colors', value: '3-color' },
          { label: '4 colors', value: '4-color' },
          { label: '5 colors', value: '5-color' },
          { label: '6+ colors', value: '6-color' },
          { label: 'Monochrome', value: 'monochrome' },
          { label: 'Complementary', value: 'complementary' },
          { label: 'Analogous', value: 'analogous' },
          { label: 'Triadic', value: 'triadic' },
          { label: 'Split Complementary', value: 'split-complementary' },
        ],
      },
      {
        id: 'category',
        label: 'All',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Nature', value: 'nature' },
          { label: 'Ocean', value: 'ocean' },
          { label: 'Sunset', value: 'sunset' },
          { label: 'Sunrise', value: 'sunrise' },
          { label: 'Forest', value: 'forest' },
          { label: 'Desert', value: 'desert' },
          { label: 'Sky', value: 'sky' },
          { label: 'Earth', value: 'earth' },
          { label: 'Abstract', value: 'abstract' },
          { label: 'Minimal', value: 'minimal' },
          { label: 'Modern', value: 'modern' },
          { label: 'Retro', value: 'retro' },
          { label: 'Vintage', value: 'vintage' },
          { label: 'Vibrant', value: 'vibrant' },
          { label: 'Pastel', value: 'pastel' },
          { label: 'Bold', value: 'bold' },
          { label: 'Subtle', value: 'subtle' },
          { label: 'Soft', value: 'soft' },
          { label: 'Muted', value: 'muted' },
          { label: 'Bright', value: 'bright' },
          { label: 'Dark', value: 'dark' },
          { label: 'Warm', value: 'warm' },
          { label: 'Cool', value: 'cool' },
          { label: 'Neutral', value: 'neutral' },
          { label: 'Metallic', value: 'metallic' },
          { label: 'Neon', value: 'neon' },
          { label: 'Earthy', value: 'earthy' },
          { label: 'Jewel Tones', value: 'jewel' },
          { label: 'Calm', value: 'calm' },
          { label: 'Energetic', value: 'energetic' },
          { label: 'Elegant', value: 'elegant' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
      },
      {
        id: 'time',
        label: 'All time',
        options: [
          { label: 'All time', value: 'all' },
          { label: 'Today', value: 'today' },
          { label: 'This Week', value: 'week' },
          { label: 'This Month', value: 'month' },
          { label: 'Recent', value: 'recent' },
          { label: 'Last 30 Days', value: '30days' },
          { label: 'Last 90 Days', value: '90days' },
          { label: 'This Year', value: 'year' },
          { label: 'Popular', value: 'popular' },
          { label: 'Trending', value: 'trending' },
          { label: 'Most Used', value: 'most-used' },
          { label: 'Most Saved', value: 'most-saved' },
          { label: 'Most Downloaded', value: 'most-downloaded' },
          { label: "Editor's Choice", value: 'editors-choice' },
          { label: 'New', value: 'new' },
          { label: 'Featured', value: 'featured' },
        ],
      },
    ];
  }

  // 1. Create container
  const container = createTag('div', { class: 'filters-container' });

  // 2. Create Pickers using shared Express Picker wrapper
  const filtersToUse = filters.length > 0 ? filters : getDefaultFilters();

  try {
    for (const filter of filtersToUse) {
      try {
        const defaultOpt = filter.options[0];
        filterValues[filter.id] = defaultOpt?.value ?? 'all';

        const picker = await createExpressPicker({
          label: filter.label,
          value: filterValues[filter.id],
          options: filter.options,
          id: filter.id,
          onChange: ({ value }) => {
            filterValues[filter.id] = value;
            onFilterChange?.(filterValues);
          },
        });

        container.appendChild(picker.element);
        pickers.push(picker);
      } catch (pickerError) {
        console.error(`[Filters] Failed to create picker for filter ${filter.id}:`, pickerError);
        if (window.lana) {
          window.lana.log(`Failed to create picker for filter ${filter.id}: ${pickerError.message}`, {
            tags: 'color-explorer,filters',
          });
        }
      }
    }
  } catch (error) {
    console.error('[Filters] Failed to create filters component:', error);
    if (window.lana) {
      window.lana.log(`Failed to create filters component: ${error.message}`, {
        tags: 'color-explorer,filters',
      });
    }
  }

  // 3. Public API (unchanged from original)
  return {
    element: container,
    getValues: () => ({ ...filterValues }),
    reset: () => {
      Object.keys(filterValues).forEach((key) => {
        delete filterValues[key];
      });
      pickers.forEach((p) => p.destroy());
    },
  };
}
