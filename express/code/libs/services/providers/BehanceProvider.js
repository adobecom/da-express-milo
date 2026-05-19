import BaseProvider from './BaseProvider.js';
import { BehanceTopics, BehanceActionGroups } from '../plugins/behance/topics.js';

export default class BehanceProvider extends BaseProvider {
  /** @type {Object} */
  #actions = {};

  /** @param {Object} plugin */
  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { PROJECTS, GALLERIES, GRAPHQL } = BehanceActionGroups;

    this.#actions = {
      searchProjects: this.plugin.useAction(PROJECTS, BehanceTopics.PROJECTS.SEARCH),
      getGalleryList: this.plugin.useAction(GALLERIES, BehanceTopics.GALLERIES.LIST),
      getGalleryProjects: this.plugin.useAction(GALLERIES, BehanceTopics.GALLERIES.PROJECTS),
      getGraphicDesignList: this.plugin.useAction(
        GRAPHQL,
        BehanceTopics.GRAPHQL.GRAPHIC_DESIGN_LIST,
      ),
    };
  }

  /**
   * @param {string} query
   * @param {{ sort?: string, page?: number }} [options]
   * @returns {Promise<Object|null>}
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
   * @param {{ locale?: string }} [options]
   * @returns {Promise<Object|null>}
   */
  async getGalleryList(options = {}) {
    return this.safeExecute(() => this.#actions.getGalleryList(options));
  }

  /**
   * @param {string|number} galleryId
   * @param {{ locale?: string, page?: number, perPage?: number }} [options]
   * @returns {Promise<Object|null>}
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
   * @param {{ slug?: string, count?: number }} [options]
   * @returns {Promise<Object|null>}
   */
  async getGraphicDesignList(options = {}) {
    return this.safeExecute(() => this.#actions.getGraphicDesignList(options));
  }
}

/**
 * @param {Object} plugin
 * @returns {BehanceProvider}
 */
export function createBehanceProvider(plugin) {
  return new BehanceProvider(plugin);
}
