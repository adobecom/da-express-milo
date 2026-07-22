/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { createLoadingScreenComponent } from '../../../../express/code/scripts/color-shared/components/createLoadingScreenComponent.js';

describe('createLoadingScreenComponent', () => {
  let originalLana;

  beforeEach(() => {
    originalLana = window.lana;
    window.lana = { log: () => {} };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    if (originalLana === undefined) delete window.lana;
    else window.lana = originalLana;
  });

  it('keeps skeleton hidden from assistive tech while toggling visibility', async () => {
    const component = createLoadingScreenComponent({ variant: 'gradients', cardCount: 3 });
    document.body.appendChild(component.element);

    expect(component.element.getAttribute('aria-hidden')).to.equal('true');
    expect(component.element.hasAttribute('hidden')).to.equal(true);

    await component.show();

    expect(component.element.getAttribute('aria-hidden')).to.equal('true');
    expect(component.element.hasAttribute('hidden')).to.equal(false);
    expect(component.element.style.display).to.equal('block');

    component.hide();

    expect(component.element.getAttribute('aria-hidden')).to.equal('true');
    expect(component.element.hasAttribute('hidden')).to.equal(true);
    expect(component.element.style.display).to.equal('none');
  });

  it('renders card placeholders and updates count via setCardCount', () => {
    const component = createLoadingScreenComponent({ variant: 'strips', cardCount: 2 });
    const grid = component.element.querySelector('.ax-color-loading__grid');

    expect(grid.querySelectorAll('.ax-color-loading-card').length).to.equal(2);

    component.setCardCount(5);
    expect(grid.querySelectorAll('.ax-color-loading-card').length).to.equal(5);
  });

  it('does not override parent aria-busy state', async () => {
    const host = document.createElement('div');
    host.setAttribute('aria-busy', 'true');

    const component = createLoadingScreenComponent({ variant: 'strips', cardCount: 1 });
    host.appendChild(component.element);
    document.body.appendChild(host);

    await component.show();
    expect(host.getAttribute('aria-busy')).to.equal('true');

    component.hide();
    expect(host.getAttribute('aria-busy')).to.equal('true');
  });
});
