export default {
  name: 'kuler',
  featureFlag: 'ENABLE_KULER',
  loader: () => import('./KulerPlugin.js'),
  providerLoader: () => import('../../providers/KulerProvider.js'),
};

