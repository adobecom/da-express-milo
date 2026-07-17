/* eslint-disable no-underscore-dangle -- _links is Adobe HAL API property, not our naming */
/* eslint-disable class-methods-use-this -- this is a utility class */

export const EasyUploadVariants = {
  removeBackgroundEasyUploadVariant: 'remove-background-easy-upload-variant',
  resizeImageEasyUploadVariant: 'resize-image-easy-upload-variant',
  cropImageEasyUploadVariant: 'crop-image-easy-upload-variant',
  convertToJPEGEasyUploadVariant: 'convert-to-jpeg-easy-upload-variant',
  convertToPNGEasyUploadVariant: 'convert-to-png-easy-upload-variant',
  convertToSVGEasyUploadVariant: 'convert-to-svg-easy-upload-variant',
  editImageEasyUploadVariant: 'edit-image-easy-upload-variant',
};

const LINK_REL = {
  BLOCK_UPLOAD_INIT: 'http://ns.adobe.com/adobecloud/rel/block/init',
  BLOCK_TRANSFER: 'http://ns.adobe.com/adobecloud/rel/block/transfer',
  BLOCK_FINALIZE: 'http://ns.adobe.com/adobecloud/rel/block/finalize',
  SELF: 'self',
  RENDITION: 'http://ns.adobe.com/adobecloud/rel/rendition',
};

const shouldForceQrFailure = () => false;

export const EasyUploadControls = {
  removeBackgroundEasyUploadControl: 'remove-background-easy-upload-control',
  resizeImageEasyUploadControl: 'resize-image-easy-upload-control',
  cropImageEasyUploadControl: 'crop-image-easy-upload-control',
  convertToJPEGEasyUploadControl: 'convert-to-jpeg-easy-upload-control',
  convertToPNGEasyUploadControl: 'convert-to-png-easy-upload-control',
  convertToSVGEasyUploadControl: 'convert-to-svg-easy-upload-control',
  editImageEasyUploadControl: 'edit-image-easy-upload-control',
};

export const EasyUploadVariantsPromoidMap = {
  [EasyUploadVariants.removeBackgroundEasyUploadVariant]: 'P3KMQHCX&mv=other',
  [EasyUploadVariants.resizeImageEasyUploadVariant]: 'P3KMQHCX&mv=other',
  [EasyUploadVariants.cropImageEasyUploadVariant]: 'P3KMQHCX&mv=other',
  [EasyUploadControls.removeBackgroundEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadControls.resizeImageEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadControls.cropImageEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadControls.convertToJPEGEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadControls.convertToPNGEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadControls.convertToSVGEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadVariants.convertToJPEGEasyUploadVariant]: 'P3KMQHCX&mv=other',
  [EasyUploadVariants.convertToPNGEasyUploadVariant]: 'P3KMQHCX&mv=other',
  [EasyUploadVariants.convertToSVGEasyUploadVariant]: 'P3KMQHCX&mv=other',
  [EasyUploadControls.editImageEasyUploadControl]: 'NYTLQM3Y&mv=other',
  [EasyUploadVariants.editImageEasyUploadVariant]: 'P3KMQHCX&mv=other',
};

const QR_CODE_CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js';
const CONFIRM_TOOLTIP_AUTO_HIDE_DELAY = 4000;
// How long the failure message stays on screen before the QR code is
// regenerated, so the user can read what went wrong before it disappears.
const INVALID_UPLOAD_DISPLAY_MS = 5000;

const URL_SHORTENER_CONFIGS = {
  prod: {
    serviceUrl: 'https://go.adobe.io',
    apiKey: 'quickactions_hz_webapp',
  },
  stage: {
    serviceUrl: 'https://go-stage.adobe.io',
    apiKey: 'hz-dynamic-url-service',
  },
  local: {
    serviceUrl: 'https://go-stage.adobe.io',
    apiKey: 'hz-dynamic-url-service',
  },
};

const ACP_STORAGE_CONFIG = {
  MAX_FILE_SIZE: 60000000,
  TRANSFER_DOCUMENT: 'application/vnd.adobecloud.bulk-transfer+json',
  CONTENT_TYPE: 'application/octet-stream',
  SECOND_IN_MS: 1000,
  MAX_POLLING_ATTEMPTS: 100,
  POLLING_TIMEOUT_MS: 100000,
};

/**
 * Fallback: Create asset using createAssetForUser/createAssetForGuest
 * Replicates the logic of UploadService.createAsset()
 */
async function fallbackCreateAsset(uploadService, contentType) {
  const config = uploadService.getConfig();
  const path = `temp/${crypto.randomUUID()}/${crypto.randomUUID()}`;
  const uploadOptions = {
    contentType,
    path,
    createIntermediates: true,
    file: undefined,
    fileName: undefined,
  };

  let createAssetResult;
  if (config.authConfig?.tokenType === 'user') {
    createAssetResult = await uploadService.createAssetForUser(
      uploadOptions,
      undefined,
      undefined,
      path,
    );
  } else {
    createAssetResult = await uploadService.createAssetForGuest(
      uploadOptions,
      undefined,
      undefined,
      path,
    );
  }
  return createAssetResult?.result?.result;
}

/**
 * Fallback: Initialize block upload
 * Makes direct HTTP call to block upload init endpoint
 */
/**
 * Extract href from link(s) - handles both single object and array format (HAL)
 */
