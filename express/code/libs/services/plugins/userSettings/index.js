export default {
  name: 'userSettings',
  featureFlag: 'ENABLE_USERSETTINGS',
  loader: () => import('./UserSettingsPlugin.js'),
};
