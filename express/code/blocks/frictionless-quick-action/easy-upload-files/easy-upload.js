import { EasyUploadControls, EasyUploadVariants, EasyUploadVariantsPromoidMap } from '../../../scripts/utils/easy-upload-utils.js';
import { getIconElementDeprecated, getLibs } from '../../../scripts/utils.js';
import { adjustElementPosition } from '../../../scripts/widgets/tooltip.js';
import {
  DEBUG_MODES,
  PLACEHOLDER_DEBUG_MODES,
  getDebugMode,
  renderDebugAutofailVariant,
  renderDebugLoaderPaneState,
  renderDebugPendingUploadVariant,
  renderDebugPlaceholderVariant,
} from './easy-upload-debug.js';

const registeredListeners = [];
function trackListener(el, type, fn) {
  el.addEventListener(type, fn);
  registeredListeners.push({ el, type, fn });
}

const EASY_UPLOAD_CSS_PATH = '/blocks/frictionless-quick-action/easy-upload-files/easy-upload.css';
const TOOLTIP_CSS_PATH = '/scripts/widgets/tooltip.css';
const EASY_UPLOAD_SDK_INITIALIZED_EVENT = 'easyupload:sdk-initialized';
const AUTOLOAD_QR_CODE = false;
const DISABLE_QR_CODE_RENDER = false;
let easyUploadInstance = null;
let easyUploadStylesLoaded = false;
let tooltipStylesLoaded = false;
let activeDebugMode = DEBUG_MODES.NONE;
let deferredInitContext = null;
let sharedCreateTag = null;
let sharedShowErrorToast = null;
let sharedReplaceKey = null;
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
    qrErrorText: '',
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
    .map((p) => p.innerHTML.trim())
    .filter(Boolean);
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
  const qrErrorText = secondaryParagraphs[0] || '';
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
    qrErrorText,
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
    tooltipTrigger.setAttribute('aria-expanded', 'true');
    adjustElementPosition();
  };

  const hideTooltip = () => {
    tooltipPopup.classList.remove('hover');
    tooltipTrigger.setAttribute('aria-expanded', 'false');
  };

  const checkAndHideTooltip = () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isMouseOverTrigger && !isMouseOverTooltip) {
        hideTooltip();
      }
    }, 200);
  };

  const onTriggerEnter = () => {
    isMouseOverTrigger = true;
    showTooltip();
  };
  const onTriggerLeave = () => {
    isMouseOverTrigger = false;
    checkAndHideTooltip();
  };
  const onPopupEnter = () => {
    isMouseOverTooltip = true;
    clearTimeout(hideTimeout);
  };
  const onPopupLeave = () => {
    isMouseOverTooltip = false;
    checkAndHideTooltip();
  };
  const onTriggerFocus = () => {
    showTooltip();
  };
  const onTriggerBlur = () => {
    checkAndHideTooltip();
  };
  const onTriggerKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (tooltipPopup.classList.contains('hover')) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  trackListener(tooltipTrigger, 'mouseenter', onTriggerEnter);
  trackListener(tooltipTrigger, 'mouseleave', onTriggerLeave);
  trackListener(tooltipPopup, 'mouseenter', onPopupEnter);
  trackListener(tooltipPopup, 'mouseleave', onPopupLeave);
  trackListener(tooltipTrigger, 'focus', onTriggerFocus);
  trackListener(tooltipTrigger, 'blur', onTriggerBlur);
  trackListener(tooltipTrigger, 'keydown', onTriggerKeydown);
}

