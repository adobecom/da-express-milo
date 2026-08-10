import { serviceManager } from '../../../../libs/services/index.js';
import { announceToScreenReader } from '../../spectrum/index.js';
import { createLibraryCardActionMenu } from './createLibraryCardActionMenu.js';
import { libraryItemToDownloadData } from './libraryDownloadUtils.js';

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

const THEME_DOWNLOAD_ACTIONS = {
  ase: 'downloadASE',
  jpeg: 'downloadJPEG',
};

const GRADIENT_DOWNLOAD_ACTIONS = {
  png: 'downloadPNG',
  svg: 'downloadSVG',
};

function buildDownloadItems(item, strings) {
  const isGradient = item?.type === 'gradient';

  if (isGradient) {
    return [
      { value: 'png', label: strings.librariesDownloadAsPNG },
      { value: 'svg', label: strings.librariesDownloadAsSVG },
    ].filter((entry) => entry.label);
  }

  const items = [
    { value: 'ase', label: strings.librariesDownloadAsASE },
    { value: 'jpeg', label: strings.librariesDownloadAsJPEG },
  ].filter((entry) => entry.label);

  if (isIOSDevice()) {
    return items.filter((entry) => entry.value !== 'ase');
  }

  return items;
}

async function runDownload(item, format) {
  const isGradient = item?.type === 'gradient';
  const actionMap = isGradient ? GRADIENT_DOWNLOAD_ACTIONS : THEME_DOWNLOAD_ACTIONS;
  const method = actionMap[format];
  if (!method) return false;

  const data = libraryItemToDownloadData(item);
  if (!data?.swatches?.length) return false;

  await serviceManager.init({ plugins: ['download'] });
  const downloadProvider = await serviceManager.getProvider('download');
  await downloadProvider[method](data);
  return true;
}

/**
 * Download action menu for a library card (theme or gradient).
 *
 * @param {Object} options
 * @param {Object} options.item - library theme or gradient item
 * @param {Object} options.strings - resolved placeholders
 */
export function createLibraryDownloadMenu({
  item,
  strings = {},
} = {}) {
  const triggerLabel = strings.librariesDownloadTrigger;
  const menuItems = buildDownloadItems(item, strings);

  const menu = createLibraryCardActionMenu({
    triggerIcon: 'sp-icon-download',
    triggerLabel,
    items: menuItems,
    async onSelect(format, { closePopover }) {
      try {
        const started = await runDownload(item, format);
        if (started && strings.librariesDownloadStarted) {
          announceToScreenReader(strings.librariesDownloadStarted);
        }
      } catch (err) {
        window.lana?.log(`Library download failed: ${err?.message}`, {
          tags: 'color-libraries,download',
          severity: 'error',
        });
      } finally {
        closePopover({ focusTrigger: true });
      }
    },
  });

  return menu;
}
