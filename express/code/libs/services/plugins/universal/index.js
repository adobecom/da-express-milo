export default {
  name: 'universal',
  featureFlag: 'ENABLE_UNIVERSAL',
  loader: () => import('./UniversalSearchPlugin.js'),
};

