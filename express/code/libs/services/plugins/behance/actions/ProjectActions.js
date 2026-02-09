import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { BehanceTopics } from '../topics.js';

/**
 * ProjectActions - Handles Behance project search
 *
 * Actions:
 * - searchProjects - Search for projects by keyword (GET /projects)
 *
 * @see BEHANCE_API.md - Search Projects
 */
export default class ProjectActions extends BaseActionGroup {
  getHandlers() {
    return {
      [BehanceTopics.PROJECTS.SEARCH]: this.searchProjects.bind(this),
    };
  }

  /**
   * Search Behance projects by keyword
   *
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.query - Search query
   * @param {string} [criteria.sort='featured_date'] - Sort: featured_date | appreciations | views
   * @param {number} [criteria.page=1] - Page number
   * @returns {Promise<Object>} Promise resolving to { projects } from API
   * @throws {ValidationError} If query is missing
   */
  async searchProjects(criteria) {
    if (!criteria?.query) {
      throw new ValidationError('Search query is required', {
        field: 'criteria.query',
        serviceName: 'Behance',
        topic: 'PROJECTS.SEARCH',
      });
    }
    const path = this.plugin.endpoints.projects;
    const params = {
      q: criteria.query,
      sort: criteria.sort || 'featured_date',
      page: criteria.page || 1,
    };
    return this.plugin.get(path, { params });
  }
}
