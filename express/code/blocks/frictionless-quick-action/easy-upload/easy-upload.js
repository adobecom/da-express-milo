import { EasyUploadControls, EasyUploadVariants, EasyUploadVariantsPromoidMap } from '../../../scripts/utils/easy-upload-utils.js';

const EASY_UPLOAD_CSS_PATH = '/blocks/frictionless-quick-action/easy-upload/easy-upload.css';
const AUTOLOAD_QR_CODE = false;

let easyUploadInstance = null;
let easyUploadStylesLoaded = false;
const easyUploadPaneContent = {
  html: '',
  text: '',
  hasContent: false,
};

function loadEasyUploadStyles(getConfig, loadStyle) {
  if (easyUploadStylesLoaded || !loadStyle) {
    return Promise.resolve();
  }

  const config = getConfig();
  return new Promise((resolve) => {
    loadStyle(`${config.codeRoot}${EASY_UPLOAD_CSS_PATH}`, () => {
      easyUploadStylesLoaded = true;
      resolve();
    });
  });
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
  easyUploadPaneContent.html = paneHtml;
  easyUploadPaneContent.hasContent = true;
  lastRow.remove();
}

function attachSecondaryCtaHandler(block, createTag) {
  if (!easyUploadPaneContent.hasContent) return;

  const dropzone = block.querySelector('.dropzone');
  const dropzoneContainer = block.querySelector('.dropzone-container');
  if (!dropzone || !dropzoneContainer) return;

  const ctas = dropzone.querySelectorAll('a.button, a.con-button');
  const secondaryCta = ctas[1];
  if (!secondaryCta) return;

  secondaryCta.addEventListener('click', (event) => {
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
    qrDropzone.innerHTML = easyUploadPaneContent.html;
    qrPane.append(qrDropzone);
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
  attachSecondaryCtaHandler(block, createTag);

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
