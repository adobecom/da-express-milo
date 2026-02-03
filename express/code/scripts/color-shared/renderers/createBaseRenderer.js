/**
 * Base Renderer
 * 
 * WIREFRAME FILE - Shows shared functionality
 * 
 * Responsibilities:
 * - Event system (on/emit)
 * - Data management (get/set)
 * - Common utilities
 * - Shared between all variant renderers
 * 
 * Does NOT:
 * - Render UI (override in specific renderers)
 * - Contain variant-specific logic
 */

import { createTag } from '../../utils.js';
import BlockMediator from '../../block-mediator.min.js';

/**
 * Create base renderer with shared functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Base renderer API
 */
export function createBaseRenderer(options) {
  const { data = [], config = {}, stateKey = 'color-explorer-hybrid' } = options;

  console.log('[BaseRenderer] Initializing with', data.length, 'items');

  // Private state
  let currentData = data;
  const eventListeners = {};

  /**
   * Event system: Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  function on(event, callback) {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);
    console.log('[BaseRenderer] Registered listener for:', event);
  }

  /**
   * Event system: Emit event
   * @param {string} event - Event name
   * @param {*} detail - Event data
   */
  function emit(event, detail) {
    console.log('[BaseRenderer] Emitting event:', event, detail);
    
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => callback(detail));
    }

    // Also emit as custom DOM event
    const customEvent = new CustomEvent(`color-explorer:${event}`, {
      detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(customEvent);
  }

  /**
   * Get current data
   * @returns {Array} Current data array
   */
  function getData() {
    return currentData;
  }

  /**
   * Set new data
   * @param {Array} newData - New data array
   */
  function setData(newData) {
    console.log('[BaseRenderer] Setting new data:', newData.length, 'items');
    currentData = newData;
    
    // Update BlockMediator state
    const state = BlockMediator.get(stateKey);
    BlockMediator.set(stateKey, {
      ...state,
      data: newData,
    });
  }

  /**
   * Get state from BlockMediator
   * @returns {Object} Current state
   */
  function getState() {
    return BlockMediator.get(stateKey);
  }

  /**
   * Update state in BlockMediator
   * @param {Object} updates - Partial state updates
   */
  function updateState(updates) {
    const state = getState();
    BlockMediator.set(stateKey, {
      ...state,
      ...updates,
    });
  }

  /**
   * Create a grid container (vanilla DOM)
   * Override in specific renderers if needed
   * @returns {HTMLElement} Grid element
   */
  function createGrid() {
    const grid = createTag('div', { class: 'color-grid' });
    console.log('[BaseRenderer] Created grid container');
    return grid;
  }

  /**
   * Create a card wrapper (placeholder)
   * Override in specific renderers
   * @param {Object} item - Data item
   * @returns {HTMLElement} Card element
   */
  function createCard(item) {
    const card = createTag('div', { class: 'color-card' });
    card.textContent = `Card: ${item.name || item.id}`;
    console.log('[BaseRenderer] Created card:', item.name);
    return card;
  }

  /**
   * Create loading indicator
   * @returns {HTMLElement} Loading element
   */
  function createLoader() {
    const loader = createTag('div', { class: 'color-explorer-loading' });
    loader.innerHTML = '<div class="spinner"></div><p>Loading colors...</p>';
    return loader;
  }

  /**
   * Create error message
   * @param {string} message - Error message
   * @returns {HTMLElement} Error element
   */
  function createError(message = 'Failed to load colors') {
    const error = createTag('div', { class: 'color-explorer-error' });
    error.innerHTML = `<p>${message}</p>`;
    return error;
  }

  // Public API
  return {
    // Event system
    on,
    emit,

    // Data management
    getData,
    setData,
    getState,
    updateState,

    // Common utilities
    createGrid,
    createCard,
    createLoader,
    createError,

    // Configuration
    config,
    stateKey,
  };
}
