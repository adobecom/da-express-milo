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
  EXPRESS_ROUTE_PATHS,
  EXPERIMENTAL_VARIANTS_PROMOID_MAP,
  AUTH_EXPERIMENTAL_VARIANTS_PROMOID_MAP,
} from '../../scripts/utils/frictionless-utils.js';
import {
  cleanupEasyUpload,
  isEasyUploadControlExperimentEnabled,
  isEasyUploadExperimentEnabled,
  runEasyUploadExperiment,
  setupEasyUploadUI,
} from './easy-upload/easy-upload.js';

let createTag;
let getConfig;
let getMetadata;
let loadStyle;
let selectedVideoLanguage = 'en-us'; // Default to English (US)
let replaceKey;

let ccEverywhere;
let quickActionContainer;
let uploadContainer;
let uploadService;
let fqaContainer;
let uploadEvents;
let frictionlessTargetBaseUrl;
let progressBar;
let uploadInProgress = null; // Tracks active upload: { file, startTime, quickAction }

function frictionlessQAExperiment(
  quickAction,
  docConfig,
  appConfig,
  exportConfig,
  contConfig,
) {
  const isAuth = window.adobeIMS?.isSignedInUser();
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  const variant = urlVariant || quickAction;
  const promoid = (isAuth && AUTH_EXPERIMENTAL_VARIANTS_PROMOID_MAP[variant])
    ? AUTH_EXPERIMENTAL_VARIANTS_PROMOID_MAP[variant]
    : EXPERIMENTAL_VARIANTS_PROMOID_MAP[variant];
  appConfig.metaData.variant = variant;
  appConfig.metaData.promoid = promoid;
  appConfig.metaData.mv = 'other';
  appConfig.metaData.entryPoint = 'seo-quickaction-image-upload';
  switch (variant) {
    case 'qa-nba':
      ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig);
      break;
    case 'qa-in-product-control':
      ccEverywhere.quickAction.removeBackground(docConfig, appConfig, exportConfig, contConfig);
      break;
    default:
      break;
  }
}

let timeoutId = null;
function showErrorToast(block, msg) {
  let toast = block.querySelector('.error-toast');
  const hideToast = () => {
    toast.classList.add('hide');
    toast.html = '';
  };
  if (!toast) {
    toast = createTag('div', { class: 'error-toast hide' });
    block.append(toast);
  }
  toast.prepend(getIconElementDeprecated('error'));
  const close = createTag(
    'button',
    {},
    getIconElementDeprecated('close-white'),
  );
  close.addEventListener('click', hideToast);
  toast.append(close);
  toast.textContent = msg;
  toast.classList.remove('hide');
  clearTimeout(timeoutId);
  timeoutId = setTimeout(hideToast, 6000);
}

