/**
 * Mini Editor background loader
 *
 * Single entry point (`getCardBackgrounds`) that returns the background-card
 * collection the mini-editor renders. It owns the decision of WHERE that
 * collection comes from, so callers never branch on it:
 *
 *   - A `collectionId` is authored on the block → fetch live templates from
 *     the template service (the dynamic source).
 *   - No `collectionId` → fall back to the bundled STATIC_COLLECTION shipped
 *     with this block (the 10 curated images under ./img).
 *
 * Every card — dynamic or static — has the same shape: `{ id, bg }`, where
 * `id` is a template urn (used later for todo/CTA actions that need to
 * reference the exact source asset) and `bg` is the image URL to paint.
 */

import {
  fetchResults,
  isValidTemplate,
  getImageThumbnailSrc,
} from '../../scripts/template-utils.js';

/**
 * The curated fallback set, used when no collectionId is authored. Each entry
 * pairs a bundled image with its Adobe asset urn so downstream actions can
 * recover the source id from a card the same way they would for a fetched
 * template. `file` is resolved against codeRoot at read time (see
 * resolveStaticCollection) so it works regardless of deploy path.
 *
 * Keep `id` and `file` in lockstep — the id is what a todo/CTA action will
 * look up for a given image, so the pairing here is the source of truth.
 */
const STATIC_COLLECTION = [
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25650', file: 'image1.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25651', file: 'image2.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25652', file: 'image3.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25653', file: 'image4.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25654', file: 'image5.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25655', file: 'image6.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25656', file: 'image7.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25657', file: 'image8.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25658', file: 'image9.jpg' },
  { id: 'urn:aaid:sc:VA6C2:79e88577-0d8f-5ad7-88ef-f38f03c25659', file: 'image10.jpg' },
];

const STATIC_IMG_BASE = '/blocks/mini-editor/img';

/**
 * Turns the STATIC_COLLECTION into runtime cards ({ id, bg }), resolving each
 * bundled image against codeRoot and honouring the block's `limit`.
 */
function resolveStaticCollection(props) {
  const base = `${props.codeRoot || ''}${STATIC_IMG_BASE}`;
  return STATIC_COLLECTION
    .slice(0, props.limit)
    .map(({ id, file }) => ({ id, bg: `${base}/${file}` }));
}

function buildRecipe(props) {
  const params = new URLSearchParams();
  params.set('limit', String(props.limit));
  if (props.collectionId) params.set('collectionId', props.collectionId);
  if (props.topics) params.set('topics', props.topics);
  return params.toString();
}

async function fetchTemplateCollection(props) {
  const recipe = buildRecipe(props);
  const res = await fetchResults(recipe);
  if (!res?.items?.length) return [];

  return res.items
    .filter((item) => isValidTemplate(item))
    .slice(0, props.limit)
    .map((item) => {
      const page = item.pages?.[0];
      /* eslint-disable no-underscore-dangle */
      const renditionHref = item._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
      const componentHref = item._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
      /* eslint-enable no-underscore-dangle */
      const bg = getImageThumbnailSrc(renditionHref, componentHref, page);
      return { id: item.id, bg };
    })
    .filter((card) => !!card.bg);
}

/**
 * Returns the mini-editor's background-card collection as `[{ id, bg }, ...]`.
 * Picks the dynamic template fetch when a collectionId is authored, otherwise
 * the bundled static collection — the caller does not need to know which.
 *
 * @param {Object} props
 * @param {string} [props.collectionId] — when set, fetch live templates.
 * @param {number} props.limit — max cards to return.
 * @param {string} [props.topics] — template-fetch topics filter.
 * @param {string} [props.codeRoot] — base path for resolving static images.
 * @returns {Promise<Array<{ id: string, bg: string }>>}
 */
export default async function getCardBackgrounds(props) {
  if (!props.collectionId) {
    return resolveStaticCollection(props);
  }
  return fetchTemplateCollection(props);
}
