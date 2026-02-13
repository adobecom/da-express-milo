// Import required utilities
import { getIconElementDeprecated } from '../utils.js';

// Constants

// SVG loader icon
const ROTATE_LOADER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" id="ICONS" width="44" height="44" viewBox="0 0 44 44">
  <defs>
    <style>
      .fill {
        fill: #222;
      }
    </style>
  </defs>
  <rect id="Canvas" fill="#ff13dc" opacity="0" width="44" height="44" />
  <path class="fill" d="m22.39014,3.83301c-6.90808,0-13.18256,3.73047-16.39014,9.5144v-6.26831c0-.82812-.67139-1.5-1.5-1.5s-1.5.67188-1.5,1.5v10.47363c0,.82812.67139,1.5,1.5,1.5h10.5c.82861,0,1.5-.67188,1.5-1.5s-.67139-1.5-1.5-1.5h-6.98792c2.42493-5.54883,8.08215-9.21973,14.37805-9.21973,8.60742,0,15.60986,6.7666,15.60986,15.08398,0,8.31641-7.00244,15.08301-15.60986,15.08301-3.95312,0-7.72461-1.43066-10.61963-4.02832-.6167-.55273-1.56543-.50293-2.11816.11426-.55371.61719-.50195,1.56543.11426,2.11816,3.44678,3.09277,7.92969,4.7959,12.62354,4.7959,10.26172,0,18.60986-8.1123,18.60986-18.08301,0-9.97168-8.34814-18.08398-18.60986-18.08398Z" />
