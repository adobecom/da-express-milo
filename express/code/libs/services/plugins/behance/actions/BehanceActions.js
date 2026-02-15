/* eslint-disable max-classes-per-file */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { BehanceTopics } from '../topics.js';
import { DEFAULT_GRAPHIC_DESIGN_SLUG, GRAPHIC_DESIGN_QUERY } from '../constants.js';

export class ProjectActions extends BaseActionGroup {
  getHandlers() {
    return {
      [BehanceTopics.PROJECTS.SEARCH]: this.searchProjects.bind(this),
    };
  }

  /**
   * @param {{ query: string, sort?: string, page?: number }} criteria
   * @returns {Promise<Object>}
   * @throws {ValidationError}
   */
  async searchProjects(criteria) {
    if (!criteria?.query) {
      throw new ValidationError('Search query is required', {
        field: 'criteria.query',
        serviceName: 'Behance',
        topic: BehanceTopics.PROJECTS.SEARCH,
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

export class GalleryActions extends BaseActionGroup {
  getHandlers() {
    return {
      [BehanceTopics.GALLERIES.LIST]: this.getGalleryList.bind(this),
      [BehanceTopics.GALLERIES.PROJECTS]: this.getGalleryProjects.bind(this),
    };
  }

  /**
   * @param {{ locale?: string }} [options]
   * @returns {Promise<Object>}
   */
  async getGalleryList(options = {}) {
    const path = this.plugin.endpoints.galleries;
    const params = {
      'api-key': this.plugin.apiKey,
      locale: options.locale || 'en',
    };
    return this.plugin.get(path, { params });
  }

  /**
   * @param {{
   *   galleryId: string|number,
   *   locale?: string,
   *   page?: number,
   *   perPage?: number,
   * }} criteria
   * @returns {Promise<Object>}
   * @throws {ValidationError}
   */
  async getGalleryProjects(criteria) {
    if (criteria?.galleryId == null || criteria.galleryId === '') {
      throw new ValidationError('Gallery ID is required', {
        field: 'criteria.galleryId',
        serviceName: 'Behance',
        topic: BehanceTopics.GALLERIES.PROJECTS,
      });
    }
    const { galleryId, locale = 'en', page = 1, perPage = 20 } = criteria;
    const ordinal = (Number(page) - 1) * Number(perPage);
    const path = `${this.plugin.endpoints.galleries}/${galleryId}/projects`;
    const params = {
      'api-key': this.plugin.apiKey,
      locale,
      ordinal,
      per_page: perPage,
    };
    return this.plugin.get(path, { params });
  }
}

export class GraphQLActions extends BaseActionGroup {
  getHandlers() {
    return {
      [BehanceTopics.GRAPHQL.GRAPHIC_DESIGN_LIST]: this.getGraphicDesignList.bind(this),
    };
  }

  /** @returns {string} */
  getGraphQLUrl() {
    const { graphqlBaseUrl } = this.plugin.serviceConfig;
    const graphqlPath = this.plugin.endpoints?.graphql || '/graphql';
    return `${graphqlBaseUrl}${graphqlPath}`;
  }

  /**
   * @param {string} url
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async postGraphQL(url, body) {
    const headers = this.plugin.getHeaders();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return this.plugin.handleResponse(response);
  }

  /**
   * @param {{ slug?: string, count?: number }} [options]
   * @returns {Promise<Object>}
   */
  async getGraphicDesignList(options = {}) {
    const slug = options.slug ?? DEFAULT_GRAPHIC_DESIGN_SLUG;
    const count = options.count ?? 10;
    const url = this.getGraphQLUrl();
    const body = {
      query: GRAPHIC_DESIGN_QUERY,
      variables: { slug, count },
    };
    const data = await this.postGraphQL(url, body);
    return data?.data?.gallery ?? data;
  }
}
