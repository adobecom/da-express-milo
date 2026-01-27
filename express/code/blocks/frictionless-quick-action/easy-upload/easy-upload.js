import { EasyUploadControls, EasyUploadVariants, EasyUploadVariantsPromoidMap } from '../../../scripts/utils/easy-upload-utils.js';
import { adjustElementPosition } from '../../../scripts/widgets/tooltip.js';

const EASY_UPLOAD_CSS_PATH = '/blocks/frictionless-quick-action/easy-upload/easy-upload.css';
const TOOLTIP_CSS_PATH = '/scripts/widgets/tooltip.css';
const AUTOLOAD_QR_CODE = false;

let easyUploadInstance = null;
let easyUploadStylesLoaded = false;
let tooltipStylesLoaded = false;
const easyUploadPaneContent = {
  hasContent: false,
  primary: {
    heading: '',
    steps: [],
    confirmLabel: '',
    confirmHref: '',
    tooltipText: '',
    errorText: '',
  },
  secondary: {
    question: '',
    tooltipText: '',
    paragraphs: [],
  },
};

function loadEasyUploadStyles(getConfig, loadStyle) {
  if (!loadStyle) {
    return Promise.resolve();
  }

  const config = getConfig();
  const promises = [];

  if (!easyUploadStylesLoaded) {
    promises.push(new Promise((resolve) => {
      loadStyle(`${config.codeRoot}${EASY_UPLOAD_CSS_PATH}`, () => {
        easyUploadStylesLoaded = true;
        resolve();
      });
    }));
  }

  if (!tooltipStylesLoaded) {
    promises.push(new Promise((resolve) => {
      loadStyle(`${config.codeRoot}${TOOLTIP_CSS_PATH}`, () => {
        tooltipStylesLoaded = true;
        resolve();
      });
    }));
  }

  return Promise.all(promises);
}

export function isEasyUploadExperimentEnabled(quickAction) {
  return Object.values(EasyUploadVariants).includes(quickAction);
}

export function isEasyUploadControlExperimentEnabled(quickAction) {
  return Object.values(EasyUploadControls).includes(quickAction);
}

export function runEasyUploadExperiment(
  quickActionId,
  docConfig,
  appConfig,
  exportConfig,
  contConfig,
  fromQrCode,
  ccEverywhere,
) {
  appConfig.metaData.variant = quickActionId;
  appConfig.metaData.promoid = EasyUploadVariantsPromoidMap[quickActionId];
  appConfig.metaData.mv = 'other';
  appConfig.metaData.entryPoint = fromQrCode ? 'seo-quickaction-qr-code' : 'seo-quickaction-image-upload';

  switch (quickActionId) {
    case EasyUploadVariants.removeBackgroundEasyUploadVariant:
    case EasyUploadControls.removeBackgroundEasyUploadControl:
      ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig);
      break;
    case EasyUploadVariants.resizeImageEasyUploadVariant:
    case EasyUploadControls.resizeImageEasyUploadControl:
      ccEverywhere.quickAction.resizeImage(docConfig, appConfig, exportConfig, contConfig);
      break;
    case EasyUploadVariants.cropImageEasyUploadVariant:
    case EasyUploadControls.cropImageEasyUploadControl:
      ccEverywhere.quickAction.cropImage(docConfig, appConfig, exportConfig, contConfig);
      break;
    case EasyUploadVariants.convertToJPEGEasyUploadVariant:
    case EasyUploadControls.convertToJPEGEasyUploadControl:
      ccEverywhere.quickAction.convertToJPEG(docConfig, appConfig, exportConfig, contConfig);
      break;
    case EasyUploadVariants.convertToPNGEasyUploadVariant:
    case EasyUploadControls.convertToPNGEasyUploadControl:
      ccEverywhere.quickAction.convertToPNG(docConfig, appConfig, exportConfig, contConfig);
      break;
    case EasyUploadVariants.convertToSVGEasyUploadVariant:
    case EasyUploadControls.convertToSVGEasyUploadControl:
      exportConfig.pop();
      ccEverywhere.quickAction.convertToSVG(docConfig, appConfig, exportConfig, contConfig);
      break;
    default:
      break;
  }
}

