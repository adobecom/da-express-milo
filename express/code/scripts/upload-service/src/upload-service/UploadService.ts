import type { AdobeRepoAPISession } from '@dcx/repo-api-session';
import type { LogService } from './Logging';
import type { 
  AdobeAsset,
  AdobeHTTPService,
  UploadProgressCallback,
  SliceableData,
  AdobeMinimalAsset,
  LinkSet,
  ACPTransferDocument
} from '@dcx/common-types';
import {
  type UploadServiceConfig,
  type UploadOptions,
  type UploadResult,
  type PreSignedUrlOptions,
  type AuthConfig,
  UploadStatus
} from '../types';
import { createRepoAPISession } from '@dcx/repo-api-session';
import { Directory, getPresignedUrl, PathOrIdAssetDesignator, RepoResponseResult, RepositoryLinksCache, LinkRelation } from '@dcx/assets';
import { ERROR_CODES } from '../consts';
import { createHTTPService } from '@dcx/http';
import { UploadStatusEvent } from '../events';
import { getLinkHrefTemplated } from "@dcx/util";

/**
 * Service for uploading assets to Adobe Content Platform Storage
 * Supports both guest token and normal access token authentication
 */

interface ACPTransferDocumentWithLinks extends ACPTransferDocument {
  _links: LinkSet;
}
export class UploadService {
  private session: AdobeRepoAPISession;
  private config: UploadServiceConfig;
  private httpService: AdobeHTTPService;
  private authConfig: AuthConfig;
  private logService?: LogService;
  private _uploadStatus: UploadStatus = UploadStatus.IDLE;
  private _uploadBytesCompleted: boolean = false;
  private _uploadProgressPercentage: number = 0;

  private TRANSFER_DOCUMENT: string;

  /**
   * Create a new UploadService instance
   * @param config - Configuration for the upload service
   */
  constructor(config: UploadServiceConfig) {
    this.config = config;
    this.httpService = createHTTPService();
    this.authConfig = config.authConfig;
    this.session = this.prepareSession();
    this.TRANSFER_DOCUMENT = 'application/vnd.adobecloud.bulk-transfer+json';
  }

  /**
   * Initialize logging service
   */
  async initializeLogging(): Promise<void> {
    const { LogService } = await import('./Logging');
    this.logService = new LogService();
    await this.logService.initialize(this.config.environment);
  }

  /**
   * Initialize repository for user token type
   */
  private async initializeUserRepository(): Promise<void> {
    try {
      const repository = await this.setupUserRepository();
      if (repository) {
        this.config.repository = repository;
      }
    } catch (error) {
      throw this.handleError(
        ERROR_CODES.REPOSITORY_REQUIRED.code,
        error
      );
    }
  }

  /**
   * Sets up the user repository for the upload service
   * This function does a couple of things:
   * 1. Gets the index document for the user
   * 2. Gets the children of the index document
   * 3. If there is only one child, that is the repository
   * 4. If there are multiple children, it finds the temp folder. If there is no temp folder, it uses the first child as the repository
   * 5. Returns the repository ID and path
   * @returns Promise resolving to the repository
   */
  private async setupUserRepository(): Promise<AdobeMinimalAsset | null> {
    const indexDocumentResponse = await this.session.getIndexDocument();
    const { assignedDirectories } = indexDocumentResponse.result;
    const indexRepoId = assignedDirectories?.[0]?.repositoryId;
    const indexAssetId = assignedDirectories?.[0]?.assetId;

    this.config.directory = new Directory({ repositoryId: indexRepoId, assetId: indexAssetId }, this.httpService);
    const children = await this.config.directory.getPagedChildren();

    if(children?.result) {
      const directoryChildren = children.result.children;
      if(directoryChildren.length === 1) {
        const repository = directoryChildren[0];
        return {
          repositoryId: repository["repo:repositoryId"],
          path: repository["repo:path"]
        };
      } else {
        //Find the temp folder for the user from the children repositories
        let tempFolder = directoryChildren.find((child: any) => child["repo:name"] === "temp");
        if(!tempFolder) {
          tempFolder = directoryChildren[0];
        }
        return {
          repositoryId: tempFolder["repo:repositoryId"],
          path: tempFolder["repo:path"]
        };
      }
    }

    return null;
  }

  /**
   * Get the current upload status
   * @returns The current upload status
   */
  get uploadStatus(): UploadStatus {
    return this._uploadStatus;
  }

