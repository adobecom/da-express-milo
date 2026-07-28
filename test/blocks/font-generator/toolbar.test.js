import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const [
  { getState, setState, initFonts },
  { default: createToolbar },
  { DEFAULT_PLACEHOLDERS },
] = await Promise.all([
  import('../../../express/code/blocks/font-generator/state.js'),
  import('../../../express/code/blocks/font-generator/toolbar.js'),
  import('../../../express/code/blocks/font-generator/placeholders.js'),
]);

const MOCK_FONTS = [
  { id: '1', styleName: 'A', category: 'bold', map: {} },
  { id: '2', styleName: 'B', category: 'italic', map: {} },
];

initFonts(MOCK_FONTS);

describe('font-generator/toolbar', () => {
  let result;

  beforeEach(() => {
    setState({
      layout: 'grid', fontSize: 24, activeFilters: [], previewText: '',
    });
    result = createToolbar({ panelId: 'fg-panel-1' });
  });

  afterEach(() => {
    result.unsubscribe();
    sinon.restore();
  });

  it('builds grid and list layout buttons', () => {
    expect(result.toolbar.querySelector('.toolbar-layout-btn[data-layout="grid"]')).to.exist;
    expect(result.toolbar.querySelector('.toolbar-layout-btn[data-layout="list"]')).to.exist;
  });

  it('reflects the current layout via aria-pressed', () => {
    expect(result.toolbar.querySelector('[data-layout="grid"]').getAttribute('aria-pressed')).to.equal('true');
    expect(result.toolbar.querySelector('[data-layout="list"]').getAttribute('aria-pressed')).to.equal('false');
  });

  it('clicking the list button sets layout to list', () => {
    result.toolbar.querySelector('[data-layout="list"]').click();
    expect(getState().layout).to.equal('list');
  });

  it('clicking the grid button sets layout to grid', () => {
    setState({ layout: 'list' });
    result.toolbar.querySelector('[data-layout="grid"]').click();
    expect(getState().layout).to.equal('grid');
  });

  it('labels the layout buttons from the default placeholders', () => {
    expect(result.toolbar.querySelector('[data-layout="grid"]').getAttribute('aria-label'))
      .to.equal(DEFAULT_PLACEHOLDERS.gridViewLabel);
    expect(result.toolbar.querySelector('[data-layout="list"]').getAttribute('aria-label'))
      .to.equal(DEFAULT_PLACEHOLDERS.rowViewLabel);
  });

  it('shows the active font count with the unit label', () => {
    const count = result.toolbar.querySelector('.toolbar-count');
    expect(count.textContent).to.equal(`${getState().activeFonts.length} ${DEFAULT_PLACEHOLDERS.fontCountLabel}`);
  });

  it('names the active category in the count when a filter is active', () => {
    setState({ activeFilters: ['bold'] });
    expect(result.toolbar.querySelector('.toolbar-count').textContent)
      .to.equal(`1 bold ${DEFAULT_PLACEHOLDERS.fontCountLabel}`);
  });

  it('omits the category from the count once filters are cleared', () => {
    setState({ activeFilters: ['bold'] });
    setState({ activeFilters: [] });
    expect(result.toolbar.querySelector('.toolbar-count').textContent)
      .to.equal(`${getState().activeFonts.length} ${DEFAULT_PLACEHOLDERS.fontCountLabel}`);
  });

  it('reflects the current fontSize on the slider', () => {
    expect(result.toolbar.querySelector('.toolbar-slider').value).to.equal('24');
  });

  it('wires the filter trigger to the panel id with a popup role', () => {
    expect(result.filterTrigger.getAttribute('aria-controls')).to.equal('fg-panel-1');
    expect(result.filterTrigger.getAttribute('aria-haspopup')).to.equal('true');
  });

  it('labels the filter trigger from placeholders', () => {
    expect(result.filterTrigger.querySelector('.filter-trigger-label').textContent)
      .to.equal(DEFAULT_PLACEHOLDERS.filterTrigger);
  });

  it('debounced slider input updates fontSize in the store', () => {
    const clock = sinon.useFakeTimers();
    const slider = result.toolbar.querySelector('.toolbar-slider');
    slider.value = '40';
    slider.dispatchEvent(new Event('input'));
    clock.tick(100);
    expect(getState().fontSize).to.equal(40);
    clock.restore();
  });

  describe('layout button group — single tab stop with arrow-key nav', () => {
    it('makes the active layout button the only tab stop', () => {
      expect(result.toolbar.querySelector('[data-layout="grid"]').tabIndex).to.equal(0);
      expect(result.toolbar.querySelector('[data-layout="list"]').tabIndex).to.equal(-1);
    });

    it('moves the tab stop when the layout changes', () => {
      setState({ layout: 'list' });
      expect(result.toolbar.querySelector('[data-layout="grid"]').tabIndex).to.equal(-1);
      expect(result.toolbar.querySelector('[data-layout="list"]').tabIndex).to.equal(0);
    });

    it('ArrowRight moves focus from grid to list', () => {
      document.body.append(result.toolbar);
      const gridBtn = result.toolbar.querySelector('[data-layout="grid"]');
      const listBtn = result.toolbar.querySelector('[data-layout="list"]');
      gridBtn.focus();
      gridBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(document.activeElement).to.equal(listBtn);
      result.toolbar.remove();
    });

    it('ArrowLeft wraps from grid back to list', () => {
      document.body.append(result.toolbar);
      const gridBtn = result.toolbar.querySelector('[data-layout="grid"]');
      const listBtn = result.toolbar.querySelector('[data-layout="list"]');
      gridBtn.focus();
      gridBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(document.activeElement).to.equal(listBtn);
      result.toolbar.remove();
    });

    it('arrow-key focus move does not itself change the layout', () => {
      document.body.append(result.toolbar);
      const gridBtn = result.toolbar.querySelector('[data-layout="grid"]');
      gridBtn.focus();
      gridBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(getState().layout).to.equal('grid');
      result.toolbar.remove();
    });
  });

  it('honours custom string overrides', () => {
    const custom = createToolbar({ panelId: 'p', strings: { gridViewLabel: 'Cuadrícula' } });
    expect(custom.toolbar.querySelector('[data-layout="grid"]').getAttribute('aria-label')).to.equal('Cuadrícula');
    custom.unsubscribe();
  });

  it('stops updating after unsubscribe', () => {
    result.unsubscribe();
    expect(() => setState({ layout: 'list' })).to.not.throw();
    // re-create so afterEach unsubscribe is a safe no-op
    result = createToolbar({ panelId: 'fg-panel-1' });
  });
});
