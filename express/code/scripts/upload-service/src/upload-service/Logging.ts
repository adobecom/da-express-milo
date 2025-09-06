import { ENVIRONMENT_TYPES, type EnvironmentType } from '../types';

const MARKER_TYPES = {
  LOG_UPLOAD_START: 'LOG_UPLOAD_START',
  LOG_UPLOAD_RESPONSE: 'LOG_UPLOAD_RESPONSE',
  LOG_UPLOAD_STATUS: 'LOG_UPLOAD_STATUS',
  LOG_UPLOAD_ERROR: 'LOG_UPLOAD_ERROR'
} as const;

type MarkerType = typeof MARKER_TYPES[keyof typeof MARKER_TYPES];


/**
 * Logging markers for different types of upload operations
 */
export class LogMarkers {
  private markers: typeof MARKER_TYPES;
  private isInitialized = false;

  constructor() {
    this.markers = MARKER_TYPES;
  }

  /**
   * Initialize the markers (for consistency with other classes)
   */
  initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  /**
   * Get all available markers
   */
  getMarkers(): typeof MARKER_TYPES {
    if (!this.isInitialized) {
      throw new Error('LogMarkers must be initialized before use');
    }
    return this.markers;
  }

  /**
   * Get a specific marker
   */
  getMarker(markerName: keyof typeof MARKER_TYPES): MarkerType {
    if (!this.isInitialized) {
      throw new Error('LogMarkers must be initialized before use');
    }
    return this.markers[markerName];
  }

  /**
   * Check if a string is a valid marker
   */
  isValidMarker(marker: string): marker is MarkerType {
    return Object.values(this.markers).includes(marker as MarkerType);
  }
}

/**
 * Logging service that conditionally loads and uses EnhancedLogging
 * Only loads the logging module and performs logging in local environments
 * Instance-based class that requires initialization
 */
export class LogService {
  private enhancedLoggingInstance: any = null;
  private logMarkers: LogMarkers;
  private isInitialized = false;
  private isLoggingEnabled = false;
  private environment: EnvironmentType | null = null;

  constructor() {
    this.logMarkers = new LogMarkers();
    this.logMarkers.initialize();
  }

  /**
   * Initialize the logging service
   * Dynamically imports EnhancedLogging if environment is local
   * @param environment - The current environment ('local', 'stage', 'prod')
   */
  async initialize(environment: EnvironmentType): Promise<void> {
    if (this.isInitialized) return;

    this.environment = environment;
    this.isLoggingEnabled = this.shouldEnableLogging(environment);
    
    if (this.isLoggingEnabled) {
      try {
        await this.loadEnhancedLogging();
      } catch (error) {
        console.warn('Failed to load EnhancedLogging module:', error);
        this.isLoggingEnabled = false;
      }
    }
    
    this.isInitialized = true;
  }

  /**
   * Check if logging should be enabled for the environment
   */
  private shouldEnableLogging(environment: EnvironmentType): boolean {
    return environment === ENVIRONMENT_TYPES.LOCAL;
  }

  /**
   * Load the EnhancedLogging module dynamically
   */
  private async loadEnhancedLogging(): Promise<void> {
    const module = await import('./EnhancedLogging');
    this.enhancedLoggingInstance = new module.EnhancedLogging();
  }

  /**
   * Get the markers instance
   */
  getMarkers(): LogMarkers {
    if (!this.isInitialized) {
      throw new Error('LogService must be initialized before accessing markers');
    }
    return this.logMarkers;
  }

  /**
   * Single public function for all logging operations
   * @param marker - The logging marker indicating the type of log
   * @param args - Arguments specific to the logging operation
   */
  log(marker: string, ...args: any[]): void {
    if (!this.isInitialized) {
      console.warn('LogService not initialized - call initialize() first');
      return;
    }

    if (!this.isLoggingEnabled || !this.enhancedLoggingInstance) return;

    if (!this.logMarkers.isValidMarker(marker)) {
      console.warn(`Unknown logging marker: ${marker}`);
      return;
    }

    this.executeLogging(marker as MarkerType, ...args);
  }

  /**
   * Execute the appropriate logging method based on marker
   */
  private executeLogging(marker: MarkerType, ...args: any[]): void {
    switch (marker) {
      case MARKER_TYPES.LOG_UPLOAD_START:
        this.enhancedLoggingInstance.logUploadStart(...args);
        break;
      case MARKER_TYPES.LOG_UPLOAD_RESPONSE:
        this.enhancedLoggingInstance.logUploadResponse(...args);
        break;
      case MARKER_TYPES.LOG_UPLOAD_STATUS:
        this.enhancedLoggingInstance.handleUploadStatusCode(...args);
        break;
      case MARKER_TYPES.LOG_UPLOAD_ERROR:
        this.enhancedLoggingInstance.logUploadError(...args);
        break;
    }
  }

  /**
   * Check if logging is enabled for the current environment
   */
  isEnabled(): boolean {
    return this.isLoggingEnabled;
  }

  /**
   * Get current environment
   */
  getEnvironment(): EnvironmentType | null {
    return this.environment;
  }

  /**
   * Check if the service is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset the service state (useful for testing)
   */
  reset(): void {
    this.enhancedLoggingInstance = null;
    this.isInitialized = false;
    this.isLoggingEnabled = false;
    this.environment = null;
    this.logMarkers = new LogMarkers();
    this.logMarkers.initialize();
  }
}