function extractLinkHref(links, relation) {
  const link = links?.[relation];
  if (!link) return null;
  const item = Array.isArray(link) ? link[0] : link;
  return item?.href?.replace(/\{.*$/, '') || null;
}

async function fallbackInitializeBlockUpload(asset, fileSize, blockSize, contentType) {
  const blockUploadUrl = extractLinkHref(asset?.links, LINK_REL.BLOCK_UPLOAD_INIT)
        || extractLinkHref(asset?._links, LINK_REL.BLOCK_UPLOAD_INIT);

  if (!blockUploadUrl) {
    throw new Error('Block upload URL not found in asset links');
  }

  const token = window?.adobeIMS?.getAccessToken()?.token;
  const blockUploadData = {
    'repo:size': fileSize,
    'repo:blocksize': blockSize,
    'repo:reltype': 'http://ns.adobe.com/adobecloud/rel/primary',
    'dc:format': contentType,
  };

  const response = await fetch(`${blockUploadUrl}?includes=all`, {
    method: 'POST',
    headers: {
      'Content-Type': ACP_STORAGE_CONFIG.TRANSFER_DOCUMENT,
      'x-api-key': 'AdobeExpressWeb',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(blockUploadData),
  });

  if (!response.ok) {
    throw new Error(`Block upload initialization failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fallback: Get asset version by polling
 */
async function fallbackGetAssetVersion(asset) {
  const selfUrl = asset?.links?.[LINK_REL.SELF]?.href
        || asset?._links?.[LINK_REL.SELF]?.href
        || asset?.['repo:path'];

  if (!selfUrl) {
    throw new Error('Self URL not found in asset');
  }

  const token = window?.adobeIMS?.getAccessToken()?.token;
  const versionsUrl = `${selfUrl}/versions`;

  const response = await fetch(versionsUrl, {
    method: 'GET',
    headers: {
      'x-api-key': 'AdobeExpressWeb',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Get versions failed: ${response.status}`);
  }

  const data = await response.json();
  const versions = data?.versions || [];
  if (versions.length === 0) {
    return '0';
  }
  return versions[versions.length - 1]?.version || '0';
}

/**
 * Fallback: Finalize upload
 */
async function fallbackFinalizeUpload(uploadAsset) {
  const finalizeUrl = extractLinkHref(uploadAsset?._links, LINK_REL.BLOCK_FINALIZE);

  if (!finalizeUrl) {
    throw new Error('Block finalize URL not found in upload asset links');
  }

  const token = window?.adobeIMS?.getAccessToken()?.token;
  const response = await fetch(finalizeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': ACP_STORAGE_CONFIG.TRANSFER_DOCUMENT,
      'x-api-key': 'AdobeExpressWeb',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(uploadAsset),
  });

  if (!response.ok) {
    throw new Error(`Block upload finalization failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Fallback: Download asset content
 */
async function fallbackDownloadAssetContent(asset) {
  const renditionUrl = asset?.links?.[LINK_REL.RENDITION]?.href
        || asset?._links?.[LINK_REL.RENDITION]?.href;

  const contentUrl = renditionUrl
        || asset?.links?.[LINK_REL.SELF]?.href
        || asset?._links?.[LINK_REL.SELF]?.href;

  if (!contentUrl) {
    throw new Error('Content URL not found in asset');
  }

  const token = window?.adobeIMS?.getAccessToken()?.token;
  const response = await fetch(contentUrl, {
    method: 'GET',
    headers: {
      'x-api-key': 'AdobeExpressWeb',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  return response.blob();
}

function isAssetVersionReady(version) {
  if (version === null || version === undefined) {
    return false;
  }

  const numericVersion = Number(version);
  if (!Number.isNaN(numericVersion)) {
    return numericVersion > 0;
  }

  return String(version).trim() !== '' && String(version).trim() !== '0';
}

const QR_CODE_CONFIG = {
  REFRESH_INTERVAL: 30 * 1000 * 60,
  GENERATION_TIMEOUT: 10 * 1000,
  DISPLAY_CONFIG: {
    width: 200,
    height: 200,
    type: 'canvas',
    dotsOptions: {
      color: '#000000',
      type: 'rounded',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 10,
    },
  },
};

// Magic-byte signatures matched against the file's actual leading bytes.
// Every check in an entry must match, which prevents generic container
// signatures (such as RIFF and ISO-BMFF's ftyp box) from being misclassified.
const FILE_TYPE_SIGNATURES = [
  { type: 'image/png', checks: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
  { type: 'image/jpeg', checks: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  { type: 'image/gif', checks: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] }, // "GIF8"
  { type: 'image/bmp', checks: [{ offset: 0, bytes: [0x42, 0x4d] }] }, // "BM"
  {
    type: 'image/webp',
    checks: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
    ],
  },
  {
    type: 'image/heic',
    checks: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }], // "ftyp"
    brands: ['heic', 'heix', 'hevc', 'hevx'],
  },
];

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Get URL Shortener configuration based on environment
 * @param {string} envName - Environment name (prod, stage, local)
 * @returns {object} Configuration object with serviceUrl and apiKey
 */
function getUrlShortenerConfig(envName) {
  return URL_SHORTENER_CONFIGS[envName] || URL_SHORTENER_CONFIGS.stage;
}

/**
 * Lifecycle states for a single QR-based upload session. The instance is
 * always in exactly one of these; every UI side effect (button state,
 * tooltip, refresh scheduling) is driven from state entry rather than from
 * ad-hoc boolean flags scattered across the flow.
 * @readonly
 * @enum {string}
 */
export const EasyUploadState = {
  IDLE: 'idle', // constructed, nothing generated yet
  GENERATING: 'generating', // creating an asset / QR code
  AWAITING_UPLOAD: 'awaiting-upload', // QR shown, polling for a mobile upload
  READY: 'ready', // an upload arrived and validated; confirm enabled
  INVALID: 'invalid', // an upload arrived but failed validation
  CONFIRMING: 'confirming', // user confirmed; handing off to the SDK
  ERROR: 'error', // QR generation failed
};

// Permitted transitions. The engine logs (but does not throw) on an
// unexpected transition, so a late async callback can never wedge the UI in
// an inconsistent state — the worst case is a warning in the logs.
const EASY_UPLOAD_TRANSITIONS = {
  [EasyUploadState.IDLE]: [EasyUploadState.GENERATING],
  [EasyUploadState.GENERATING]: [EasyUploadState.AWAITING_UPLOAD, EasyUploadState.ERROR],
  [EasyUploadState.AWAITING_UPLOAD]: [
    EasyUploadState.READY, EasyUploadState.INVALID, EasyUploadState.GENERATING,
  ],
  [EasyUploadState.READY]: [
    EasyUploadState.CONFIRMING, EasyUploadState.INVALID,
    EasyUploadState.GENERATING, EasyUploadState.AWAITING_UPLOAD,
  ],
  [EasyUploadState.INVALID]: [EasyUploadState.GENERATING],
  [EasyUploadState.CONFIRMING]: [
    EasyUploadState.INVALID, EasyUploadState.READY, EasyUploadState.GENERATING,
  ],
  [EasyUploadState.ERROR]: [EasyUploadState.GENERATING],
};

/**
 * EasyUpload class for handling file uploads via QR code
 * Manages QR code generation, ACP storage, and file upload flow
 */
export class EasyUpload {
  /**
     * Creates an EasyUpload instance
     * @param {object} uploadService - Service for handling ACP storage operations
     * @param {string} envName - Environment name (prod, stage, local)
     * @param {string} quickAction - Quick action identifier
     * @param {HTMLElement} block - Block element reference
     * @param {Function} startSDKWithUnconvertedFiles - Function to start SDK with files
     * @param {Function} createTag - Function to create DOM elements
     * @param {Function} showErrorToast - Function to show error toast
     * @param {string} qrErrorText - Error text to display when QR code fails
     */
  constructor(uploadService, envName, quickAction, block, startSDKWithUnconvertedFiles, createTag, showErrorToast, qrErrorText = '') {
    this.uploadService = uploadService;
    this.envName = envName;
    this.quickAction = quickAction;
    this.block = block;
    this.startSDKWithUnconvertedFiles = startSDKWithUnconvertedFiles;
    this.createTag = createTag;
    this.showErrorToast = showErrorToast;
    this.qrErrorText = qrErrorText;
    this.qrCode = null;
    this.qrCodeContainer = null;
    this.qrRefreshInterval = null;
    this.loaderContainer = null;
    this.qrCodeLibraryPromise = this.loadQRCodeLibrary();

    this.confirmButton = null;
    this.confirmTooltipElement = null;
    this.confirmTooltipMessages = {};
    this.confirmTooltipHideTimeout = null;
    this.handleTooltipOutsideClick = null;

    // State engine. `state` is the single source of truth; the remaining
    // fields are data the states read (the finalize round-trip completed,
    // the validated file to hand off, whether an upload was detected).
    this.state = EasyUploadState.IDLE;
    this.invalidUploadRefreshTimeout = null;
    this.uploadFinalized = false;
    this.uploadDetected = false;
    this.validatedUploadedFile = null;
    this.hasConsumedQrCode = false;
    // In-flight de-dupe for prepareUploadedFileForConfirm. The 2s detection
    // poll and a confirm click can both call it; without this, overlapping
    // calls would double-finalize the asset and spawn concurrent (leaking)
    // version-ready polls.
    this.preparePromise = null;

    this.asset = null;
    this.uploadAsset = null;
    this.pollingInterval = null;
    this.versionReadyPromise = null;
    this.isGeneratingUrl = false;
    this.handleConfirmClick = null;

    this.toastTimeoutId = null;

    this.handleBeforeUnload = () => this.cleanup();
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  setConfirmTooltipConfig({ element, messages } = {}) {
    this.confirmTooltipElement = element || null;
    this.confirmTooltipMessages = messages || {};
  }

  /**
   * Move the session to a new state, running its entry side effects. Invalid
   * transitions are logged and still applied so a stray callback can't lock
   * the UI; the state table documents the intended flow.
   * @param {string} nextState - One of EasyUploadState
   */
  transitionTo(nextState) {
    if (this.state === nextState) return;
    const allowed = EASY_UPLOAD_TRANSITIONS[this.state] || [];
    if (!allowed.includes(nextState)) {
      window.lana?.log(`[EasyUpload] Unexpected state transition: ${this.state} -> ${nextState}`, { severity: 'warning' });
    }
    this.state = nextState;
    this.onEnterState(nextState);
  }

  /**
   * Synchronous UI side effects for entering a state. Async work (generating
   * or refreshing the QR code) is driven by the methods that call
   * transitionTo, not from here.
   * @param {string} state - The state just entered
   */
  onEnterState(state) {
    switch (state) {
      case EasyUploadState.AWAITING_UPLOAD:
        this.uploadDetected = false;
        this.updateConfirmButtonState(true);
        break;
      case EasyUploadState.READY:
        this.uploadDetected = true;
        this.updateConfirmButtonState(false);
        break;
      case EasyUploadState.INVALID:
        this.uploadDetected = false;
        this.updateConfirmButtonState(true);
        // Pin the failure message so it shows without hovering and stays up
        // through the delay (dismissible by clicking outside), then regenerate.
        this.showConfirmTooltip('failed', { autoHide: false, pin: true });
        this.scheduleInvalidUploadRefresh();
        break;
      default:
        break;
    }
  }

  /**
   * After an invalid upload, wait INVALID_UPLOAD_DISPLAY_MS with the error
   * visible, then regenerate the QR code so the user can try again.
   */
  scheduleInvalidUploadRefresh() {
    clearTimeout(this.invalidUploadRefreshTimeout);
    this.invalidUploadRefreshTimeout = setTimeout(() => {
      this.invalidUploadRefreshTimeout = null;
      this.refreshQRCode();
    }, INVALID_UPLOAD_DISPLAY_MS);
  }

  /**
   * Show the confirm tooltip.
   * @param {string} messageKey - Key into confirmTooltipMessages
   * @param {object} [options]
   * @param {boolean} [options.autoHide=true] - Auto-dismiss after a delay
   * @param {boolean} [options.pin=false] - Show independently of hover state
   *   (survives mouseleave/blur) and dismiss on an outside click instead. Used
   *   for the corrupted-upload message so it stays put without hovering.
   * @returns {boolean} Whether the tooltip was shown
   */
  showConfirmTooltip(messageKey, { autoHide = true, pin = false } = {}) {
    if (!this.confirmTooltipElement) {
      return false;
    }
    const message = this.confirmTooltipMessages?.[messageKey];
    if (!message) {
      return false;
    }
    this.confirmTooltipElement.textContent = message;
    this.confirmTooltipElement.classList.remove('hidden');
    clearTimeout(this.confirmTooltipHideTimeout);
    this.confirmTooltipHideTimeout = null;

    if (pin) {
      // `.pinned` is a hover-independent visibility class the block's hover
      // handlers never touch, so the message can't be yanked away on
      // mouseleave. It is dismissed by clicking outside the tooltip.
      this.confirmTooltipElement.classList.add('pinned');
      this.attachTooltipOutsideDismiss();
      return true;
    }

    this.confirmTooltipElement.classList.add('hover');
    if (autoHide) {
      this.confirmTooltipHideTimeout = setTimeout(() => {
        this.confirmTooltipElement?.classList.remove('hover');
      }, CONFIRM_TOOLTIP_AUTO_HIDE_DELAY);
    }
    return true;
  }

  hideConfirmTooltip() {
    if (!this.confirmTooltipElement) return;
    this.confirmTooltipElement.classList.remove('hover');
    this.confirmTooltipElement.classList.remove('pinned');
    this.detachTooltipOutsideDismiss();
  }

  /**
   * Dismiss a pinned tooltip when the user clicks anywhere outside of it.
   * The pinned tooltip is only ever surfaced from a timer (upload polling) or
   * after the confirm click has already finished propagating, so registering
   * synchronously can't self-dismiss on the triggering click.
   */
  attachTooltipOutsideDismiss() {
    this.detachTooltipOutsideDismiss();
    this.handleTooltipOutsideClick = (event) => {
      if (this.confirmTooltipElement?.contains(event.target)) return;
      this.hideConfirmTooltip();
    };
    document.addEventListener('click', this.handleTooltipOutsideClick, true);
  }

  detachTooltipOutsideDismiss() {
    if (this.handleTooltipOutsideClick) {
      document.removeEventListener('click', this.handleTooltipOutsideClick, true);
      this.handleTooltipOutsideClick = null;
    }
  }

  /**
 * Load QR Code styling library from CDN
 * @returns {Promise<object>} QRCodeStyling library
 */
  loadQRCodeLibrary() {
    return new Promise((resolve, reject) => {
      if (window.QRCodeStyling) {
        resolve(window.QRCodeStyling);
        return;
      }

      const script = document.createElement('script');
      script.src = QR_CODE_CDN_URL;
      script.onload = () => resolve(window.QRCodeStyling);
      script.onerror = () => reject(new Error('Failed to load QR code library'));
      document.head.appendChild(script);
    });
  }

  /**
   * Extract upload URL from transfer document
   * @param {object} uploadAsset - Upload asset with links
   * @returns {string} Upload URL
   * @throws {Error} If block transfer URL not found
   */
  extractUploadUrl(uploadAsset) {
    const uploadUrl = extractLinkHref(uploadAsset._links, LINK_REL.BLOCK_TRANSFER);
    if (!uploadUrl) {
      throw new Error('Block transfer URL not found in upload asset links');
    }
    return uploadUrl;
  }

  /**
   * Generate presigned upload URL from ACP Storage
   * @returns {Promise<string>} Upload URL
   * @throws {Error} If upload URL generation fails
   */
  async generatePresignedUploadUrl() {
    this.uploadFinalized = false;
    this.validatedUploadedFile = null;
    try {
      const hasNativeCreateAsset = typeof this.uploadService?.createAsset === 'function';
      const hasNativeInitializeBlockUpload = typeof this.uploadService?.initializeBlockUpload === 'function';

      if (hasNativeCreateAsset) {
        this.asset = await this.uploadService.createAsset(ACP_STORAGE_CONFIG.CONTENT_TYPE);
      } else {
        this.asset = await fallbackCreateAsset(this.uploadService, ACP_STORAGE_CONFIG.CONTENT_TYPE);
      }

      if (hasNativeInitializeBlockUpload) {
        this.uploadAsset = await this.uploadService.initializeBlockUpload(
          this.asset,
          ACP_STORAGE_CONFIG.MAX_FILE_SIZE,
          ACP_STORAGE_CONFIG.MAX_FILE_SIZE,
          ACP_STORAGE_CONFIG.CONTENT_TYPE,
        );
      } else {
        this.uploadAsset = await fallbackInitializeBlockUpload(
          this.asset,
          ACP_STORAGE_CONFIG.MAX_FILE_SIZE,
          ACP_STORAGE_CONFIG.MAX_FILE_SIZE,
          ACP_STORAGE_CONFIG.CONTENT_TYPE,
        );
      }

      return extractLinkHref(this.uploadAsset._links, LINK_REL.BLOCK_TRANSFER);
    } catch (error) {
      window.lana?.log(`[EasyUpload] Failed to generate upload URL: ${error?.name} ${error?.message} code=${error?.code} status=${error?.statusCode}`, { severity: 'error' });
      throw error;
    }
  }

  /**
   * Wait for asset version to be ready by polling
   * @returns {Promise<void>} Resolves when asset is ready
   * @throws {Error} If polling times out or max attempts reached
   */
  async waitForAssetVersionReady() {
    // Never run two version polls at once: a leftover interval would be
    // orphaned (its id overwritten) and keep hitting the versions endpoint
    // forever, since the later poll's clearInterval targets a different id.
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    return new Promise((resolve, reject) => {
      this.versionReadyPromise = { resolve, reject };
      let pollAttempts = 0;
      let checkInFlight = false;
      let intervalId = null;
      let timeoutId = null;

      const finish = (fn, arg) => {
        if (intervalId) clearInterval(intervalId);
        if (this.pollingInterval === intervalId) this.pollingInterval = null;
        clearTimeout(timeoutId);
        fn(arg);
      };

      timeoutId = setTimeout(() => {
        finish(reject, new Error(`Polling timeout: Asset version not ready after ${ACP_STORAGE_CONFIG.POLLING_TIMEOUT_MS}ms`));
      }, ACP_STORAGE_CONFIG.POLLING_TIMEOUT_MS);

      intervalId = setInterval(async () => {
        // Skip this tick if the previous version fetch hasn't returned yet;
        // otherwise a slow fetch would overlap itself.
        if (checkInFlight) return;
        checkInFlight = true;
        try {
          pollAttempts += 1;

          let version = null;
          try {
            const hasNativeGetAssetVersion = typeof this.uploadService?.getAssetVersion === 'function';
            version = hasNativeGetAssetVersion
              ? await this.uploadService.getAssetVersion(this.asset)
              : await fallbackGetAssetVersion(this.asset);
          } catch (versionError) {
            // A thrown version lookup means "not ready yet" here (e.g. the
            // native service throws on an empty version list while the file is
            // still landing). Treat it as not-ready and keep polling rather
            // than aborting — the attempt/timeout guards below still bound it,
            // and genuine content corruption is caught later by
            // retrieveUploadedFile's integrity checks, not by this poll.
            window.lana?.log(`[EasyUpload] Asset version not ready yet (attempt ${pollAttempts}): ${versionError?.message || versionError}`, { severity: 'info' });
          }

          if (isAssetVersionReady(version)) {
            finish(resolve);
          } else if (pollAttempts >= ACP_STORAGE_CONFIG.MAX_POLLING_ATTEMPTS) {
            finish(reject, new Error(`Max polling attempts reached (${ACP_STORAGE_CONFIG.MAX_POLLING_ATTEMPTS}). Asset version: ${version}`));
          }
        } finally {
          checkInFlight = false;
        }
      }, ACP_STORAGE_CONFIG.SECOND_IN_MS);

      this.pollingInterval = intervalId;
    });
  }

  /**
     * Finalize the upload process
     * @returns {Promise<void>}
     */
  async finalizeUpload() {
    const hasNativeFinalizeUpload = typeof this.uploadService?.finalizeUpload === 'function';
    if (hasNativeFinalizeUpload) {
      await this.uploadService.finalizeUpload(this.uploadAsset);
      this.uploadFinalized = true;
      return;
    }
    await fallbackFinalizeUpload(this.uploadAsset);
    this.uploadFinalized = true;
  }

  /**
   * Detect MIME type from a file's actual leading bytes (magic numbers).
   * Unlike text sniffing, this cannot misclassify binary content, and returns
   * null for anything without a recognized image signature.
   * @param {ArrayBuffer} buffer - Leading bytes of the file
   * @returns {string|null} Detected MIME type, or null if unrecognized
   */
  detectFileTypeFromBytes(buffer) {
    const bytes = new Uint8Array(buffer);

    for (const { type, checks, brands } of FILE_TYPE_SIGNATURES) {
      const matches = checks.every(({ offset, bytes: signature }) => (
        signature.every((byte, i) => bytes[offset + i] === byte)
      ));
      let hasMatchingBrand = true;
      if (matches && brands) {
        // ISO-BMFF stores a major brand at byte 8 and compatible brands from
        // byte 16 onward. Byte 12 is the minor version, not a brand.
        const brandOffsets = [8];
        for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
          brandOffsets.push(offset);
        }
        hasMatchingBrand = brandOffsets.some((offset) => {
          const brand = String.fromCharCode(...bytes.slice(offset, offset + 4));
          return brands.includes(brand);
        });
      }

      if (matches && hasMatchingBrand) return type;
    }

    // SVG is text-based (no binary magic number); sniff the leading markup.
    const head = new TextDecoder().decode(bytes).trimStart().toLowerCase();
    const svgPrefix = /^(?:<\?xml[^>]*>\s*)?(?:(?:<!--(?:[^-]|-(?!->))*-->|<!doctype\s+svg[^>]*>)\s*)*<svg(?:\s|\/?>)/;
    if (svgPrefix.test(head)) return 'image/svg+xml';

    return null;
  }

  /**
   * Verify a blob decodes as a complete, non-truncated image. A valid signature
   * alone does not prove integrity (a truncated file keeps its header), so we
   * actually decode the pixels.
   * @param {Blob} blob - Image blob to validate
   * @param {string} mimeType - Detected MIME type
   * @returns {Promise<void>} Resolves if valid; throws if corrupted
   * @throws {Error} If the image cannot be decoded
   */
  async validateImageIntegrity(blob, mimeType) {
    // SVG can't be decoded via createImageBitmap reliably, so parse the full
    // document to reject truncated markup and non-SVG XML.
    if (mimeType === 'image/svg+xml') {
      const documentNode = new DOMParser().parseFromString(await blob.text(), 'image/svg+xml');
      if (documentNode.querySelector('parsererror')
        || documentNode.documentElement?.localName !== 'svg') {
        throw new Error('Corrupted or invalid SVG image');
      }
      return;
    }

    // Most Chromium and Firefox environments cannot decode HEIC even though
    // the downstream SDK supports it. Its container and brand checks above
    // must remain the integrity gate until browser decoding is portable.
    if (mimeType === 'image/heic') return;

    let bitmap;
    try {
      bitmap = await createImageBitmap(blob);
    } catch (error) {
      throw new Error(`Corrupted or undecodable image: ${error?.message || error}`);
    }

    const { width, height } = bitmap;
    bitmap.close?.();
    if (!width || !height) {
      throw new Error('Corrupted image: decoded to zero dimensions');
    }
  }

  /**
   * Retrieve uploaded file from ACP Storage
   * @returns {Promise<File>} Retrieved file with detected type
   * @throws {Error} If file retrieval fails
   */
  async retrieveUploadedFile() {
    try {
      // Rejection here propagates as a thrown error; no extra flag to check.
      await this.waitForAssetVersionReady();

      const hasNativeDownloadAssetContent = typeof this.uploadService?.downloadAssetContent === 'function';
      const blob = hasNativeDownloadAssetContent
        ? await this.uploadService.downloadAssetContent(this.asset)
        : await fallbackDownloadAssetContent(this.asset);

      if (!blob || blob.size === 0) {
        throw new Error('Uploaded file is empty');
      }

      // Detect type from real bytes, not text — an unrecognized signature means
      // the upload is not a supported image (or is corrupted).
      const headerBuffer = await blob.slice(0, 512).arrayBuffer();
      const detectedType = this.detectFileTypeFromBytes(headerBuffer);
      if (!detectedType) {
        throw new Error('Unrecognized or corrupted file: no valid image signature');
      }

      // Confirm the bytes actually decode as a complete image before handoff.
      await this.validateImageIntegrity(blob, detectedType);

      const fileName = `upload_${Date.now()}_${generateUUID().substring(0, 8)}`;

      const file = new File([blob], fileName, { type: detectedType });

      return file;
    } catch (error) {
      window.lana?.log(`[EasyUpload] Failed to retrieve uploaded file: ${error?.message || error}`, { severity: 'error' });
      throw error;
    }
  }

  /**
   * Cleanup ACP Storage resources and state
   * @returns {Promise<void>}
   */
  async cleanupAcpStorage() {
    try {
      if (this.uploadService && this.asset) {
        const hasNativeDeleteAsset = typeof this.uploadService?.deleteAsset === 'function';
        if (hasNativeDeleteAsset) {
          await this.uploadService.deleteAsset(this.asset);
        }
      }

      this.asset = null;
      this.uploadAsset = null;
    } catch (error) {
      window.lana?.log(`[EasyUpload] Error during ACP Storage cleanup: ${error?.message || error}`, { severity: 'warning' });
    }
  }

  /**
     * Generate upload URL with timeout protection
     * @returns {Promise<string>} Upload URL
     * @throws {Error} If URL generation fails or times out
     */
  async generateUploadUrl() {
    if (this.isGeneratingUrl) return null;
    this.isGeneratingUrl = true;
    try {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          window.lana?.log('[EasyUpload] URL generation timed out', { severity: 'error' });
          reject(new Error(`QR code generation timed out after ${QR_CODE_CONFIG.GENERATION_TIMEOUT / 1000} seconds`));
        }, QR_CODE_CONFIG.GENERATION_TIMEOUT);
      });

      const TIMEOUT_MS = 10000;

      const urlGenerationPromise = Promise.race([
        (async () => {
          const presignedUrl = await this.generatePresignedUploadUrl();
          const mobileUrl = this.buildMobileUploadUrl(presignedUrl);
          return this.shortenUrl(mobileUrl);
        })(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('[EasyUpload] URL generation timed out')), TIMEOUT_MS);
        }),
      ]).catch((error) => {
        window.lana?.log(`[EasyUpload] Failed in URL generation promise: ${error?.message || error}`, {
          severity: 'error',
          error,
        });
        throw error;
      });

      const result = await Promise.race([urlGenerationPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } finally {
      this.isGeneratingUrl = false;
    }
  }

  /**
     * Build mobile upload URL with presigned URL as parameter
     * @param {string} presignedUrl - Presigned ACP storage URL
     * @returns {string} Complete mobile upload URL
     */
  buildMobileUploadUrl(presignedUrl) {
    const urlParams = new URLSearchParams(window.location.search);
    const qrHost = urlParams.get('qr_host');
    const host = this.envName === 'prod'
      ? 'express.adobe.com'
      : qrHost || 'express-stage.adobe.com';

    const url = new URL(`https://${host}/uploadFromOtherDevice`);
    url.searchParams.set('upload_url', presignedUrl);

    return url.toString();
  }

  /**
     * Shorten URL using Adobe URL shortener service
     * Falls back to original URL if shortening fails or user not logged in
     * @param {string} longUrl - URL to shorten
     * @returns {Promise<string>} Shortened URL or original if shortening fails
     */
  async shortenUrl(longUrl) {
    const accessToken = window?.adobeIMS?.getAccessToken?.()?.token;

    const ENABLE_URL_SHORTENING = true;

    if (!ENABLE_URL_SHORTENING || !accessToken) {
      return longUrl;
    }

    try {
      const urlShortenerConfig = getUrlShortenerConfig(this.envName);
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      const metaData = 'easy-upload-qr-code';

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': urlShortenerConfig.apiKey,
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const url = new URL(`${urlShortenerConfig.serviceUrl}/v1/short-links/`);
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: longUrl,
          timeZone,
          metaData,
        }),
      });

      if (!response.ok) {
        window.lana?.log(`[EasyUpload] Failed to shorten URL (HTTP error), using original: ${response.status} ${response.statusText}`, { severity: 'warning' });
        return longUrl;
      }

      const data = await response.json();
      if (data.status === 'success' && data.data) {
        return data.data;
      }

      window.lana?.log(`[EasyUpload] Failed to shorten URL (unexpected response), using original: ${JSON.stringify(data)}`, { severity: 'warning' });
      return longUrl;
    } catch (error) {
      window.lana?.log(`[EasyUpload] Error shortening URL, using original: ${error instanceof Error ? error.message : String(error)}`, { severity: 'warning' });
      return longUrl;
    }
  }

  /**
     * Create loader container with rotating SVG
     * @returns {HTMLElement} Loader container element
     */
  getQrButtonContainer() {
    return this.block?.querySelector('.qr-code-widget-container')
            || this.block?.querySelector('.dropzone .button-container')
            || document.querySelector('.qr-code-widget-container')
            || document.querySelector('.dropzone .button-container');
  }

  createLoader() {
    if (!this.loaderContainer) {
      this.loaderContainer = this.createTag('div', {
        class: 'qr-code-loader',
        role: 'status',
        'aria-label': 'Generating QR code',
        'aria-busy': 'true',
      });

      const loaderContent = this.createTag('div', { class: 'qr-code-loader-content' });
      const preview = this.createTag('img', {
        class: 'qr-code-loader-preview',
        src: '/express/code/blocks/frictionless-quick-action/easy-upload-files/dummy.png',
        alt: '',
      });
      const indicator = this.createTag('img', {
        class: 'qr-code-loader-indicator',
        src: '/express/code/blocks/frictionless-quick-action/easy-upload-files/progress.png',
        alt: '',
      });
      loaderContent.append(preview, indicator);
      this.loaderContainer.append(loaderContent);
    }
    const buttonContainer = this.getQrButtonContainer();
    if (buttonContainer) {
      buttonContainer.appendChild(this.loaderContainer);
    }
    return this.loaderContainer;
  }

  /**
     * Show loader in place of QR code
     */
  showLoader() {
    if (!this.loaderContainer) {
      this.createLoader();
    }
    if (this.qrCodeContainer) {
      this.qrCodeContainer.classList.add('hidden');
    }

    if (this.loaderContainer) {
      this.loaderContainer.classList.remove('hidden');
      this.loaderContainer.setAttribute('aria-busy', 'true');
    }

    this.updateConfirmButtonState(true);
  }

  /**
     * Hide loader and show QR code
     */
  hideLoader() {
    if (this.loaderContainer) {
      this.loaderContainer.classList.add('hidden');
      this.loaderContainer.setAttribute('aria-busy', 'false');
    }

    if (this.qrCodeContainer) {
      this.qrCodeContainer.classList.remove('hidden');
    }

    this.updateConfirmButtonState(false);
  }

  /**
     * Show failed QR code state with grayed out QR icon, caution icon, and error message
     */
  showFailedQR() {
    if (this.loaderContainer) {
      this.loaderContainer.classList.add('hidden');
    }

    const bgIcon = this.createTag('img', { src: '/express/code/blocks/frictionless-quick-action/easy-upload-files/placeholder.png', class: 'qr-error-bg-icon', alt: '' });
    const cautionIcon = this.createTag('img', { src: '/express/code/icons/error.svg', class: 'qr-error-caution-icon', alt: 'Error' });
    const errorMsg = this.createTag('p', { class: 'qr-error-message' }, this.qrErrorText || 'Failed to generate QR code');
    const iconContainer = this.createTag('div', { class: 'qr-error-icon-container' });
    iconContainer.append(bgIcon, cautionIcon, errorMsg);
    const errorState = this.createTag('div', { class: 'qr-error-state', role: 'alert', 'aria-live': 'assertive' });
    errorState.appendChild(iconContainer);

    if (this.qrCodeContainer) {
      this.qrCodeContainer.replaceChildren(errorState);
      this.qrCodeContainer.classList.remove('hidden');
    } else {
      const buttonContainer = this.getQrButtonContainer();
      if (buttonContainer) {
        this.qrCodeContainer = this.createTag('div', { class: 'qr-code-container' });
        this.qrCodeContainer.appendChild(errorState);
        buttonContainer.appendChild(this.qrCodeContainer);
      }
    }

    this.updateConfirmButtonState(true);
  }

  /**
     * Display QR code in the UI
     * @param {string} uploadUrl - URL to encode in QR code
     * @returns {Promise<void>}
     */
  async displayQRCode(uploadUrl) {
    const QRCodeStyling = await this.qrCodeLibraryPromise;

    if (!this.qrCode) {
      this.qrCode = new QRCodeStyling({
        ...QR_CODE_CONFIG.DISPLAY_CONFIG,
        data: uploadUrl,
      });
    } else {
      this.qrCode.update({
        ...QR_CODE_CONFIG.DISPLAY_CONFIG,
        data: uploadUrl,
      });
    }

    const buttonContainer = this.getQrButtonContainer();

    if (buttonContainer) {
      if (!this.qrCodeContainer) {
        this.qrCodeContainer = this.createTag('div', { class: 'qr-code-container' });
        buttonContainer.appendChild(this.qrCodeContainer);
      }

      if (!this.loaderContainer) {
        this.createLoader();
        this.loaderContainer.classList.add('hidden');
        buttonContainer.appendChild(this.loaderContainer);
      }
    }

    if (this.qrCodeContainer) {
      this.qrCodeContainer.replaceChildren();
      this.qrCodeContainer.setAttribute('role', 'img');
      this.qrCodeContainer.setAttribute('aria-label', 'QR code — scan with your phone to upload a file');
      this.qrCode.append(this.qrCodeContainer);
    }

    this.hideLoader();
  }

  /**
     * Initialize QR code with upload URL
     * @returns {Promise<void>}
     * @throws {Error} If initialization fails
     */
  async initializeQRCode() {
    try {
      this.transitionTo(EasyUploadState.GENERATING);
      this.markQrCodeFresh();
      this.showLoader();
      if (shouldForceQrFailure()) {
        throw new Error('Forced QR failure for testing');
      }

      const uploadUrl = await this.generateUploadUrl();
      // A null URL means a generation is already in flight (isGeneratingUrl
      // guard); that in-flight call owns the loader/QR, so leave state as-is.
      if (!uploadUrl) return;
      await this.displayQRCode(uploadUrl);

      this.scheduleQRRefresh();
    } catch (error) {
      window.lana?.log(`[EasyUpload] Failed to initialize QR code: ${error?.name} ${error?.message} code=${error?.code} status=${error?.statusCode}`, { severity: 'error' });
      this.transitionTo(EasyUploadState.ERROR);
      this.showFailedQR();
      this.showErrorToast(this.block, 'Failed to generate QR code.');
    }
  }

  /**
     * Schedule QR code refresh after configured interval
     */
  scheduleQRRefresh() {
    if (this.qrRefreshInterval) {
      clearTimeout(this.qrRefreshInterval);
    }

    this.qrRefreshInterval = setTimeout(() => {
      this.refreshQRCode();
    }, QR_CODE_CONFIG.REFRESH_INTERVAL);
  }

  /**
     * Whether current QR code has already been consumed by a confirm action
     * @returns {boolean}
     */
  isQrCodeConsumed() {
    return this.hasConsumedQrCode;
  }

  markQrCodeConsumed() {
    this.hasConsumedQrCode = true;
  }

  markQrCodeFresh() {
    this.hasConsumedQrCode = false;
  }

  /**
     * Reset upload session state while preserving pane listeners and bindings
     * @returns {Promise<void>}
     */
  async resetUploadSession() {
    if (this.qrRefreshInterval) {
      clearTimeout(this.qrRefreshInterval);
      this.qrRefreshInterval = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.stopUploadDetectionPolling();

    if (this.versionReadyPromise) {
      this.versionReadyPromise.reject(new Error('EasyUpload upload-session reset'));
      this.versionReadyPromise = null;
    }

    clearTimeout(this.invalidUploadRefreshTimeout);
    this.invalidUploadRefreshTimeout = null;
    this.uploadFinalized = false;
    this.uploadDetected = false;
    this.validatedUploadedFile = null;
    this.preparePromise = null;
    await this.cleanupAcpStorage();
  }

  /**
     * Regenerate the QR code for a fresh upload attempt. Uses
     * resetUploadSession (not cleanup) so the confirm-button and unload
     * listeners survive; cleanup is reserved for final teardown.
     * @returns {Promise<void>}
     */
  async refreshQRCode() {
    try {
      this.transitionTo(EasyUploadState.GENERATING);
      await this.resetUploadSession();
      await this.initializeQRCode();
      this.hideConfirmTooltip();
      this.startUploadDetectionPolling();
    } catch (error) {
      window.lana?.log(`[EasyUpload] Failed to refresh QR code: ${error?.message || error}`, { severity: 'error' });
    }
  }

  /**
     * Handle confirm import button click
     * Finalizes upload and starts SDK with the uploaded file
     * @returns {Promise<void>}
     */
  async handleConfirmImport() {
    this.updateConfirmButtonState(true);
    this.hideConfirmTooltip();
    this.markQrCodeConsumed();

    try {
      const file = await this.prepareUploadedFileForConfirm();

      if (file) {
        this.transitionTo(EasyUploadState.CONFIRMING);
        await this.startSDKWithUnconvertedFiles([file], this.quickAction, this.block, true);
      } else {
        throw new Error('No file was uploaded');
      }
    } catch (error) {
      window.lana?.log(`[EasyUpload] Failed to confirm import: ${error?.message || error}`, { severity: 'error' });
      if (error?.easyUploadStage === 'finalize') {
        // Upload not yet finalized on the server — recoverable; let the user
        // retry without regenerating the QR code.
        this.showConfirmTooltip('pending');
        this.updateConfirmButtonState(false);
        return;
      }
      // Corrupted/undecodable file: show the failure, hold it on screen, then
      // regenerate the QR code (handled by the INVALID state).
      this.transitionTo(EasyUploadState.INVALID);
    }
  }

  /**
     * Finalize, retrieve, and validate the uploaded file before enabling confirm.
     * @returns {Promise<File>} Validated uploaded file
     * @throws {Error} If the upload is not ready or cannot be decoded
     */
  async prepareUploadedFileForConfirm() {
    if (this.validatedUploadedFile) {
      return this.validatedUploadedFile;
    }
    // Collapse concurrent callers onto a single attempt so finalize runs once
    // and only one version-ready poll is ever in flight. Cleared on settle so
    // a failed attempt can be retried by the next poll tick / confirm click.
    if (this.preparePromise) {
      return this.preparePromise;
    }
    this.preparePromise = this.runUploadedFilePreparation();
    try {
      return await this.preparePromise;
    } finally {
      this.preparePromise = null;
    }
  }

  async runUploadedFilePreparation() {
    if (!this.uploadService) {
      throw new Error('Upload service not initialized');
    }

    if (!this.uploadFinalized) {
      try {
        await this.finalizeUpload();
      } catch (error) {
        error.easyUploadStage = 'finalize';
        throw error;
      }
    }

    let file;
    try {
      file = await this.retrieveUploadedFile();
    } catch (error) {
      error.easyUploadStage = 'retrieve';
      throw error;
    }
    this.validatedUploadedFile = file;
    return file;
  }

  /**
     * Update confirm button state (disabled/enabled)
     * @param {boolean} disabled - Whether button should be disabled
     */
  updateConfirmButtonState(disabled) {
    if (this.confirmButton) {
      if (disabled) {
        this.confirmButton.classList.add('disabled');
        this.confirmButton.setAttribute('aria-disabled', 'true');
      } else {
        this.confirmButton.classList.remove('disabled');
        this.confirmButton.removeAttribute('aria-disabled');
      }
    }
  }

  /**
     * Create confirm import button
     * @returns {HTMLElement} Confirm button element
     */
  createConfirmButton() {
    const confirmButton = this.createTag('a', {
      href: '#',
      class: 'button accent xlarge confirm-import-button',
      title: 'Confirm Import',
    }, 'Confirm Import');

    this.handleConfirmClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleConfirmImport().catch((error) => {
        window.lana?.log(`[EasyUpload] Unhandled error in handleConfirmImport: ${error?.message || error}`, { severity: 'error' });
      });
    };
    confirmButton.addEventListener('click', this.handleConfirmClick);

    this.confirmButton = confirmButton;
    return confirmButton;
  }

  /**
     * Setup complete QR code interface with QR code display and confirm button
     * This is the main entry point for initializing the QR code upload feature
     * @returns {Promise<void>}
     * @throws {Error} If QR code interface setup fails
     */
  async setupQRCodeInterface() {
    try {
      const dropzone = document.querySelector('.qr-code-container');
      const buttonContainer = dropzone?.querySelector('.button-container');
      await this.initializeQRCode();
      if (buttonContainer) {
        const confirmButton = this.createConfirmButton();
        buttonContainer.appendChild(confirmButton);
      }
    } catch (error) {
      window.lana?.log(`[EasyUpload] Failed to setup QR code interface: ${error?.message || error}`, { severity: 'error' });
      throw error;
    }
  }

  /**
     * Start polling to detect when mobile upload is complete
     * Enables the confirm button when upload is detected
     */
  startUploadDetectionPolling() {
    if (this.uploadDetectionInterval) {
      clearInterval(this.uploadDetectionInterval);
    }

    this.validatedUploadedFile = null;
    this.transitionTo(EasyUploadState.AWAITING_UPLOAD);
    const POLL_INTERVAL_MS = 2000;
    const MAX_POLL_TIME_MS = 30 * 60 * 1000;
    const startTime = Date.now();

    this.uploadDetectionInterval = setInterval(async () => {
      if (Date.now() - startTime > MAX_POLL_TIME_MS) {
        clearInterval(this.uploadDetectionInterval);
        this.uploadDetectionInterval = null;
        return;
      }

      try {
        if (!this.uploadAsset || !this.uploadService) {
          return;
        }

        if (this.validatedUploadedFile) {
          this.transitionTo(EasyUploadState.READY);
          clearInterval(this.uploadDetectionInterval);
          this.uploadDetectionInterval = null;
          return;
        }

        try {
          await this.prepareUploadedFileForConfirm();
          clearInterval(this.uploadDetectionInterval);
          this.uploadDetectionInterval = null;
          this.transitionTo(EasyUploadState.READY);
        } catch (error) {
          // Only treat this as a real failure once the upload has finalized;
          // before that the poll is just waiting for the file to arrive.
          if (this.uploadFinalized) {
            clearInterval(this.uploadDetectionInterval);
            this.uploadDetectionInterval = null;
            // INVALID shows the error, holds it, then regenerates the QR code.
            this.transitionTo(EasyUploadState.INVALID);
          }
        }
      } catch (error) {
        window.lana?.log(`[EasyUpload] Polling error: ${error?.message || error}`, { severity: 'warning' });
      }
    }, POLL_INTERVAL_MS);
  }

  /**
     * Stop upload detection polling
     */
  stopUploadDetectionPolling() {
    if (this.uploadDetectionInterval) {
      clearInterval(this.uploadDetectionInterval);
      this.uploadDetectionInterval = null;
    }
  }

  /**
     * Cleanup all resources and event listeners
     * @returns {Promise<void>}
     */
  async cleanup() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);

    if (this.confirmButton && this.handleConfirmClick) {
      this.confirmButton.removeEventListener('click', this.handleConfirmClick);
      this.handleConfirmClick = null;
    }

    if (this.qrRefreshInterval) {
      clearTimeout(this.qrRefreshInterval);
      this.qrRefreshInterval = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.confirmTooltipHideTimeout) {
      clearTimeout(this.confirmTooltipHideTimeout);
      this.confirmTooltipHideTimeout = null;
    }

    if (this.invalidUploadRefreshTimeout) {
      clearTimeout(this.invalidUploadRefreshTimeout);
      this.invalidUploadRefreshTimeout = null;
    }

    this.detachTooltipOutsideDismiss();
    this.stopUploadDetectionPolling();

    if (this.versionReadyPromise) {
      this.versionReadyPromise.reject(new Error('EasyUpload cleanup'));
      this.versionReadyPromise = null;
    }

    await this.cleanupAcpStorage();
  }
}
