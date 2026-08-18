/**
 * Mini Editor background loader
 *
 * Single entry point (`getCardBackgrounds`) that returns the background-card
 * collection the mini-editor renders, by fetching live templates from the
 * template service for the block's authored `collectionId`.
 *
 * Every card has the same shape: `{ id, bg }`, where `id` is a template urn
 * (used later for todo/CTA actions that need to reference the exact source
 * asset) and `bg` is the image URL to paint.
 */

import {
  fetchResults,
  isValidTemplate,
  getTemplateTitle,
  extractRenditionLinkHref,
  extractComponentLinkHref,
  getImageThumbnailSrc,
} from '../../scripts/template-utils.js';

function buildRecipe(props) {
  const params = new URLSearchParams();
  params.set('limit', String(props.limit));
  if (props.collectionId) params.set('collectionId', props.collectionId);
  if (props.topics) params.set('topics', props.topics);
  return params.toString();
}

function extractImagePreview(page) {
  return page?.rendition?.image?.preview;
}

export function getImageSrc(item) {
  const page = item.pages?.[0];
  /* eslint-disable no-underscore-dangle */
  const renditionHref = extractRenditionLinkHref(item);
  if (!renditionHref) {
    const componentHref = extractComponentLinkHref(item);
    return getImageThumbnailSrc(renditionHref, componentHref, page);
  }

  const preview = extractImagePreview(page);
  const {
    mediaType,
    componentId,
    width,
    height,
  } = preview;

  return renditionHref.replace(
    '{&page,size,type,fragment}',
    `&size=${Math.max(width, height)}&type=${mediaType}&fragment=id=${componentId}`,
  );
}

/**
 * Returns the mini-editor's background-card collection as `[{ id, bg }, ...]`,
 * fetched live from the template service.
 *
 * @param {Object} props
 * @param {string} [props.collectionId] — template collection to fetch from.
 * @param {number} props.limit — max cards to return.
 * @param {string} [props.topics] — template-fetch topics filter.
 * @returns {Promise<Array<{ id: string, bg: string }>>}
 */
export default async function getCardBackgrounds(props) {
  const recipe = buildRecipe(props);
  const res = await fetchResults(recipe);
  if (!res?.items?.length) return [];

  return res.items
    .filter((item) => isValidTemplate(item))
    .slice(0, props.limit)
    .map((item) => {
      /* eslint-enable no-underscore-dangle */
      const bg = getImageSrc(item);
      return { id: item.id, bg, title: getTemplateTitle(item) };
    })
    .filter((card) => !!card.bg);
}
