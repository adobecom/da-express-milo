import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { CCLibraryTopics } from '../topics.js';

/**
 * LibraryActions - Handles library-level operations for CC Libraries (Melville API)
 *
 * Actions:
 * - createLibrary - Create a new library
 * - fetchLibraries - List libraries with optional query params
 * - fetchLibraryElements - List elements (themes/gradients) in a library
 *
 * Uses ValidationError for input validation failures.
 * All operations require Bearer authentication (enforced by BaseApiService).
 */
export default class LibraryActions extends BaseActionGroup {
  getHandlers() {
    return {
      [CCLibraryTopics.LIBRARY.CREATE]: this.createLibrary.bind(this),
      [CCLibraryTopics.LIBRARY.FETCH]: this.fetchLibraries.bind(this),
      [CCLibraryTopics.LIBRARY.ELEMENTS]: this.fetchLibraryElements.bind(this),
    };
  }

  /**
   * Create a new library
   *
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
    const path = this.plugin.endpoints.libraries;
    return this.plugin.post(path, { name });
  }

  /**
   * Fetch all libraries
   *
   * @param {Object} [params] - Query parameters
   * @param {string} [params.owner='all'] - Owner filter: 'self', 'shared', 'all'
   * @param {number} [params.start=0] - Pagination start index
   * @param {number} [params.limit=40] - Results per page
   * @param {string} [params.selector='details'] - Data detail level
   * @param {string} [params.orderBy='-modified'] - Sort order
   * @param {string} [params.toolkit='none'] - Exclude toolkit data
   * @returns {Promise<Object>} { total_count, libraries, _links }
   */
  async fetchLibraries(params = {}) {
    const path = this.plugin.endpoints.libraries;
    const queryParams = {
      owner: params.owner ?? 'all',
      start: params.start ?? 0,
      limit: params.limit ?? 40,
      selector: params.selector ?? 'details',
      orderBy: params.orderBy ?? '-modified',
      toolkit: params.toolkit ?? 'none',
    };
    return this.plugin.get(path, { params: queryParams });
  }

  /**
   * List elements (themes/gradients) in a library
   *
   * @param {string} libraryId - Library ID (library_urn or id)
   * @param {Object} [params] - Query parameters
   * @param {number} [params.start=0] - Pagination start index
   * @param {number} [params.limit=50] - Results per page
   * @param {string} [params.selector='representations'] - Data detail level
   * @param {string} [params.type] - Filter by element type (MIME types, comma-separated)
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
    const path = `${this.plugin.endpoints.libraries}/${libraryId}${this.plugin.endpoints.themes}`;
    const queryParams = {
      start: params.start ?? 0,
      limit: params.limit ?? 50,
      selector: params.selector ?? 'representations',
      ...(params.type != null && { type: params.type }),
    };
    return this.plugin.get(path, { params: queryParams });
  }
}