  /**
   * Set the upload status
   * @param status - The status to set
   */
  set uploadStatus(status: UploadStatus) {
    this._uploadStatus = status;
    this.dispatchStatusEvent(status);
  }

  /**
   * Initialize the upload service
   */
  async setIndexRepository(): Promise<void> {    
    if(this.authConfig.tokenType === 'user') {
      await this.initializeUserRepository();
    }
  }

  /**
   * Upload an asset to storage
   * @param options - Upload options including file, path, and metadata
   * @returns Promise resolving to upload result
   */
  async uploadAsset(options: UploadOptions): Promise<UploadResult> {
    this.uploadStatus = UploadStatus.IDLE;

    try {
      const {
        file,
        fileName,
        path = this.config.basePath,
        onProgress = this.getUploadProgress()
      } = options;

      const fileData = this.convertToSliceableData(file);
      const fileSize = this.getFileSize(file);
      const fullPath = this.buildPath(path, this.generateFileName(fileName));
      const optionsWithProgress = { ...options, onProgress };

      let result: RepoResponseResult<AdobeAsset>;

      switch (this.authConfig.tokenType) {
        case 'guest': {
          const guestResult = await this.createAssetForGuest(
            optionsWithProgress,
            fileData,
            fileSize,
            fullPath
          );
          result = guestResult.result;
          break;
        }
        case 'user':
        default: {
          const userResult = await this.createAssetForUser(
            optionsWithProgress,
            fileData,
            fileSize,
            fullPath
          );
          result = userResult.result;
          break;
        }
      }

      if(this._uploadBytesCompleted) {
        this.uploadStatus = UploadStatus.COMPLETED;
      }

      const asset = result.result;
      return {
        asset
      };

    } catch (error) {
      throw this.handleError(
        ERROR_CODES.UPLOAD_FAILED.code,
        error
      );
    }
  }

  /**
   * Create asset for guest users
   * @param options - Upload options
   * @param fileData - Processed file data
   * @param fileSize - Size of the file
   * @param fullPath - Full path for the asset
   * @returns Promise resolving to asset creation result and optionlally pre-signed URL
   */
  private async createAssetForGuest(
    options: UploadOptions,
    fileData: SliceableData,
    fileSize: number,
    fullPath: string
  ): Promise<{ result: RepoResponseResult<AdobeAsset>; preSignedUrl?: string }> {
    const {
      contentType,
      resourceDesignator,
      additionalHeaders = {},
      repoMetaPatch,
      onProgress
    } = options;

    
    this.logService?.log('LOG_UPLOAD_START', 'guest', {
      fullPath,
      contentType,
      fileSize,
      hasResourceDesignator: !!resourceDesignator,
      hasRepoMetaPatch: !!repoMetaPatch
    });

    try {
      const result = await this.session.createAssetForGuest(
        fullPath,
        contentType,
        resourceDesignator,
        additionalHeaders,
        fileData,
        fileSize,
        repoMetaPatch,
        onProgress
      );

      this.logService?.log('LOG_UPLOAD_RESPONSE', 'createAssetForGuest', result, fullPath, fileSize);
      this.logService?.log('LOG_UPLOAD_STATUS', result.response.statusCode, result.response, 'guest');

      return { result };
    } catch (error) {
      this.logService?.log('LOG_UPLOAD_ERROR', 'guest', {
        fullPath,
        contentType,
        fileSize
      }, error);
      throw error;
    }
  }