function extractEasyUploadPaneContent(block) {
  const rows = block.querySelectorAll(':scope > div');
  if (!rows.length) return;
  const lastRow = rows[rows.length - 1];
  const paneHtml = lastRow.innerHTML.trim();
  if (!paneHtml) return;

  const container = document.createElement('div');
  container.innerHTML = paneHtml;

  let columns = Array.from(container.children).filter((child) => child.tagName === 'DIV');
  if (columns.length === 1) {
    const nestedColumns = Array.from(columns[0].children).filter((child) => child.tagName === 'DIV');
    if (nestedColumns.length) {
      columns = nestedColumns;
    }
  }

  const primaryColumn = columns[0];
  const secondaryColumn = columns[1];
  if (!primaryColumn) return;

  const primaryParagraphs = Array.from(primaryColumn.querySelectorAll('p'));
  const confirmIndex = primaryParagraphs.findIndex((p) => p.querySelector('a'));
  const heading = primaryParagraphs[0]?.textContent?.trim() || '';
  const steps = primaryParagraphs
    .slice(1, Math.max(confirmIndex, 1))
    .map((p) => p.textContent.trim());
  const confirmLink = confirmIndex >= 0 ? primaryParagraphs[confirmIndex].querySelector('a') : null;
  const confirmLabel = confirmLink?.textContent?.trim() || '';
  const confirmHref = confirmLink?.getAttribute('href') || '';
  const tooltipText = primaryParagraphs[confirmIndex + 1]?.textContent?.trim() || '';
  const errorText = primaryParagraphs[confirmIndex + 2]?.textContent?.trim() || '';

  const secondaryParagraphs = secondaryColumn
    ? Array.from(secondaryColumn.querySelectorAll('p'))
      .map((p) => p.textContent.trim())
      .filter(Boolean)
    : [];
  const secondaryQuestion = secondaryParagraphs[1] || '';
  const secondaryTooltip = secondaryParagraphs[2] || '';
  const secondaryRemaining = secondaryParagraphs.slice(3);

  easyUploadPaneContent.primary = {
    heading,
    steps,
    confirmLabel,
    confirmHref,
    tooltipText,
    errorText,
  };
  easyUploadPaneContent.secondary = {
    question: secondaryQuestion,
    tooltipText: secondaryTooltip,
    paragraphs: secondaryRemaining,
  };
  easyUploadPaneContent.hasContent = true;
  lastRow.remove();
}

function attachTooltipHandlers(tooltipTrigger, tooltipPopup) {
  let hideTimeout;
  let isMouseOverTrigger = false;
  let isMouseOverTooltip = false;

  const showTooltip = () => {
    tooltipPopup.classList.add('hover');
    adjustElementPosition();
  };

  const hideTooltip = () => {
    tooltipPopup.classList.remove('hover');
  };

  const checkAndHideTooltip = () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isMouseOverTrigger && !isMouseOverTooltip) {
        hideTooltip();
      }
    }, 200);
  };

  tooltipTrigger.addEventListener('mouseenter', () => {
    isMouseOverTrigger = true;
    showTooltip();
  });

  tooltipTrigger.addEventListener('mouseleave', () => {
    isMouseOverTrigger = false;
    checkAndHideTooltip();
  });

  tooltipPopup.addEventListener('mouseenter', () => {
    isMouseOverTooltip = true;
    clearTimeout(hideTimeout);
  });

  tooltipPopup.addEventListener('mouseleave', () => {
    isMouseOverTooltip = false;
    checkAndHideTooltip();
  });
}

