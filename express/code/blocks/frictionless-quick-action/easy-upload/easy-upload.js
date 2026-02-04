import { EasyUploadControls, EasyUploadVariants, EasyUploadVariantsPromoidMap } from '../../../scripts/utils/easy-upload-utils.js';
import { getIconElementDeprecated } from '../../../scripts/utils.js';
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
    backButton.addEventListener('click', (event) => {
      event.preventDefault();
      onBack();
    });
  }

  if (easyUploadPaneContent.primary.heading) {
    primary.append(createTag('p', { class: 'easy-upload-heading' }, easyUploadPaneContent.primary.heading));
  }

  easyUploadPaneContent.primary.steps.forEach((step) => {
    primary.append(createTag('p', { class: 'easy-upload-step' }, step));
  });

  if (easyUploadPaneContent.primary.confirmLabel) {
    const tooltipContainer = createTag('div', { class: 'tooltip easy-upload-confirm' });
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

  // Add icons to buttons
  const buttons = buttonContainers.map((container) => container.querySelector('a.button'));
  if (buttons[0]) {
    const uploadIcon = getIconElementDeprecated('easy-upload-upload', 22);
    buttons[0].prepend(uploadIcon);
  }
  if (buttons[1]) {
    const qrCodeIcon = getIconElementDeprecated('easy-upload-qr-code', 22);
    buttons[1].prepend(qrCodeIcon);
  }

  buttonContainers.forEach((container) => {
    ctaRow.append(container);
  });
}

// Store deferred initialization context
let deferredInitContext = null;

