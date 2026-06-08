/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { createExpressTabs } from '../../../../../express/code/scripts/color-shared/spectrum/components/express-tabs.js';

describe('createExpressTabs: onSelectionChange', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('does not fire onSelectionChange when a child input fires a change event', async () => {
    const handler = sinon.spy();
    const tabs = await createExpressTabs({
      selected: 'image',
      tabs: [
        { label: 'Image', value: 'image' },
        { label: 'Color Wheel', value: 'color-wheel' },
      ],
      onSelectionChange: handler,
    });
    document.body.appendChild(tabs.element);

    const content = document.createElement('div');
    tabs.addPanel('image', content);
    const input = document.createElement('input');
    input.type = 'file';
    content.appendChild(input);

    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(handler.called).to.be.false;
  });

  it('does not call onSelectionChange with undefined when a child element fires change', async () => {
    const handler = sinon.spy();
    const tabs = await createExpressTabs({
      selected: 'image',
      tabs: [
        { label: 'Image', value: 'image' },
        { label: 'Color Wheel', value: 'color-wheel' },
      ],
      onSelectionChange: handler,
    });
    document.body.appendChild(tabs.element);

    const content = document.createElement('div');
    tabs.addPanel('image', content);
    const input = document.createElement('input');
    content.appendChild(input);
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const calledWithUndefined = handler.args.some(([arg]) => arg?.selected === undefined);
    expect(calledWithUndefined).to.be.false;
  });
});
