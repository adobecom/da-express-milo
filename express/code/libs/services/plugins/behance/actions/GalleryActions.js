import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { BehanceTopics } from '../topics.js';

/**
 * GalleryActions - Handles Behance gallery list and gallery projects
 *
 * Actions:
 * - getGalleryList - Get curated gallery categories (GET /galleries)
 * - getGalleryProjects - Get projects in a gallery (GET /galleries/:id/projects)
 *
 * @see BEHANCE_API.md - Get Gallery List, Get Gallery Projects
 */
export default class GalleryActions extends BaseActionGroup {
  getHandlers() {
    return {
      [BehanceTopics.GALLERIES.LIST]: this.getGalleryList.bind(this),
      [BehanceTopics.GALLERIES.PROJECTS]: this.getGalleryProjects.bind(this),
    };
  }

  /**
   * Get list of curated Behance galleries
   *
   * @param {Object} [options] - Options
   * @param {string} [options.locale='en'] - Locale code
   * @returns {Promise<Object>} Promise resolving to API response (categories)
   */
  async getGalleryList(options = {}) {
    const path = this.plugin.endpoints.galleries;
    const params = {
      'api-key': this.plugin.apiKey || 'ColorWeb',
      locale: options.locale || 'en',
    };
    return this.plugin.get(path, { params });
  }

  /**
   * Get projects within a specific gallery
   *
   * @param {Object} criteria - Criteria
   * @param {string|number} criteria.galleryId - Gallery ID
   * @param {string} [criteria.locale='en'] - Locale code
   * @param {number} [criteria.page=1] - Page number (1-indexed)
   * @param {number} [criteria.perPage=20] - Results per page
   * @returns {Promise<Object>} Promise resolving to { gallery, entities }
   * @throws {ValidationError} If galleryId is missing
   */
  async getGalleryProjects(criteria) {
    if (criteria?.galleryId == null || criteria.galleryId === '') {
      throw new ValidationError('Gallery ID is required', {
        field: 'criteria.galleryId',
        serviceName: 'Behance',
        topic: 'GALLERIES.PROJECTS',
      });
    }
    const { galleryId, locale = 'en', page = 1, perPage = 20 } = criteria;
    const ordinal = (Number(page) - 1) * Number(perPage);
    const path = `${this.plugin.endpoints.galleries}/${galleryId}/projects`;
    const params = {
      'api-key': this.plugin.apiKey || 'ColorWeb',
      locale,
      ordinal,
      per_page: perPage,
    };
    return this.plugin.get(path, { params });
  }
}