function attachSecondaryCtaHandler(block, createTag, showErrorToast) {
  console.log('[EasyUpload-UI] attachSecondaryCtaHandler called');
  if (!easyUploadPaneContent.hasContent) {
    console.log('[EasyUpload-UI] No pane content, returning');
    return;
  }

  const dropzone = block.querySelector('.dropzone');
  const dropzoneContainer = block.querySelector('.dropzone-container');
  if (!dropzone || !dropzoneContainer) {
    console.log('[EasyUpload-UI] Missing dropzone or container, returning');
    return;
  }

  const ctas = dropzone.querySelectorAll('a.button, a.con-button');
  const secondaryCta = ctas[1];
  if (!secondaryCta) {
    console.log('[EasyUpload-UI] No secondary CTA found, returning');
    return;
  }
  console.log('[EasyUpload-UI] Secondary CTA found, attaching click handler');

  secondaryCta.addEventListener('click', async (event) => {
    console.log('[EasyUpload-UI] Secondary CTA clicked - initiating QR code flow');
    event.preventDefault();
    event.stopPropagation();

    dropzoneContainer.classList.add('hidden');

    let qrPane = dropzoneContainer.parentElement?.querySelector('.qr-code-container');
    if (!qrPane) {
      console.log('[EasyUpload-UI] Creating new QR pane');
      qrPane = createTag('div', { class: 'qr-code-container dropzone-container' });
      const rect = dropzoneContainer.getBoundingClientRect();
      if (rect.width) {
        qrPane.style.width = `${rect.width}px`;
      }
      if (rect.height) {
        qrPane.style.height = `${rect.height}px`;
      }
      dropzoneContainer.insertAdjacentElement('afterend', qrPane);
    } else {
      console.log('[EasyUpload-UI] Showing existing QR pane');
      qrPane.classList.remove('hidden');
    }

    if (!qrPane.querySelector('.qr-code-dropzone')) {
      console.log('[EasyUpload-UI] Building QR pane content');
      qrPane.innerHTML = '';
      const qrDropzone = createTag('div', { class: 'dropzone qr-code-dropzone' });
      const handleBack = () => {
        dropzoneContainer.classList.remove('hidden');
        qrPane.classList.add('hidden');
      };
      qrDropzone.append(buildQrPaneContent(createTag, handleBack));
      qrPane.append(qrDropzone);
      delete qrPane.dataset.qrInitialized;
    }

    // Initialize EasyUpload instance on-demand (deferred until user clicks QR button)
    // This ensures IMS has time to initialize before we create the upload service
    if (!easyUploadInstance && deferredInitContext) {
      console.log('[EasyUpload-UI] Initializing EasyUpload instance on-demand (deferred)...');
      try {
        const { EasyUpload } = await import('../../../scripts/utils/easy-upload-utils.js');
        const { env } = deferredInitContext.getConfig();
        console.log('[EasyUpload-UI] Environment:', env.name);

        console.log('[EasyUpload-UI] Initializing upload service (deferred)...');
        const uploadService = await deferredInitContext.initializeUploadService();
        console.log('[EasyUpload-UI] Upload service initialized:', {
          hasService: !!uploadService,
          serviceType: uploadService?.constructor?.name,
        });

        if (!uploadService) {
          throw new Error('Upload service not initialized');
        }

        // Debug: Log the service config
        try {
          const config = uploadService.getConfig();
          console.log('[EasyUpload-UI] Upload service config:', {
            environment: config?.environment,
            hasAuthConfig: !!config?.authConfig,
            hasToken: !!config?.authConfig?.token,
            tokenLength: config?.authConfig?.token?.length,
          });
        } catch (e) {
          console.log('[EasyUpload-UI] Could not read service config:', e.message);
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
        console.log('[EasyUpload-UI] EasyUpload instance created (deferred):', !!easyUploadInstance);
      } catch (error) {
        console.error('[EasyUpload-UI] Deferred initialization failed:', error);
        showErrorToast?.(block, 'Failed to initialize QR code upload.');
        return;
      }
    }

    console.log('[EasyUpload-UI] QR initialization check:', {
      qrInitialized: qrPane.dataset.qrInitialized,
      hasEasyUploadInstance: !!easyUploadInstance,
      hasInitializeQRCode: !!easyUploadInstance?.initializeQRCode,
    });

    if (!qrPane.dataset.qrInitialized && easyUploadInstance?.initializeQRCode) {
      try {
        console.log('[EasyUpload-UI] Calling easyUploadInstance.initializeQRCode()...');
        qrPane.dataset.qrInitialized = 'true';
        await easyUploadInstance.initializeQRCode();
        console.log('[EasyUpload-UI] initializeQRCode completed successfully');
        
        // Wire up the confirm button to the EasyUpload instance
        const confirmButton = qrPane.querySelector('.confirm-import-button');
        if (confirmButton && easyUploadInstance) {
          console.log('[EasyUpload-UI] Wiring up confirm button to EasyUpload instance');
          
          // Store reference in the EasyUpload instance
          easyUploadInstance.confirmButton = confirmButton;
          
          // Start disabled - will be enabled when upload is detected
          easyUploadInstance.updateConfirmButtonState(true);
          console.log('[EasyUpload-UI] Confirm button initially disabled (waiting for upload)');
          
          // Attach click handler
          confirmButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[EasyUpload-UI] Confirm button clicked, calling handleConfirmImport...');
            await easyUploadInstance.handleConfirmImport();
          });
          
          // Start polling for upload completion
          console.log('[EasyUpload-UI] Starting upload detection polling...');
          easyUploadInstance.startUploadDetectionPolling();
        } else {
          console.warn('[EasyUpload-UI] Could not find confirm button or EasyUpload instance');
        }
      } catch (error) {
        console.error('[EasyUpload-UI] initializeQRCode failed:', {
          errorName: error?.name,
          errorMessage: error?.message,
          errorCode: error?.code,
          statusCode: error?.statusCode,
        });
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
  console.log('[EasyUpload-UI] setupEasyUploadUI called for quickAction:', quickAction);

  if (!isEasyUploadExperimentEnabled(quickAction)) {
    console.log('[EasyUpload-UI] Experiment not enabled, returning null');
    return null;
  }
  console.log('[EasyUpload-UI] Loading styles...');
  await loadEasyUploadStyles(getConfig, loadStyle);
  console.log('[EasyUpload-UI] Extracting pane content...');
  extractEasyUploadPaneContent(block);
  console.log('[EasyUpload-UI] Setting up first pane...');
  setupEasyUploadFirstPane(block, createTag);

  // Store deferred initialization context - upload service will be initialized
  // when user clicks the QR button, giving IMS time to fully initialize
  deferredInitContext = {
    quickAction,
    getConfig,
    initializeUploadService,
    startSDKWithUnconvertedFiles,
  };
  console.log('[EasyUpload-UI] Stored deferred init context (upload service will initialize on QR click)');

  console.log('[EasyUpload-UI] Attaching secondary CTA handler...');
  attachSecondaryCtaHandler(block, createTag, showErrorToast);

  // If AUTOLOAD_QR_CODE is enabled, initialize immediately (with slight delay for IMS)
  if (AUTOLOAD_QR_CODE) {
    console.log('[EasyUpload-UI] AUTOLOAD_QR_CODE is true, initializing with delay...');
    // Use setTimeout to give IMS time to initialize (similar to old seo-easy-upload branch)
    setTimeout(async () => {
      try {
        const { EasyUpload } = await import('../../../scripts/utils/easy-upload-utils.js');
        const { env } = getConfig();

        console.log('[EasyUpload-UI] Initializing upload service (autoload)...');
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
          easyUploadPaneContent.secondary.qrErrorText,
        );

        await easyUploadInstance.setupQRCodeInterface();
        console.log('[EasyUpload-UI] Autoload QR code completed');
      } catch (error) {
        console.error('[EasyUpload-UI] Autoload initialization failed:', error);
      }
    }, 100); // 100ms delay to allow IMS to initialize
  }

  return easyUploadInstance;
}

export function cleanupEasyUpload() {
  if (easyUploadInstance) {
    easyUploadInstance.cleanup();
    easyUploadInstance = null;
  }
}
