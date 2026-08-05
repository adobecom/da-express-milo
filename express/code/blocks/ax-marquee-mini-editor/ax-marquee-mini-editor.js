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
// Default editable greeting text overlaid on the preview image's two pill bars.
const BAR_TITLE_TEXT = 'Happy Birthday';
const BAR_SIGNATURE_TEXT = 'From ___ To ___';

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

/** One editable greeting bar positioned over a pill in the preview image. */
function makeEditableBar(cls, text, ariaLabel) {
  const bar = createTag('div', {
    class: `me-bar ${cls}`,
    contenteditable: 'true',
    role: 'textbox',
    spellcheck: 'false',
    'aria-label': ariaLabel,
  });
  bar.textContent = text;
  return bar;
}

/**
 * Build the preview: the bundled image plus two editable greeting bars
 * overlaid on the image's pill bars. Returned element is the widget `content`.
 */
function buildPreview() {
  const preview = createTag('div', { class: 'me-preview' });
  const img = createTag('img', {
    class: 'me-preview-img', src: PREVIEW_IMG, alt: '', loading: 'lazy',
  });
  const bar1 = makeEditableBar('me-bar-title', BAR_TITLE_TEXT, BAR_TITLE_TEXT);
  const bar2 = makeEditableBar('me-bar-signature', BAR_SIGNATURE_TEXT, BAR_SIGNATURE_TEXT);
  preview.append(img, bar1, bar2);
  return preview;
}

/** Swap the authored media column for the mini editor, with a bundled preview image. */
async function setupMiniEditor(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  // cells[0] = authored content (left, the hero); cells[1] = media column.
  const cells = [...row.children];
  const mediaCol = cells[1] || row.appendChild(createTag('div'));

  const preview = buildPreview();
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
