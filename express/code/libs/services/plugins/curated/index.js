export default {
  name: 'curated',
  featureFlag: 'ENABLE_CURATED',
  loader: () => import('./CuratedPlugin.js'),
};
