import type { AdobeAsset } from '@dcx/common-types';
import type { RepoResponseResult } from '@dcx/assets';

const OPERATION_TYPE = {
  GUEST: 'guest',
  USER: 'user'
} as const;

type OperationType = typeof OPERATION_TYPE[keyof typeof OPERATION_TYPE];

const MESSAGES = {
  GUEST_START: 'Creating asset for guest user',
  USER_START: 'Creating asset for authenticated user',
  GUEST_ERROR: 'Error creating asset for guest',
  USER_ERROR: 'Error creating asset for authenticated user',
  UPLOAD_SUCCESSFUL: 'Upload successful',
  UPLOAD_REDIRECT: 'Upload redirect',
  UPLOAD_FAILED: 'Upload failed',
  UNKNOWN_STATUS: 'Unknown status code'
} as const;

const STATUS_MESSAGES = {
  200: { icon: '✅', message: 'Upload successful' },
  201: { icon: '✅', message: 'Upload successful' },
  202: { icon: '✅', message: 'Upload accepted - processing asynchronously' },
  400: { icon: '❌', message: 'Bad Request' },
  401: { icon: '❌', message: 'Unauthorized' },
  403: { icon: '❌', message: 'Forbidden' },
  404: { icon: '❌', message: 'Not Found' },
  409: { icon: '⚠️', message: 'Conflict' },
  412: { icon: '⚠️', message: 'Precondition Failed' },
  413: { icon: '❌', message: 'Payload Too Large' },
  429: { icon: '❌', message: 'Rate Limited' },
  500: { icon: '❌', message: 'Internal Server Error' },
  502: { icon: '❌', message: 'Bad Gateway' },
  503: { icon: '❌', message: 'Service Unavailable' },
  504: { icon: '❌', message: 'Gateway Timeout' }
} as const;

const DEFAULT_ERROR_MESSAGES = {
  401: 'Invalid or expired authentication token',
  403: 'Insufficient permissions or resource access denied',
  404: 'Repository, directory, or resource not found',
  409: 'Asset already exists or version conflict',
  412: 'Version mismatch or etag validation failed',
  413: 'File size exceeds maximum allowed limit',
  429: 'Too many requests - rate limit exceeded',
  500: 'Server encountered an internal error',
  502: 'Server acting as gateway received invalid response',
  503: 'Service temporarily unavailable',
  504: 'Gateway timeout while waiting for response'
} as const;

/**
 * Enhanced logging utilities for upload operations
 * Provides detailed logging and status code handling for upload responses
 */
export class EnhancedLogging {
  private log: Console;

  constructor() {
    this.log = console;
  }

  /**
   * Get operation display name
   */
  private getOperationName(operation: OperationType, isError = false): string {
    if (isError) {
      return operation === OPERATION_TYPE.GUEST ? MESSAGES.GUEST_ERROR : MESSAGES.USER_ERROR;
    }
    return operation === OPERATION_TYPE.GUEST ? MESSAGES.GUEST_START : MESSAGES.USER_START;
  }

  /**
   * Extract response headers for logging
   */
  private extractResponseHeaders(headers: Record<string, string> = {}): {
    contentLength: string;
    retryAfter: string | null;
    rateLimitRemaining: string | null;
    rateLimitReset: string | null;
  } {
    return {
      contentLength: headers['content-length'] || 'unknown',
      retryAfter: headers['retry-after'] || null,
      rateLimitRemaining: headers['x-ratelimit-remaining'] || null,
      rateLimitReset: headers['x-ratelimit-reset'] || null
    };
  }

  /**
   * Create log data for upload response
   */
  private createUploadResponseLogData(
    operation: string,
    result: RepoResponseResult<AdobeAsset>,
    fullPath: string,
    fileSize: number
  ) {
    const { response } = result;
    const headers = this.extractResponseHeaders(response.headers);
    
    return {
      operation,
      fullPath,
      fileSize,
      statusCode: response.statusCode,
      statusMessage: response.message,
      responseCode: response.code,
      hasAsset: !!result.result,
      assetId: result.result?.assetId,
      assetName: result.result?.name,
      ...headers
    };
  }

  /**
   * Log based on response status code range
   */
  private logByStatusRange(statusCode: number, logData: any): void {
    if (statusCode >= 200 && statusCode < 300) {
      this.log.log(MESSAGES.UPLOAD_SUCCESSFUL, logData);
    } else if (statusCode >= 300 && statusCode < 400) {
      this.log.log(MESSAGES.UPLOAD_REDIRECT, logData);
    } else {
      this.log.log(MESSAGES.UPLOAD_FAILED, logData);
    }
  }

