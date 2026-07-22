/* eslint-disable max-classes-per-file */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { CCLibraryTopics } from '../topics.js';
import {
  LIBRARIES_PAGE_SIZE,
  ELEMENTS_PAGE_SIZE,
  ALL_COLOR_ELEMENT_TYPES,
  LIBRARY_OWNER_SCOPE,
} from '../constants.js';

export class LibraryActions extends BaseActionGroup {
  getHandlers() {
    return {
      [CCLibraryTopics.LIBRARY.CREATE]: this.createLibrary.bind(this),
      [CCLibraryTopics.LIBRARY.FETCH]: this.fetchLibraries.bind(this),
      [CCLibraryTopics.LIBRARY.ELEMENTS]: this.fetchLibraryElements.bind(this),
    };
  }

  /**
   * @param {string} name - Library name
   * @returns {Promise<Object>} Created library
   * @throws {ValidationError} If name is missing
   */
  async createLibrary(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Library name is required', {
        field: 'name',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.LIBRARY.CREATE,
      });
    }
    const { libraries } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries }, 'CCLibrary');
    return this.plugin.post(libraries, { name });
  }

  /**
   * @param {Object} [params] - Query parameters
   * @param {string} [params.owner='all'] - Owner scope filter.
   *   Valid: 'all', 'private', 'incoming', 'outgoing', 'team', 'discovery', 'public', 'other'.
   *   Can be comma-separated (e.g. 'private,incoming').
   * @param {number} [params.start=0] - Pagination start index
   * @param {number} [params.limit=LIBRARIES_PAGE_SIZE] - Results per page
   * @param {string} [params.selector='details'] - Data detail level
   * @param {string} [params.orderBy='-modified_date'] -
   * Sort order ('name', 'created_date', 'modified_date'; prefix with - for descending)
   * @param {string} [params.toolkit='none'] - Exclude toolkit data
   * @returns {Promise<Object>} { total_count, libraries, _links }
   */
  async fetchLibraries(params = {}) {
    const { libraries } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries }, 'CCLibrary');
    const queryParams = {
      owner: params.owner ?? LIBRARY_OWNER_SCOPE.ALL,
      start: params.start ?? 0,
      limit: params.limit ?? LIBRARIES_PAGE_SIZE,
      selector: params.selector ?? 'details',
      orderBy: params.orderBy ?? '-modified_date',
      toolkit: params.toolkit ?? 'none',
    };
    return this.plugin.get(libraries, { params: queryParams });
  }

  /**
   * @param {string} libraryId - Library ID (library_urn or id)
   * @param {Object} [params] - Query parameters
   * @param {number} [params.start=0] - Pagination start index
   * @param {number} [params.limit=ELEMENTS_PAGE_SIZE] - Results per page
   * @param {string} [params.selector='representations'] - Data detail level
   * @param {string} [params.type] - Filter by element type (MIME types, comma-separated).
   *   Defaults to ALL_COLOR_ELEMENT_TYPES (themes + gradients).
   * @returns {Promise<Object>} { total_count, elements }
   * @throws {ValidationError} If libraryId is missing
   */
  async fetchLibraryElements(libraryId, params = {}) {
    if (!libraryId) {
      throw new ValidationError('Library ID is required', {
        field: 'libraryId',
        serviceName: 'CCLibrary',
        topic: CCLibraryTopics.LIBRARY.ELEMENTS,
      });
    }
    const { libraries, themes } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries, themes }, 'CCLibrary');
    const path = `${libraries}/${libraryId}${themes}`;
    const queryParams = {
      start: params.start ?? 0,
      limit: params.limit ?? ELEMENTS_PAGE_SIZE,
      selector: params.selector ?? 'representations',
      type: params.type ?? ALL_COLOR_ELEMENT_TYPES,
    };
    return this.plugin.get(path, { params: queryParams });
  }
}

export class LibraryThemeActions extends BaseActionGroup {
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
    const { libraries, themes } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries, themes }, 'CCLibrary');
    return this.plugin.post(`${libraries}/${libraryId}${themes}`, themeData);
  }

  /**
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
    const { libraries, themes } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries, themes }, 'CCLibrary');
    return this.plugin.post(`${libraries}/${libraryId}${themes}`, gradientData);
  }

  /**
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
    const { libraries, themes } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries, themes }, 'CCLibrary');
    return this.plugin.delete(`${libraries}/${libraryId}${themes}/${elementId}`);
  }

  /**
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
    const { libraries, themes } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries, themes }, 'CCLibrary');
    return this.plugin.put(`${libraries}/${libraryId}${themes}/${elementId}/representations`, payload);
  }

  /**
   * @param {string} libraryId - Library ID
   * @param {Array<{id: string, name?: string}>} elements
   *   Elements to update (id and fields to set)
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
    const { libraries, themes, metadata } = this.plugin.endpoints;
    BaseActionGroup.requireConfig({ libraries, themes, metadata }, 'CCLibrary');
    return this.plugin.put(`${libraries}/${libraryId}${themes}${metadata}`, { elements });
  }
}
