/* eslint-disable func-names */
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { createGradientsRenderer } from '../../../express/code/blocks/color-explore/renderers/createGradientsRenderer.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const TIMEOUT = 10000;

function makeGradient(id) {
  return {
    id: `g-${id}`,
    name: `Gradient ${id}`,
    gradient: `linear-gradient(90deg, #${String(id).padStart(6, '0')}, #ffffff)`,
  };
}

function makeData(count) {
  return Array.from({ length: count }, (_, i) => makeGradient(i + 1));
}

function cardIdOrder(container) {
  return Array.from(container.querySelectorAll('.gradient-strip'))
    .map((card) => card.getAttribute('data-gradient-id'));
}

async function renderRenderer(data, config = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const renderer = createGradientsRenderer({
    container,
    data,
    config: { useInternalLoadMore: false, ...config },
  });
  await renderer.render();
  return { renderer, container };
}

describe('createGradientsRenderer — filter update', () => {
  const containers = [];

  afterEach(() => {
    while (containers.length) containers.pop().remove();
  });

  it('reorders the rendered cards when the same set is re-sorted (MWPW-198812)', async function () {
    this.timeout(TIMEOUT);
    const data = makeData(3);
    const { renderer, container } = await renderRenderer(data);
    containers.push(container);

    expect(cardIdOrder(container)).to.deep.equal(['g-1', 'g-2', 'g-3']);

    // Same items, new order — mirrors a sort filter change (e.g. Most popular -> Random).
    const reordered = [data[2], data[0], data[1]];
    await renderer.update(reordered);

    expect(cardIdOrder(container)).to.deep.equal(['g-3', 'g-1', 'g-2']);
  });

  it('replaces the visible cards when a filter narrows the set to fewer items', async function () {
    this.timeout(TIMEOUT);
    const data = makeData(4);
    const { renderer, container } = await renderRenderer(data);
    containers.push(container);

    expect(cardIdOrder(container)).to.deep.equal(['g-1', 'g-2', 'g-3', 'g-4']);

    // Fewer items in a different order — mirrors a time-range filter change.
    await renderer.update([data[3], data[1]]);

    expect(cardIdOrder(container)).to.deep.equal(['g-4', 'g-2']);
  });
});