  /**
   * Create asset for authenticated users
   * @param options - Upload options
   * @param fileData - Processed file data
   * @param fileSize - Size of the file
   * @param fullPath - Full path for the asset
   * @returns Promise resolving to asset creation result
   */
  private async createAssetForUser(
    options: UploadOptions,
    fileData: SliceableData,
    fileSize: number,
    fullPath: string
  ): Promise<{ result: RepoResponseResult<AdobeAsset> }> {
    const {
      contentType,
      resourceDesignator,
      additionalHeaders = {},
      repoMetaPatch,
      createIntermediates,
      onProgress
    } = options;

    let result: RepoResponseResult<AdobeAsset>;

    this.validateRequiredConfig([
      { field: 'directory', errorCode: ERROR_CODES.DIRECTORY_REQUIRED },
      { field: 'repository', errorCode: ERROR_CODES.REPOSITORY_REQUIRED }
    ]);

    this.logService?.log('LOG_UPLOAD_START', 'user', {
      fullPath,
      contentType,
      fileSize,
      createIntermediates: createIntermediates || true,
      hasResourceDesignator: !!resourceDesignator,
      hasRepoMetaPatch: !!repoMetaPatch,
      repository: this.config.repository?.name || 'unknown'
    });

    try {
      result = await this.config.directory!.createAsset(
        fullPath,
        createIntermediates || true,
        contentType,
        resourceDesignator,
        additionalHeaders,
        fileData,
        fileSize,
        repoMetaPatch,
        onProgress
      );

      this.logService?.log('LOG_UPLOAD_RESPONSE', 'createAssetForUser', result, fullPath, fileSize);
      this.logService?.log('LOG_UPLOAD_STATUS', result.response.statusCode, result.response, 'user');

    } catch (error) {
      this.logService?.log('LOG_UPLOAD_ERROR', 'user', {
        fullPath,
        contentType,
        fileSize,
        repository: this.config.repository?.name || 'unknown'
      }, error);
      
      throw this.handleError(
        ERROR_CODES.UPLOAD_FAILED.code,
        error
      );
    }

    return { result };
  }

  /**
   * Generate a pre-signed URL for downloading an asset
   * @param options - Options for URL generation
   * @returns Promise resolving to pre-signed URL result
   */
  async generatePreSignedUrl(options: PreSignedUrlOptions): Promise<string> {
    try {
      const {
        asset
      } = options;

      const { result: url } = await getPresignedUrl(this.httpService, asset);

      return url;

    } catch (error) {
      throw this.handleError(
        ERROR_CODES.URL_GENERATION_FAILED.code,
        error
      );
    }
  }

  /**
   * Generate a shareable pre-signed URL by base64 encoding the URL
   * This is useful for passing the URL via URL params
   * @param url - The pre-signed URL to share
   * @returns The shareable pre-signed URL
   */
  private generateShareablePreSignedUrl(url: string | undefined): string {
    if (!url) {
      return '';
    }
    return btoa(url);
  }

  /**
   * Generate a unique file name for the uploaded file
   * @param fileName - The original file name
   * @returns The unique file name
   */
  private generateFileName(fileName: string): string {
    const [name, extension] = fileName.split('.');
    const timestamp = Date.now();
    return `${name}-${timestamp}.${extension}`;
  }

  /**
   * Dispatch a status event
   * @param status - The status to dispatch
   */
  private dispatchStatusEvent(status: UploadStatus): void {
    window.dispatchEvent(new UploadStatusEvent({ status, progress: this._uploadProgressPercentage }));
  }

  /**
   * Get upload progress for an ongoing upload
   * @returns Promise resolving to upload progress information
   */
  getUploadProgress(): UploadProgressCallback {
    return (bytesCompleted, totalBytes) => {
      this._uploadProgressPercentage = Math.round((bytesCompleted / totalBytes) * 100);
      if(bytesCompleted === totalBytes) {
        this._uploadBytesCompleted = true;
      }
      this.uploadStatus = UploadStatus.UPLOADING;
    };
  }

  /**
   * Prepare the RAPI session for the upload service.
   */
  private prepareSession(): AdobeRepoAPISession {
    this.httpService.setAuthToken(this.authConfig.token);
    this.httpService.setApiKey(this.authConfig.apiKey);
    const session = createRepoAPISession(this.httpService, this.config.endpoint);
    session.setLinksCache(new RepositoryLinksCache());
    return session;
  }

  /**
   * Convert a file to a sliceable data object
   * @param file - The file to convert
   * @returns The sliceable data object
   */
  private convertToSliceableData(file: File | Blob | ArrayBuffer): SliceableData {
    if (file instanceof ArrayBuffer) {
      return new Uint8Array(file);
    }
    return file as SliceableData;
  }



  /**
   * Get the size of a file
   * @param file - The file to get the size of
   * @returns The size of the file
   */
  private getFileSize(file: File | Blob | ArrayBuffer): number {
    if (file instanceof ArrayBuffer) {
      return file.byteLength;
    }
    if ('size' in file) {
      return file.size;
    }
    return 0;
  }

