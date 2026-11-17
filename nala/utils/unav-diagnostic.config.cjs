const path = require('path');
const normal = require('../../playwright.config.cjs');
const { EMPTY_STORAGE_STATE } = require('../libs/ims-login.cjs');
const { BASE_URL } = require('./unav-diagnostic.cjs');

if (process.env.IMS_EMAIL || process.env.IMS_PASS || process.env.MILO_LIBS) {
  throw new Error('Run this diagnostic without IMS credentials or a Milo override.');
}
process.env.NALA_UNAV_DIAGNOSTIC = '1';

const login = normal.projects.find((project) => project.name === 'express-login-chromium');

module.exports = {
  ...normal,
  testDir: path.resolve(__dirname, '..'),
  globalSetup: undefined,
  outputDir: path.resolve(__dirname, '../../test-results/unav-diagnostic'),
  reporter: [[path.resolve(__dirname, 'unav-diagnostic.reporter.cjs')]],
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  retries: 0,
  timeout: 180000,
  grep: /@ims-login-signed-out\b/,
  use: {
    ...normal.use,
    baseURL: BASE_URL,
    storageState: EMPTY_STORAGE_STATE,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [{
    ...login,
    testMatch: '**/features/ims-login/ims-login.login.test.cjs',
    dependencies: [],
    use: {
      ...login.use,
      baseURL: BASE_URL,
      storageState: EMPTY_STORAGE_STATE,
      trace: 'off',
      screenshot: 'off',
      video: 'off',
    },
  }],
};
