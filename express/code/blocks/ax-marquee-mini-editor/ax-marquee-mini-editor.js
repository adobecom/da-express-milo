import { getLibs, getIconElementDeprecated, createTag } from '../../scripts/utils.js';
import { addFreePlanWidget } from '../../scripts/widgets/free-plan.js';
import createMiniEditorWidget from '../../scripts/widgets/mini-editor-widget/mini-editor-widget.js';

const MARQUEE_INJECT_LOGO = 'marquee-inject-logo';
const LOGO_INJECT_VALUES = ['on', 'yes'];

// Bundled demo preview image (transparent PNG) shown inside the editor canvas.
const PREVIEW_IMG = '/express/code/blocks/ax-marquee-mini-editor/img/birthday-cupcake.png';

// Default background palette (theme-appropriate pastels) applied behind the
// preview image. Baked in for now; make authorable later.
const PALETTE = ['#FDE9DE', '#F9D7C4', '#C9E7FF', '#E6D7FF', '#D8F0DC', '#131313'];

const LABEL_KEYS = ['share', 'edit', 'download', 'background', 'editor-actions'];

let getConfig;
let getMetadata;
let replaceKeyArray;

/** Style the heading + CTA in the content column (mirrors ax-marquee-dynamic-hero). */
async function setupButtonStyling(block) {
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.classList.add('heading');
  if (!heading) return;

  const pWithLink = block.querySelector('p:has(a)');
  if (!pWithLink) return;

  pWithLink.classList.add('button-container');
  const link = pWithLink.querySelector('a');
  if (link) {
    link.classList.add('quick-link', 'button', 'accent');
    await addFreePlanWidget(link.parentElement);
  }
}

/** Optionally inject the Adobe Express logo before the heading. */
function placeLogo(block) {
  const shouldInject = LOGO_INJECT_VALUES.includes(
    getMetadata(MARQUEE_INJECT_LOGO)?.toLowerCase(),
  );
  if (!shouldInject) return;

  const logo = getIconElementDeprecated('adobe-express-logo');
  logo.classList.add('express-logo');
  const heading = block.querySelector('h1,h2,h3:first-of-type');
  heading?.parentElement?.insertBefore(logo, heading);
}

/** Recolor the preview canvas behind the (transparent) image. */
function applyCanvasBg(root, color) {
  const canvas = root.querySelector('.mini-editor-canvas');
  if (canvas) canvas.style.background = color;
}

/** Swap the authored media column for the mini editor, with a bundled preview image. */
async function setupMiniEditor(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  // cells[0] = authored content (left, the hero); cells[1] = media column.
  const cells = [...row.children];
  const mediaCol = cells[1] || row.appendChild(createTag('div'));

  const preview = createTag('img', { src: PREVIEW_IMG, alt: '', loading: 'lazy' });
  const [defaultBg] = PALETTE;

  const labels = await replaceKeyArray(LABEL_KEYS, getConfig());
  const [shareLabel, editLabel, downloadLabel, backgroundLabel, actionsLabel] = labels;

  const editor = await createMiniEditorWidget({
    content: preview,
    strings: { actionsLabel, backgroundsLabel: backgroundLabel },
    topActions: [
      { id: 'share', type: 'button', label: shareLabel },
      { id: 'edit', type: 'action', iconOnly: true, ariaLabel: editLabel },
      { id: 'download', type: 'action', iconOnly: true, ariaLabel: downloadLabel },
    ],
    backgrounds: {
      colors: PALETTE,
      selected: ['0'],
      onChange: ({ index }) => {
        if (index >= 0) applyCanvasBg(editor.element, PALETTE[index]);
      },
    },
  });

  // Apply the initial background behind the preview image.
  applyCanvasBg(editor.element, defaultBg);

  mediaCol.classList.add('mini-editor-col');
  mediaCol.replaceChildren(editor.element);
}

/**
 * Decorator for the ax-marquee-mini-editor block: authored content on the left,
 * the mini editor (image preview + background swatches) on the right.
 * @param {Element} block
 */
export default async function decorate(block) {
  await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]).then(([utils, placeholders]) => {
    ({ getConfig, getMetadata } = utils);
    ({ replaceKeyArray } = placeholders);
  });

  try {
    await setupButtonStyling(block);
    placeLogo(block);
    await setupMiniEditor(block);
  } catch (error) {
    window.lana?.log(`Error decorating ax-marquee-mini-editor: ${error}`, { tags: 'ax-marquee-mini-editor', severity: 'error' });
  }
}
