import { defaultReporter } from '@web/test-runner';
import { chromeLauncher } from '@web/test-runner-chrome';

function customReporter() {
  return {
    async reportTestFileResults({ logger, sessionsForTestFile }) {
      sessionsForTestFile.forEach((session) => {
        if (session.testResults && session.testResults.tests) {
          session.testResults.tests.forEach((test) => {
            if (!test.passed && !test.skipped) {
              logger.log(test);
            }
          });
        }
      });
    },
  };
}

// Headless Chrome only renders the tab in front, and test files run side by side
// in separate tabs. A test that needs real rendering (IntersectionObserver,
// scrolling) calls executeServerCommand('bring-to-front') first.
function bringToFront() {
  return {
    name: 'bring-to-front',
    async executeCommand({ command, session }) {
      if (command !== 'bring-to-front') return undefined;
      await session.browser.getPage?.(session.id)?.bringToFront();
      return true;
    },
  };
}

// Pinned to Puppeteer's historical default so layout-dependent tests don't depend on the
// launcher. Keep it under 900px wide: milo's delayed google-login loads IMS on desktop widths.
const VIEWPORT = { width: 800, height: 600 };

export default {
  nodeResolve: true,
  browsers: [chromeLauncher({ launchOptions: { defaultViewport: VIEWPORT } })],
  plugins: [bringToFront()],
  // Mocha's 2s default is calibrated for a fast machine with one file in front; CI runs ~2.5x
  // slower with files in parallel background tabs, so async setup routinely crosses it.
  testFramework: { config: { timeout: 10000 } },
  coverageConfig: {
    exclude: [
      '**/mocks/**',
      '**/node_modules/**',
      '**/test/**',
      '**/deps/**',
    ],
  },
  reporters: [
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    customReporter(),
  ],
  testRunnerHtml: (testFramework) => `
    <html>
      <head>
        <script type='module'>
          // External requests make tests slow, flaky and network-dependent, so they fail the
          // test: the request is blocked without hitting the network and recorded, and root
          // hooks fail the current (or, for import-time requests, the first) test. Recording
          // instead of relying on the rejection means callers that swallow errors can't hide it.
          // Mocking guidance: https://github.com/orgs/adobecom/discussions/814#discussioncomment-6060759
          const isExternal = (url) => new URL(url, location.href).hostname !== location.hostname;
          const violations = [];
          const disallow = (kind, url) => {
            violations.push(\`\${kind} \${url}\`);
            return new Error(\`\${kind} to external resource is disallowed in unit tests, please mock it: \${url}\`);
          };
          const assertNoExternalRequests = () => {
            if (!violations.length) return;
            const list = violations.splice(0).join('\\n  ');
            throw new Error(\`External requests are disallowed in unit tests, please mock them:\\n  \${list}\`);
          };
          // Mocha publishes its BDD globals on window right before loading the test file;
          // registering here puts the hooks on the root suite, so they cover every test.
          ['afterEach', 'after'].forEach((name) => {
            Object.defineProperty(window, name, {
              configurable: true,
              set(hook) {
                Object.defineProperty(window, name, { value: hook, configurable: true, writable: true });
                hook(assertNoExternalRequests);
              },
            });
          });

          // Milo's loadDelayed() (started by importing scripts.js) loads the privacy/OneTrust stack
          // 3s later unless window.adobePrivacy exists, so any test running past 3s would trip it.
          window.adobePrivacy = { activeCookieGroups: () => [] };

          // Importing scripts.js starts milo's page bootstrap, which makes a few external requests
          // on its own schedule (loadPage() asks geo2 for the country; loadDelayed() ~3s later
          // fetches aria/notification data and may load IMS and martech). They come from the
          // bootstrap, not the code under test, and slow runs push more tests past 3s, so the
          // harness answers them instead of every file mocking them. Tests that care about the
          // country can still stub fetch themselves.
          const GEO2 = 'https://geo2.adobe.com/json/';
          const MILO_DELAYED_DATA = /^https:\\/\\/main--(milo|federal)--adobecom\\.aem\\.(live|page)\\/(libs\\/consonant\\.json|federal\\/assets\\/data\\/[\\w-]+\\.json)$/;
          const BOOTSTRAP_SCRIPTS = /^https:\\/\\/(main--milo--adobecom\\.aem\\.(live|page)\\/libs\\/deps\\/imslib\\.min\\.js|www\\.adobe\\.com\\/marketingtech\\/[\\w.-]+\\.js)$/;
          const oldFetch = window.fetch;
          window.fetch = function fetch(resource, options) {
            const url = resource instanceof Request ? resource.url : String(resource);
            if (url === GEO2) return Promise.resolve(Response.json({ country: 'US' }));
            if (MILO_DELAYED_DATA.test(url)) return Promise.resolve(new Response(null, { status: 404 }));
            if (isExternal(url)) return Promise.reject(disallow('fetch', url));
            return oldFetch.call(this, resource, options);
          };

          const oldXHROpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
            if (isExternal(String(url))) throw disallow('XMLHttpRequest', url);
            return oldXHROpen.call(this, method, url, ...rest);
          };

          // Block at src assignment: by the time a MutationObserver sees the inserted node the
          // browser has already started fetching it. An error event lets loaders settle.
          const blockScript = (script, url) => {
            if (!isExternal(String(url))) return false;
            if (!BOOTSTRAP_SCRIPTS.test(String(url))) disallow('script', url);
            setTimeout(() => script.dispatchEvent(new Event('error')));
            return true;
          };
          const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
          Object.defineProperty(HTMLScriptElement.prototype, 'src', {
            ...srcDescriptor,
            set(url) {
              if (!blockScript(this, url)) srcDescriptor.set.call(this, url);
            },
          });
          const oldSetAttribute = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function setAttribute(name, value) {
            if (this instanceof HTMLScriptElement && String(name).toLowerCase() === 'src'
              && blockScript(this, value)) return;
            oldSetAttribute.call(this, name, value);
          };
        </script>
      </head>
      <body>
        <script type='module' src='${testFramework}'></script>
      </body>
    </html>`,
};
