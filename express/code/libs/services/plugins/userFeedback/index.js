export default {
  name: 'userFeedback',
  featureFlag: 'ENABLE_USERFEEDBACK',
  loader: () => import('./UserFeedbackPlugin.js'),
  providerLoader: () => import('../../providers/UserFeedbackProvider.js'),
};