  /**
   * Build a path for an asset for uploading.
   * @param path - The path to the asset
   * @param fileName - The name of the asset
   * @returns The full path to the asset
   */
  private buildPath(path: string, fileName: string): string {
    const fullPath = [path, fileName]
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');
    
    return fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
  }

  /**
   * Validate required configuration fields
   * @param validations - Array of field validations to perform
   * @throws Error if any required field is missing
   */
  private validateRequiredConfig(validations: Array<{ field: keyof UploadServiceConfig, errorCode: typeof ERROR_CODES[keyof typeof ERROR_CODES] }>): void {
    for (const { field, errorCode } of validations) {
      if (!this.config[field]) {
        throw this.handleError(
          errorCode.code as keyof typeof ERROR_CODES,
          new Error(errorCode.message)
        );
      }
    }
  }

  /**
   * Handle an error
   * @param code - The error code
   * @param originalError - The original error
   * @param message - The error message
   * @returns The error
   */
  private handleError(code: keyof typeof ERROR_CODES, originalError?: any, message?: string): Error {
    let errorCode = ERROR_CODES[code];

    this.uploadStatus = UploadStatus.FAILED;

    const errorMessage = message || errorCode.message;

    if(this.config.environment === 'local' || this.config.environment === 'stage') {
      window?.lana.log(`UploadService Error [${errorCode.code}]: ${errorMessage}`);
      window?.lana.log(originalError);
    } else {
      // Only show upload failed error in prod.
      errorCode = ERROR_CODES.UPLOAD_FAILED;
    }
    const error = new (class extends Error {
      constructor(
        message: string,
        public code: string,
        public originalError?: Error
      ) {
        super(message);
        this.name = 'UploadServiceError';
      }
    })(errorMessage, errorCode.code, originalError);
    
    return error;
  }

