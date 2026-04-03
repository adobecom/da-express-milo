/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { createFiltersComponent, FILTER_IDS } from '../../../../express/code/scripts/color-shared/components/createFiltersComponent.js';

describe('createFiltersComponent', () => {
  let originalLana;

  beforeEach(() => {
    originalLana = window.lana;
    window.lana = { log: sinon.spy() };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    if (originalLana === undefined) delete window.lana;
    else window.lana = originalLana;
  });

  it('deduplicates duplicate filter ids and logs a warning', async () => {
    const filters = [
      {
        id: FILTER_IDS.SORT,
        label: 'Most popular',
        defaultValue: 'most-popular',
        options: [
          { label: 'Most popular', value: 'most-popular' },
          { label: 'All', value: 'all' },
        ],
      },
      {
        id: FILTER_IDS.SORT,
        label: 'Duplicate sort',
        defaultValue: 'all',
        options: [
          { label: 'Most popular', value: 'most-popular' },
          { label: 'All', value: 'all' },
        ],
      },
    ];

    const component = await createFiltersComponent({
      filters,
      variant: 'strips',
    });

    document.body.appendChild(component.element);

    const desktopSlots = component.element.querySelectorAll('.filters-desktop .filter-dropdown');
    expect(desktopSlots.length).to.equal(1);

    const duplicateLog = window.lana.log
      .getCalls()
      .some((call) => String(call.args[0]).includes('Duplicate filter id removed: sort'));
    expect(duplicateLog).to.equal(true);

    component.reset();
  });
});