</svg>
`;

// Failed QR code icon
const FAILED_QR_SVG = `
<svg width="200" height="200" viewBox="0 0 150 151" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.136719" y="0.178711" width="149.863" height="149.863" rx="9.36646" fill="#F8F8F8" />
  <path d="M109.843 88.9461L104.708 61.476C104.048 57.9461 101.808 55.1135 98.8563 53.5664C99.9832 55.4367 100.633 57.6255 100.633 59.9637V87.9098C100.633 94.7653 95.0561 100.343 88.2006 100.343H60.8398C62.795 105.237 67.9919 108.232 73.3688 107.226L100.839 102.091C106.955 100.948 110.987 95.0625 109.843 88.9461Z" fill="#DEDEF9" />
  <path d="M100.633 87.9102V59.9641C100.633 57.6259 99.9837 55.437 98.8568 53.5668C96.6796 49.9535 92.7184 47.5312 88.2011 47.5312H70.2475C69.6033 47.5312 69.0814 48.0532 69.0814 48.6973C69.0814 49.0474 69.2387 49.3577 69.4828 49.5714C69.688 49.751 69.9534 49.8634 70.2475 49.8634H88.2011C93.7703 49.8634 98.3012 54.3946 98.3012 59.9641V87.9102C98.3012 93.4798 93.7703 98.0108 88.2011 98.0108H60.2551C54.6856 98.0108 50.1544 93.4798 50.1544 87.9102V72.9955C50.1544 72.6454 49.9971 72.3352 49.7531 72.1215C49.5479 71.9419 49.2825 71.8294 48.9883 71.8294C48.3442 71.8294 47.8223 72.3514 47.8223 72.9955V87.9102C47.8223 94.7656 53.3996 100.343 60.2551 100.343H60.8405H88.2012C95.0566 100.343 100.633 94.7656 100.633 87.9102Z" fill="#242424" />
  <path d="M58.608 81.8293H65.7375C65.7373 81.8353 65.7341 81.8402 65.7341 81.8462V89.0728C65.7341 89.3418 65.9521 89.5598 66.221 89.5598H73.9346H89.8488C90.1177 89.5598 90.3357 89.3418 90.3357 89.0728V81.8462C90.3357 81.5773 90.1177 81.3592 89.8488 81.3592H81.812V74.2421C81.818 74.2423 81.8229 74.2455 81.8289 74.2455H89.0556C89.3245 74.2455 89.5425 74.0274 89.5425 73.7585V66.5319C89.5425 66.263 89.3245 66.0449 89.0556 66.0449H81.8288C81.8214 66.0449 81.8152 66.0489 81.8077 66.0492C81.8081 66.0418 81.812 66.0356 81.812 66.0281V58.8014C81.812 58.5325 81.594 58.3145 81.3251 58.3145H74.0983C73.8294 58.3145 73.6114 58.5325 73.6114 58.8014V66.0281C73.6114 66.0355 73.6153 66.0417 73.6157 66.0492C73.6083 66.0488 73.602 66.0449 73.5946 66.0449H66.3679C66.099 66.0449 65.8809 66.2629 65.8809 66.5318V73.638C65.865 73.6364 65.8511 73.6287 65.8347 73.6287H58.608C58.3391 73.6287 58.1211 73.8467 58.1211 74.1156V81.3424C58.1211 81.6113 58.3391 81.8293 58.608 81.8293ZM74.0983 66.515H81.325C81.3325 66.515 81.3387 66.5111 81.3461 66.5107C81.3458 66.5181 81.3419 66.5243 81.3419 66.5319V73.6615C81.3359 73.6613 81.331 73.6581 81.325 73.6581H74.0983C74.0923 73.6581 74.0874 73.6613 74.0815 73.6615V66.5319C74.0815 66.5244 74.0776 66.5182 74.0772 66.5107C74.0846 66.5111 74.0909 66.515 74.0983 66.515ZM73.5946 74.2455C73.6006 74.2455 73.6055 74.2423 73.6114 74.2421V81.3592H66.3182C66.3184 81.3533 66.3216 81.3484 66.3216 81.3424V74.2362C66.3376 74.2378 66.3515 74.2455 66.3679 74.2455H73.5946Z" fill="#5C5CE0" />
  <path d="M65.9493 54.8662C65.9493 54.4639 65.9283 54.0666 65.8931 53.6735C65.2898 46.9381 59.6335 41.6582 52.7413 41.6582C45.4467 41.6582 39.5332 47.5716 39.5332 54.8662C39.5332 62.1608 45.4467 68.0742 52.7413 68.0742C52.9306 68.0742 53.1184 68.0678 53.3059 68.06C60.3383 67.7639 65.9493 61.9714 65.9493 54.8662ZM51.4013 47.1904C51.4013 46.4505 52.0016 45.8504 52.7413 45.8504C53.4818 45.8504 54.0812 46.4506 54.0812 47.1904V58.4298C54.0812 59.17 53.4818 59.7698 52.7413 59.7698C52.0016 59.7698 51.4013 59.17 51.4013 58.4298V47.1904ZM52.9098 63.8741C52.8535 63.8758 52.7972 63.8737 52.7411 63.868C52.0253 63.9404 51.3864 63.4187 51.314 62.7029C51.3084 62.6469 51.3064 62.5906 51.3079 62.5344C51.2962 61.7864 51.8929 61.1705 52.641 61.1586C52.6744 61.1581 52.7078 61.1588 52.7411 61.1608C53.4752 61.105 54.1155 61.6548 54.1713 62.3888C54.1749 62.4373 54.176 62.4859 54.1743 62.5344C54.1951 63.2536 53.6289 63.8534 52.9098 63.8741Z" fill="#DEDEF9" />
  <path d="M52.7404 59.77C53.4809 59.77 54.0803 59.1702 54.0803 58.43V47.1906C54.0803 46.4507 53.4809 45.8506 52.7404 45.8506C52.0007 45.8506 51.4004 46.4508 51.4004 47.1906V58.43C51.4003 59.1702 52.0007 59.77 52.7404 59.77Z" fill="#5C5CE0" />
  <path d="M52.7404 61.1611C52.707 61.1592 52.6736 61.1585 52.6402 61.159C51.8922 61.1708 51.2954 61.7868 51.3072 62.5348C51.3056 62.591 51.3076 62.6472 51.3133 62.7032C51.3856 63.4191 52.0246 63.9407 52.7404 63.8684C52.7964 63.8741 52.8527 63.8761 52.909 63.8745C53.6282 63.8537 54.1943 63.2539 54.1736 62.5348C54.1752 62.4862 54.1742 62.4376 54.1706 62.3892C54.1148 61.6552 53.4744 61.1054 52.7404 61.1611Z" fill="#5C5CE0" />
