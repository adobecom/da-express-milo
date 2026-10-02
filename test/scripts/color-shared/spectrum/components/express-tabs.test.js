/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setViewport } from '@web/test-runner-commands';
import { createExpressTabs } from '../../../../../express/code/scripts/color-shared/spectrum/components/express-tabs.js';

describe('createExpressTabs: onSelectionChange', () => {
  afterEach(() => {
    sinon.restore();
    document.body.replaceChildren();
  });

  describe('createExpressTabs: rendered labels', () => {
    let tabs;

    afterEach(async () => {
      tabs?.destroy();
      sinon.restore();
      await setViewport({ width: 800, height: 600 });
    });

    [false, true].forEach((useExpressTagNames) => {
      it(`renders one label per ${useExpressTagNames ? 'Express' : 'Spectrum'} tab across updates and reconnects`, async () => {
        await setViewport({ width: 1271, height: 900 });
        const configs = [
          { label: 'Base color', value: 'primary-color' },
          { label: 'Image', value: 'image', spIcon: 'sp-icon-image' },
          { label: 'Color Wheel', value: 'color-wheel' },
        ];
        tabs = await createExpressTabs({
          selected: 'color-wheel', tabs: configs, useExpressTagNames,
        });
        document.body.append(tabs.element);
        expect(tabs.tabsEl.localName).to.equal(useExpressTagNames ? 'ax-tabs' : 'sp-tabs');

        for (let i = 0; i < 10; i += 1) {
          if (i > 0) {
            tabs.element.remove();
            document.body.append(tabs.element);
          }
          tabs.setSelected(configs[i % configs.length].value);
          await tabs.tabsEl.updateComplete;
          const elements = [...tabs.tabsEl.querySelectorAll(useExpressTagNames ? 'ax-tab' : 'sp-tab')];
          expect(elements).to.have.lengthOf(configs.length);
          for (const [index, tab] of elements.entries()) {
            tab.requestUpdate();
            await tab.updateComplete;
            const labels = tab.shadowRoot.querySelectorAll('#item-label');
            expect(labels).to.have.lengthOf(1);
            expect(labels[0].textContent.trim()).to.equal(configs[index].label);
          }
        }
      });
    });

    it('preserves selection, panel lookup, ARIA links, and entry focus with Express tags', async () => {
      const handler = sinon.spy();
      const entryFocus = sinon.spy();
      tabs = await createExpressTabs({
        useExpressTagNames: true,
        selected: 'image',
        tabs: [
          { label: 'Image', value: 'image' },
          { label: 'Color Wheel', value: 'color-wheel' },
        ],
        onSelectionChange: handler,
      });
      const image = tabs.addPanel('image', document.createElement('input'));
      const wheel = tabs.addPanel('color-wheel', document.createElement('div'));
      document.body.append(tabs.element);
      await tabs.tabsEl.updateComplete;
      expect(tabs.getPanel('image')).to.equal(image);
      expect(image.localName).to.equal('ax-tab-panel');
      expect(image.selected).to.equal(true);
      const wheelTab = tabs.tabsEl.querySelector('ax-tab[value="color-wheel"]');
      wheelTab.click();
      await tabs.tabsEl.updateComplete;
      expect(tabs.getSelected()).to.equal('color-wheel');
      expect(wheel.selected).to.equal(true);
      expect(image.selected).to.equal(false);
      expect(wheelTab.getAttribute('aria-controls')).to.equal(wheel.id);
      expect(wheel.getAttribute('aria-labelledby')).to.equal(wheelTab.id);
      expect(handler.calledOnceWith({ selected: 'color-wheel' })).to.equal(true);

      tabs.setPanelEntryFocus('color-wheel', entryFocus);
      const schedule = sinon.stub(window, 'requestAnimationFrame').returns(0);
      wheelTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      expect(entryFocus.called).to.equal(false);
      expect(schedule.calledOnce).to.equal(true);
      schedule.firstCall.args[0]();
      expect(entryFocus.calledOnce).to.equal(true);
    });

    it('preserves parent-disabled styling for Express tab names', async () => {
      tabs = await createExpressTabs({
        useExpressTagNames: true,
        selected: 'image',
        tabs: [{ label: 'Image', value: 'image' }],
      });
      tabs.element.style.setProperty('--mod-tabs-color-disabled', 'rgb(1, 2, 3)');
      tabs.tabsEl.querySelector('ax-tab').style.transition = 'none';
      tabs.tabsEl.setAttribute('disabled', '');
      document.body.append(tabs.element);
      await tabs.tabsEl.updateComplete;
      expect(getComputedStyle(tabs.tabsEl.querySelector('ax-tab')).color).to.equal('rgb(1, 2, 3)');
    });
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