  /**
   * Update the service configuration
   * @param newConfig - New configuration to apply
   */
  updateConfig(newConfig: Partial<UploadServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.authConfig || newConfig.endpoint) {
      this.session = this.prepareSession();
    }
  }

  /**
   * Get the current configuration
   * @returns Current service configuration
   */
  getConfig(): UploadServiceConfig {
    return { ...this.config };
  }

  /**
   * Generate a unique file name for the uploaded file
   * @param fileName - The original file name
   * @returns The unique file name
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  async createAsset(contentType: string) {
    const path = `temp/${this.generateUUID()}/${this.generateUUID()}`;
    try {
      var createAssetResult: { result: RepoResponseResult<AdobeAsset> };
      const uploadOptions: UploadOptions = {
        contentType,
        path,
        createIntermediates: true,
        file: undefined as any,
        fileName: undefined as any,
      };
      if (this.authConfig.tokenType === 'user') {
        createAssetResult = await this.createAssetForUser(
          uploadOptions,
          undefined as any,
          undefined as any,
          path
        );
      } else {
        createAssetResult = await this.createAssetForGuest(
          uploadOptions,
          undefined as any,
          undefined as any,
          path
        );
      }
      return createAssetResult?.result?.result;
    } catch (error) {
      this.logService?.log("LOG_UPLOAD_START", "createAsset", "Failed to create temporary guest asset", {
        documentPath: path,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get assets version
   * @param asset
   * **/
  async getAssetVersion(asset: AdobeAsset): Promise<string> {
    try {
      const versions = await this.session.getVersions(asset);
      if (versions.response.statusCode < 200 || versions.response.statusCode >= 300) {
        const error = new Error(
          `Get Versions failed: ${versions.response.statusCode} ${versions.response.message}`
        );
        this.logService?.log("LOG_UPLOAD_ERROR", "getAssetVersion", "Failed to get asset versions", {
          assetId: asset.assetId,
          statusCode: versions.response.statusCode,
          message: versions.response.message
        });
        throw error;
      }

      if (!versions.result.versions || versions.result.versions.length === 0) {
        throw new Error("No versions found for asset");
      }

      const latestVersion = versions.result.versions[versions.result.versions.length - 1]["version"];
      this.logService?.log("LOG_UPLOAD_STATUS", "getAssetVersion", "Retrieved asset version", {
        assetId: asset.assetId,
        version: latestVersion,
        totalVersions: versions.result.versions.length
      });

      return latestVersion;
    } catch (error) {
      this.logService?.log("LOG_UPLOAD_ERROR", "getAssetVersion", "Error getting asset versions", {
        assetId: asset.assetId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Download asset content
   * @param asset
   * @returns Promise resolving to the asset content
   */
  async downloadAssetContent(asset: AdobeAsset): Promise<Blob> {
    try {
      const downloadResponse = await this.session.blockDownloadAsset(asset);

      this._validateDownloadResponse(downloadResponse);

      const blob = new Blob([downloadResponse.response as ArrayBuffer]);
      this._validateDownloadedContent(blob);


      this.logService?.log("LOG_UPLOAD_STATUS", "downloadAssetContent", "Asset content downloaded successfully", {
        assetId: asset.assetId,
        blobSize: blob.size
      });

      return blob;
    } catch (error) {
      this.logService?.log("LOG_UPLOAD_ERROR", "downloadAssetContent", "Failed to download asset content", {
        assetId: asset.assetId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
 * Validates downloaded content
 * @private
 */
  private _validateDownloadedContent(blob: Blob): void {
    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }
  }

  /**
 * Validates download response
 * @private
 */
  private _validateDownloadResponse(downloadResponse: any): void {
    if (downloadResponse.statusCode < 200 || downloadResponse.statusCode >= 300) {
      throw new Error(`Block download failed: ${downloadResponse.statusCode} ${downloadResponse.message}`);
    }

    if (downloadResponse.responseType !== "defaultbuffer") {
      throw new Error(`Unexpected response type: ${downloadResponse.responseType}. Expected: defaultbuffer`);
    }
  }

  /**
   * Deletes the asset
   * @private
   */
  async deleteAsset(asset: AdobeAsset): Promise<void> {
    const { repositoryId, assetId } = asset;
    try {
      await this.session.deleteAsset({ repositoryId, assetId } as PathOrIdAssetDesignator);
    } catch (error) {
      this.logService?.log("LOG_UPLOAD_ERROR", "deleteAsset", "Failed to delete asset", {
        assetId: assetId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
 * Extract link href from asset links
 */
  getLinkHref(links: any, relation: string) {
    return getLinkHrefTemplated(links, relation, {});
  }

  async initializeBlockUpload(asset: AdobeAsset, fileSize: number, blockSize: number, contentType: string) {
    try {
      const blockUploadUrl = this.getLinkHref(asset.links, LinkRelation.BLOCK_UPLOAD_INIT);
      if (!blockUploadUrl) {
        throw new Error('Block upload URL not found in asset links');
      }

      const blockUploadData = {
        'repo:size': fileSize,
        'repo:blocksize': blockSize,
        'repo:reltype': LinkRelation.PRIMARY,
        'dc:format': contentType
      };

      const response = await this.httpService.invoke(
        'POST',
        `${blockUploadUrl}?includes=all`,
        {
          'Content-Type': this.TRANSFER_DOCUMENT,
        },
        JSON.stringify(blockUploadData),
        {
          responseType: 'json'
        }
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        const errorText = await response.response.text().catch(() => 'Unknown error');
        throw new Error(`Block upload initialization failed: ${response.statusCode} ${response.message}. ${errorText}`);
      }

      const uploadAsset = await response.response

      this.logService?.log('LOG_UPLOAD_START', 'initializeBlockUpload', 'Block upload initialized successfully', {
        hasLinks: !!uploadAsset._links,
      });

      return uploadAsset;
    } catch (error) {
      this.logService?.log('LOG_UPLOAD_ERROR', 'initializeBlockUpload', 'Failed to initialize block upload:', error);
      throw error;
    }
  }

  /**
   * Finalize the upload
   */
  async finalizeUpload(asset: ACPTransferDocumentWithLinks) {
    try {
      const finalizeUrl = this.getLinkHref(asset._links, LinkRelation.BLOCK_FINALIZE);
      if (!finalizeUrl) {
        throw new Error('Block finalize URL not found in upload asset links');
      }

      const response = await this.httpService.invoke(
        'POST',
        finalizeUrl,
        { 'Content-Type': this.TRANSFER_DOCUMENT },
        JSON.stringify(asset),
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`Block upload finalization failed: ${response.statusCode} ${response.message}. ${response.response}`);
      }

      this.logService?.log('LOG_UPLOAD_STATUS', 'finalizeUpload', 'Upload finalized successfully');
    } catch (error) {
      this.logService?.log('LOG_UPLOAD_ERROR', 'finalizeUpload', 'Failed to finalize upload:', error);
      throw error;
    }
  }

}
