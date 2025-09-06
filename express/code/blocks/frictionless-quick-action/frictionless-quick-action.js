import { transformLinkToAnimation } from '../../scripts/utils/media.js';
import { getLibs, getIconElementDeprecated, decorateButtonsDeprecated } from '../../scripts/utils.js';
import { buildFreePlanWidget } from '../../scripts/widgets/free-plan.js';
import { sendFrictionlessEventToAdobeAnaltics } from '../../scripts/instrument.js';
import { createLocaleDropdownWrapper } from '../../scripts/widgets/frictionless-locale-dropdown.js';
import {
  QA_CONFIGS,
  EXPERIMENTAL_VARIANTS,
  fadeIn,
  fadeOut,
  createDocConfig,
  createMergeVideosDocConfig,
  createContainerConfig,
  selectElementByTagPrefix,
  createDefaultExportConfig,
  executeQuickAction,
  processFilesForQuickAction,
  loadAndInitializeCCEverywhere,
  getErrorMsg,
  initProgressBar,
  FRICTIONLESS_UPLOAD_QUICK_ACTIONS,
} from '../../scripts/utils/frictionless-utils.js';

let createTag;
let getConfig;
let getMetadata;
let globalNavSelector;
let selectedVideoLanguage = 'en-us'; // Default to English (US)
let replaceKey;

let ccEverywhere;
let quickActionContainer;
let uploadContainer;
let uploadService;
let fqaContainer;
let uploadEvents;
let frictionlessTargetBaseUrl;

function frictionlessQAExperiment(
  quickAction,
  docConfig,
  appConfig,
  exportConfig,
  contConfig,
) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  const variant = urlVariant || quickAction;
  appConfig.metaData.variant = variant;
  appConfig.metaData.entryPoint = 'seo-quickaction-image-upload';
  switch (variant) {
    case 'qa-nba':
      ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'qa-in-product-control':
      ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'qa-in-product-variant1':
      appConfig.metaData.isFrictionlessQa = false;
      document.querySelector(`${globalNavSelector}.ready`).style.display = 'none';
      ccEverywhere.editor.createWithAsset(docConfig, appConfig, exportConfig, {
        ...contConfig,
        mode: 'modal',
      });
      break;
    case 'qa-in-product-variant2':
      appConfig.metaData.isFrictionlessQa = false;
      document.querySelector(`${globalNavSelector}.ready`).style.display = 'none';
      ccEverywhere.editor.createWithAsset(docConfig, appConfig, exportConfig, {
        ...contConfig,
        mode: 'modal',
      });
      break;
    default:
      break;
  }
}

let timeoutId = null;
function showErrorToast(block, msg) {
  let toast = block.querySelector('.error-toast');
  const hideToast = () => toast.classList.add('hide');
  if (!toast) {
    toast = createTag('div', { class: 'error-toast hide' });
    toast.prepend(getIconElementDeprecated('error'));
    const close = createTag(
      'button',
      {},
      getIconElementDeprecated('close-white'),
    );
    close.addEventListener('click', hideToast);
    toast.append(close);
    block.append(toast);
  }
  toast.textContent = msg;
  toast.classList.remove('hide');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(hideToast, 6000);
}

