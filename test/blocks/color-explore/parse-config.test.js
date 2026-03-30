import { expect } from '@esm-bundle/chai';

import { parseBlockConfig } from '../../../express/code/blocks/color-explore/helpers/parseConfig.js';

function createRow(key, value) {
  const row = document.createElement('div');
  const keyCell = document.createElement('div');
  const valueCell = document.createElement('div');
  keyCell.textContent = key;
  valueCell.textContent = value;
  row.append(keyCell, valueCell);
  return row;
}

describe('parseBlockConfig', () => {
  const defaults = {
    variant: 'strips',
    initialLoad: 24,
    loadMoreIncrement: 10,
    maxItems: 100,
    enableFilters: false,
    enableSearch: true,
    showReviewSection: false,
    enableGradientEditor: false,
    enableSizesDemo: false,
  };

  it('parses supported keys and preserves defaults for invalid numbers', () => {
    const rows = [
      createRow('Variant', 'Gradients'),
      createRow('initial load', '30'),
      createRow('load more increment', 'invalid-number'),
      createRow('max items', '200'),
      createRow('enable filters', 'true'),
      createRow('enable search', 'false'),
      createRow('show review section', '1'),
      createRow('enable gradient editor', 'true'),
      createRow('enable sizes demo', 'true'),
    ];

    const config = parseBlockConfig(rows, defaults);

    expect(config.variant).to.equal('gradients');
    expect(config.initialLoad).to.equal(30);
    expect(config.loadMoreIncrement).to.equal(defaults.loadMoreIncrement);
    expect(config.maxItems).to.equal(200);
    expect(config.enableFilters).to.equal(true);
    expect(config.enableSearch).to.equal(false);
    expect(config.showReviewSection).to.equal(true);
    expect(config.enableGradientEditor).to.equal(true);
    expect(config.enableSizesDemo).to.equal(true);
  });

  it('clamps swatchVerticalMaxPerRow to 1..10 for both key aliases', () => {
    const overMax = parseBlockConfig([createRow('swatch vertical max per row', '12')], defaults);
    const underMin = parseBlockConfig([createRow('vertical max per row', '0')], defaults);

    expect(overMax.swatchVerticalMaxPerRow).to.equal(10);
    expect(underMin.swatchVerticalMaxPerRow).to.equal(1);
  });

  it('ignores unknown keys and empty values', () => {
    const rows = [
      createRow('unknown key', 'anything'),
      createRow('variant', ''),
    ];

    const config = parseBlockConfig(rows, defaults);
    expect(config).to.deep.equal(defaults);
  });
});
