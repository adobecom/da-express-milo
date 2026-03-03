/* eslint-disable max-len, no-promise-executor-return */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createToolbar } from '../../../../express/code/scripts/color-shared/toolbar/createToolbarComponent.js';
import { MOCK_PALETTE, MOCK_GRADIENT } from './mocks/palette.js';
import { createMockGetLibraryContext } from './mocks/stubs.js';

const noopDeps = { loadDeps: () => {} };

function defaultOptions(overrides = {}) {
  return {
    palette: MOCK_PALETTE,
    type: 'palette',
    variant: 'standalone',
    ctaText: 'Create with my color palette',
    mobileCTAText: 'Create',
    showEdit: true,
    showPaletteName: true,
    editPaletteName: false,
    onCTA: sinon.stub(),
    deps: noopDeps,
    ...overrides,
  };
}

describe('createToolbar', () => {
  beforeEach(() => {
    window.isTestEnv = true;
  });

  afterEach(() => {
    window.isTestEnv = false;
    sinon.restore();
    document.body.innerHTML = '';
  });

  describe('API', () => {
    it('returns { element, on, emit, sticky, getState, updateSwatches, destroy }', () => {
      const toolbar = createToolbar(defaultOptions());
      expect(toolbar.element).to.exist;
      expect(toolbar.element.tagName.toLowerCase()).to.equal('sp-theme');
      expect(toolbar.on).to.be.a('function');
      expect(toolbar.emit).to.be.a('function');
      expect(typeof toolbar.sticky).to.equal('boolean');
      expect(toolbar.getState).to.be.a('function');
      expect(toolbar.updateSwatches).to.be.a('function');
      expect(toolbar.destroy).to.be.a('function');
    });

    it('sticky is false for standalone variant', () => {
      const toolbar = createToolbar(defaultOptions({ variant: 'standalone' }));
      expect(toolbar.sticky).to.be.false;
    });

    it('sticky is true for sticky variant', () => {
      const toolbar = createToolbar(defaultOptions({ variant: 'sticky' }));
      expect(toolbar.sticky).to.be.true;
    });
  });

  describe('DOM — palette type', () => {
    it('renders sp-theme > .ax-toolbar with role="toolbar"', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const theme = document.querySelector('sp-theme');
      expect(theme).to.exist;
      const tb = theme.querySelector('.ax-toolbar[role="toolbar"]');
      expect(tb).to.exist;
    });

    it('renders swatch strip with correct number of .ax-swatch children', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const swatches = toolbar.element.querySelectorAll('.ax-swatch-strip .ax-swatch');
      expect(swatches.length).to.equal(MOCK_PALETTE.colors.length);
    });

    it('each swatch has correct background-color and aria-label', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const swatches = toolbar.element.querySelectorAll('.ax-swatch-strip .ax-swatch');
      swatches.forEach((swatch, i) => {
        expect(swatch.style.backgroundColor).to.exist;
        expect(swatch.getAttribute('aria-label')).to.equal(`Color ${i + 1}: ${MOCK_PALETTE.colors[i]}`);
      });
    });

    it('renders action buttons: Share, Download, CC Library with correct labels', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const actions = toolbar.element.querySelector('.ax-toolbar-actions');
      expect(actions).to.exist;
      const buttons = actions.querySelectorAll('sp-action-button');
      expect(buttons.length).to.equal(3);

      const labels = [...buttons].map((btn) => btn.getAttribute('label'));
      expect(labels).to.include('Share this color palette');
      expect(labels).to.include('Download this color palette');
      expect(labels).to.include('Save this palette to your Library');
    });

    it('renders CTA button with correct text', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const cta = toolbar.element.querySelector('sp-button[variant="accent"]');
      expect(cta).to.exist;
      expect(cta.textContent).to.equal('Create with my color palette');
    });
  });

  describe('DOM — gradient type', () => {
    it('renders .ax-gradient-strip instead of discrete swatches', () => {
      const toolbar = createToolbar(defaultOptions({
        palette: MOCK_GRADIENT,
        type: 'gradient',
      }));
      document.body.appendChild(toolbar.element);

      const strip = toolbar.element.querySelector('.ax-gradient-strip');
      expect(strip).to.exist;
      const discreteSwatches = strip.querySelectorAll('.ax-swatch');
      expect(discreteSwatches.length).to.equal(0);
    });

    it('gradient strip has correct CSS linear-gradient background', () => {
      const toolbar = createToolbar(defaultOptions({
        palette: MOCK_GRADIENT,
        type: 'gradient',
      }));
      document.body.appendChild(toolbar.element);

      const strip = toolbar.element.querySelector('.ax-gradient-strip');
      const bg = strip.style.background.toLowerCase();
      expect(bg).to.include('linear-gradient');
      expect(bg).to.include(`${MOCK_GRADIENT.angle}deg`);
    });
  });

  describe('DOM — options', () => {
    it('showEdit: true renders Edit button', () => {
      const toolbar = createToolbar(defaultOptions({ showEdit: true }));
      document.body.appendChild(toolbar.element);

      const editBtn = toolbar.element.querySelector('sp-action-button[label="Edit this color palette"]');
      expect(editBtn).to.exist;
    });

    it('showEdit: false omits Edit button', () => {
      const toolbar = createToolbar(defaultOptions({ showEdit: false }));
      document.body.appendChild(toolbar.element);

      const editBtn = toolbar.element.querySelector('sp-action-button[label="Edit this color palette"]');
      expect(editBtn).to.not.exist;
    });

    it('showPaletteName: true renders .ax-palette-name with label and input', () => {
      const toolbar = createToolbar(defaultOptions({ showPaletteName: true }));
      document.body.appendChild(toolbar.element);

      const nameField = toolbar.element.querySelector('.ax-palette-name');
      expect(nameField).to.exist;
      expect(nameField.querySelector('label')).to.exist;
      const input = nameField.querySelector('input');
      expect(input).to.exist;
      expect(input.value).to.equal(MOCK_PALETTE.name);
    });

    it('showPaletteName: false omits palette name field', () => {
      const toolbar = createToolbar(defaultOptions({ showPaletteName: false }));
      document.body.appendChild(toolbar.element);

      const nameField = toolbar.element.querySelector('.ax-palette-name');
      expect(nameField).to.not.exist;
    });

    it('editPaletteName: false makes input readonly with tabindex="-1"', () => {
      const toolbar = createToolbar(defaultOptions({ editPaletteName: false }));
      document.body.appendChild(toolbar.element);

      const input = toolbar.element.querySelector('#ax-palette-name-input');
      expect(input.hasAttribute('readonly')).to.be.true;
      expect(input.getAttribute('tabindex')).to.equal('-1');
    });

    it('editPaletteName: true makes input editable (no readonly)', () => {
      const toolbar = createToolbar(defaultOptions({ editPaletteName: true }));
      document.body.appendChild(toolbar.element);

      const input = toolbar.element.querySelector('#ax-palette-name-input');
      expect(input.hasAttribute('readonly')).to.be.false;
    });
  });

  describe('DOM — sticky variant', () => {
    it('adds .ax-toolbar-sticky class', () => {
      const toolbar = createToolbar(defaultOptions({ variant: 'sticky' }));
      document.body.appendChild(toolbar.element);

      const tb = toolbar.element.querySelector('.ax-toolbar');
      expect(tb.classList.contains('ax-toolbar-sticky')).to.be.true;
    });

    it('renders .ax-swatch-band element with aria-hidden="true"', () => {
      const toolbar = createToolbar(defaultOptions({ variant: 'sticky' }));
      document.body.appendChild(toolbar.element);

      const band = toolbar.element.querySelector('.ax-swatch-band');
      expect(band).to.exist;
      expect(band.getAttribute('aria-hidden')).to.equal('true');
    });
  });

  describe('event bus', () => {
    it('on("edit", cb) fires when Edit button clicked', () => {
      const onEdit = sinon.stub();
      const toolbar = createToolbar(defaultOptions({ onEdit }));
      document.body.appendChild(toolbar.element);

      const cb = sinon.stub();
      toolbar.on('edit', cb);

      const editBtn = toolbar.element.querySelector('sp-action-button[label="Edit this color palette"]');
      editBtn.click();

      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.have.property('palette');
    });

    it('on("share", cb) fires when Share button clicked', async () => {
      sinon.stub(navigator, 'share').resolves();
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const cb = sinon.stub();
      toolbar.on('share', cb);

      const shareBtn = toolbar.element.querySelector('sp-action-button[label="Share this color palette"]');
      shareBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.have.property('palette');
    });

    it('on("download", cb) fires when Download button clicked', async () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const cb = sinon.stub();
      toolbar.on('download', cb);

      const downloadBtn = toolbar.element.querySelector('sp-action-button[label="Download this color palette"]');
      downloadBtn.click();
      await new Promise((r) => setTimeout(r, 50));

      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.have.property('palette');
    });

    it('on("save", cb) fires when CC Library button clicked', async () => {
      const mockCtx = createMockGetLibraryContext([], null);
      const toolbar = createToolbar(defaultOptions({ getLibraryContext: mockCtx }));
      document.body.appendChild(toolbar.element);

      const cb = sinon.stub();
      toolbar.on('save', cb);

      const saveBtn = toolbar.element.querySelector('sp-action-button[label="Save this palette to your Library"]');
      saveBtn.click();
      await new Promise((r) => setTimeout(r, 100));

      expect(cb.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.have.property('palette');
    });

    it('on("cta", cb) fires when CTA button clicked', () => {
      const onCTA = sinon.stub();
      const toolbar = createToolbar(defaultOptions({ onCTA }));
      document.body.appendChild(toolbar.element);

      const cb = sinon.stub();
      toolbar.on('cta', cb);

      const ctaBtn = toolbar.element.querySelector('sp-button[variant="accent"]');
      ctaBtn.click();

      expect(cb.calledOnce).to.be.true;
      expect(onCTA.calledOnce).to.be.true;
      expect(cb.firstCall.args[0]).to.have.property('palette');
    });
  });

  describe('updateSwatches', () => {
    it('replaces swatch strip with new colors', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);

      const newColors = ['#111111', '#222222', '#333333'];
      toolbar.updateSwatches(newColors);

      const swatches = toolbar.element.querySelectorAll('.ax-palette-summary .ax-swatch-strip .ax-swatch');
      expect(swatches.length).to.equal(3);
    });

    it('replaces swatch band with new colors (sticky variant)', () => {
      const toolbar = createToolbar(defaultOptions({ variant: 'sticky' }));
      document.body.appendChild(toolbar.element);

      const newColors = ['#111111', '#222222'];
      toolbar.updateSwatches(newColors);

      const bandSwatches = toolbar.element.querySelectorAll('.ax-swatch-band .ax-swatch');
      expect(bandSwatches.length).to.equal(2);
    });
  });

  describe('getState', () => {
    it('returns current palette including edited name', () => {
      const toolbar = createToolbar(defaultOptions({ editPaletteName: true }));
      document.body.appendChild(toolbar.element);

      const input = toolbar.element.querySelector('#ax-palette-name-input');
      input.value = 'Updated Name';

      const state = toolbar.getState();
      expect(state.palette.name).to.equal('Updated Name');
    });
  });

  describe('destroy', () => {
    it('removes theme element from DOM', () => {
      const toolbar = createToolbar(defaultOptions());
      document.body.appendChild(toolbar.element);
      expect(document.querySelector('sp-theme')).to.exist;

      toolbar.destroy();
      expect(toolbar.element.parentNode).to.be.null;
    });
  });

  describe('responsive CTA text', () => {
    it('CTA text updates based on isMobileViewport() when matchMedia fires', () => {
      const origMatchMedia = window.matchMedia;
      let mobileMatches = false;
      let changeListeners = [];
      sinon.stub(window, 'matchMedia').callsFake((query) => {
        if (query === '(max-width: 599px)') {
          return {
            get matches() { return mobileMatches; },
            media: query,
            addEventListener(evt, cb) { changeListeners.push(cb); },
            removeEventListener(evt, cb) { changeListeners = changeListeners.filter((l) => l !== cb); },
            addListener() {},
            removeListener() {},
          };
        }
        return origMatchMedia.call(window, query);
      });

      const toolbar = createToolbar(defaultOptions({
        ctaText: 'Desktop CTA',
        mobileCTAText: 'Mobile CTA',
      }));
      document.body.appendChild(toolbar.element);

      const ctaBtn = toolbar.element.querySelector('sp-button[variant="accent"]');
      expect(ctaBtn.textContent).to.equal('Desktop CTA');

      mobileMatches = true;
      changeListeners.forEach((cb) => cb({ matches: true }));
      expect(ctaBtn.textContent).to.equal('Mobile CTA');
    });
  });
});
