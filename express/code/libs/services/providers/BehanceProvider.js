import BaseProvider from './BaseProvider.js';
import { BehanceTopics, BehanceActionGroups } from '../plugins/behance/topics.js';

/**
 * Behance Provider
 *
 * Provides a clean API for Behance: project search, gallery list,
 * gallery projects, and graphic design list (GraphQL).
 * Uses the useAction pattern for cached, reusable action functions.
 *
 * @example
 * const behance = await serviceManager.getProvider('behance');
 * const projects = await behance.searchProjects('sunset', { page: 1 });
 * const galleries = await behance.getGalleryList({ locale: 'en' });
 * const galleryProjects = await behance.getGalleryProjects('12345', { page: 1 });
 * const graphicDesign = await behance.getGraphicDesignList({ count: 10 });
 */
export default class BehanceProvider extends BaseProvider {
  /**
   * Cached action functions
   * @type {Object}
   */
  #actions = {};

  /**
   * @param {Object} plugin - Plugin instance
   */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  /**
   * Initialize action functions from plugin using useAction.
   */
  #initActions() {
    const { PROJECTS, GALLERIES, GRAPHQL } = BehanceActionGroups;

    this.#actions = {
      searchProjects: this.plugin.useAction(PROJECTS, BehanceTopics.PROJECTS.SEARCH),
      getGalleryList: this.plugin.useAction(GALLERIES, BehanceTopics.GALLERIES.LIST),
      getGalleryProjects: this.plugin.useAction(GALLERIES, BehanceTopics.GALLERIES.PROJECTS),
      getGraphicDesignList: this.plugin.useAction(GRAPHQL, BehanceTopics.GRAPHQL.GRAPHIC_DESIGN_LIST),
    };
  }

  /**
   * Search Behance projects by keyword
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string} [options.sort='featured_date'] - Sort: featured_date | appreciations | views
   * @param {number} [options.page=1] - Page number
   * @returns {Promise<Object|null>} API response (e.g. { projects }) or null on failure
   */
  async searchProjects(query, options = {}) {
    const criteria = {
      query,
      sort: options.sort || 'featured_date',
      page: options.page || 1,
    };
    return this.safeExecute(() => this.#actions.searchProjects(criteria));
  }

  /**
   * Get list of curated Behance galleries
   *
   * @param {Object} [options] - Options
   * @param {string} [options.locale='en'] - Locale code
   * @returns {Promise<Object|null>} API response (e.g. { categories }) or null on failure
   */
  async getGalleryList(options = {}) {
    return this.safeExecute(() => this.#actions.getGalleryList(options));
  }

  /**
   * Get projects within a specific gallery
   *
   * @param {string|number} galleryId - Gallery ID
   * @param {Object} [options] - Options
   * @param {string} [options.locale='en'] - Locale code
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.perPage=20] - Results per page
   * @returns {Promise<Object|null>} API response (e.g. { gallery, entities }) or null on failure
   */
  async getGalleryProjects(galleryId, options = {}) {
    const criteria = {
      galleryId,
      locale: options.locale || 'en',
      page: options.page || 1,
      perPage: options.perPage || 20,
    };
    return this.safeExecute(() => this.#actions.getGalleryProjects(criteria));
  }

  /**
   * Fetch graphic design projects for home page (GraphQL)
   *
   * @param {Object} [options] - Options
   * @param {string} [options.slug='graphic-design'] - Gallery slug
   * @param {number} [options.count=10] - Number of projects
   * @returns {Promise<Object|null>} GraphQL result (gallery.projects.nodes) or null on failure
   */
  async getGraphicDesignList(options = {}) {
    return this.safeExecute(() => this.#actions.getGraphicDesignList(options));
  }
}

/**
 * Factory function to create a new Behance provider instance.
 * Useful for testing or when isolated instances are needed.
 *
 * @param {Object} plugin - Plugin instance
 * @returns {BehanceProvider} New provider instance
 */
export function createBehanceProvider(plugin) {
  return new BehanceProvider(plugin);
}
