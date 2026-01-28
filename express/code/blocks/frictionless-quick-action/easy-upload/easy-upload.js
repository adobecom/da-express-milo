import { EasyUploadControls, EasyUploadVariants, EasyUploadVariantsPromoidMap } from '../../../scripts/utils/easy-upload-utils.js';

const EASY_UPLOAD_CSS_PATH = '/blocks/frictionless-quick-action/easy-upload/easy-upload.css';
const AUTOLOAD_QR_CODE = false;

let easyUploadInstance = null;
let easyUploadStylesLoaded = false;

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
