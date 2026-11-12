import {
  fetchResults,
  isValidTemplate,
  getTemplateTitle,
  extractRenditionLinkHref,
  extractComponentLinkHref,
  getImageThumbnailSrc,
  getFullResImageSrc,
} from '../../scripts/template-utils.js';

export const TEMPLATE_ID = /^urn:aaid:sc:[\w:-]+$/i;
// The search request is not abortable; give up on it so samples never wait indefinitely.
const TIMEOUT_MS = 8000;

/**
 * Resolves authored Express template IDs to sample images, keyed by ID.
 * `preview` is the thumbnail rendition for the sample button; `src` is the
 * native-size JPEG analysed on selection. Unknown or invalid templates are
 * absent from the map so the block can skip them.
 */
export default async function resolveTemplates(ids) {
  const recipe = new URLSearchParams({ templateIds: ids.join(','), limit: String(ids.length) });
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('template search timed out')), TIMEOUT_MS);
  });
  try {
    const { items = [] } = await Promise.race([fetchResults(recipe.toString()), timeout]) ?? {};
    const templates = new Map();
    items.filter(isValidTemplate).forEach((item) => {
      const preview = getImageThumbnailSrc(
        extractRenditionLinkHref(item),
        extractComponentLinkHref(item),
        item.pages?.[0],
      );
      const src = getFullResImageSrc(item) || preview;
      if (preview) templates.set(item.id, { preview, src, title: getTemplateTitle(item) });
    });
    return templates;
  } finally {
    clearTimeout(timer);
  }
}
