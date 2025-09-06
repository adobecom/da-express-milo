import { InitOptions, type AuthConfig } from '../types';
import { UploadService } from './UploadService';
import { API_KEY, DEFAULT_STORAGE_PATH, REPO_API_ENDPOINTS } from '../consts';

export const initUploadService = async (options: InitOptions) => {
  const isSignedInUser =  window?.adobeIMS?.isSignedInUser() || false;
  const authConfig: AuthConfig = {
    tokenType: isSignedInUser ? 'user' : 'guest',
    token: window?.adobeIMS?.getAccessToken()?.token,
    apiKey: API_KEY
  };

  const uploadService = new UploadService({
    authConfig,
    endpoint: REPO_API_ENDPOINTS[options.environment],
    basePath: DEFAULT_STORAGE_PATH,
    environment: options.environment
  });

  await uploadService.setIndexRepository();

  await uploadService.initializeLogging();

  return uploadService;
};