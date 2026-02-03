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
     * @param {Function} showErrorToast - Function to show error toast
     * @param {string} qrErrorText - Error text to display when QR code fails
     */
    constructor(uploadService, envName, quickAction, block, startSDKWithUnconvertedFiles, createTag, showErrorToast, qrErrorText = '') {
        // Core dependencies
        this.uploadService = uploadService;
        this.envName = envName;
        this.quickAction = quickAction;
        this.block = block;
        this.startSDKWithUnconvertedFiles = startSDKWithUnconvertedFiles;
        this.createTag = createTag;
        this.showErrorToast = showErrorToast;
        this.qrErrorText = qrErrorText;
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
    getQrButtonContainer() {
        return this.block?.querySelector('.qr-code-widget-container')
            || this.block?.querySelector('.dropzone .button-container')
            || document.querySelector('.qr-code-widget-container')
            || document.querySelector('.dropzone .button-container');
    }

    createLoader() {
        if (!this.loaderContainer) {
            this.loaderContainer = this.createTag('div', { class: 'qr-code-loader' });
            this.loaderContainer.innerHTML = ROTATE_LOADER_SVG;
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
     * Show failed QR code state with grayed out QR icon, caution icon, and error message
     */
    showFailedQR() {
        // Hide loader
        if (this.loaderContainer) {
            this.loaderContainer.classList.add('hidden');
        }

        // Create the error state HTML
        const errorStateHtml = `
            <div class="qr-error-state">
                <div class="qr-error-icon-container">
                    <img src="/express/code/blocks/frictionless-quick-action/easy-upload/placeholder.png" class="qr-error-bg-icon" alt="" />
                    <img src="/express/code/icons/error.svg" class="qr-error-caution-icon" alt="Error" />
                    <p class="qr-error-message">${this.qrErrorText || 'Failed to generate QR code'}</p>
                </div>
            </div>
        `;

        // Show QR code container with failed state
        if (this.qrCodeContainer) {
            this.qrCodeContainer.innerHTML = errorStateHtml;
            this.qrCodeContainer.classList.remove('hidden');
        } else {
            // Create QR code container if it doesn't exist
            const buttonContainer = this.getQrButtonContainer();
            if (buttonContainer) {
                this.qrCodeContainer = this.createTag('div', { class: 'qr-code-container' });
                this.qrCodeContainer.innerHTML = errorStateHtml;
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
        const buttonContainer = this.getQrButtonContainer();

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
