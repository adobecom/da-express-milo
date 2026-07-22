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

  it('updates the count when filters change', () => {
    setState({ activeFilters: ['bold'] });
    expect(result.toolbar.querySelector('.toolbar-count').textContent)
      .to.equal(`1 ${DEFAULT_PLACEHOLDERS.fontCountLabel}`);
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
