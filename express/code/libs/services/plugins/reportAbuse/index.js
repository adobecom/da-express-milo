export default {
  name: 'reportAbuse',
  featureFlag: 'ENABLE_REPORTABUSE',
  loader: () => import('./ReportAbusePlugin.js'),
  providerLoader: () => import('../../providers/ReportAbuseProvider.js'),
};

