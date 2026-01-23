export default {
  name: 'behance',
  featureFlag: 'ENABLE_BEHANCE',
  loader: () => import('./BehancePlugin.js'),
};