// eslint-disable-next-line default-param-last
export function runQuickAction(quickActionId, data, block, fromQrCode = false) {
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

  const isEasyUploadVariant = isEasyUploadExperimentEnabled(quickActionId);
  const isEasyUploadControl = isEasyUploadControlExperimentEnabled(quickActionId);
  const isEasyUploadQuickAction = isEasyUploadVariant || isEasyUploadControl;
  
  console.log('[FrictionlessQA] Quick action routing check:', {
    quickActionId,
    quickActionIdType: typeof quickActionId,
    quickActionIdLength: quickActionId?.length,
    isEasyUploadVariant,
    isEasyUploadControl,
    isEasyUploadQuickAction,
  });
  
  if (isEasyUploadQuickAction) {
    runEasyUploadExperiment(
      quickActionId,
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
      fromQrCode,
      ccEverywhere,
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
async function startSDK(data = [''], quickAction, block, fromQrCode = false) {
  if (!ccEverywhere) {
    ccEverywhere = await loadAndInitializeCCEverywhere(getConfig);
  }
  runQuickAction(quickAction, data, block, fromQrCode);
}

function resetUploadUI() {
  progressBar.remove();
  fadeIn(fqaContainer);
}

/* c8 ignore next 15 */
function createUploadStatusListener(uploadStatusEvent) {
  const listener = (e) => {
    const isUploadProgressLessThanVisual = e.detail.progress < progressBar.getProgress();
    const progress = isUploadProgressLessThanVisual ? progressBar.getProgress() : e.detail.progress;

    /**
     * The reason for doing this is because assetId takes a while to resolve
     * and progress completes to 100 before assetId is resolved. This can cause
     * a confusion in experience where user might think the upload is stuck.
     */
    if (progress > 95) {
      progressBar.setProgress(95);
    } else {
      progressBar.setProgress(progress);
    }

    if (['completed', 'failed'].includes(e.detail.status)) {
      if (e.detail.status === 'failed') {
        setTimeout(() => {
          resetUploadUI();
        }, 200);
      }
      window.removeEventListener(uploadStatusEvent, listener);
    }
  };
  window.addEventListener(uploadStatusEvent, listener);
}

/* c8 ignore next 30 */
async function validateTokenAndReturnService(existingService) {
  console.log('[FQA] validateTokenAndReturnService called');

  // Verify service has expected methods before returning
  const hasCreateAsset = typeof existingService?.createAsset === 'function';
  console.log('[FQA] Existing service validation:', {
    hasService: !!existingService,
    constructorName: existingService?.constructor?.name,
    hasCreateAsset,
    createAssetType: typeof existingService?.createAsset,
  });

  if (!hasCreateAsset) {
    console.error('[FQA] CRITICAL: Existing service missing createAsset method!');
  }

  const freshToken = window?.adobeIMS?.getAccessToken()?.token;
  const existingToken = existingService.getConfig().authConfig?.token;
  console.log('[FQA] Token comparison:', {
    hasFreshToken: !!freshToken,
    freshTokenLength: freshToken?.length,
    hasExistingToken: !!existingToken,
    existingTokenLength: existingToken?.length,
    tokensMatch: freshToken === existingToken,
  });
  if (freshToken && freshToken !== existingToken) {
    console.log('[FQA] Updating service config with fresh token');
    existingService.updateConfig({
      authConfig: {
        ...uploadService.getConfig().authConfig,
        token: freshToken,
      },
    });
  }
  return existingService;
}

/* c8 ignore next 30 */
async function initializeUploadService() {
  console.log('[FQA] initializeUploadService called');
  console.log('[FQA] Existing upload service:', !!uploadService);

  if (uploadService) {
    console.log('[FQA] Reusing existing upload service');
    return validateTokenAndReturnService(uploadService);
  }

  console.log('[FQA] Creating new upload service...');
  // eslint-disable-next-line import/no-relative-packages
  const uploadModule = await import('../../scripts/upload-service/dist/upload-service.min.es.js');
  console.log('[FQA] Upload module loaded:', {
    moduleKeys: Object.keys(uploadModule),
    hasInitUploadService: typeof uploadModule.initUploadService === 'function',
    hasUploadEvents: !!uploadModule.UPLOAD_EVENTS,
  });
  const { initUploadService, UPLOAD_EVENTS } = uploadModule;
  const { env } = getConfig();
  console.log('[FQA] Environment:', env.name);

  uploadService = await initUploadService({ environment: env.name });
  uploadEvents = UPLOAD_EVENTS;

  // Get prototype methods (class methods are defined on prototype, not own properties)
  const proto = uploadService ? Object.getPrototypeOf(uploadService) : null;
  const protoMethods = proto ? Object.getOwnPropertyNames(proto).filter(
    (name) => typeof uploadService[name] === 'function' && name !== 'constructor',
  ) : [];

  console.log('[FQA] Upload service created:', {
    hasService: !!uploadService,
    constructorName: uploadService?.constructor?.name,
    ownMethods: uploadService ? Object.keys(uploadService).filter((k) => typeof uploadService[k] === 'function') : [],
    prototypeMethods: protoMethods,
    hasCreateAsset: typeof uploadService?.createAsset === 'function',
    hasInitializeBlockUpload: typeof uploadService?.initializeBlockUpload === 'function',
  });

  // Debug: Log the service config
  try {
    const config = uploadService.getConfig();
    console.log('[FQA] Service config:', {
      environment: config?.environment,
      hasAuthConfig: !!config?.authConfig,
      hasToken: !!config?.authConfig?.token,
      tokenLength: config?.authConfig?.token?.length,
    });
  } catch (e) {
    console.log('[FQA] Could not read service config:', e.message);
  }

  // Verify critical methods exist
  if (typeof uploadService?.createAsset !== 'function') {
    console.error('[FQA] CRITICAL: createAsset method is missing!', {
      createAssetType: typeof uploadService?.createAsset,
      protoMethods,
    });
  }

  return uploadService;
}

/* c8 ignore next 7 */
async function setupUploadUI(block) {
  const progressBarElement = await initProgressBar(replaceKey, getConfig);
  fqaContainer = block.querySelector('.fqa-container');
  fadeOut(fqaContainer);
  block.insertBefore(progressBarElement, fqaContainer);
  return progressBarElement;
}

/* c8 ignore next 13 */
async function uploadAssetToStorage(file, quickAction, uploadStartTime) {
  const service = await initializeUploadService();
  createUploadStatusListener(uploadEvents.UPLOAD_STATUS);

  const { asset } = await service.uploadAsset({
    file,
    fileName: file.name,
    contentType: file.type,
  });

  progressBar.setProgress(100);

  // Clear upload state on success
  uploadInProgress = null;

  // Log video upload success for analytics
  if (file.type.startsWith('video/')) {
    const uploadDuration = Date.now() - uploadStartTime;
    window.lana?.log(
      'Video upload successful '
        + `id:${asset.assetId} `
        + `size:${file.size} `
        + `type:${file.type} `
        + `quickAction:${quickAction} `
        + `uploadDuration:${uploadDuration}`,
      {
        clientId: 'express',
        tags: 'frictionless-video-upload-success',
      },
    );
  }

  return asset.assetId;
}

/* c8 ignore next 14 */
async function performStorageUpload(files, block, quickAction) {
  const file = files[0];
  const uploadStartTime = Date.now();
  uploadInProgress = { file, startTime: uploadStartTime, quickAction };
  try {
    progressBar = await setupUploadUI(block);
    return await uploadAssetToStorage(file, quickAction, uploadStartTime);
  } catch (error) {
    if (error.code === 'UPLOAD_FAILED') {
      const message = await replaceKey('upload-media-error', getConfig());
      showErrorToast(block, message);
    } else {
      showErrorToast(block, error.message);
    }

    // Log video upload failure for analytics
    if (file && file.type.startsWith('video/')) {
      const uploadDuration = Date.now() - uploadStartTime;
      window.lana?.log(
        'Video upload failed '
          + `size:${file.size} `
          + `type:${file.type} `
          + `quickAction:${quickAction} `
          + `uploadDuration:${uploadDuration} `
          + `errorCode:${error.code} `
          + `errorMessage:${error.message}`,
        {
          clientId: 'express',
          tags: 'frictionless-video-upload-failed',
        },
      );
    }

    // Clear upload state on failure
    uploadInProgress = null;

    return null;
  }
}

async function startAssetDecoding(file, controller) {
  const { getAssetDimensions, decodeWithTimeout } = await import('../../scripts/utils/assetDecoder.js');

  return decodeWithTimeout(getAssetDimensions(file, {
    signal: controller.signal,
  }).catch((error) => {
    window.lana?.log(
      `Asset decode failed error:${error.message || error}`,
      { clientId: 'express', tags: 'frictionless-asset-decode-failed' },
    );
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

/**
 * Builds search parameters for editor URL based on route path and editor type
 * @param {string} pathname - The URL pathname to determine parameter set
 * @param {string} assetId - The frictionless upload asset ID
 * @param {boolean} quickAction - The quick action ID.
 * @param {Object} dimensions - Asset dimensions with width and height properties
 * @returns {Object} Search parameters object
 */
/* c8 ignore next */
function buildSearchParamsForEditorUrl(pathname, assetId, quickAction, dimensions) {
  const baseSearchParams = {
    frictionlessUploadAssetId: assetId,
  };

  let routeSpecificParams = {};
  let pageSpecificParams = {};

  switch (pathname) {
    case EXPRESS_ROUTE_PATHS.focusedEditor: {
      const { locale: { ietf } } = getConfig();
      routeSpecificParams = {
        locale: ietf,
        skipUploadStep: true,
      };
      break;
    }
    case EXPRESS_ROUTE_PATHS.loggedOutEditor:
    default: {
      const isVideoEditor = quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.videoEditor;
      routeSpecificParams = {
        category: 'media',
        tab: isVideoEditor ? 'videos' : 'photos',
        width: dimensions?.width,
        height: dimensions?.height,
        ...(isVideoEditor && {
          sceneline: true,
          isVideoMaker: true,
        }),
      };
      break;
    }
  }

  if (EXPERIMENTAL_VARIANTS.includes(quickAction)) {
    const isAuth = window.adobeIMS?.isSignedInUser();
    const promoid = (isAuth && AUTH_EXPERIMENTAL_VARIANTS_PROMOID_MAP[quickAction])
      ? AUTH_EXPERIMENTAL_VARIANTS_PROMOID_MAP[quickAction]
      : EXPERIMENTAL_VARIANTS_PROMOID_MAP[quickAction];
    pageSpecificParams = {
      variant: quickAction,
      promoid,
      mv: 'other',
    };
  }

  /**
   * This block has been added to support the url path via query param.
   * This is because on express side we validate the url path for SEO
   * pages that need to be validated for the download flow in express to work.
   * This works fine in prod, but fails for draft pages. This block helps
   * in testing the download flow in express to work for draft pages, i.e.,
   * pages not whitelisted for download flow on express side.
   */
  const urlParams = new URLSearchParams(window.location.search);
  const urlPathViaQueryParam = urlParams.has('hzUrlPath');
  if (urlPathViaQueryParam) {
    routeSpecificParams.url = urlParams.get('hzUrlPath');
  }

  return {
    ...baseSearchParams,
    ...routeSpecificParams,
    ...pageSpecificParams,
  };
}

/**
 * Applies search parameters to URL, filtering out null, undefined, and empty values
 * @param {URL} url - The URL object to modify
 * @param {Object} searchParams - Object containing search parameters to apply
 */
export function applySearchParamsToUrl(url, searchParams) {
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
}

async function buildEditorUrl(quickAction, assetId, dimensions) {
  const { getTrackingAppendedURL } = await import('../../scripts/branchlinks.js');
  let url = new URL(await getTrackingAppendedURL(frictionlessTargetBaseUrl));
  const isImageEditor = quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.imageEditor
    || quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.editImageVariant
    || quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.editImageControl;

  if (isImageEditor && url.pathname === EXPRESS_ROUTE_PATHS.focusedEditor) {
    url = new URL(frictionlessTargetBaseUrl);
  }

  const searchParams = buildSearchParamsForEditorUrl(
    url.pathname,
    assetId,
    quickAction,
    dimensions,
  );

  applySearchParamsToUrl(url, searchParams);

  return url;
}

/* c8 ignore next 38 */
async function performUploadAction(files, block, quickAction) {
  const initialDecodeController = new AbortController();

  const initialDecodePromise = startAssetDecoding(files[0], initialDecodeController);
  const uploadPromise = performStorageUpload(files, block, quickAction);

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

  /**
 * In some backward cache scenarios,
 * (when the user navigates back to the upload page from the editor),
 * due to backward cache, the upload UI is not reset. This creates an issue,
 * where the user does not see the upload UI and instead sees the upload progress bar.
 * So we reset the upload UI just before navigating to the editor.
 */
  resetUploadUI();

  window.location.href = url.toString();
}

async function startSDKWithUnconvertedFiles(files, quickAction, block, fromQrCode = false) {
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

  // here update the variant to the url variant if it exists
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  const variant = urlVariant || quickAction;

  const frictionlessAllowedQuickActions = Object.values(FRICTIONLESS_UPLOAD_QUICK_ACTIONS);
  if (frictionlessAllowedQuickActions.includes(variant)) {
    await performUploadAction(files, block, variant);
    return;
  }

  startSDK(data, quickAction, block, fromQrCode);
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

export function createStep(number, content) {
  const step = createTag('div', { class: 'step', 'data-step': number });
  const stepNumber = createTag('div', { class: 'step-number' }, number);
  step.append(stepNumber, content);
  return step;
}

export default async function decorate(block) {
  const [utils, placeholders] = await Promise.all([import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
    decorateButtonsDeprecated(block)]);

  ({ createTag, getMetadata, getConfig, loadStyle } = utils);
  ({ replaceKey } = placeholders);

  const rows = Array.from(block.children);
  rows[1].classList.add('fqa-container');
  const quickActionRow = rows.filter(
    (r) => r.children
      && r.children[0].textContent.toLowerCase().trim() === 'quick-action',
  );

  let quickAction = quickActionRow?.[0].children[1]?.textContent;
  console.log('[FrictionlessQA] Initial quickAction from block:', {
    quickAction,
    trimmed: quickAction?.trim(),
  });
  
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
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  console.log('[FrictionlessQA] URL variant param:', urlVariant);
  
  const variant = urlVariant || quickAction;
  quickAction = urlVariant || quickAction;
  console.log('[FrictionlessQA] Final quickAction after URL override:', quickAction);
  if (variant === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.removeBackgroundVariant1
    || variant === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.removeBackgroundVariant2) {
    const isStage = urlParams.get('hzenv') === 'stage';
    const stageURL = urlParams.get('base') ? urlParams.get('base') : 'https://stage.projectx.corp.adobe.com/new';
    frictionlessTargetBaseUrl = isStage
      ? stageURL
      : 'https://express.adobe.com/new';
  }

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

  // Map easy upload variants to their base quick action for QA_CONFIGS lookup
  // This handles cases where QA_CONFIGS may be cached without easy upload entries
  const easyUploadToBaseMap = {
    'remove-background-easy-upload-variant': 'remove-background',
    'resize-image-easy-upload-variant': 'resize-image',
    'crop-image-easy-upload-variant': 'crop-image',
    'convert-to-jpeg-easy-upload-variant': 'convert-to-jpg',
    'convert-to-png-easy-upload-variant': 'convert-to-png',
    'convert-to-svg-easy-upload-variant': 'convert-to-svg',
    'edit-image-easy-upload-variant': 'edit-image',
    'remove-background-easy-upload-control': 'remove-background',
    'resize-image-easy-upload-control': 'resize-image',
    'crop-image-easy-upload-control': 'crop-image',
    'convert-to-jpeg-easy-upload-control': 'convert-to-jpg',
    'convert-to-png-easy-upload-control': 'convert-to-png',
    'convert-to-svg-easy-upload-control': 'convert-to-svg',
    'edit-image-easy-upload-control': 'edit-image',
  };
  
  const configKey = easyUploadToBaseMap[quickAction] || quickAction;
  const qaConfig = QA_CONFIGS[configKey];
  
  console.log('[FrictionlessQA] QA_CONFIGS lookup:', {
    quickAction,
    configKey,
    hasConfig: !!qaConfig,
    usedFallback: configKey !== quickAction,
  });
  
  if (!qaConfig) {
    throw new Error(`Unknown quick action type: ${quickAction}`);
  }

  const inputElement = createTag('input', {
    type: 'file',
    accept: qaConfig.accept,
    ...(quickAction === 'merge-videos' && { multiple: true }),
  });
  inputElement.onchange = () => {
    const { files } = inputElement;
    if (!files?.length) {
      document.body.dataset.suppressfloatingcta = 'false';
      return;
    }

    document.body.dataset.suppressfloatingcta = 'true';

    if (quickAction === 'merge-videos' && files.length > 1) {
      startSDKWithUnconvertedFiles(files, quickAction, block);
    } else {
      const [file] = files;
      startSDKWithUnconvertedFiles([file], quickAction, block);
    }
  };
  block.append(inputElement);

  dropzoneContainer.addEventListener('click', (e) => {
    e.preventDefault();
    if (quickAction === 'generate-qr-code') {
      document.body.dataset.suppressfloatingcta = 'true';
      startSDK([''], quickAction, block);
    } else {
      inputElement.click();
    }
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
    if (!files?.length) {
      document.body.dataset.suppressfloatingcta = 'false';
      return;
    }

    document.body.dataset.suppressfloatingcta = 'true';

    if (quickAction === 'merge-videos' && files.length > 1) {
      startSDKWithUnconvertedFiles(files, quickAction, block);
    } else {
      await Promise.all(
        [...files].map((file) => startSDKWithUnconvertedFiles([file], quickAction, block)),
      );
    }
  }, false);

  const freePlanTags = await buildFreePlanWidget({
    typeKey: 'branded',
    checkmarks: true,
  });
  dropzone.append(freePlanTags);

  // Initialize Easy Upload UI (QR autoload disabled for now).
  if (isEasyUploadExperimentEnabled(quickAction)) {
    await setupEasyUploadUI({
      quickAction,
      block,
      getConfig,
      loadStyle,
      initializeUploadService,
      startSDKWithUnconvertedFiles,
      createTag,
      showErrorToast,
    });
  }

  window.addEventListener('popstate', (e) => {
    // Log video upload cancellation if user presses back during active upload
    if (uploadInProgress && uploadInProgress.file.type.startsWith('video/')) {
      const uploadDuration = Date.now() - uploadInProgress.startTime;
      window.lana?.log(
        'Video upload cancelled '
          + `size:${uploadInProgress.file.size} `
          + `type:${uploadInProgress.file.type} `
          + `quickAction:${uploadInProgress.quickAction} `
          + `uploadDuration:${uploadDuration}`,
        {
          clientId: 'express',
          tags: 'frictionless-video-upload-cancelled',
        },
      );
      uploadInProgress = null;
    }

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

      // Cleanup easy upload resources
      cleanupEasyUpload();
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
