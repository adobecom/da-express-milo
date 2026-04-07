/* eslint-disable func-names */
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../../express/code/scripts/utils.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

import { createStripsRenderer } from '../../../../express/code/scripts/color-shared/renderers/createStripsRenderer.js';

const TIMEOUT = 10000;

function makePalette(id, colorCount = 3) {
  const colors = Array.from({ length: colorCount }, (_, i) => `#${String(i + 1).padStart(6, '0')}`);
  return { id: `palette-${id}`, name: `Palette ${id}`, colors };
}

function makeData(count, colorsPerPalette = 3) {
  return Array.from({ length: count }, (_, i) => makePalette(i + 1, colorsPerPalette));
}

async function renderRenderer(data, config = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const renderer = createStripsRenderer({ container, data, config });
  await renderer.render(container);
  return { renderer, container };
}

describe('createStripsRenderer — grid', () => {
  const containers = [];

  afterEach(() => {
    while (containers.length) containers.pop().remove();
  });

  it('renders a .palettes-grid element', async function () {
    this.timeout(TIMEOUT);
    const { container } = await renderRenderer(makeData(1));
    containers.push(container);
    expect(container.querySelector('.palettes-grid')).to.exist;
  });

  it('renders one card for one palette', async function () {
    this.timeout(TIMEOUT);
    const { container } = await renderRenderer(makeData(1));
    containers.push(container);
    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(1);
  });

  it('renders two cards for two palettes', async function () {
    this.timeout(TIMEOUT);
    const { container } = await renderRenderer(makeData(2));
    containers.push(container);
    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(2);
  });

  it('renders three cards for three palettes', async function () {
    this.timeout(TIMEOUT);
    const { container } = await renderRenderer(makeData(3));
    containers.push(container);
    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(3);
  });

  it('grid card count matches data length for larger sets', async function () {
    this.timeout(TIMEOUT);
    const data = makeData(8);
    const { container } = await renderRenderer(data);
    containers.push(container);
    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(8);
  });

  it('adds color-explorer-strips class to container', async function () {
    this.timeout(TIMEOUT);
    const { container } = await renderRenderer(makeData(1));
    containers.push(container);
    expect(container.classList.contains('color-explorer-strips')).to.be.true;
  });

  it('sets daa-ll/data-ll on palette action buttons with sequential indexes', async function () {
    this.timeout(TIMEOUT);
    const { container } = await renderRenderer(makeData(2), { renderGridVariant: 'summary' });
    containers.push(container);

    const buttons = Array.from(container.querySelectorAll('.color-card-action-btn'));
    expect(buttons).to.have.length(4);

    expect(buttons[0].getAttribute('daa-ll')).to.equal('Edit palette-1--2 color palettes');
    expect(buttons[0].getAttribute('data-ll')).to.equal('Edit palette-1--2 color palettes');

    expect(buttons[1].getAttribute('daa-ll')).to.equal('Open-2--2 color palettes');
    expect(buttons[1].getAttribute('data-ll')).to.equal('Open-2--2 color palettes');

    expect(buttons[2].getAttribute('daa-ll')).to.equal('Edit palette-3--2 color palettes');
    expect(buttons[3].getAttribute('daa-ll')).to.equal('Open-4--2 color palettes');
  });
});

describe('createStripsRenderer — update (load more)', () => {
  const containers = [];

  afterEach(() => {
    while (containers.length) containers.pop().remove();
  });

  it('update() replaces grid cards with new data', async function () {
    this.timeout(TIMEOUT);
    const { renderer, container } = await renderRenderer(makeData(2));
    containers.push(container);

    renderer.update(makeData(5));

    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(5);
  });

  it('update() reduces card count when given fewer items', async function () {
    this.timeout(TIMEOUT);
    const { renderer, container } = await renderRenderer(makeData(4));
    containers.push(container);

    renderer.update(makeData(1));

    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(1);
  });

  it('update() simulates load more: initial 2, load to 4', async function () {
    this.timeout(TIMEOUT);
    const fullData = makeData(6);
    const { renderer, container } = await renderRenderer(fullData.slice(0, 2));
    containers.push(container);

    renderer.update(fullData.slice(0, 4));

    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(4);
  });

  it('update() simulates load more: initial 4, load all 6', async function () {
    this.timeout(TIMEOUT);
    const fullData = makeData(6);
    const { renderer, container } = await renderRenderer(fullData.slice(0, 4));
    containers.push(container);

    renderer.update(fullData);

    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(6);
  });

  it('update() with empty array clears the grid', async function () {
    this.timeout(TIMEOUT);
    const { renderer, container } = await renderRenderer(makeData(3));
    containers.push(container);

    renderer.update([]);

    const grid = container.querySelector('.palettes-grid');
    expect(grid.children).to.have.length(0);
  });

  it('update() is a no-op when called before render()', () => {
    const container = document.createElement('div');
    containers.push(container);
    document.body.appendChild(container);
    const renderer = createStripsRenderer({ container, data: makeData(2), config: {} });

    expect(() => renderer.update(makeData(5))).to.not.throw();
    expect(container.querySelector('.palettes-grid')).to.be.null;
  });
});

describe('createStripsRenderer — summary variant (results count)', () => {
  const containers = [];

  afterEach(() => {
    while (containers.length) containers.pop().remove();
  });

  it('shows results count matching data length', async function () {
    this.timeout(TIMEOUT);
    const data = makeData(3);
    const { container } = await renderRenderer(data, { renderGridVariant: 'summary' });
    containers.push(container);

    const count = container.querySelector('.results-count');
    expect(count).to.exist;
    expect(count.textContent).to.include('3');
  });

  it('update() refreshes results count', async function () {
    this.timeout(TIMEOUT);
    const { renderer, container } = await renderRenderer(makeData(3), { renderGridVariant: 'summary' });
    containers.push(container);

    renderer.update(makeData(7));

    const count = container.querySelector('.results-count');
    expect(count.textContent).to.include('7');
  });

  it('formats count >= 1000 as xK', async function () {
    this.timeout(TIMEOUT);
    const { renderer, container } = await renderRenderer(makeData(3), { renderGridVariant: 'summary' });
    containers.push(container);

    renderer.update(makeData(1000));

    const count = container.querySelector('.results-count');
    expect(count.textContent).to.include('1.0K');
  });
});
