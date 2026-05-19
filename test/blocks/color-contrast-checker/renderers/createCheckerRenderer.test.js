import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createCheckerRenderer } from '../../../../express/code/blocks/color-contrast-checker/renderers/createCheckerRenderer.js';
import createContrastDataService from '../../../../express/code/blocks/color-contrast-checker/services/createContrastDataService.js';
import createRecommendationService from '../../../../express/code/blocks/color-contrast-checker/services/createRecommendationService.js';
import { generateTints } from '../../../../express/code/blocks/color-contrast-checker/utils/contrastUtils.js';
import createContextProvider from '../../../../express/code/scripts/color-shared/shell/contextProvider.js';

function waitForFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

async function waitForElement(selector, attempts = 10) {
  for (let index = 0; index < attempts; index += 1) {
    const element = document.body.querySelector(selector);
    if (element) return element;
    await waitForFrame();
  }

  return null;
}

describe('createCheckerRenderer', () => {
  let renderer;

  beforeEach(() => {
    sinon.stub(window, 'matchMedia').callsFake((query) => ({
      matches: query === '(max-width: 599px)',
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      text: async () => '<svg></svg>',
    });
  });

  afterEach(() => {
    renderer?.destroy();
    renderer = null;
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('renders the WCAG tooltip on the ratio label text', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer = createCheckerRenderer({
      container,
      dataService: createContrastDataService(),
      config: {
        initialForeground: '#222222',
        initialBackground: '#FFFFFF',
      },
      services: {
        recommendation: createRecommendationService(),
      },
    });

    await renderer.render();

    const ratioLabel = container.querySelector('.cc-ratio-label-text');
    const tooltip = ratioLabel?.querySelector('sp-tooltip');

    expect(ratioLabel).to.exist;
    expect(ratioLabel?.tagName).to.equal('SP-ACTION-BUTTON');
    expect(tooltip?.textContent.trim()).to.equal('Ensure your color choices meet WCAG compliance');
  });

  it('renders AA and AAA summary header tooltips', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer = createCheckerRenderer({
      container,
      dataService: createContrastDataService(),
      config: {
        initialForeground: '#222222',
        initialBackground: '#FFFFFF',
      },
      services: {
        recommendation: createRecommendationService(),
      },
    });

    await renderer.render();

    const headerTooltips = [...container.querySelectorAll('.cc-summary-header-cell--level sp-tooltip')]
      .map((tooltip) => tooltip.textContent.trim());

    expect(headerTooltips).to.deep.equal([
      'Must meet a ratio of 3:1',
      'Must meet a ratio of 4.5:1',
    ]);
  });

  it('shows normalized tint display values and distinct accessible names for each tint input', async () => {
    const container = document.createElement('div');
    const backgroundTint = generateTints('#336699', 20)[9];
    document.body.appendChild(container);

    renderer = createCheckerRenderer({
      container,
      dataService: createContrastDataService(),
      config: {
        initialForeground: '#FFFFFF',
        initialBackground: backgroundTint,
      },
      services: {
        recommendation: createRecommendationService(),
      },
    });

    await renderer.render();

    const tintInputs = [...container.querySelectorAll('.cc-tint-value-input')];
    const sliders = [...container.querySelectorAll('color-channel-slider')];

    expect(tintInputs).to.have.lengthOf(2);
    expect(sliders).to.have.lengthOf(2);

    expect(tintInputs[0].value).to.equal('1');
    expect(tintInputs[0].getAttribute('aria-label')).to.equal('Foreground color: Tint value');
    expect(tintInputs[0].getAttribute('name')).to.equal('foreground-color-tint-value');

    expect(tintInputs[1].value).to.equal('0.5');
    expect(tintInputs[1].getAttribute('aria-label')).to.equal('Background color: Tint value');
    expect(tintInputs[1].getAttribute('name')).to.equal('background-color-tint-value');
    expect(tintInputs[1].getAttribute('inputmode')).to.equal('decimal');

    sliders[1].dispatchEvent(new CustomEvent('input', {
      detail: { value: 20 },
      bubbles: true,
      composed: true,
    }));
    expect(tintInputs[1].value).to.equal('1');

    sliders[1].dispatchEvent(new CustomEvent('input', {
      detail: { value: 19 },
      bubbles: true,
      composed: true,
    }));
    expect(tintInputs[1].value).to.equal('0.9');

    sliders[1].dispatchEvent(new CustomEvent('input', {
      detail: { value: 0 },
      bubbles: true,
      composed: true,
    }));
    expect(tintInputs[1].value).to.equal('0');

    tintInputs[1].dispatchEvent(new Event('focus'));
    expect(tintInputs[1].value).to.equal('0');

    tintInputs[1].value = '0.5a';
    tintInputs[1].dispatchEvent(new Event('input'));
    expect(tintInputs[1].value).to.equal('0.5');

    tintInputs[1].dispatchEvent(new Event('change'));
    expect(tintInputs[1].value).to.equal('0.5');
    expect(sliders[1].value).to.equal(10);

    tintInputs[1].value = '124';
    tintInputs[1].dispatchEvent(new Event('change'));
    expect(tintInputs[1].value).to.equal('1');
    expect(sliders[1].value).to.equal(20);

    tintInputs[1].value = '50';
    tintInputs[1].dispatchEvent(new Event('change'));
    expect(tintInputs[1].value).to.equal('0.5');
    expect(sliders[1].value).to.equal(10);

    tintInputs[1].value = 'abc';
    tintInputs[1].dispatchEvent(new Event('input'));
    expect(tintInputs[1].value).to.equal('');
    tintInputs[1].dispatchEvent(new Event('change'));
    expect(tintInputs[1].value).to.equal('0.5');
    expect(sliders[1].value).to.equal(10);
  });

  it('syncs the tint slider when color-edit updates to a non-exact tint value', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer = createCheckerRenderer({
      container,
      dataService: createContrastDataService(),
      config: {
        initialForeground: '#FFFFFF',
        initialBackground: '#336699',
      },
      services: {
        recommendation: createRecommendationService(),
      },
    });

    await renderer.render();

    const backgroundField = container.querySelectorAll('.ax-color-input__field')[1];
    const tintInputs = [...container.querySelectorAll('.cc-tint-value-input')];
    const sliders = [...container.querySelectorAll('color-channel-slider')];

    backgroundField.click();

    const editor = await waitForElement('color-edit');
    expect(editor).to.exist;

    editor.dispatchEvent(new CustomEvent('color-change', {
      detail: { hex: '#7A7A7A' },
      bubbles: true,
      composed: true,
    }));

    expect(tintInputs[1].value).to.equal('0.5');
    expect(sliders[1].value).to.equal(10);
  });

  it('passes the active palette from context into color-edit', async () => {
    const container = document.createElement('div');
    const context = createContextProvider();
    const colors = ['#101010', '#202020', '#303030'];
    document.body.appendChild(container);

    context.set('palette', {
      colors,
      selectedForeground: '#101010',
      selectedBackground: '#202020',
    });

    renderer = createCheckerRenderer({
      container,
      context,
      dataService: createContrastDataService(),
      config: {
        initialForeground: '#101010',
        initialBackground: '#202020',
      },
      services: {
        recommendation: createRecommendationService(),
      },
    });

    await renderer.render();

    const backgroundField = container.querySelectorAll('.ax-color-input__field')[1];
    backgroundField.click();

    const editor = await waitForElement('color-edit');
    expect(editor).to.exist;
    expect(editor.palette).to.deep.equal(colors);
    expect(editor.selectedIndex).to.equal(1);
    expect(editor.showPalette).to.equal(true);
  });
});
