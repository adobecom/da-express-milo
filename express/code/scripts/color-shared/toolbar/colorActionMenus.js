import { getMobileOperatingSystem } from '../../utils.js';
import { serviceManager } from '../../../libs/services/index.js';
import { paletteToThemeData } from '../../../libs/services/providers/transforms.js';
import { loadActionButton, loadMenu } from '../spectrum/load-spectrum.js';
import { createExpressTooltip } from '../spectrum/components/express-tooltip.js';
import { wrapInTheme } from '../spectrum/utils/theme.js';
import { createLibraryCardActionMenu } from '../components/libraries/createLibraryCardActionMenu.js';
import { buildColorCodeSnippet, COLOR_CODE_FORMATS } from '../utils/colorCodeFormats.js';

// The trigger is an sp-action-button and the popover an sp-menu; the element is
// created synchronously (matching createIconButton's convention) and upgrades
// once these bundles load.
function loadActionMenuDeps() {
  Promise.all([loadActionButton(), loadMenu()]).catch((err) => {
    window.lana?.log(`Spectrum load failed: ${err.message}`, {
      tags: 'color-action-menu,spectrum',
      severity: 'error',
    });
  });
}

function releaseOverflowClipping(popoverEl) {
  const observer = new MutationObserver(() => {
    const clippingAncestor = popoverEl.closest('.ax-toolbar');
    if (!clippingAncestor) return;
    if (popoverEl.hasAttribute('hidden')) {
      clippingAncestor.style.removeProperty('overflow');
    } else {
      clippingAncestor.style.overflow = 'visible';
    }
  });
  observer.observe(popoverEl, { attributes: true, attributeFilter: ['hidden'] });
}

function finalizeActionMenu(menu, triggerIcon) {
  const icon = menu.element.querySelector(triggerIcon);
  icon?.setAttribute('size', 'm');

  const trigger = menu.element.querySelector('.ax-lib-card__action');
  if (trigger) {
    createExpressTooltip({
      targetEl: trigger,
      content: trigger.getAttribute('data-tooltip-content'),
      placement: 'top',
      dismissOnActivate: true,
    }).catch(() => {});
  }

  const popover = menu.element.querySelector('.ax-lib-card__action-menu-popover');
  if (popover) releaseOverflowClipping(popover);

  return { ...menu, element: wrapInTheme(menu.element) };
}

/**
 * Dropdown action (backed by the shared library-card action menu) that copies
 * all colors currently shown in a container as a CSS/SASS/LESS/XML snippet.
 *
 * @param {Object} options
 * @param {string} options.triggerLabel - aria-label/tooltip for the trigger icon
 * @param {() => string[]} options.getColors - current hex colors, in display order
 * @param {() => string} options.getName - current color/palette name, for class/variable naming
 * @param {Object<string, string>} [options.formatLabels] - localized menu item labels, by format
 * @param {(format: string) => void} [options.onCopied]
 * @param {(err: Error) => void} [options.onError]
 */
export function createCopyCodeAction({
  triggerLabel,
  getColors,
  getName,
  formatLabels = {},
  onCopied = () => {},
  onError = () => {},
}) {
  loadActionMenuDeps();
  return finalizeActionMenu(createLibraryCardActionMenu({
    triggerIcon: 'sp-icon-code',
    triggerLabel,
    items: COLOR_CODE_FORMATS.map((format) => (
      { value: format, label: formatLabels[format] || format }
    )),
    onSelect: async (format, { closePopover }) => {
      closePopover();
      try {
        const snippet = buildColorCodeSnippet(format, getName(), getColors());
        await navigator.clipboard.writeText(snippet);
        onCopied(format);
      } catch (err) {
        onError(err);
      }
    },
  }), 'sp-icon-code');
}

const DOWNLOAD_FORMATS = ['JPEG', 'ASE'];

/**
 * Dropdown action (backed by the shared library-card action menu) that downloads
 * all colors currently shown in a container as a JPEG swatch image or an ASE file.
 * ASE is hidden on iOS, matching the existing library-download menu convention.
 *
 * @param {Object} options
 * @param {string} options.triggerLabel - aria-label/tooltip for the trigger icon
 * @param {() => string[]} options.getColors - current hex colors, in display order
 * @param {() => string} options.getName - current color/palette name
 * @param {Object<string, string>} [options.formatLabels] - localized menu item labels, by format
 * @param {(format: string) => void} [options.onDownloaded]
 * @param {(err: Error) => void} [options.onError]
 */
export function createDownloadAction({
  triggerLabel,
  getColors,
  getName,
  formatLabels = {},
  onDownloaded = () => {},
  onError = () => {},
}) {
  loadActionMenuDeps();
  const isIOS = getMobileOperatingSystem() === 'iOS';
  const formats = DOWNLOAD_FORMATS.filter((format) => format !== 'ASE' || !isIOS);

  return finalizeActionMenu(createLibraryCardActionMenu({
    triggerIcon: 'sp-icon-download',
    triggerLabel,
    items: formats.map((format) => ({ value: format, label: formatLabels[format] || format })),
    onSelect: async (format, { closePopover }) => {
      closePopover();
      try {
        const themeData = paletteToThemeData({ name: getName(), colors: getColors() });
        const provider = await serviceManager.getProvider('download');
        if (format === 'ASE') await provider.downloadASE(themeData);
        else await provider.downloadJPEG(themeData);
        onDownloaded(format);
      } catch (err) {
        onError(err);
      }
    },
  }), 'sp-icon-download');
}
