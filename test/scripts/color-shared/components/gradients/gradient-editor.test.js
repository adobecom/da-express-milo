/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { createGradientEditor } from '../../../../../express/code/scripts/color-shared/components/gradients/gradient-editor.js';

async function loadRealGradientEditorCSS() {
  const res = await fetch('/express/code/scripts/color-shared/components/gradients/gradient-editor.css');
  const text = await res.text();
  const style = document.createElement('style');
  style.textContent = text;
  document.head.appendChild(style);
  return style;
}

const SAMPLE_GRADIENT = {
  type: 'linear',
  angle: 90,
  colorStops: [
    { color: '#ff0000', position: 0 },
    { color: '#0000ff', position: 1 },
  ],
};

describe('createGradientEditor', () => {
  let editor;
  let wrapper;

  beforeEach(() => {
    editor = createGradientEditor(SAMPLE_GRADIENT, { size: 'l', showMockDebug: false, showMockHandlesOrder: false });
    wrapper = editor.element;
  });

  afterEach(() => {
    if (wrapper && wrapper.parentNode) wrapper.remove();
  });

  describe('API', () => {
    it('returns element, getGradient, setGradient, updateColorStop, on, emit, destroy', () => {
      expect(editor.element).to.exist;
      expect(editor.getGradient).to.be.a('function');
      expect(editor.setGradient).to.be.a('function');
      expect(editor.updateColorStop).to.be.a('function');
      expect(editor.on).to.be.a('function');
      expect(editor.emit).to.be.a('function');
      expect(editor.destroy).to.be.a('function');
    });
  });

  describe('DOM structure', () => {
    it('renders root with role group and gradient-editor class', () => {
      expect(wrapper.classList.contains('gradient-editor')).to.be.true;
      expect(wrapper.getAttribute('role')).to.equal('group');
    });

    it('renders bar and handles container', () => {
      expect(wrapper.querySelector('.gradient-editor-bar')).to.exist;
      expect(wrapper.querySelector('.gradient-editor-handles')).to.exist;
    });

    it('renders one handle per color stop (size l)', () => {
      const handles = wrapper.querySelectorAll('.gradient-editor-handle');
      expect(handles.length).to.equal(SAMPLE_GRADIENT.colorStops.length);
    });

    it('renders midpoint elements when size is l', () => {
      const midpoints = wrapper.querySelectorAll('.gradient-editor-midpoint');
      expect(midpoints.length).to.equal(SAMPLE_GRADIENT.colorStops.length - 1);
    });
  });

  describe('getGradient', () => {
    it('returns normalized gradient with colorStops and midpoints', () => {
      const result = editor.getGradient();
      expect(result).to.have.property('type', 'linear');
      expect(result).to.have.property('angle', 90);
      expect(result.colorStops).to.be.an('array').with.lengthOf(2);
      expect(result.midpoints).to.be.an('array').with.lengthOf(1);
      expect(result.colorStops[0]).to.have.property('color');
      expect(result.colorStops[0]).to.have.property('position');
    });
  });

  describe('setGradient', () => {
    it('updates bar background and getGradient', () => {
      const newGradient = {
        type: 'linear',
        angle: 180,
        colorStops: [
          { color: '#00ff00', position: 0 },
          { color: '#ffff00', position: 0.5 },
          { color: '#ff00ff', position: 1 },
        ],
      };
      editor.setGradient(newGradient);
      const result = editor.getGradient();
      expect(result.colorStops).to.have.lengthOf(3);
      expect(result.midpoints).to.have.lengthOf(2);
    });

    it('clears handles before appending new ones (no duplicate handles)', () => {
      const threeStops = {
        type: 'linear',
        angle: 90,
        colorStops: [
          { color: '#a', position: 0 },
          { color: '#b', position: 0.5 },
          { color: '#c', position: 1 },
        ],
      };
      editor.setGradient(threeStops);
      let handles = wrapper.querySelectorAll('.gradient-editor-handle');
      expect(handles.length).to.equal(3);

      editor.setGradient(SAMPLE_GRADIENT);
      handles = wrapper.querySelectorAll('.gradient-editor-handle');
      expect(handles.length).to.equal(2, 'setGradient must clear previous handles; no duplicates');
    });
  });

  describe('events', () => {
    it('calls onChange when stop color is updated via updateColorStop', (done) => {
      const editorWithCb = createGradientEditor(SAMPLE_GRADIENT, {
        size: 'l',
        showMockDebug: false,
        onChange: (payload) => {
          expect(payload).to.have.property('colorStops');
          expect(payload).to.have.property('midpoints');
          done();
        },
      });
      editorWithCb.updateColorStop(0, '#00ff00');
    });

    it('emits gradient-editor:change on wrapper when updateColorStop is called', (done) => {
      wrapper.addEventListener('gradient-editor:change', (e) => {
        expect(e.detail).to.have.property('colorStops');
        done();
      });
      editor.updateColorStop(0, '#00ff00');
    });
  });

  describe('updateColorStop', () => {
    it('updates stop color and bar background', () => {
      editor.updateColorStop(0, '#00ff00');
      const result = editor.getGradient();
      expect(result.colorStops[0].color).to.equal('#00ff00');
    });
  });

  describe('size s (handles only, no midpoints)', () => {
    beforeEach(() => {
      if (wrapper && wrapper.parentNode) wrapper.remove();
      editor = createGradientEditor(SAMPLE_GRADIENT, { size: 's', showMockDebug: false });
      wrapper = editor.element;
    });

    it('renders handles but no midpoint elements', () => {
      expect(wrapper.querySelectorAll('.gradient-editor-handle').length).to.equal(2);
      expect(wrapper.querySelectorAll('.gradient-editor-midpoint').length).to.equal(0);
    });
  });

  describe('layout responsive (strip-tall / modal)', () => {
    beforeEach(() => {
      if (wrapper && wrapper.parentNode) wrapper.remove();
      editor = createGradientEditor(SAMPLE_GRADIENT, {
        layout: 'responsive',
        size: 'strip-responsive',
        draggable: false,
        copyable: true,
        showMockDebug: false,
      });
      wrapper = editor.element;
    });

    it('applies layout-responsive and copyable classes; not draggable', () => {
      expect(wrapper.classList.contains('gradient-editor--layout-responsive')).to.be.true;
      expect(wrapper.classList.contains('gradient-editor--copyable')).to.be.true;
      expect(wrapper.classList.contains('gradient-editor--draggable')).to.be.false;
    });

    it('arrow key on handle does not move stop position', () => {
      document.body.appendChild(wrapper);
      const handle = wrapper.querySelector('.gradient-editor-handle');
      handle.focus();
      const posBefore = editor.getGradient().colorStops[0].position;
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const posAfter = editor.getGradient().colorStops[0].position;
      expect(posAfter).to.equal(posBefore);
      wrapper.remove();
    });

    it('copyable handles have aria-label "Copy #HEX"', () => {
      const handles = wrapper.querySelectorAll('.gradient-editor-handle');
      expect(handles.length).to.be.greaterThan(0);
      handles.forEach((handle, i) => {
        const label = handle.getAttribute('aria-label');
        expect(label).to.match(/^Copy #[0-9A-F]{6}$/i, `handle ${i} aria-label should be "Copy #HEX"`);
      });
    });

    it('click on copyable handle calls clipboard.writeText with hex', async () => {
      let capturedText = null;
      const originalWriteText = navigator.clipboard?.writeText;
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText = (text) => {
            capturedText = text;
            return Promise.resolve();
          };
        }
        document.body.appendChild(wrapper);
        const handle = wrapper.querySelector('.gradient-editor-handle');
        handle.click();
        await Promise.resolve();
        await Promise.resolve();
        if (originalWriteText) {
          expect(capturedText).to.match(/^#[0-9a-fA-F]{6}$/, 'click should copy a hex color');
        }
      } finally {
        if (navigator.clipboard && originalWriteText) {
          navigator.clipboard.writeText = originalWriteText;
        }
        if (wrapper.parentNode) wrapper.remove();
      }
    });
  });

  describe('color mode-aware copying', () => {
    async function clickAndCapture(handle) {
      let capturedText = null;
      const originalWriteText = navigator.clipboard?.writeText;
      navigator.clipboard.writeText = (text) => {
        capturedText = text;
        return Promise.resolve();
      };
      handle.click();
      await Promise.resolve();
      await Promise.resolve();
      if (originalWriteText) navigator.clipboard.writeText = originalWriteText;
      return capturedText;
    }

    afterEach(() => {
      if (wrapper?.parentNode) wrapper.remove();
    });

    it('copies the same raw, unit-less value as the swatch rail\'s per-channel breakdown (not a formatted rgba() string) when created with colorMode: "RGB"', async () => {
      // Regression test: this used to go through formatSwatchInMode (helpers.js),
      // which wraps RGB as "rgba(r, g, b, 1)" — a real CSS-ready string, but one
      // that reads as a mismatch against the swatch rail immediately below the
      // gradient bar, which shows the same stop as bare "255, 0, 0".
      editor = createGradientEditor(SAMPLE_GRADIENT, {
        layout: 'responsive', size: 'strip-responsive', draggable: false, copyable: true, colorMode: 'RGB',
      });
      wrapper = editor.element;
      document.body.appendChild(wrapper);
      const handle = wrapper.querySelector('.gradient-editor-handle');
      expect(handle.getAttribute('aria-label')).to.equal('Copy 255, 0, 0');
      expect(await clickAndCapture(handle)).to.equal('255, 0, 0');
    });

    it('copies HSB with no % suffixes, matching the swatch rail\'s H/S/B rows exactly', async () => {
      editor = createGradientEditor(SAMPLE_GRADIENT, {
        layout: 'responsive', size: 'strip-responsive', draggable: false, copyable: true, colorMode: 'HSB',
      });
      wrapper = editor.element;
      document.body.appendChild(wrapper);
      const handle = wrapper.querySelector('.gradient-editor-handle');
      expect(await clickAndCapture(handle)).to.equal('0, 100, 100');
    });

    it('copies Lab with no % suffixes, matching the swatch rail\'s L/a/b rows exactly', async () => {
      editor = createGradientEditor(SAMPLE_GRADIENT, {
        layout: 'responsive', size: 'strip-responsive', draggable: false, copyable: true, colorMode: 'Lab',
      });
      wrapper = editor.element;
      document.body.appendChild(wrapper);
      const handle = wrapper.querySelector('.gradient-editor-handle');
      const copied = await clickAndCapture(handle);
      expect(copied).to.not.include('%');
    });

    it('setColorMode() switches what a later click copies, and updates the aria-label to match', async () => {
      editor = createGradientEditor(SAMPLE_GRADIENT, {
        layout: 'responsive', size: 'strip-responsive', draggable: false, copyable: true,
      });
      wrapper = editor.element;
      document.body.appendChild(wrapper);

      // Regression test: this used to always copy the hex, regardless of
      // whatever color mode was selected in the modal's Color mode picker.
      editor.setColorMode('RGB');
      const rgbHandle = wrapper.querySelector('.gradient-editor-handle');
      expect(rgbHandle.getAttribute('aria-label')).to.equal('Copy 255, 0, 0');
      expect(await clickAndCapture(rgbHandle)).to.equal('255, 0, 0');

      editor.setColorMode('HEX');
      const hexHandle = wrapper.querySelector('.gradient-editor-handle');
      expect(hexHandle.getAttribute('aria-label')).to.equal('Copy #FF0000');
      expect(await clickAndCapture(hexHandle)).to.equal('#ff0000');
    });
  });

  describe('edge-position handle shift (real CSS)', () => {
    let styleTag;

    beforeEach(async () => {
      styleTag = await loadRealGradientEditorCSS();
    });

    afterEach(() => {
      styleTag?.remove();
    });

    it('shifts every handle that is really at 0% the same way — not just whichever one happens to be :last-child in the DOM', () => {
      // Regression test: multiple stops can legitimately share a position
      // (e.g. coincident stops for a hard color-stop edge). The old
      // :first-child/:last-child CSS assumed DOM order matched left/right
      // edge position, so a stop at 0% that wasn't the *first* DOM child (and
      // was instead :last-child) got the "flush against the right edge"
      // -9px shift instead of the "flush against the left edge" +9px one —
      // pushing it further past the left edge instead of back into view.
      editor = createGradientEditor({
        type: 'linear',
        angle: 90,
        colorStops: [
          { color: '#ff0000', position: 0 },
          { color: '#00ff00', position: 0 },
          { color: '#0000ff', position: 0 },
        ],
      }, { layout: 'responsive', size: 'strip-responsive', draggable: false, copyable: true });
      wrapper = editor.element;
      document.body.appendChild(wrapper);

      const handles = [...wrapper.querySelectorAll('.gradient-editor-handle')];
      expect(handles).to.have.length(3);
      const transforms = handles.map((h) => getComputedStyle(h).transform);
      // translateX(9px) as a matrix: matrix(1, 0, 0, 1, 9, 0)
      transforms.forEach((t) => expect(t).to.equal('matrix(1, 0, 0, 1, 9, 0)'));
    });
  });
});
