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

let createTag;
let getConfig;
let getMetadata;
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

// Local SDK configuration for development
const LOCAL_SDK_URL = 'http://localhost:8443/sdk/v4/CCEverywhere.js';
const LOCAL_HORIZON_URL = 'https://localhost.adobe.com:8080';

/**
 * Load and initialize local SDK for development mode
 * Used for testing local quick actions like create-calendar
 */
async function loadLocalSDK() {
  if (ccEverywhere) return ccEverywhere;

  console.log('📦 Loading LOCAL SDK from', LOCAL_SDK_URL);
  
  // Set LOCAL Horizon server override for quick actions
  const urlParams = new URLSearchParams(window.location.search);
  const baseQA = urlParams.get('baseQA') || LOCAL_HORIZON_URL;
  
  window.CCEverywhereDebug = window.CCEverywhereDebug || {};
  window.CCEverywhereDebug.baseQA = baseQA;
  window.CCEverywhereDebug.base = baseQA;
  console.log('🔧 Set CCEverywhereDebug.baseQA to:', window.CCEverywhereDebug.baseQA);

  try {
    await import(LOCAL_SDK_URL);
    console.log('✅ LOCAL SDK loaded successfully!');
  } catch (e) {
    console.error('❌ Failed to load local SDK:', e);
    throw e;
  }

  if (!window.CCEverywhere) {
    console.error('❌ CCEverywhere not available after SDK load');
    return undefined;
  }

  // Initialize the SDK for local development
  // Get your API key from: https://developer.adobe.com/console
  // Add 'localhost' as an allowed domain in the console
  
  // You can pass your API key via URL param: ?clientId=YOUR_API_KEY
  // Or replace the default value below with your API key from Adobe Developer Console
  const apiKey = urlParams.get('clientId') || '19a8ddc908f14955a130d4654649daff';
  console.log("HEY THE API KEY IS :", apiKey);
  
  const hostInfo = {
    clientId: apiKey,
    appName: 'Local Dev Test',
  };

  // Use 'stage' environment for authentication to work
  const configParams = {
    env: 'stage',
    skipBrowserSupportCheck: true,
  };

  ccEverywhere = await window.CCEverywhere.initialize(hostInfo, configParams);
  console.log('✅ SDK initialized - quickAction methods:', Object.keys(ccEverywhere.quickAction));
  
  return ccEverywhere;
}

/**
 * Launch the Create Calendar quick action
 * This is triggered when the Google Drive button is clicked
 */
let assetMessageHandler = null;

