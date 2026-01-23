export default {
  name: 'stock',
  featureFlag: 'ENABLE_STOCK',
  loader: () => import('./StockPlugin.js'),
  providerLoader: () => import('../../providers/StockProvider.js'),
};