</svg>
`;

export const EasyUploadVariants = {
    removeBackgroundEasyUploadVariant: 'remove-background-easy-upload-variant',
    resizeImageEasyUploadVariant: 'resize-image-easy-upload-variant',
    cropImageEasyUploadVariant: 'crop-image-easy-upload-variant',
    convertToJPEGEasyUploadVariant: 'convert-to-jpeg-easy-upload-variant',
    convertToPNGEasyUploadVariant: 'convert-to-png-easy-upload-variant',
    convertToSVGEasyUploadVariant: 'convert-to-svg-easy-upload-variant',
    editImageEasyUploadVariant: 'edit-image-easy-upload-variant',
};

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
    [EasyUploadVariants.removeBackgroundEasyUploadVariant]: '<To be added>',
    [EasyUploadVariants.resizeImageEasyUploadVariant]: '<To be added>',
    [EasyUploadVariants.cropImageEasyUploadVariant]: '<To be added>',
    [EasyUploadControls.removeBackgroundEasyUploadControl]: '<To be added>',
    [EasyUploadControls.resizeImageEasyUploadControl]: '<To be added>',
    [EasyUploadControls.cropImageEasyUploadControl]: '<To be added>',
    [EasyUploadControls.convertToJPEGEasyUploadControl]: '<To be added>',
    [EasyUploadControls.convertToPNGEasyUploadControl]: '<To be added>',
    [EasyUploadControls.convertToSVGEasyUploadControl]: '<To be added>',
    [EasyUploadVariants.convertToJPEGEasyUploadVariant]: '<To be added>',
    [EasyUploadVariants.convertToPNGEasyUploadVariant]: '<To be added>',
    [EasyUploadVariants.convertToSVGEasyUploadVariant]: '<To be added>',
    [EasyUploadControls.editImageEasyUploadControl]: '<To be added>',
    [EasyUploadVariants.editImageEasyUploadVariant]: '<To be added>',
};

const QR_CODE_CDN_URL = 'https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js';

// URL Shortener Service Configuration
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

// ACP Storage Constants
const ACP_STORAGE_CONFIG = {
    MAX_FILE_SIZE: 60000000, // 60 MB
    TRANSFER_DOCUMENT: 'application/vnd.adobecloud.bulk-transfer+json',
    CONTENT_TYPE: 'application/octet-stream',
    SECOND_IN_MS: 1000,
    MAX_POLLING_ATTEMPTS: 100,
    POLLING_TIMEOUT_MS: 100000,
};

// Link Relation Constants
const LINK_REL = {
    BLOCK_UPLOAD_INIT: 'http://ns.adobe.com/adobecloud/rel/block/upload/init',
    BLOCK_TRANSFER: 'http://ns.adobe.com/adobecloud/rel/block/transfer',
    BLOCK_FINALIZE: 'http://ns.adobe.com/adobecloud/rel/block/finalize',
    SELF: 'self',
    RENDITION: 'http://ns.adobe.com/adobecloud/rel/rendition',
};

// QR Code Configuration Constants
const QR_CODE_CONFIG = {
    REFRESH_INTERVAL: 30 * 1000 * 60, // 30 minutes
    GENERATION_TIMEOUT: 10 * 1000, // 10 seconds timeout for QR code generation
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

// File Type Detection Patterns
const FILE_TYPE_PATTERNS = {
    // Image types
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg', 'jfif', 'exif'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/svg+xml': ['svg'],
    'image/bmp': ['bmp'],
    'image/heic': ['heic'],
    // Video types
    'video/mp4': ['mp4'],
    'video/quicktime': ['mov'],
    'video/x-msvideo': ['avi'],
    'video/webm': ['webm'],
};

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
     */
    constructor(uploadService, envName, quickAction, block, startSDKWithUnconvertedFiles, createTag, showErrorToast) {
        // Core dependencies
        this.uploadService = uploadService;
        this.envName = envName;
        this.quickAction = quickAction;
        this.block = block;
        this.startSDKWithUnconvertedFiles = startSDKWithUnconvertedFiles;
        this.createTag = createTag;
        this.showErrorToast = showErrorToast;
        // QR Code state
        this.qrCode = null;
        this.qrCodeContainer = null;
        this.qrRefreshInterval = null;
        this.loaderContainer = null;
        // Start loading QR Code library immediately (non-blocking)
        this.qrCodeLibraryPromise = this.loadQRCodeLibrary();

        // Upload state
        this.confirmButton = null;

        // ACP Storage state
        this.asset = null;
        this.uploadAsset = null;
        this.pollingInterval = null;
        this.versionReadyPromise = null;

        // Toast state
        this.toastTimeoutId = null;

        // Bind cleanup to window unload
        this.handleBeforeUnload = () => this.cleanup();
        window.addEventListener('beforeunload', this.handleBeforeUnload);
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
   * Extract link href from asset links by relation type
   * @param {object} links - Asset links object
   * @param {string} relation - Link relation type
   * @returns {string|null} Link href or null if not found
   */
    extractLinkHref(links, relation) {
        if (!links || !links[relation]) {
            return null;
        }
        return links[relation].href;
    }

  /**
   * Extract upload URL from transfer document
   * @param {object} uploadAsset - Upload asset with links
   * @returns {string} Upload URL
   * @throws {Error} If block transfer URL not found
   */
    extractUploadUrl(uploadAsset) {
        const uploadUrl = this.extractLinkHref(uploadAsset._links, LINK_REL.BLOCK_TRANSFER);
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
        console.log('Generating upload URL for mobile client');

        try {
            this.asset = await this.uploadService.createAsset(ACP_STORAGE_CONFIG.CONTENT_TYPE);
            this.uploadAsset = await this.uploadService.initializeBlockUpload(
                this.asset,
                ACP_STORAGE_CONFIG.MAX_FILE_SIZE,
                ACP_STORAGE_CONFIG.MAX_FILE_SIZE,
                ACP_STORAGE_CONFIG.CONTENT_TYPE,
            );

            const uploadUrl = this.uploadAsset._links[LINK_REL.BLOCK_TRANSFER][0].href;

            console.log('Upload URL generated successfully', {
                assetId: this.asset.assetId,
                hasUploadUrl: !!uploadUrl,
            });

            return uploadUrl;
        } catch (error) {
            console.error('Failed to generate upload URL:', error);
            throw error;
        }
    }

  /**
   * Wait for asset version to be ready by polling
   * @returns {Promise<void>} Resolves when asset is ready
   * @throws {Error} If polling times out or max attempts reached
   */
    async waitForAssetVersionReady() {
        return new Promise((resolve, reject) => {
            this.versionReadyPromise = { resolve, reject };
            let pollAttempts = 0;

            const timeoutId = setTimeout(() => {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                }
                reject(new Error(`Polling timeout: Asset version not ready after ${ACP_STORAGE_CONFIG.POLLING_TIMEOUT_MS}ms`));
            }, ACP_STORAGE_CONFIG.POLLING_TIMEOUT_MS);

            this.pollingInterval = setInterval(async () => {
                try {
                    pollAttempts += 1;
                    console.log('Polling for asset version', {
                        assetId: this.asset?.assetId,
                        attempt: pollAttempts,
                    });

                    const version = await this.uploadService.getAssetVersion(this.asset);
                    const success = version === '1';

                    if (success) {
                        clearInterval(this.pollingInterval);
                        clearTimeout(timeoutId);
                        console.log('Asset version ready', {
                            assetId: this.asset?.assetId,
                            attempts: pollAttempts,
                        });
                        resolve();
                    } else if (pollAttempts >= ACP_STORAGE_CONFIG.MAX_POLLING_ATTEMPTS) {
                        clearInterval(this.pollingInterval);
                        clearTimeout(timeoutId);
                        reject(new Error(`Max polling attempts reached (${ACP_STORAGE_CONFIG.MAX_POLLING_ATTEMPTS}). Asset version: ${version}`));
                    }
                } catch (error) {
                    clearInterval(this.pollingInterval);
                    clearTimeout(timeoutId);
                    console.error('Error during version polling:', error);
                    reject(error);
                }
            }, ACP_STORAGE_CONFIG.SECOND_IN_MS);
        });
    }

    /**
     * Finalize the upload process
     * @returns {Promise<void>}
     */
    async finalizeUpload() {
        return this.uploadService.finalizeUpload(this.uploadAsset);
    }

  /**
   * Detect file type from content string by pattern matching
   * @param {string} typeString - Content string to analyze
   * @returns {string} Detected MIME type
   */
    detectFileType(typeString) {
        const lowerTypeString = typeString.toLowerCase();

        // Check against known patterns
        for (const [mimeType, patterns] of Object.entries(FILE_TYPE_PATTERNS)) {
            if (patterns.some((pattern) => lowerTypeString.includes(pattern))) {
                return mimeType;
            }
        }

        // Default to JPEG for images
        return 'image/jpeg';
    }

  /**
   * Retrieve uploaded file from ACP Storage
   * @returns {Promise<File>} Retrieved file with detected type
   * @throws {Error} If file retrieval fails
   */
    async retrieveUploadedFile() {
        console.log('Retrieving uploaded file', { assetId: this.asset?.assetId });

        try {
            await this.waitForAssetVersionReady();

            if (this.versionReadyPromise?.isRejected) {
                throw new Error('Asset version not ready');
            }

            const blob = await this.uploadService.downloadAssetContent(this.asset);
            const typeString = await blob.slice(0, 50).text();
            const detectedType = this.detectFileType(typeString);
            const fileName = `upload_${Date.now()}_${generateUUID().substring(0, 8)}`;

            const file = new File([blob], fileName, { type: detectedType });

            console.log('File retrieved successfully', {
                assetId: this.asset?.assetId,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });

            return file;
        } catch (error) {
            console.error('Failed to retrieve uploaded file:', error);
            throw error;
        }
    }

  /**
   * Cleanup ACP Storage resources and state
   * @returns {Promise<void>}
   */
    async cleanupAcpStorage() {
        console.log('Cleaning up ACP Storage resources', {
            assetId: this.asset?.assetId,
            hasPollingInterval: !!this.pollingInterval,
        });

        try {
            if (this.uploadService && this.asset) {
                await this.uploadService.deleteAsset(this.asset);
            }

            this.asset = null;
            this.uploadAsset = null;

            console.log('ACP Storage cleanup completed');
        } catch (error) {
            console.error('Error during ACP Storage cleanup:', error);
        }
    }

    /**
     * Generate upload URL with timeout protection
     * @returns {Promise<string>} Upload URL
     * @throws {Error} If URL generation fails or times out
     */
    async generateUploadUrl() {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`QR code generation timed out after ${QR_CODE_CONFIG.GENERATION_TIMEOUT / 1000} seconds`));
            }, QR_CODE_CONFIG.GENERATION_TIMEOUT);
        });

        // Create the actual URL generation promise
        const urlGenerationPromise = (async () => {
            try {
                // Generate presigned upload URL
                const presignedUrl = await this.generatePresignedUploadUrl();

                // Build mobile upload URL
                return await this.shortenUrl(this.buildMobileUploadUrl(presignedUrl));
            } catch (error) {
                console.error('Failed to generate upload URL:', error);
                throw error;
            }
        })();

        // Race between URL generation and timeout
        return Promise.race([urlGenerationPromise, timeoutPromise]);
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
        // Return long URL for logged-out users
        if (!window?.adobeIMS?.isSignedInUser()) {
            console.log('User not logged in, using original URL');
            return longUrl;
        }

        try {
            const accessToken = window.adobeIMS.getAccessToken()?.token;
            if (!accessToken) {
                console.log('No access token available, using original URL');
                return longUrl;
            }

            const urlShortenerConfig = getUrlShortenerConfig(this.envName);
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const metaData = 'easy-upload-qr-code';

            console.log('Attempting to shorten URL', {
                originalUrlLength: longUrl.length,
                timeZone,
                metaData,
            });

            const url = new URL(`${urlShortenerConfig.serviceUrl}/v1/short-links/`);
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'x-api-key': urlShortenerConfig.apiKey,
                },
                body: JSON.stringify({
                    url: longUrl,
                    timeZone,
                    metaData,
                }),
            });

            if (!response.ok) {
                console.warn('Failed to shorten URL (HTTP error), using original', {
                    status: response.status,
                    statusText: response.statusText,
                });
                return longUrl;
            }

            const data = await response.json();
            if (data.status === 'success' && data.data) {
                console.log('URL shortened successfully', {
                    shortUrl: data.data,
                    originalLength: longUrl.length,
                    shortLength: data.data.length,
                });
                return data.data;
            }

            console.warn('Failed to shorten URL (unexpected response), using original', {
                responseData: data,
            });
            return longUrl;
        } catch (error) {
            console.error('Error shortening URL, using original', {
                error: error instanceof Error ? error.message : String(error),
            });
            return longUrl;
        }
    }

    /**
     * Create loader container with rotating SVG
     * @returns {HTMLElement} Loader container element
     */
    createLoader() {
        if (!this.loaderContainer) {
            this.loaderContainer = this.createTag('div', { class: 'qr-code-loader' });
            this.loaderContainer.innerHTML = ROTATE_LOADER_SVG;
        }
        const dropzone = document.querySelector('.dropzone');
        const buttonContainer = dropzone?.querySelector('.button-container');
        buttonContainer.appendChild(this.loaderContainer);
        return this.loaderContainer;
    }

    /**
     * Show loader in place of QR code
     */
    showLoader() {
        if (!this.loaderContainer) {
            this.createLoader();
        }
        // Hide QR code container if it exists
        if (this.qrCodeContainer) {
            this.qrCodeContainer.classList.add('hidden');
        }

        // Show loader
        if (this.loaderContainer) {
            this.loaderContainer.classList.remove('hidden');
        }

        // Disable confirm import button
        this.updateConfirmButtonState(true);
    }

    /**
     * Hide loader and show QR code
     */
    hideLoader() {
        if (this.loaderContainer) {
            this.loaderContainer.classList.add('hidden');
        }

        // Show QR code container
        if (this.qrCodeContainer) {
            this.qrCodeContainer.classList.remove('hidden');
        }

        // Enable confirm import button
        this.updateConfirmButtonState(false);
    }

    /**
     * Show failed QR code state
     */
    showFailedQR() {
        // Hide loader
        if (this.loaderContainer) {
            this.loaderContainer.classList.add('hidden');
        }

        // Show QR code container with failed state
        if (this.qrCodeContainer) {
            this.qrCodeContainer.innerHTML = FAILED_QR_SVG;
            this.qrCodeContainer.classList.remove('hidden');
        } else {
            // Create QR code container if it doesn't exist
            const dropzone = document.querySelector('.dropzone');
            const buttonContainer = dropzone?.querySelector('.button-container');
            if (buttonContainer) {
                this.qrCodeContainer = this.createTag('div', { class: 'qr-code-container' });
                this.qrCodeContainer.innerHTML = FAILED_QR_SVG;
                buttonContainer.appendChild(this.qrCodeContainer);
            }
        }

        // Keep confirm button disabled in failed state
        this.updateConfirmButtonState(true);
    }

    /**
     * Display QR code in the UI
     * @param {string} uploadUrl - URL to encode in QR code
     * @returns {Promise<void>}
     */
    async displayQRCode(uploadUrl) {
        // Await the library promise that started loading in constructor
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

        // Create containers for QR code and loader
        const dropzone = document.querySelector('.dropzone');
        const buttonContainer = dropzone?.querySelector('.button-container');

        if (buttonContainer) {
            // Create QR code container if it doesn't exist
            if (!this.qrCodeContainer) {
                this.qrCodeContainer = this.createTag('div', { class: 'qr-code-container' });
                buttonContainer.appendChild(this.qrCodeContainer);
            }

            // Create and insert loader container parallel to QR code container
            if (!this.loaderContainer) {
                this.createLoader();
                this.loaderContainer.classList.add('hidden');
                buttonContainer.appendChild(this.loaderContainer);
            }
        }

        if (this.qrCodeContainer) {
            this.qrCodeContainer.innerHTML = '';
            this.qrCode.append(this.qrCodeContainer);
        }

        // Hide loader and show QR code
        this.hideLoader();
    }

    /**
     * Initialize QR code with upload URL
     * @returns {Promise<void>}
     * @throws {Error} If initialization fails
     */
    async initializeQRCode() {
        try {
            // Show loader while generating QR code
            this.showLoader();

            const uploadUrl = await this.generateUploadUrl();
            console.log('Upload URL:', uploadUrl);
            await this.displayQRCode(uploadUrl);

            // Set up refresh interval
            this.scheduleQRRefresh();
        } catch (error) {
            console.error('Failed to initialize QR code:', error);
            // Show failed QR state
            this.showFailedQR();
            // Show error toast
            this.showErrorToast(this.block, 'Failed to generate QR code.');
        }
    }

    /**
     * Schedule QR code refresh after configured interval
     */
    scheduleQRRefresh() {
        // Clear existing interval
        if (this.qrRefreshInterval) {
            clearTimeout(this.qrRefreshInterval);
        }

        // Schedule next refresh
        this.qrRefreshInterval = setTimeout(() => {
            this.refreshQRCode();
        }, QR_CODE_CONFIG.REFRESH_INTERVAL);
    }

    /**
     * Refresh QR code with new upload URL
     * @returns {Promise<void>}
     */
    async refreshQRCode() {
        try {
            console.log('Refreshing QR code...');
            await this.cleanup();
            await this.initializeQRCode();
        } catch (error) {
            console.error('Failed to refresh QR code:', error);
        }
    }

    /**
     * Handle confirm import button click
     * Finalizes upload and starts SDK with the uploaded file
     * @returns {Promise<void>}
     */
    async handleConfirmImport() {
        this.updateConfirmButtonState(true);

        try {
            if (!this.uploadService) {
                throw new Error('Upload service not initialized');
            }

            // Finalize the upload first
            await this.finalizeUpload();
        } catch (error) {
            console.error('Failed to finalize upload:', error);
            // Show error toast
            this.showErrorToast(this.block, 'Wait for a few more seconds for mobile upload to complete.');
            // Re-enable button to allow retry on error
            this.updateConfirmButtonState(false);
            return;
        }
        try {
            // Retrieve the uploaded file
            const file = await this.retrieveUploadedFile();

            if (file) {
                // Process the file (trigger the standard upload flow)
                await this.startSDKWithUnconvertedFiles([file], this.quickAction, this.block, true);
                // Keep button disabled on success (operation complete)
            } else {
                throw new Error('No file was uploaded');
            }
        } catch (error) {
            console.error('Failed to confirm import:', error);
            // Show error toast
            this.showErrorToast(this.block, 'Invalid file, try uploading another file.');
            // Re-enable button to allow retry on error
            this.refreshQRCode();
        }
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
                this.confirmButton.style.pointerEvents = 'none';
            } else {
                this.confirmButton.classList.remove('disabled');
                this.confirmButton.removeAttribute('aria-disabled');
                this.confirmButton.style.pointerEvents = 'auto';
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

        confirmButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleConfirmImport();
        });

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
            // Add Confirm Import button
            const dropzone = document.querySelector('.dropzone');
            const buttonContainer = dropzone?.querySelector('.button-container');
            await this.initializeQRCode();
            if (buttonContainer) {
                const confirmButton = this.createConfirmButton();
                buttonContainer.appendChild(confirmButton);
            }
        } catch (error) {
            console.error('Failed to setup QR code interface:', error);
            throw error;
        }
    }

    /**
     * Cleanup all resources and event listeners
     * @returns {Promise<void>}
     */
    async cleanup() {
        // Clear refresh interval
        if (this.qrRefreshInterval) {
            clearTimeout(this.qrRefreshInterval);
            this.qrRefreshInterval = null;
        }

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.versionReadyPromise) {
            this.versionReadyPromise.reject(new Error('EasyUpload cleanup'));
            this.versionReadyPromise = null;
        }

        // Cleanup ACP Storage resources
        await this.cleanupAcpStorage();

        console.log('EasyUpload resources cleaned up');
    }
}
