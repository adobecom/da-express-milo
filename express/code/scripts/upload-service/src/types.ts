import { Directory } from '@dcx/assets';
import type { 
  AdobeAsset, 
  UploadProgressCallback,
  RepoMetaPatch,
  ResourceDesignator,
  AdobeMinimalAsset
} from '@dcx/common-types';

export const ENVIRONMENT_TYPES = {
  LOCAL: 'local',
  STAGE: 'stage',
  PROD: 'prod'
} as const;

export type EnvironmentType = typeof ENVIRONMENT_TYPES[keyof typeof ENVIRONMENT_TYPES];
export interface InitOptions {
  /** Environment to use for the upload service */
  environment: EnvironmentType;
}

/**
 * Type of authentication token being used
 */
export type TokenType = 'guest' | 'user';

/**
 * Configuration for the UploadService
 */
export interface UploadServiceConfig {
  /** Authentication configuration */
  authConfig: AuthConfig;
  /** Repository endpoint URL */
  endpoint: string;
  /** User repository (required for normal token uploads) */
  repository?: AdobeMinimalAsset;
  /** Directory to use for the upload service (required for normal token uploads) */
  directory?: Directory;
  /** Base path for guest uploads (optional) */
  basePath: string;
  /** Environment to use for the upload service */
  environment: InitOptions['environment'];
}

/**
 * Options for uploading an asset
 */
export interface UploadOptions {
  /** File to upload */
  file: File | Blob | ArrayBuffer;
  /** File name */
  fileName: string;
  /** Content type of the file */
  contentType: string;
  /** Relative path where to upload the file */
  path?: string;
  /** Whether to create intermediate directories */
  createIntermediates?: boolean;
  /** Progress callback for upload monitoring - uses upload-specific callback */
  onProgress?: UploadProgressCallback;
  /** Additional headers to include in the request */
  additionalHeaders?: Record<string, string>;
  /** Repository metadata patch */
  repoMetaPatch?: RepoMetaPatch;
  /** Resource designator for response */
  resourceDesignator?: ResourceDesignator;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  /** The uploaded asset */
  asset: AdobeAsset;
}

/**
 * Options for generating pre-signed URLs
 */
export interface PreSignedUrlOptions {
  /** Asset to generate URL for */
  asset: AdobeAsset;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Authentication token */
  token: string;
  /** API key */
  apiKey?: string;
  /** Token type */
  tokenType: TokenType;
} 

/**
 * Status of the upload
 */
export enum UploadStatus {
  /** Upload has not started */
  IDLE = 'idle',
  /** Upload is in progress */  
  UPLOADING = 'uploading',
  /** Upload is complete */
  COMPLETED = 'completed',
  /** Upload failed */
  FAILED = 'failed'
}

/**
 * Payload for upload event status
 */ 
export type UploadEventStatusPayload = {
  /** Status of the upload */
  status: UploadStatus;
  /** Progress percentage (0-100) */
  progress: number;
}