function buildQrPaneContent(createTag, onBack) {
  const content = createTag('div', { class: 'qr-code-dropzone-content' });
  const primary = createTag('div', { class: 'easy-upload-primary' });
  const secondary = createTag('div', { class: 'easy-upload-secondary' });
  const qrWidgetContainer = createTag('div', { class: 'button-container qr-code-widget-container' });

  const backButton = createTag(
    'button',
    {
      class: 'easy-upload-back-button',
      type: 'button',
      'aria-label': 'Back',
    },
    getIconElementDeprecated('s2-chevron-left', 18, 'Back'),
  );
  primary.append(backButton);
  if (onBack) {
    const handleBack = (event) => {
      event.preventDefault();
      onBack();
    };
    trackListener(backButton, 'click', handleBack);
  }

  if (easyUploadPaneContent.primary.heading) {
    primary.append(createTag('p', { class: 'easy-upload-heading' }, easyUploadPaneContent.primary.heading));
  }

  easyUploadPaneContent.primary.steps.forEach((step) => {
    primary.append(createTag('p', { class: 'easy-upload-step' }, step));
  });

  if (easyUploadPaneContent.primary.confirmLabel) {
    const confirmTooltipId = 'easy-upload-confirm-tooltip';
    const tooltipContainer = createTag('div', { class: 'tooltip easy-upload-confirm' });
    const confirmButton = createTag('a', {
      href: easyUploadPaneContent.primary.confirmHref || '#',
      class: 'button accent xlarge confirm-import-button disabled',
      'aria-describedby': confirmTooltipId,
    }, easyUploadPaneContent.primary.confirmLabel);
    const tooltipPopup = createTag('div', { class: 'tooltip-text', id: confirmTooltipId, role: 'tooltip' }, easyUploadPaneContent.primary.tooltipText);
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
    const tooltipContainer = createTag('p', { class: 'tooltip security' });
    const tooltipId = 'easy-upload-security-tooltip';
    const tooltipTrigger = createTag(
      'span',
      {
        class: 'easy-upload-tooltip-trigger',
        tabindex: '0',
        role: 'button',
        'aria-expanded': 'false',
        'aria-describedby': tooltipId,
      },
      easyUploadPaneContent.secondary.question,
    );
    const tooltipPopup = createTag(
      'div',
      { class: 'tooltip-text', id: tooltipId, role: 'tooltip' },
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

function setupEasyUploadFirstPane(block, createTag) {
  const dropzone = block.querySelector('.dropzone');
  if (!dropzone || dropzone.querySelector('.easy-upload-cta-row')) return;

  const buttonContainers = Array.from(dropzone.querySelectorAll('p.button-container'));
  if (buttonContainers.length < 2) return;

  dropzone.classList.add('easy-upload-initial');

  const firstButton = buttonContainers[0];
  const ctaRow = createTag('div', { class: 'easy-upload-cta-row' });
  const orDivider = createTag('div', { class: 'easy-upload-or' }, createTag('span', {}, 'OR'));

  dropzone.insertBefore(orDivider, firstButton);
  dropzone.insertBefore(ctaRow, orDivider.nextSibling);

  const buttons = buttonContainers.map((container) => container.querySelector('a.button'));
  if (buttons[0]) {
    const uploadIcon = getIconElementDeprecated('easy-upload-files-upload', 22);
    buttons[0].prepend(uploadIcon);
  }
  if (buttons[1]) {
    const qrCodeIcon = getIconElementDeprecated('easy-upload-files-qr-code', 22);
    buttons[1].prepend(qrCodeIcon);
  }

  buttonContainers.forEach((container) => {
    ctaRow.append(container);
  });
}

export function notifyEasyUploadSdkInitialization(block) {
  if (!block) return;
  window.dispatchEvent(new CustomEvent(EASY_UPLOAD_SDK_INITIALIZED_EVENT, {
    detail: { block },
  }));
}

function getDropzoneContainer(block) {
  return block.querySelector('.dropzone-container');
}

function getQrPane(block) {
  return block.querySelector('.qr-code-container.dropzone-container');
}

function navigateToQrPane(block) {
  const dropzoneContainer = getDropzoneContainer(block);
  const qrPane = getQrPane(block);
  if (!dropzoneContainer || !qrPane) {
    return;
  }
  dropzoneContainer.classList.add('hidden');
  qrPane.classList.remove('hidden');
}

function navigateAwayFromQrPane(block) {
  const dropzoneContainer = getDropzoneContainer(block);
  const qrPane = getQrPane(block);
  if (!dropzoneContainer || !qrPane) {
    return;
  }
  qrPane.classList.add('hidden');
  dropzoneContainer.classList.remove('hidden');
}

async function resolveQrInitFailedMessage(fallbackMessage) {
  const getConfig = deferredInitContext?.getConfig;
  if (!getConfig) {
    return fallbackMessage;
  }

  try {
    if (!sharedReplaceKey) {
      ({ replaceKey: sharedReplaceKey } = await import(`${getLibs()}/features/placeholders.js`));
    }
    const translated = await sharedReplaceKey('qr-init-failed', getConfig());
    if (!translated || translated === 'qr-init-failed') {
      return fallbackMessage;
    }
    return translated;
  } catch (error) {
    window.lana?.log(
      `[EasyUpload-UI] Failed to resolve qr-init-failed placeholder: ${error?.message || error}`,
      { severity: 'warning' },
    );
    return fallbackMessage;
  }
}

async function ensureEasyUploadInstance(block, createTag, showErrorToast) {
  if (easyUploadInstance) {
    return true;
  }
  if (!deferredInitContext) {
    return false;
  }

  try {
    const { EasyUpload } = await import('../../../scripts/utils/easy-upload-utils.js');
    const { env } = deferredInitContext.getConfig();
    const uploadService = await deferredInitContext.initializeUploadService();
    if (!uploadService) {
      throw new Error('Upload service not initialized');
    }

    easyUploadInstance = new EasyUpload(
      uploadService,
      env.name,
      deferredInitContext.quickAction,
      block,
      deferredInitContext.startSDKWithUnconvertedFiles,
      createTag,
      showErrorToast,
      easyUploadPaneContent.secondary.qrErrorText,
    );
    return true;
  } catch (error) {
    window.lana?.log(
      `[EasyUpload-UI] Deferred initialization failed: ${error?.message || error}`,
      { severity: 'error' },
    );
    const errorMessage = await resolveQrInitFailedMessage('Failed to initialize QR code upload.');
    showErrorToast?.(block, errorMessage);
    return false;
  }
}

function applyDebugPaneState({ qrPane, createTag, showErrorToast, block }) {
  if (PLACEHOLDER_DEBUG_MODES.has(activeDebugMode)) {
    if (activeDebugMode === DEBUG_MODES.AUTOFAIL) {
      renderDebugAutofailVariant({
        qrPane,
        createTag,
        showErrorToast,
        block,
        paneContent: easyUploadPaneContent,
      });
    } else if (activeDebugMode === DEBUG_MODES.UPLOADING) {
      renderDebugPendingUploadVariant({
        qrPane,
        createTag,
        showErrorToast,
        block,
        paneContent: easyUploadPaneContent,
      });
    } else {
      renderDebugPlaceholderVariant({ qrPane, createTag });
    }
    return true;
  }

  if (activeDebugMode === DEBUG_MODES.LOADER) {
    renderDebugLoaderPaneState({ qrPane, createTag });
    return true;
  }

  return false;
}

function bindConfirmButton(qrPane) {
  const confirmButton = qrPane.querySelector('.confirm-import-button');
  if (!confirmButton || !easyUploadInstance) {
    window.lana?.log(
      '[EasyUpload-UI] Could not find confirm button or EasyUpload instance',
      { severity: 'warning' },
    );
    return;
  }

  easyUploadInstance.confirmButton = confirmButton;
  easyUploadInstance.updateConfirmButtonState(true);

  const confirmTooltipElement = confirmButton
    .closest('.tooltip')?.querySelector('.tooltip-text');
  easyUploadInstance.setConfirmTooltipConfig({
    element: confirmTooltipElement,
    messages: {
      pending: easyUploadPaneContent.primary.tooltipText,
      failed: easyUploadPaneContent.primary.errorText,
    },
  });

  if (!confirmButton.dataset.easyUploadConfirmBound) {
    const handleConfirmClick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (confirmButton.classList.contains('disabled')) {
        easyUploadInstance.showConfirmTooltip?.('pending');
        return;
      }
      await easyUploadInstance.handleConfirmImport();
    };
    trackListener(confirmButton, 'click', handleConfirmClick);
    confirmButton.dataset.easyUploadConfirmBound = 'true';
  }
}

async function initializeQrPane(block, qrPane, createTag, showErrorToast, options = {}) {
  const { forceRefresh = false } = options;
  if (!qrPane) {
    return false;
  }

  if (applyDebugPaneState({
    qrPane,
    createTag,
    showErrorToast,
    block,
  })) {
    return true;
  }

  const hasInstance = await ensureEasyUploadInstance(block, createTag, showErrorToast);
  if (!hasInstance) {
    return false;
  }

  if (forceRefresh || easyUploadInstance?.isQrCodeConsumed?.()) {
    delete qrPane.dataset.qrInitialized;
  }

  if (qrPane.dataset.qrInitialized) {
    bindConfirmButton(qrPane);
    easyUploadInstance.startUploadDetectionPolling();
    return true;
  }

  try {
    qrPane.dataset.qrInitialized = 'true';
    if (DISABLE_QR_CODE_RENDER) {
      easyUploadInstance.showLoader?.();
      bindConfirmButton(qrPane);
      return true;
    }

    if (easyUploadInstance?.isQrCodeConsumed?.() && easyUploadInstance?.resetUploadSession) {
      await easyUploadInstance.resetUploadSession();
    }

    await easyUploadInstance.initializeQRCode();
    bindConfirmButton(qrPane);
    easyUploadInstance.startUploadDetectionPolling();
    return true;
  } catch (error) {
    delete qrPane.dataset.qrInitialized;
    window.lana?.log(
      `[EasyUpload-UI] initializeQRCode failed: ${error?.name} ${error?.message}`,
      { severity: 'error' },
    );
    const errorMessage = await resolveQrInitFailedMessage('Failed to load QR code.');
    showErrorToast?.(block, errorMessage);
    return false;
  }
}

function setupQrPane(block, createTag) {
  const dropzoneContainer = getDropzoneContainer(block);
  if (!dropzoneContainer) {
    return null;
  }

  const existingPane = getQrPane(block);
  if (existingPane) {
    return existingPane;
  }

  const qrPane = createTag('div', { class: 'qr-code-container dropzone-container hidden' });
  const rect = dropzoneContainer.getBoundingClientRect();
  if (rect.width) {
    qrPane.style.width = `${rect.width}px`;
  }
  if (rect.height) {
    qrPane.style.height = `${rect.height}px`;
  }

  const qrDropzone = createTag('div', { class: 'dropzone qr-code-dropzone' });
  const handleBack = () => navigateAwayFromQrPane(block);
  qrDropzone.append(buildQrPaneContent(createTag, handleBack));
  qrPane.append(qrDropzone);
  dropzoneContainer.insertAdjacentElement('afterend', qrPane);
  return qrPane;
}

function bindEasyUploadSdkInitListener(block, createTag, showErrorToast) {
  const handleSdkInitialized = (event) => {
    const eventBlock = event?.detail?.block;
    if (!easyUploadInstance || (eventBlock && eventBlock !== block)) {
      return;
    }

    easyUploadInstance.markQrCodeConsumed?.();
    const qrPane = getQrPane(block);
    if (!qrPane) {
      return;
    }

    delete qrPane.dataset.qrInitialized;
    if (!qrPane.classList.contains('hidden')) {
      initializeQrPane(block, qrPane, createTag, showErrorToast, { forceRefresh: true })
        .catch((error) => window.lana?.log(
          `[EasyUpload-UI] Failed eager consumed QR refresh: ${error?.message || error}`,
          { severity: 'warning' },
        ));
    }
  };

  trackListener(window, EASY_UPLOAD_SDK_INITIALIZED_EVENT, handleSdkInitialized);
}

function attachSecondaryCtaHandler(block, qrPane, createTag, showErrorToast) {
  if (!easyUploadPaneContent.hasContent || !qrPane) {
    return;
  }

  const dropzone = block.querySelector('.dropzone');
  if (!dropzone) {
    return;
  }

  const secondaryButtonContainer = dropzone.querySelector('.easy-upload-cta-row > p.button-container:nth-child(2)');
  const secondaryCta = secondaryButtonContainer?.querySelector('a.button, a.con-button');
  if (!secondaryCta) {
    return;
  }

  const handleSecondaryCta = async (event) => {
    event.preventDefault();
    navigateToQrPane(block);
    await initializeQrPane(block, qrPane, createTag, showErrorToast);
  };

  trackListener(secondaryCta, 'click', handleSecondaryCta);
}

function attachPrimaryCtaHandler(block) {
  if (!easyUploadPaneContent.hasContent) {
    return;
  }

  const dropzone = block.querySelector('.dropzone');
  if (!dropzone) {
    return;
  }

  const primaryButtonContainer = dropzone.querySelector('.easy-upload-cta-row > p.button-container:nth-child(1)');
  const primaryCta = primaryButtonContainer?.querySelector('a.button, a.con-button');
  if (!primaryCta) {
    return;
  }

  const handlePrimaryCta = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const inputElement = block.querySelector('input[type="file"]');
    inputElement?.click();
  };

  trackListener(primaryCta, 'click', handlePrimaryCta);
}

export async function refreshEasyUploadQrIfConsumed(block) {
  const activeBlock = block || easyUploadInstance?.block;
  const qrPane = activeBlock ? getQrPane(activeBlock) : null;
  if (
    !easyUploadInstance
    || !sharedCreateTag
    || !sharedShowErrorToast
    || !activeBlock
    || !qrPane
    || qrPane.classList.contains('hidden')
  ) {
    return false;
  }
  if (!easyUploadInstance.isQrCodeConsumed?.()) {
    return false;
  }

  return initializeQrPane(
    activeBlock,
    qrPane,
    sharedCreateTag,
    sharedShowErrorToast,
    { forceRefresh: true },
  );
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
  sharedCreateTag = createTag;
  sharedShowErrorToast = showErrorToast;
  activeDebugMode = getDebugMode(block);
  await loadEasyUploadStyles(getConfig, loadStyle);
  extractEasyUploadPaneContent(block);
  setupEasyUploadFirstPane(block, createTag);

  deferredInitContext = (PLACEHOLDER_DEBUG_MODES.has(activeDebugMode)
    || activeDebugMode === DEBUG_MODES.LOADER) ? null : {
      quickAction,
      getConfig,
      initializeUploadService,
      startSDKWithUnconvertedFiles,
    };

  const qrPane = setupQrPane(block, createTag);
  bindEasyUploadSdkInitListener(block, createTag, showErrorToast);
  attachPrimaryCtaHandler(block);
  attachSecondaryCtaHandler(block, qrPane, createTag, showErrorToast);

  if (AUTOLOAD_QR_CODE && activeDebugMode === DEBUG_MODES.NONE) {
    await initializeQrPane(block, qrPane, createTag, showErrorToast);
  }

  return easyUploadInstance;
}
export function cleanupEasyUpload() {
  registeredListeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
  registeredListeners.length = 0;
  deferredInitContext = null;
  sharedCreateTag = null;
  sharedShowErrorToast = null;
  sharedReplaceKey = null;
  if (easyUploadInstance) {
    easyUploadInstance.cleanup();
    easyUploadInstance = null;
  }
}
