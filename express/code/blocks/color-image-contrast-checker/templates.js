import { fetchResults, isValidTemplate, getTemplateTitle } from '../../scripts/template-utils.js';
import { getImageSrc, getFullResImageSrc } from '../mini-editor/mini-editor-background-loader.js';

export const TEMPLATE_ID = /^urn:aaid:sc:[\w:-]+$/i;

/**
 * Resolves authored Express template IDs to sample images, keyed by ID.
 * `preview` is the light rendition for the sample button; `src` is the
 * native-size JPEG analysed on selection. Unknown or invalid templates are
 * absent from the map so the block can skip them.
 */
export default async function resolveTemplates(ids) {
  const recipe = new URLSearchParams({ templateIds: ids.join(','), limit: String(ids.length) });
  const { items = [] } = await fetchResults(recipe.toString()) ?? {};
  const templates = new Map();
  items.filter(isValidTemplate).forEach((item) => {
    const preview = getImageSrc(item);
    const src = getFullResImageSrc(item) || preview;
    if (preview) templates.set(item.id, { preview, src, title: getTemplateTitle(item) });
  });
  return templates;
}
