import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { CCLibraryTopics } from '../topics.js';

/**
 * LibraryThemeActions - Handles theme/element operations within CC Libraries
 *
 * Actions:
 * - saveTheme - Create a theme element in a library
 * - saveGradient - Create a gradient element in a library
 * - deleteTheme - Delete an element from a library
 * - updateTheme - Update an element's representation data (PUT)
 * - updateElementMetadata - Update element metadata (e.g. name) only
 *
 * Uses ValidationError for input validation failures.
 * All operations require Bearer authentication (enforced by BaseApiService).
 */
export default class LibraryThemeActions extends BaseActionGroup {
  getHandlers() {
    return {
      [CCLibraryTopics.THEME.SAVE]: this.saveTheme.bind(this),
      [CCLibraryTopics.THEME.SAVE_GRADIENT]: this.saveGradient.bind(this),
      [CCLibraryTopics.THEME.DELETE]: this.deleteTheme.bind(this),
      [CCLibraryTopics.THEME.UPDATE]: this.updateTheme.bind(this),
      [CCLibraryTopics.THEME.UPDATE_METADATA]: this.updateElementMetadata.bind(this),
    };
  }

  /**
   * Save a theme to a library (create element type colortheme)
   *
   * @param {string} libraryId - Library ID
   * @param {Object} themeData - Theme data (name, type, client, representations per API)
   * @returns {Promise<Object>} { elements: [{ id, name, type, ... }] }
   * @throws {ValidationError} If libraryId or themeData is missing
   */
  async saveTheme(libraryId, themeData) {
    if (!libraryId) {
      throw new ValidationError('Library ID is required', {
        field: 'libraryId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.SAVE,
      });
    }
    if (!themeData || typeof themeData !== 'object') {
      throw new ValidationError('Theme data is required', {
        field: 'themeData',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.SAVE,
      });
    }
    const path = `${this.plugin.endpoints.libraries}/${libraryId}${this.plugin.endpoints.themes}`;
    return this.plugin.post(path, themeData);
  }

  /**
   * Save a gradient to a library (create element type gradient)
   *
   * @param {string} libraryId - Library ID
   * @param {Object} gradientData - Gradient data (name, type, client, representations per API)
   * @returns {Promise<Object>} { elements: [{ id, name, type, ... }] }
   * @throws {ValidationError} If libraryId or gradientData is missing
   */
  async saveGradient(libraryId, gradientData) {
    if (!libraryId) {
      throw new ValidationError('Library ID is required', {
        field: 'libraryId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.SAVE_GRADIENT,
      });
    }
    if (!gradientData || typeof gradientData !== 'object') {
      throw new ValidationError('Gradient data is required', {
        field: 'gradientData',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.SAVE_GRADIENT,
      });
    }
    const path = `${this.plugin.endpoints.libraries}/${libraryId}${this.plugin.endpoints.themes}`;
    return this.plugin.post(path, gradientData);
  }

  /**
   * Delete an element from a library
   *
   * @param {string} libraryId - Library ID
   * @param {string} elementId - Element ID
   * @returns {Promise<Object>} Empty object (204 No Content)
   * @throws {ValidationError} If libraryId or elementId is missing
   */
  async deleteTheme(libraryId, elementId) {
    if (!libraryId) {
      throw new ValidationError('Library ID is required', {
        field: 'libraryId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.DELETE,
      });
    }
    if (!elementId) {
      throw new ValidationError('Element ID is required', {
        field: 'elementId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.DELETE,
      });
    }
    const path = `${this.plugin.endpoints.libraries}/${libraryId}${this.plugin.endpoints.themes}/${elementId}`;
    return this.plugin.delete(path);
  }

  /**
   * Update an element's representation data (theme or gradient)
   *
   * @param {string} libraryId - Library ID
   * @param {string} elementId - Element ID
   * @param {Object} payload - Update payload (client, type, representations per API)
   * @returns {Promise<Object>} { id, representations }
   * @throws {ValidationError} If required params are missing
   */
  async updateTheme(libraryId, elementId, payload) {
    if (!libraryId) {
      throw new ValidationError('Library ID is required', {
        field: 'libraryId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.UPDATE,
      });
    }
    if (!elementId) {
      throw new ValidationError('Element ID is required', {
        field: 'elementId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.UPDATE,
      });
    }
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Update payload is required', {
        field: 'payload',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.UPDATE,
      });
    }
    const path = `${this.plugin.endpoints.libraries}/${libraryId}${this.plugin.endpoints.themes}/${elementId}/representations`;
    return this.plugin.put(path, payload);
  }

  /**
   * Update element metadata (e.g. name) without changing representations
   *
   * @param {string} libraryId - Library ID
   * @param {Array<{id: string, name?: string}>} elements - Elements to update (id and fields to set)
   * @returns {Promise<Object>} Empty object (204 No Content)
   * @throws {ValidationError} If libraryId or elements is missing/invalid
   */
  async updateElementMetadata(libraryId, elements) {
    if (!libraryId) {
      throw new ValidationError('Library ID is required', {
        field: 'libraryId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.UPDATE_METADATA,
      });
    }
    if (!Array.isArray(elements) || elements.length === 0) {
      throw new ValidationError('Elements array is required and must not be empty', {
        field: 'elements',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.THEME.UPDATE_METADATA,
      });
    }
    const path = `${this.plugin.endpoints.libraries}/${libraryId}${this.plugin.endpoints.themes}${this.plugin.endpoints.metadata}`;
    return this.plugin.put(path, { elements });
  }
}
