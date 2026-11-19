// The unit-tests gate runs as root inside the harness container, and Chrome
// refuses to start as root with its sandbox on. This is the repository's own
// config with the sandbox turned off; `npm test` and CI do not use it.
import { chromeLauncher } from '@web/test-runner-chrome';
import config from '../web-test-runner.config.js';

export default {
  ...config,
  browsers: [
    chromeLauncher({ launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] } }),
  ],
};
