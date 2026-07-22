export const DEFAULT_GRAPHIC_DESIGN_SLUG = 'graphic-design';

export const GRAPHIC_DESIGN_QUERY = `
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
