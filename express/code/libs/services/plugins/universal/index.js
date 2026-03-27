export default {
  name: 'universal',
  featureFlag: 'ENABLE_UNIVERSAL',
  loader: () => import('./UniversalSearchPlugin.js'),
  providerLoader: () => import('../../providers/UniversalSearchProvider.js'),
};
