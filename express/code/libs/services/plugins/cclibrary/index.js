export default {
  name: 'cclibrary',
  featureFlag: 'ENABLE_CCLIBRARY',
  loader: () => import('./CCLibraryPlugin.js'),
};

