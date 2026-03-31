const loadDownloadPlugin = () => import('./DownloadPlugin.js');
const loadDownloadProvider = () => import('../../providers/DownloadProvider.js');

export default {
  name: 'download',
  featureFlag: 'ENABLE_DOWNLOAD',
  loader: loadDownloadPlugin,
  providerLoader: loadDownloadProvider,
};
