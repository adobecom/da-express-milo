import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { BehanceTopics } from '../topics.js';

/**
 * Default slug for graphic design gallery (home page)
 */
const DEFAULT_GRAPHIC_DESIGN_SLUG = 'graphic-design';

/**
 * GraphQL query for gallery projects
 */
const GRAPHIC_DESIGN_QUERY = `
  query getGraphicDesignList($slug: String!, $count: Int) {
    gallery(slug: $slug) {
      projects(first: $count) {
        nodes {
          id
          covers {
            size_202 {
              url
            }
          }
        }
      }
    }
  }
`;

/**
 * GraphQLActions - Handles Behance GraphQL API (v3)
 *
 * Actions:
 * - getGraphicDesignList - Fetch graphic design projects for home page (POST /v3/graphql)
 *
 * @see BEHANCE_API.md - GraphQL API
 */
export default class GraphQLActions extends BaseActionGroup {
  getHandlers() {
    return {
      [BehanceTopics.GRAPHQL.GRAPHIC_DESIGN_LIST]: this.getGraphicDesignList.bind(this),
    };
  }

  /**
   * Build GraphQL request URL (v3 base)
   *
   * @returns {string} Full GraphQL endpoint URL
   */
  getGraphQLUrl() {
    const graphqlBaseUrl = this.plugin.serviceConfig?.graphqlBaseUrl || 'https://cc-api-behance.adobe.io/v3';
    const graphqlPath = this.plugin.endpoints?.graphql || '/graphql';
    return `${graphqlBaseUrl}${graphqlPath}`;
  }

  /**
   * Execute a request with full URL (for v3 GraphQL which uses different base)
   *
   * @param {string} url - Full URL
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Parsed JSON response
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
   * Fetch graphic design projects for home page via GraphQL
   *
   * @param {Object} [options] - Options
   * @param {string} [options.slug='graphic-design'] - Gallery slug
   * @param {number} [options.count=10] - Number of projects
   * @returns {Promise<Object>} Promise resolving to GraphQL data (gallery.projects.nodes)
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
