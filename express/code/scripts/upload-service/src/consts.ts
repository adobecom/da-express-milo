import type { EnvironmentType } from './types';

export const REPO_API_ENDPOINTS: Record<EnvironmentType, string> = {
  'local': 'https://platform-cs-stage.adobe.io',
  'stage': 'https://platform-cs-stage.adobe.io',
  'prod': 'https://platform-cs.adobe.io'
};
export const API_KEY = 'AdobeExpressWeb';
export const DEFAULT_STORAGE_PATH = 'assets';
export const DEFAULT_USER_ERROR_MESSAGE = 'Upload failed. Please try again.';
/**
 * Centralized error codes and messages for the UploadService
 */
export const ERROR_CODES = {
    UPLOAD_FAILED: {
      code: 'UPLOAD_FAILED',
      message: DEFAULT_USER_ERROR_MESSAGE,
    },
    URL_GENERATION_FAILED: {
      code: 'URL_GENERATION_FAILED',
      message: 'Failed to generate pre-signed URL'
    },
    REPOSITORY_REQUIRED: {
      code: 'REPOSITORY_REQUIRED',
      message: 'Repository is required for normal token uploads'
    },
    DIRECTORY_REQUIRED: {
      code: 'DIRECTORY_REQUIRED',
      message: 'Directory is required for normal token uploads'
    },
    REPOSITORY_REQUIRED_FOR_DIRECTORY: {
      code: 'REPOSITORY_REQUIRED_FOR_DIRECTORY',
      message: 'Repository is required for directory operations'
    },
    FAILED_TO_CREATE_ASSET: {
      code: 'FAILED_TO_CREATE_ASSET',
      message: 'Failed to create asset'
    },
  } as const;

  export const UPLOAD_EVENTS = {
    UPLOAD_STATUS: 'x-express-upload-status'
  } as const;