// eslint-disable-next-line default-param-last
export function runQuickAction(quickActionId, data, block) {
  // TODO: need the button labels from the placeholders sheet if the SDK default doens't work.
  const exportConfig = createDefaultExportConfig();

  const id = `${quickActionId}-container`;
  quickActionContainer = createTag('div', { id, class: 'quick-action-container' });
  block.append(quickActionContainer);
  const divs = block.querySelectorAll(':scope > div');
  if (divs[1]) [, uploadContainer] = divs;
  fadeOut(uploadContainer);

  const contConfig = createContainerConfig(quickActionId);
  const docConfig = createDocConfig(data[0], 'image');
  const videoDocConfig = quickActionId === 'merge-videos' ? createMergeVideosDocConfig(data) : createDocConfig(data[0], 'video');

  const appConfig = {
    metaData: {
      isFrictionlessQa: 'true',
      ...(quickActionId === 'caption-video' && { videoLanguage: selectedVideoLanguage }),
    },
    receiveQuickActionErrors: true,
    callbacks: {
      onIntentChange: () => {
        quickActionContainer?.remove();
        fadeIn(uploadContainer);
        document.body.classList.add('editor-modal-loaded');
        window.history.pushState({ hideFrictionlessQa: true }, '', '');
        return {
          containerConfig: {
            mode: 'modal',
            zIndex: 999,
          },
        };
      },
      onCancel: () => {
        window.history.back();
      },
      onError: (error) => {
        // eslint-disable-next-line no-underscore-dangle
        showErrorToast(block, `${error._customData} Please try again.`);
        quickActionContainer?.remove();
        fadeIn(uploadContainer);
      },
    },
  };

  const urlParams = new URLSearchParams(window.location.search);
  const variant = urlParams.get('variant');
  const isStage = urlParams.get('hzenv') === 'stage';

  if (!ccEverywhere) return;

  // Handle experimental variants for remove-background
  if (quickActionId === 'remove-background' && variant && isStage) {
    frictionlessQAExperiment(
      variant,
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    );
    return;
  }

  // Handle experimental variants
  if (EXPERIMENTAL_VARIANTS.includes(quickActionId)) {
    frictionlessQAExperiment(
      quickActionId,
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    );
    return;
  }

  // Execute the quick action using the helper function
  executeQuickAction(
    ccEverywhere,
    quickActionId,
    docConfig,
    appConfig,
    exportConfig,
    contConfig,
    videoDocConfig,
  );
}

// eslint-disable-next-line default-param-last
async function startSDK(data = [''], quickAction, block) {
  if (!ccEverywhere) {
    ccEverywhere = await loadAndInitializeCCEverywhere(getConfig);
  }
  runQuickAction(quickAction, data, block);
}

function resetUploadUI(progressBar) {
  progressBar.remove();
  fadeIn(fqaContainer);
}

function createUploadStatusListener(uploadStatusEvent, progressBar) {
  const listener = (e) => {
    const isUploadProgressLessThanVisual = e.detail.progress < progressBar.getProgress();
    const progress = isUploadProgressLessThanVisual ? progressBar.getProgress() : e.detail.progress;

    /**
     * The reason for doing this is because assetId takes a while to resolve
     * and progress completes to 100 before assetId is resolved. This can cause
     * a confusion in experience where user might think the upload is stuck.
     */
    if (progress === 100) {
      progressBar.setProgress(95);
    } else {
      progressBar.setProgress(progress);
    }

    if (['completed', 'failed'].includes(e.detail.status)) {
      if (e.detail.status === 'failed') {
        setTimeout(() => {
          resetUploadUI(progressBar);
        }, 200);
      }
      window.removeEventListener(uploadStatusEvent, listener);
    }
  };
  window.addEventListener(uploadStatusEvent, listener);
}

async function validateTokenAndReturnService(existingService) {
  const freshToken = window?.adobeIMS?.getAccessToken()?.token;
  if (freshToken && freshToken !== existingService.getConfig().authConfig.token) {
    existingService.updateConfig({
      authConfig: {
        ...uploadService.getConfig().authConfig,
        token: freshToken,
      },
    });
  }
  return existingService;
}

async function initializeUploadService() {
  if (uploadService) return validateTokenAndReturnService(uploadService);
  // eslint-disable-next-line import/no-relative-packages
  const { initUploadService, UPLOAD_EVENTS } = await import('../../scripts/upload-service/dist/upload-service.min.es.js');
  const { env } = getConfig();
  uploadService = await initUploadService({ environment: env.name });
  uploadEvents = UPLOAD_EVENTS;
  return uploadService;
}

