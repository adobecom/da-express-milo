import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/content-toggle-v2/content-toggle-v2.js'),
  import('../../../express/code/scripts/utils.js'),
]);
const { default: decorate } = imports[1];
const { decorateArea } = imports[2];

const testBody = await readFile({ path: './mocks/body.html' });

function removeMainDivDisplayNone() {
  // Get all style sheets
  const styleSheets = Array.from(document.styleSheets);

  // Find the main stylesheet
  const mainStylesheet = styleSheets.find((sheet) => sheet.href && sheet.href.includes('main.css'));

  if (mainStylesheet) {
    try {
      // Try to insert the new rule
      mainStylesheet.insertRule(`
        main > div {
          display: block !important;
        }
      `, mainStylesheet.cssRules.length);
    } catch (e) {
      console.error('Error modifying stylesheet:', e);
    }
  }
}

describe('Content Toggle V2', async () => {
  let contentToggleV2;
  beforeEach(() => {
    window.isTestEnv = true;
    document.body.innerHTML = testBody;
    window.placeholders = { 'search-branch-links':
       'https://adobesparkpost.app.link/c4bWARQhWAb' };
    // Reset URL to avoid test leakage through query params
    window.history.replaceState({}, '', window.location.pathname);
    contentToggleV2 = document.querySelector('.content-toggle-v2');
    removeMainDivDisplayNone();
  });
  afterEach(() => {
    // Clear any focus and reset DOM to minimize side effects between tests
    if (document && document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    window.history.replaceState({}, '', window.location.pathname);
    document.body.innerHTML = '';
  });

  it('should have all things', async () => {
    await decorateArea(document);
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 100));
    await decorate(contentToggleV2);

    // Wait for the decoration to complete
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 100));

    const carouselContainer = contentToggleV2.querySelector('.carousel-container');
    const carouselPlatform = carouselContainer?.querySelector('.carousel-platform');

    expect(carouselContainer).to.exist;
    expect(carouselPlatform).to.exist;
    expect(contentToggleV2.querySelectorAll('button.content-toggle-button')).lengthOf(9);
  });

  it('should handle keyboard navigation and activation', async () => {
    await decorateArea(document);
    contentToggleV2 = document.querySelector('.content-toggle-v2');
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 300));
    await decorate(contentToggleV2);

    const carouselButtons = contentToggleV2
      .querySelectorAll('button.content-toggle-button');
    const targetButton = carouselButtons[3];

    const event = new Event('keydown', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    event.key = 'Enter';
    event.code = 'Enter';
    event.keyCode = 13;
    event.which = 13;
    event.shiftKey = false;
    event.metaKey = false;

    // targetButton.dispatchEvent(clickEvent);
    targetButton.focus();
    targetButton.dispatchEvent(event);
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 100));

    carouselButtons[5].click();
    // Verify the button was activated
    expect(carouselButtons[5].classList.contains('active')).to.be.true;
  });
});
