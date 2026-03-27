export default {
  name: 'download',
  featureFlag: 'ENABLE_DOWNLOAD',
  loader: () => import('./DownloadPlugin.js'),
  providerLoader: () => import('../../providers/DownloadProvider.js'),
};