async function setupUploadUI(block) {
  const progressBar = await initProgressBar(replaceKey, getConfig);
  fqaContainer = block.querySelector('.fqa-container');
  fadeOut(fqaContainer);
  block.insertBefore(progressBar, fqaContainer);
  return progressBar;
}

async function uploadAssetToStorage(file, progressBar) {
  const service = await initializeUploadService();
  createUploadStatusListener(uploadEvents.UPLOAD_STATUS, progressBar);

  const { asset } = await service.uploadAsset({
    file,
    fileName: file.name,
    contentType: file.type,
  });

  progressBar.setProgress(100);
  return asset.assetId;
}

async function performStorageUpload(files, block) {
  try {
    const progressBar = await setupUploadUI(block);
    return await uploadAssetToStorage(files[0], progressBar);
  } catch (error) {
    if (error.code === 'UPLOAD_FAILED') {
      const message = await replaceKey('upload-media-error', getConfig());
      showErrorToast(block, message);
    } else {
      showErrorToast(block, error.message);
    }
    return null;
  }
}

async function startAssetDecoding(file, controller) {
  const { getAssetDimensions, decodeWithTimeout } = await import('../../scripts/utils/assetDecoder.js');

  return decodeWithTimeout(getAssetDimensions(file, {
    signal: controller.signal,
  }).catch((error) => {
    window.lana?.log('Asset decode failed');
    window.lana?.log(error);
    return null;
  }), 5000);
}

async function raceUploadAndDecode(uploadPromise, decodePromise) {
  return Promise.race([
    uploadPromise
      .then((result) => ({ type: 'upload', value: result }))
      .catch((error) => ({ type: 'upload', error })),
    decodePromise
      .then((result) => ({ type: 'decode', value: result }))
      .catch((error) => ({ type: 'decode', error })),
  ]);
}

async function handleUploadFirst(assetId, gracePeriodDecodePromise, gracePeriodController) {
  if (!assetId) {
    gracePeriodController.abort('Upload failed');
    return { assetId: null, dimensions: null };
  }

  const dimensions = await Promise.race([
    gracePeriodDecodePromise,
    new Promise((resolve) => {
      setTimeout(() => resolve(null), 1000);
    }),
  ]);

  if (dimensions === null) {
    gracePeriodController.abort('Grace period expired, proceeding without dimensions');
  }

  return { assetId, dimensions };
}

async function handleDecodeFirst(dimensions, uploadPromise, initialDecodeController) {
  const assetId = await uploadPromise;

  if (!assetId) {
    initialDecodeController.abort('Upload failed');
    return { assetId: null, dimensions: null };
  }

  return { assetId, dimensions };
}

