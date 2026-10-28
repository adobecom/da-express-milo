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

// Pin layout-dependent tests to Puppeteer's historical default viewport.
const VIEWPORT = { width: 800, height: 600 };

export default {
  nodeResolve: true,
  browsers: [chromeLauncher({ launchOptions: { defaultViewport: VIEWPORT } })],
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
          // This must precede the test framework: importing scripts.js starts loadPage() at module
          // scope, and individual test hooks are too late to prevent the production bootstrap.
          window.isTestEnv = true;

          // External requests make tests slow, flaky, and network-dependent. Block them before
          // they leave the browser and record violations so swallowed request errors still fail.
          // Mocking guidance: https://github.com/orgs/adobecom/discussions/814#discussioncomment-6060759
          const NativeURL = URL;
          const NativeRequest = Request;
          const isExternal = (url) => {
            const { protocol, hostname } = new NativeURL(url, location.href);
            return /^https?:$/.test(protocol) && hostname !== location.hostname;
          };
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

          // Mocha publishes its BDD globals immediately before loading the test module. These
          // setters attach root hooks at that point, covering import-time and in-test requests.
          ['afterEach', 'after'].forEach((name) => {
            Object.defineProperty(window, name, {
              configurable: true,
              set(hook) {
                Object.defineProperty(window, name, {
                  value: hook,
                  configurable: true,
                  writable: true,
                });
                hook(assertNoExternalRequests);
              },
            });
          });

          // Analytics enriches some otherwise-local interactions with Geo2 data. Provide the
          // deterministic response that those tests need without allowing a network request.
          const GEO2 = 'https://geo2.adobe.com/json/';
          const oldFetch = window.fetch;
          window.fetch = function fetch(resource, options) {
            const url = resource instanceof NativeRequest ? resource.url : String(resource);
            if (url === GEO2) return Promise.resolve(Response.json({ country: 'US' }));
            if (isExternal(url)) return Promise.reject(disallow('fetch', url));
            return oldFetch.call(this, resource, options);
          };

          const oldXHROpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
            if (isExternal(String(url))) throw disallow('XMLHttpRequest', url);
            return oldXHROpen.call(this, method, url, ...rest);
          };

          // Block script URLs at assignment time; observing an inserted node is too late because
          // the browser may already have started its request. Dispatch an error so loaders settle.
          const blockScript = (script, url) => {
            if (!isExternal(String(url))) return false;
            disallow('script', url);
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