async function launchCreateCalendar(block, quickAction) {
  console.log('🚀 Launching Create Calendar from Google Drive button...');
  
  // Create container and show spinner immediately
  const id = 'create-calendar-container';
  quickActionContainer = createTag('div', { id, class: 'quick-action-container' });
  
  const spinner = createTag('div', { class: 'addon-loading-spinner' });
  spinner.innerHTML = '<div class="spinner"></div><div class="spinner-text">Loading Google Drive...</div>';
  quickActionContainer.append(spinner);
  
  block.append(quickActionContainer);
  
  const divs = block.querySelectorAll(':scope > div');
  if (divs[1]) [, uploadContainer] = divs;
  fadeOut(uploadContainer);

  try {
    const sdk = await loadLocalSDK();
    if (!sdk) {
      console.error('❌ SDK not available');
      spinner.remove();
      closeCreateCalendar();
      return;
    }

    // Watch for the SDK to inject content, then remove spinner
    const observer = new MutationObserver(() => {
      // Check if SDK added any element besides our spinner
      const sdkContent = [...quickActionContainer.children].find(
        (child) => !child.classList.contains('addon-loading-spinner'),
      );
      if (sdkContent) {
        observer.disconnect();
        // Small delay to let SDK content render before removing spinner
        setTimeout(() => spinner.remove(), 1500);
      }
    });
    observer.observe(quickActionContainer, { childList: true, subtree: true });

    // Listen for messages from the add-on (when user selects an asset)
    assetMessageHandler = async (event) => {
      console.log('📩 Message received:', event.data?.type, event.origin);
      
      if (event.data?.type === 'frictionless-asset-selected') {
        const { blob, fileName, mimeType } = event.data.payload;
        console.log('📁 Blob received:', fileName, mimeType);

        // Immediately hide the upload area with inline style so fadeIn() can't flash it
        if (uploadContainer) uploadContainer.style.display = 'none';

        // Create a full-block overlay spinner that covers everything
        const overlay = createTag('div', { class: 'addon-processing-overlay' });
        overlay.innerHTML = '<div class="addon-loading-spinner"><div class="spinner"></div><div class="spinner-text">Processing your image...</div></div>';
        block.append(overlay);

        // Wait for the overlay to be painted before making any other DOM changes
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // Clean up the add-on container and message listener
        if (assetMessageHandler) {
          window.removeEventListener('message', assetMessageHandler);
          assetMessageHandler = null;
        }
        quickActionContainer?.remove();
        quickActionContainer = null;
        
        // Convert blob to File object
        console.log('🔄 Processing the blob...');
        const file = new File([blob], fileName, { type: mimeType });
        console.log('📄 File created:', file.name, file.type, file.size);
        
        // Process through quick action workflow
        // The overlay stays visible — the SDK's onIntentChange will call fadeIn(uploadContainer)
        // but our inline display:none prevents the upload UI from flashing.
        // The SDK modal (zIndex: 999) will appear on top of everything.
        console.log('🚀 Sending to', quickAction, 'workflow...');
        await startSDKWithUnconvertedFiles([file], quickAction, block);
        console.log('✅ Blob processed through workflow');

        // Watch for the editor modal to fully appear, then clean up
        const cleanupOverlay = () => {
          if (uploadContainer) uploadContainer.style.display = '';
          overlay.remove();
        };

        // Detect when the SDK modal has loaded (body gets 'editor-modal-loaded' class)
        if (document.body.classList.contains('editor-modal-loaded')) {
          cleanupOverlay();
        } else {
          const modalObserver = new MutationObserver(() => {
            if (document.body.classList.contains('editor-modal-loaded')) {
              modalObserver.disconnect();
              cleanupOverlay();
            }
          });
          modalObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
          // Fallback: remove overlay after 10s regardless
          setTimeout(() => {
            modalObserver.disconnect();
            cleanupOverlay();
          }, 1000);
        }
      }
    };
    
    window.addEventListener('message', assetMessageHandler);
    console.log('👂 Message listener added for frictionless-asset-selected');

    // Create Calendar doesn't require an input image
    const docConfig = {};

    const appConfig = {
      metaData: {
        isFrictionlessQa: 'true',
      },
      receiveQuickActionErrors: true,
      callbacks: {
        onIntentChange: () => {
          closeCreateCalendar();
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
          console.log('🚫 Create Calendar cancelled');
          closeCreateCalendar();
        },
        onPublish: async (intent, publishParams) => {
          console.log('📥 Create Calendar onPublish:', intent, publishParams);
        },
        onError: (error) => {
          console.error('❌ Create Calendar error:', error);
          closeCreateCalendar();
        },
      },
    };

    const exportConfig = [
      {
        id: 'download',
        label: 'Download',
        action: { target: 'download' },
        style: { uiType: 'button' },
      },
      {
        id: 'save-modified-asset',
        label: 'Save image',
        action: { target: 'publish' },
        style: { uiType: 'button' },
      },
    ];

    const contConfig = {
      mode: 'inline',
      parentElementId: id,
      backgroundColor: 'transparent',
      hideCloseButton: true,
      padding: 0,
    };

    sdk.quickAction.createCalendar(docConfig, appConfig, exportConfig, contConfig);
    console.log('✅ Create Calendar launched!');
  } catch (error) {
    console.error('❌ Failed to launch Create Calendar:', error);
  }
}

function closeCreateCalendar() {
  if (assetMessageHandler) {
    window.removeEventListener('message', assetMessageHandler);
    assetMessageHandler = null;
  }
  
  quickActionContainer?.remove();
  quickActionContainer = null;
  fadeIn(uploadContainer);
}

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

/* c8 ignore next 12 */
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

