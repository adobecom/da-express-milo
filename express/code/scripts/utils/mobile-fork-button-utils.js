/**
 * Shared utilities for mobile fork button variants
 * Used by: mobile-fork-button, mobile-fork-button-dismissable, mobile-fork-button-frictionless
 */

export const LONG_TEXT_CUTOFF = 70;

/**
 * Calculates the pixel width of text for a given font
 * @param {string} text - The text to measure
 * @param {string|number} font - Font size or full font specification
 * @returns {number} The width of the text in pixels
 */
export const getTextWidth = (text, font) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
};

/**
 * Creates a key-value map of all metadata tags from the document head
 * @returns {Object} Map of metadata name to content
 */
export function createMetadataMap() {
  return Array.from(document.head.querySelectorAll('meta')).reduce((acc, meta) => {
    if (meta?.name && !meta.property) acc[meta.name] = meta.content || '';
    return acc;
  }, {});
}

/**
 * Builds a single action row with icon, text, and button
 * @param {Function} createTag - Function to create DOM elements
 * @param {Object} entry - Entry object containing icon, iconText, and anchor
 * @param {string} buttonType - Button type class ('accent' or 'outline')
 * @returns {HTMLElement} The action row wrapper element
 */
export function buildAction(createTag, entry, buttonType) {
  const wrapper = createTag('div', { class: 'floating-button-inner-row mobile-gating-row' });
  const text = createTag('div', { class: 'mobile-gating-text' });
  text.textContent = entry?.iconText;
  const a = entry?.anchor;
  if (a) {
    a.classList.add(buttonType, 'button', 'mobile-gating-link');
    wrapper.append(entry?.icon || null, text, a);
  }
  return wrapper;
}

/**
 * Checks if the device is an Android, enables the mobile gating if it is.
 * If there is no metadata check enabled, still enable the gating block in case authors want it.
 * @param {Function} getMetadata - Function to get metadata
 * @param {Function} getMobileOperatingSystem - Function to get mobile OS
 * @returns {boolean} Whether the fork button should be shown
 */
export function androidCheck(getMetadata, getMobileOperatingSystem) {
  if (getMetadata('fork-eligibility-check')?.toLowerCase()?.trim() !== 'on') return true;
  return getMobileOperatingSystem() === 'Android';
}

/**
 * Creates tool data (icon, text, anchor) for a fork button CTA
 * @param {Function} createTag - Function to create DOM elements
 * @param {Function} getIconElementDeprecated - Function to get icon elements
 * @param {Object} metadataMap - Map of metadata
 * @param {number} index - CTA index (1 or 2)
 * @param {boolean} useFrictionless - Whether to use frictionless metadata with fallback
 * @returns {Object} Tool data with icon, iconText, and anchor
 */
export function createToolData(
  createTag,
  getIconElementDeprecated,
  metadataMap,
  index,
  useFrictionless = false,
) {
  const prefix = `fork-cta-${index}`;

  // Metadata lookup with optional frictionless fallback
  const iconMetadata = (useFrictionless && metadataMap[`${prefix}-icon-frictionless`])
    || metadataMap[`${prefix}-icon`];
  const iconTextMetadata = (useFrictionless && metadataMap[`${prefix}-icon-text-frictionless`])
    || metadataMap[`${prefix}-icon-text`];
  const hrefMetadata = (useFrictionless && metadataMap[`${prefix}-link-frictionless`])
    || metadataMap[`${prefix}-link`] || '';
  const textMetadata = (useFrictionless && metadataMap[`${prefix}-text-frictionless`])
    || metadataMap[`${prefix}-text`] || '';

  const iconElement = !iconMetadata || iconMetadata === 'null'
    ? createTag('div', { class: 'mobile-gating-icon-empty' })
    : getIconElementDeprecated(iconMetadata);

  const aTag = createTag('a', { title: textMetadata, href: hrefMetadata });

  // Special handler for frictionless upload
  if (useFrictionless && hrefMetadata.toLowerCase().trim() === '#mobile-fqa-upload') {
    aTag.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('mobile-fqa-upload').click();
    });
  }

  aTag.textContent = textMetadata;

  return {
    icon: iconElement,
    iconText: iconTextMetadata || '',
    anchor: aTag,
  };
}

/**
 * Collects floating button data from metadata
 * @param {Function} createTag - Function to create DOM elements
 * @param {Function} getIconElementDeprecated - Function to get icon elements
 * @param {boolean} useFrictionless - Whether to use frictionless metadata
 * @param {Object} extraMainCtaProps - Extra properties to add to mainCta (optional)
 * @returns {Object} Floating button data
 */
export function collectFloatingButtonData(
  createTag,
  getIconElementDeprecated,
  useFrictionless = false,
  extraMainCtaProps = {},
) {
  const metadataMap = createMetadataMap();
  const getMetadataLocal = (key) => metadataMap[key];

  const data = {
    scrollState: 'withLottie',
    showAppStoreBadge: ['on'].includes(getMetadataLocal('show-floating-cta-app-store-badge')?.toLowerCase()),
    toolsToStash: getMetadataLocal('ctas-above-divider'),
    delay: getMetadataLocal('floating-cta-drawer-delay') || 0,
    tools: [],
    mainCta: {
      desktopHref: getMetadataLocal('desktop-floating-cta-link'),
      desktopText: getMetadataLocal('desktop-floating-cta-text'),
      mobileHref: getMetadataLocal('mobile-floating-cta-link'),
      mobileText: getMetadataLocal('mobile-floating-cta-text'),
      href: getMetadataLocal('main-cta-link'),
      text: getMetadataLocal('main-cta-text'),
      ...extraMainCtaProps,
    },
    bubbleSheet: getMetadataLocal('floating-cta-bubble-sheet'),
    live: getMetadataLocal('floating-cta-live'),
    forkButtonHeader: getMetadataLocal('fork-button-header'),
  };

  for (let i = 1; i < 3; i += 1) {
    const toolData = createToolData(
      createTag,
      getIconElementDeprecated,
      metadataMap,
      i,
      useFrictionless,
    );
    if (toolData) {
      data.tools.push(toolData);
      if (getTextWidth(toolData.anchor.textContent, 16) > LONG_TEXT_CUTOFF) {
        data.longText = true;
      }
    }
  }

  return data;
}

/**
 * Creates a multi-function button with mobile gating
 * @param {Function} createTag - Function to create DOM elements
 * @param {Function} createFloatingButton - Function to create floating button
 * @param {HTMLElement} block - The block element
 * @param {Object} data - Data object for the button
 * @param {string} audience - Target audience
 * @param {string} variantClassName - Variant-specific class name
 *   ('mobile-fork-button' or 'mobile-fork-button-frictionless')
 * @returns {Promise<HTMLElement>} The button wrapper element
 */
export async function createMultiFunctionButton(
  createTag,
  createFloatingButton,
  block,
  data,
  audience,
  variantClassName,
) {
  const buttonWrapper = await createFloatingButton(block, audience, data);
  buttonWrapper.classList.add('multifunction', variantClassName);

  // Build mobile gating UI
  const floatingButton = buttonWrapper.querySelector('.floating-button');
  floatingButton.children[0].remove();
  const header = createTag('div', { class: 'mobile-gating-header' });
  header.textContent = data.forkButtonHeader;
  floatingButton.append(
    header,
    buildAction(createTag, data.tools[0], 'accent'),
    buildAction(createTag, data.tools[1], 'outline'),
  );

  return buttonWrapper;
}
