/**
 * Mini Editor background loader
 *
 * Single entry point (`getCardBackgrounds`) that returns the background-card
 * collection the mini-editor renders, by fetching live templates from the
 * template service for the block's authored `collectionId`.
 *
 * Every card has the same shape: `{ id, bg, branchUrl?, title?, mode }`, where
 * `id` is a template urn (used later for todo/CTA actions that need to reference
 * the exact source asset), `bg` is the image URL to paint, `branchUrl` is the
 * template's Branch deep link (opens it as an Express project) when available,
 * `title` is the template name when available, and `mode` is the background
 * contrast hint the widget uses for light/dark controls.
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

/**
 * Determines whether an image's dominant colors are overall 'light' or 'dark'.
 *
 * @param {Array} colors - Array of color objects with coverage and RGB values.
 * @returns {'light' | 'dark'}
 */
function getImageColorMode(item) {
  if (item.internalTags?.length > 0) {
    if (item.internalTags.includes('dark background')) {
      return 'dark';
    }

    if (item.internalTags.includes('light background')) {
      return 'light';
    }
  }

  const page = item.pages?.[0];
  const colors = page.extractedColors;
  if (!colors?.length) {
    return 'light'; // fallback
  }

  let weightedBrightness = 0;
  let totalCoverage = 0;

  for (const color of colors) {
    if (!(color.mode !== 'RGB' || !color.value)) {
      const { r, g, b } = color.value;
      const coverage = color.coverage ?? 0;

      // Perceived brightness (0-255)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      weightedBrightness += brightness * coverage;
      totalCoverage += coverage;
    }
  }

  if (totalCoverage === 0) {
    return 'light';
  }

  const averageBrightness = weightedBrightness / totalCoverage;

  // 128 is the midpoint of the 0-255 brightness range
  return averageBrightness < 128 ? 'dark' : 'light';
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
  if (!preview || !renditionHref.includes('{&page,size,type,fragment}')) {
    return renditionHref;
  }

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
 * Returns the mini-editor's background-card collection as
 * `[{ id, bg, title?, mode }, ...]`, fetched live from the template service.
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
      return {
        id: item.id,
        bg,
        // Branch deep link that opens this template as an Express project (background already
        // applied). On prod the Edit CTA opens this instead of the generic base and hands off text
        // only — see open-in-express.js. Absent on templates without a branch link.
        branchUrl: item.customLinks?.branchUrl,
        title: getTemplateTitle(item),
        mode: getImageColorMode(item),
      };
    })
    .filter((card) => !!card.bg);
}