async function buildEditorUrl(quickAction, assetId, dimensions) {
  const urlsMap = {
    'edit-image': '/express/feature/image/editor',
    'edit-video': '/express/feature/video/editor',
  };
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');

  const isVideoEditor = quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.videoEditor;
  const url = new URL(await getTrackingAppendedURL(frictionlessTargetBaseUrl));
  const searchParams = {
    frictionlessUploadAssetId: assetId,
    category: 'media',
    tab: isVideoEditor ? 'videos' : 'photos',
    width: dimensions?.width,
    height: dimensions?.height,
    url: urlsMap[quickAction],
  };

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

function addVideoEditorParams(url) {
  url.searchParams.set('isVideoMaker', 'true');
  url.searchParams.set('sceneline', 'true');
}

function addImageEditorParams(url) {
  url.searchParams.set('learn', 'exercise:express/how-to/in-app/how-to-edit-an-image:-1');
}

async function performUploadAction(files, block, quickAction) {
  const initialDecodeController = new AbortController();

  const initialDecodePromise = startAssetDecoding(files[0], initialDecodeController);
  const uploadPromise = performStorageUpload(files, block);

  const firstToComplete = await raceUploadAndDecode(uploadPromise, initialDecodePromise);

  let result;
  if (firstToComplete.type === 'upload') {
    if (firstToComplete.error) {
      return;
    }

    const gracePeriodController = new AbortController();
    const gracePeriodDecodePromise = startAssetDecoding(files[0], gracePeriodController);
    result = await handleUploadFirst(
      firstToComplete.value,
      gracePeriodDecodePromise,
      gracePeriodController,
    );

    initialDecodeController.abort('Upload completed first, switching to grace period decode');
  } else {
    if (firstToComplete.error) {
      initialDecodeController.abort('Decode failed');
      return;
    }

    result = await handleDecodeFirst(firstToComplete.value, uploadPromise, initialDecodeController);
  }

  if (!result.assetId) return;

  const url = await buildEditorUrl(quickAction, result.assetId, result.dimensions);

  if (quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.videoEditor) {
    addVideoEditorParams(url);
  }

  if (quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.imageEditor) {
    addImageEditorParams(url);
  }

  window.location.href = url.toString();
}

async function startSDKWithUnconvertedFiles(files, quickAction, block) {
  let data = await processFilesForQuickAction(files, quickAction);
  if (!data[0]) {
    const msg = await getErrorMsg(files, quickAction, replaceKey, getConfig);
    showErrorToast(block, msg);
    return;
  }

  if (data.some((item) => !item)) {
    const msg = await getErrorMsg(files, quickAction, replaceKey, getConfig);
    showErrorToast(block, msg);
    data = data.filter((item) => item);
  }

  const frictionlessAllowedQuickActions = Object.values(FRICTIONLESS_UPLOAD_QUICK_ACTIONS);
  if (frictionlessAllowedQuickActions.includes(quickAction)) {
    await performUploadAction(files, block, quickAction);
    return;
  }

  startSDK(data, quickAction, block);
}

function createCaptionLocaleDropdown() {
  const { wrapper } = createLocaleDropdownWrapper({
    defaultValue: 'en-us',
    onChange: (code) => {
      selectedVideoLanguage = code;
    },
  });
  return wrapper;
}

function createStep(number, content) {
  const step = createTag('div', { class: 'step', 'data-step': number });
  const stepNumber = createTag('div', { class: 'step-number' }, number);
  step.append(stepNumber, content);
  return step;
}

export default async function decorate(block) {
  const [utils, gNavUtils, placeholders] = await Promise.all([import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/blocks/global-navigation/utilities/utilities.js`),
    import(`${getLibs()}/features/placeholders.js`),
    decorateButtonsDeprecated(block)]);

  ({ createTag, getMetadata, getConfig } = utils);
  ({ replaceKey } = placeholders);

  globalNavSelector = gNavUtils?.selectors.globalNav;

  const rows = Array.from(block.children);
  rows[1].classList.add('fqa-container');
  const quickActionRow = rows.filter(
    (r) => r.children
      && r.children[0].textContent.toLowerCase().trim() === 'quick-action',
  );
  const quickAction = quickActionRow?.[0].children[1]?.textContent;
  if (!quickAction) {
    throw new Error('Invalid Quick Action Type.');
  }
  quickActionRow[0].remove();

  const actionAndAnimationRow = rows[1].children;
  const animationContainer = actionAndAnimationRow[0];
  const animation = animationContainer.querySelector('a');
  const dropzone = actionAndAnimationRow[1];
  const cta = dropzone.querySelector('a.button, a.con-button');
  cta.addEventListener('click', (e) => e.preventDefault(), false);
  // Fetch the base url for editor entry from upload cta and save it for later use.
  frictionlessTargetBaseUrl = cta.href;
  const dropzoneHint = dropzone.querySelector('p:first-child');
  const gtcText = dropzone.querySelector('p:last-child');
  const actionColumn = createTag('div');
  const dropzoneContainer = createTag('div', { class: 'dropzone-container' });

  if (animation && animation.href.includes('.mp4')) {
    animationContainer.append(transformLinkToAnimation(animation));
  }

  const captionVideoDropzoneActionColumn = createTag('div', { class: 'caption-video-dropzone-action-column' });
  // Add locale dropdown for caption-video
  if (quickAction === 'caption-video') {
    const localeDropdownWrapper = createCaptionLocaleDropdown();
    const step1 = createStep('1', localeDropdownWrapper);
    actionColumn.append(step1);

    const dropzoneHintClone = dropzoneHint.cloneNode(true);
    dropzoneHintClone.classList.add('caption-video-dropzone-hint');
    captionVideoDropzoneActionColumn.append(dropzoneHintClone);
    dropzoneHint.classList.add('hidden');
  }

  if (cta) cta.classList.add('xlarge');
  dropzone.classList.add('dropzone');

  dropzone.before(actionColumn);
  dropzoneContainer.append(dropzone);

  if (quickAction === 'caption-video') {
    captionVideoDropzoneActionColumn.append(dropzoneContainer, gtcText);
    const step2 = createStep('2', captionVideoDropzoneActionColumn);
    actionColumn.append(step2);
  } else {
    actionColumn.append(dropzoneContainer, gtcText);
  }

  const inputElement = createTag('input', {
    type: 'file',
    accept: QA_CONFIGS[quickAction].accept,
    ...(quickAction === 'merge-videos' && { multiple: true }),
  });
  inputElement.onchange = () => {
    if (quickAction === 'merge-videos' && inputElement.files.length > 1) {
      startSDKWithUnconvertedFiles(inputElement.files, quickAction, block);
    } else {
      const file = inputElement.files[0];
      startSDKWithUnconvertedFiles([file], quickAction, block);
    }
  };
  block.append(inputElement);

  dropzoneContainer.addEventListener('click', (e) => {
    e.preventDefault();
    if (quickAction === 'generate-qr-code') {
      startSDK([''], quickAction, block);
    } else {
      inputElement.click();
    }
    document.body.dataset.suppressfloatingcta = 'true';
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropzoneContainer.classList.add('highlight');
  }

  function unhighlight() {
    dropzoneContainer.classList.remove('highlight');
  }

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, highlight, false);
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, preventDefaults, false);
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzoneContainer.addEventListener(eventName, unhighlight, false);
  });

  dropzoneContainer.addEventListener('drop', async (e) => {
    const dt = e.dataTransfer;
    const { files } = dt;
    if (quickAction === 'merge-videos' && files.length > 1) {
      startSDKWithUnconvertedFiles(files, quickAction, block);
    } else {
      await Promise.all(
        [...files].map((file) => startSDKWithUnconvertedFiles([file], quickAction, block)),
      );
    }

    document.body.dataset.suppressfloatingcta = 'true';
  }, false);

  const freePlanTags = await buildFreePlanWidget({
    typeKey: 'branded',
    checkmarks: true,
  });
  dropzone.append(freePlanTags);

  window.addEventListener('popstate', (e) => {
    const editorModal = selectElementByTagPrefix('cc-everywhere-container-');
    const correctState = e.state?.hideFrictionlessQa;
    const embedElsFound = quickActionContainer || editorModal;
    window.history.pushState({ hideFrictionlessQa: true }, '', '');
    if (correctState || embedElsFound) {
      quickActionContainer?.remove();
      editorModal?.remove();
      document.body.classList.remove('editor-modal-loaded');
      inputElement.value = '';
      fadeIn(uploadContainer);
      document.body.dataset.suppressfloatingcta = 'false';
    }
  }, { passive: true });

  if (EXPERIMENTAL_VARIANTS.includes(quickAction)) {
    block.dataset.frictionlesstype = 'remove-background';
  } else {
    block.dataset.frictionlesstype = quickAction;
  }

  block.dataset.frictionlessgroup = QA_CONFIGS[quickAction].group ?? 'image';

  if (
    ['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())
  ) {
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');
    block.prepend(logo);
  }

  sendFrictionlessEventToAdobeAnaltics(block);
}