/* c8 ignore next 9 */
async function initializeUploadService() {
  if (uploadService) return validateTokenAndReturnService(uploadService);
  // eslint-disable-next-line import/no-relative-packages
  const { initUploadService, UPLOAD_EVENTS } = await import('../../scripts/upload-service/dist/upload-service.min.es.js');
  const { env } = getConfig();
  uploadService = await initUploadService({ environment: env.name });
  uploadEvents = UPLOAD_EVENTS;
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
  const isImageEditor = quickAction === FRICTIONLESS_UPLOAD_QUICK_ACTIONS.imageEditor;

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

  // here update the variant to the url variant if it exists
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  const variant = urlVariant || quickAction;

  const frictionlessAllowedQuickActions = Object.values(FRICTIONLESS_UPLOAD_QUICK_ACTIONS);
  if (frictionlessAllowedQuickActions.includes(variant)) {
    await performUploadAction(files, block, variant);
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

export function createStep(number, content) {
  const step = createTag('div', { class: 'step', 'data-step': number });
  const stepNumber = createTag('div', { class: 'step-number' }, number);
  step.append(stepNumber, content);
  return step;
}

function createUploadDropdown(onDeviceUpload, onGoogleDriveClick) {
  const dropdownOptions = [
    { id: 'device', label: 'From your device', icon: 'device', action: onDeviceUpload },
    { id: 'google-drive', label: 'Google Drive', icon: 'google-drive', action: onGoogleDriveClick },
    { id: 'onedrive', label: 'OneDrive', icon: 'onedrive', action: null },
    { id: 'google-photo', label: 'Google Photo', icon: 'google-photo', action: null },
    { id: 'dropbox', label: 'Dropbox', icon: 'dropbox', action: null },
  ];

  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.className = 'upload-dropdown-wrapper';

  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'upload-dropdown-menu';

  const dropdownHeader = document.createElement('div');
  dropdownHeader.className = 'upload-dropdown-header';
  dropdownHeader.textContent = 'Upload file';
  dropdownMenu.appendChild(dropdownHeader);

  dropdownOptions.forEach((option) => {
    const optionItem = document.createElement('div');
    optionItem.className = 'upload-dropdown-item';
    optionItem.dataset.source = option.id;

    const iconSpan = document.createElement('span');
    iconSpan.className = `upload-icon upload-icon-${option.icon}`;
    optionItem.appendChild(iconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'upload-dropdown-label';
    labelSpan.textContent = option.label;
    optionItem.appendChild(labelSpan);

    optionItem.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Selected upload source: ${option.id}`);
      console.log(`Label: ${option.label}`);
      dropdownMenu.classList.remove('show');
      
      // Execute the action if defined
      if (option.action) {
        option.action();
      }
    });

    dropdownMenu.appendChild(optionItem);
  });

  dropdownWrapper.appendChild(dropdownMenu);

  // Close dropdown when clicking outside (but don't trigger file upload)
  document.addEventListener('click', (e) => {
    if (!dropdownWrapper.contains(e.target)) {
      dropdownMenu.classList.remove('show');
    }
  });

  return { dropdownWrapper, dropdownMenu };
}

export default async function decorate(block) {
  console.log("edward");

  const [utils, placeholders] = await Promise.all([import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
    decorateButtonsDeprecated(block)]);

  ({ createTag, getMetadata, getConfig } = utils);
  ({ replaceKey } = placeholders);

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
  
  // Store reference for dropdown setup later (after inputElement is created)
  let setupDropdownForCta = null;
  let uploadDropdownMenu = null; // Track dropdown menu for visibility check
  
  if (cta) {
    // Update button text
    cta.innerText = 'Upload your file';
    
    // Prevent default CTA behavior, dropdown will be set up after inputElement exists
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
    
    // Store setup function to be called after inputElement is created
    setupDropdownForCta = (inputElement, blockRef, qaId) => {
      const { dropdownWrapper, dropdownMenu } = createUploadDropdown(
        () => {
          // "From your device" will trigger the file input
          inputElement.click();
        },
        () => {
          // "Google Drive" will launch the create-calendar add-on
          launchCreateCalendar(blockRef, qaId);
        },
      );
      
      // Store reference for visibility check
      uploadDropdownMenu = dropdownMenu;
      
      // Make CTA container relative for dropdown positioning
      const ctaParent = cta.parentElement;
      if (ctaParent) {
        ctaParent.style.position = 'relative';
        ctaParent.appendChild(dropdownWrapper);
      }
      
      // Update CTA click to toggle dropdown
      cta.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      }, false);
    };
  }
  // Fetch the base url for editor entry from upload cta and save it for later use.
  frictionlessTargetBaseUrl = cta.href;
  const urlParams = new URLSearchParams(window.location.search);
  const urlVariant = urlParams.get('variant');
  const variant = urlVariant || quickAction;
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

  const inputElement = createTag('input', {
    type: 'file',
    accept: QA_CONFIGS[quickAction].accept,
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

  // Setup dropdown for CTA now that inputElement exists
  if (setupDropdownForCta) {
    setupDropdownForCta(inputElement, block, quickAction);
  }

  dropzoneContainer.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Close dropdown if open when clicking anywhere in dropzone
    if (uploadDropdownMenu && uploadDropdownMenu.classList.contains('show')) {
      uploadDropdownMenu.classList.remove('show');
    }
    
    // Only handle QR code quick action directly from dropzone click
    // File upload is now handled exclusively through dropdown "From your device" option
    if (quickAction === 'generate-qr-code') {
      document.body.dataset.suppressfloatingcta = 'true';
      startSDK([''], quickAction, block);
    }
    // Don't open file picker from dropzone click - use dropdown instead
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