function buildQrPaneContent(createTag) {
  const content = createTag('div', { class: 'qr-code-dropzone-content' });
  const primary = createTag('div');
  const secondary = createTag('div');
  const qrWidgetContainer = createTag('div', { class: 'button-container qr-code-widget-container' });

  if (easyUploadPaneContent.primary.heading) {
    primary.append(createTag('p', {}, easyUploadPaneContent.primary.heading));
  }

  easyUploadPaneContent.primary.steps.forEach((step) => {
    primary.append(createTag('p', {}, step));
  });

  if (easyUploadPaneContent.primary.confirmLabel) {
    const tooltipContainer = createTag('div', { class: 'tooltip' });
    const confirmButton = createTag('a', {
      href: easyUploadPaneContent.primary.confirmHref || '#',
      class: 'button accent xlarge confirm-import-button',
    }, easyUploadPaneContent.primary.confirmLabel);
    const tooltipPopup = createTag('div', { class: 'tooltip-text' }, easyUploadPaneContent.primary.tooltipText);
    tooltipContainer.append(confirmButton, tooltipPopup);
    if (easyUploadPaneContent.primary.tooltipText) {
      attachTooltipHandlers(confirmButton, tooltipPopup);
    } else {
      tooltipPopup.classList.add('hidden');
    }
    primary.append(tooltipContainer);
  }

  if (easyUploadPaneContent.primary.errorText) {
    primary.append(createTag('p', { class: 'easy-upload-error-message' }, easyUploadPaneContent.primary.errorText));
  }

  secondary.append(qrWidgetContainer);

  if (easyUploadPaneContent.secondary.question) {
    const tooltipContainer = createTag('p', { class: 'tooltip' });
    const tooltipTrigger = createTag(
      'span',
      { class: 'easy-upload-tooltip-trigger' },
      easyUploadPaneContent.secondary.question,
    );
    const tooltipPopup = createTag(
      'div',
      { class: 'tooltip-text' },
      easyUploadPaneContent.secondary.tooltipText,
    );
    tooltipContainer.append(tooltipTrigger, tooltipPopup);
    if (easyUploadPaneContent.secondary.tooltipText) {
      attachTooltipHandlers(tooltipTrigger, tooltipPopup);
    } else {
      tooltipPopup.classList.add('hidden');
    }
    secondary.append(tooltipContainer);
  }

  easyUploadPaneContent.secondary.paragraphs.forEach((paragraph) => {
    secondary.append(createTag('p', {}, paragraph));
  });

  content.append(primary, secondary);
  return content;
}

function attachSecondaryCtaHandler(block, createTag, showErrorToast) {
  if (!easyUploadPaneContent.hasContent) return;

  const dropzone = block.querySelector('.dropzone');
  const dropzoneContainer = block.querySelector('.dropzone-container');
  if (!dropzone || !dropzoneContainer) return;

  const ctas = dropzone.querySelectorAll('a.button, a.con-button');
  const secondaryCta = ctas[1];
  if (!secondaryCta) return;

  secondaryCta.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    dropzoneContainer.classList.add('hidden');

    let qrPane = dropzoneContainer.parentElement?.querySelector('.qr-code-container');
    if (!qrPane) {
      qrPane = createTag('div', { class: 'qr-code-container dropzone-container' });
      const rect = dropzoneContainer.getBoundingClientRect();
      if (rect.width) {
        qrPane.style.width = `${rect.width}px`;
      }
      if (rect.height) {
        qrPane.style.height = `${rect.height}px`;
      }
      dropzoneContainer.insertAdjacentElement('afterend', qrPane);
    }

    qrPane.innerHTML = '';
    const qrDropzone = createTag('div', { class: 'dropzone qr-code-dropzone' });
    qrDropzone.append(buildQrPaneContent(createTag));
    qrPane.append(qrDropzone);

    dropzone.classList.remove('dropzone');
    if (!qrPane.dataset.qrInitialized && easyUploadInstance?.initializeQRCode) {
      try {
        qrPane.dataset.qrInitialized = 'true';
        await easyUploadInstance.initializeQRCode();
      } catch (error) {
        showErrorToast?.(block, 'Failed to load QR code.');
      }
    }
  });
}

export async function setupEasyUploadUI({
  quickAction,
  block,
  getConfig,
  loadStyle,
  initializeUploadService,
  startSDKWithUnconvertedFiles,
  createTag,
  showErrorToast,
}) {
  if (!isEasyUploadExperimentEnabled(quickAction)) {
    return null;
  }
  await loadEasyUploadStyles(getConfig, loadStyle);
  extractEasyUploadPaneContent(block);
  attachSecondaryCtaHandler(block, createTag, showErrorToast);

  try {
    const { EasyUpload } = await import('../../../scripts/utils/easy-upload-utils.js');
    const { env } = getConfig();
    const uploadService = await initializeUploadService();
    if (!uploadService) {
      throw new Error('Upload service not initialized');
    }

    easyUploadInstance = new EasyUpload(
      uploadService,
      env.name,
      quickAction,
      block,
      startSDKWithUnconvertedFiles,
      createTag,
      showErrorToast,
    );

    if (AUTOLOAD_QR_CODE) {
      await easyUploadInstance.setupQRCodeInterface();
    }
  } catch (error) {
    window.lana?.log('Easy Upload UI initialization failed', {
      clientId: 'express',
      tags: 'easy-upload-ui-init-failed',
      error: error?.message || String(error),
    });
  }

  return easyUploadInstance;
}

export function cleanupEasyUpload() {
  if (easyUploadInstance) {
    easyUploadInstance.cleanup();
    easyUploadInstance = null;
  }
}
