/**
 * Color Explorer - Base Renderer
 * Provides common functionality for all renderers
 * Uses closures for encapsulation
 * Returns object with methods
 */

import { createTag } from '../../../scripts/utils.js';
import BlockMediator from '../../../scripts/block-mediator.min.js';

/**
 * Create base renderer with common functionality
 * @param {Object} options - Configuration options
 * @param {Array} options.data - Initial data
 * @param {string} options.stateKey - BlockMediator state key
 * @param {Object} options.config - Configuration
 * @returns {Object} Base renderer methods
 */
export function createBaseRenderer(options) {
  // Private state (closure)
  let data = options.data || [];
  let stateKey = options.stateKey;
  let config = options.config;
  const eventListeners = new Map();

  /**
   * Event emitter - register listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  function on(event, callback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event).push(callback);
  }

  /**
   * Event emitter - trigger event
   * @param {string} event - Event name
   * @param {*} eventData - Event data
   */
  function emit(event, eventData) {
    const listeners = eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(eventData));
  }

  /**
   * Create card element
   * @param {Object} item - Item data
   * @returns {HTMLElement} Card element
   */
  function createCard(item) {
    const card = createTag('div', {
      class: 'color-card',
      'data-id': item.id,
      tabindex: '0',
      role: 'button',
      'aria-label': item.name || 'Color item',
    });
    return card;
  }

  /**
   * Create grid container
   * @returns {HTMLElement} Grid element
   */
  function createGrid() {
    return createTag('div', { class: 'color-grid' });
  }

  /**
   * Get current data
   * @returns {Array} Current data
   */
  function getData() {
    return data;
  }

  /**
   * Update data
   * @param {Array} newData - New data
   */
  function setData(newData) {
    data = newData;
  }

  /**
   * Get config
   * @returns {Object} Configuration
   */
  function getConfig() {
    return config;
  }

  /**
   * Get state key
   * @returns {string} BlockMediator state key
   */
  function getStateKey() {
    return stateKey;
  }

  /**
   * Get current state from BlockMediator
   * @returns {Object} Current state
   */
  function getState() {
    return BlockMediator.get(stateKey) || {};
  }

  // Return public API
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
    getStateKey,
    getState,
  };
}

