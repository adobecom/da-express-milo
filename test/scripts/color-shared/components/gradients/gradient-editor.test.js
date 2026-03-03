/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { createGradientEditor } from '../../../../../express/code/scripts/color-shared/components/gradients/gradient-editor.js';

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
});