  /**
   * Create status log message with icon and user type
   */
  private createStatusLogMessage(statusCode: number, authType: OperationType): string {
    const statusInfo = STATUS_MESSAGES[statusCode as keyof typeof STATUS_MESSAGES];
    if (statusInfo) {
      return `${statusInfo.icon} ${statusInfo.message} (${statusCode}) for ${authType} user`;
    }
    return `ℹ️ ${MESSAGES.UNKNOWN_STATUS} (${statusCode}) for ${authType} user`;
  }

  /**
   * Handle success status codes (200-299)
   */
  private handleSuccessStatus(statusCode: number, authType: OperationType): void {
    const message = this.createStatusLogMessage(statusCode, authType);
    this.log.log(message);
  }

  /**
   * Handle client error status codes (400-499)
   */
  private handleClientErrorStatus(
    statusCode: number,
    response: any,
    authType: OperationType
  ): void {
    const message = this.createStatusLogMessage(statusCode, authType);
    const errorMessage = response.message || DEFAULT_ERROR_MESSAGES[statusCode as keyof typeof DEFAULT_ERROR_MESSAGES];
    
    const logData = {
      message: errorMessage,
      code: response.code,
      authType
    };

    // Add specific headers for certain error types
    if (statusCode === 413) {
      (logData as any).maxSize = response.headers?.['x-max-upload-size'] || 'unknown';
    } else if (statusCode === 429) {
      (logData as any).retryAfter = response.headers?.['retry-after'] || 'unknown';
      (logData as any).rateLimitReset = response.headers?.['x-ratelimit-reset'] || 'unknown';
      (logData as any).rateLimitRemaining = response.headers?.['x-ratelimit-remaining'] || '0';
    } else if (statusCode === 503) {
      (logData as any).retryAfter = response.headers?.['retry-after'] || 'unknown';
    }

    if (statusCode === 409 || statusCode === 412) {
      this.log.log(message, logData);
    } else {
      this.log.log(message, logData);
    }
  }

  /**
   * Handle server error status codes (500-599)
   */
  private handleServerErrorStatus(
    statusCode: number,
    response: any,
    authType: OperationType
  ): void {
    const message = this.createStatusLogMessage(statusCode, authType);
    const errorMessage = response.message || DEFAULT_ERROR_MESSAGES[statusCode as keyof typeof DEFAULT_ERROR_MESSAGES];
    
    const logData = {
      message: errorMessage,
      authType
    };

    if (statusCode === 503) {
      (logData as any).retryAfter = response.headers?.['retry-after'] || 'unknown';
    }

    this.log.log(message, logData);
  }

  /**
   * Format error object for logging
   */
  private formatError(error: any) {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        code: (error as any).code,
        statusCode: (error as any).response?.statusCode
      };
    }
    return error;
  }

  /**
   * Log detailed upload response information
   */
  logUploadResponse(
    operation: string,
    result: RepoResponseResult<AdobeAsset>,
    fullPath: string,
    fileSize: number
  ): void {
    const logData = this.createUploadResponseLogData(operation, result, fullPath, fileSize);
    this.logByStatusRange(result.response.statusCode, logData);
  }

  /**
   * Handle specific status codes with appropriate logging and actions
   */
  handleUploadStatusCode(
    statusCode: number,
    response: any,
    authType: OperationType
  ): void {
    if (statusCode >= 200 && statusCode < 300) {
      this.handleSuccessStatus(statusCode, authType);
    } else if (statusCode >= 400 && statusCode < 500) {
      this.handleClientErrorStatus(statusCode, response, authType);
    } else if (statusCode >= 500) {
      this.handleServerErrorStatus(statusCode, response, authType);
    } else {
      // Handle other status codes (3xx, etc.)
      const message = this.createStatusLogMessage(statusCode, authType);
      this.log.log(message, { message: response.message, authType });
    }
  }

  /**
   * Log upload operation start with context
   */
  logUploadStart(operation: OperationType, context: {
    fullPath: string;
    contentType: string;
    fileSize: number;
    [key: string]: any;
  }): void {
    const operationName = this.getOperationName(operation);
    this.log.log(`${operationName}:`, context);
  }

  /**
   * Log upload operation error with detailed context
   */
  logUploadError(operation: OperationType, context: {
    fullPath: string;
    contentType: string;
    fileSize: number;
    [key: string]: any;
  }, error: any): void {
    const operationName = this.getOperationName(operation, true);
    
    this.log.log(`${operationName}:`, {
      ...context,
      error: this.formatError(error)
    });
  }
}
