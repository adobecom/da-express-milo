/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  createLibraryCardActionMenu,
  createLibraryCardActionMenuCoordinator,
  getLibraryCardActionMenuCoordinator,
} from '../../../../../express/code/scripts/color-shared/components/libraries/createLibraryCardActionMenu.js';

describe('createLibraryCardActionMenu', () => {
  const items = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ];

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('coordinator', () => {
    it('getLibraryCardActionMenuCoordinator returns a singleton', () => {
      const first = getLibraryCardActionMenuCoordinator();
      const second = getLibraryCardActionMenuCoordinator();
      expect(first).to.equal(second);
    });

    it('closeOthers closes every menu except the current one', () => {
      const coordinator = createLibraryCardActionMenuCoordinator();
      const menuA = createLibraryCardActionMenu({
        triggerIcon: 'sp-icon-download',
        triggerLabel: 'Menu A',
        items,
        coordinator,
      });
      const menuB = createLibraryCardActionMenu({
        triggerIcon: 'sp-icon-download',
        triggerLabel: 'Menu B',
        items,
        coordinator,
      });
      document.body.append(menuA.element, menuB.element);

      menuA.element.querySelector('.ax-lib-card__action').click();
      menuB.element.querySelector('.ax-lib-card__action').click();

      expect(menuA.element.querySelector('.ax-lib-card__action-menu-popover').hasAttribute('hidden')).to.be.true;
      expect(menuB.element.querySelector('.ax-lib-card__action-menu-popover').hasAttribute('hidden')).to.be.false;

      menuA.destroy();
      menuB.destroy();
    });
  });

  describe('menu', () => {
    let menu;

    afterEach(() => {
      menu?.destroy?.();
      menu = null;
    });

    it('returns wrapper with trigger and menu items', () => {
      menu = createLibraryCardActionMenu({
        triggerIcon: 'sp-icon-download',
        triggerLabel: 'Download',
        items,
      });

      expect(menu.element.classList.contains('ax-lib-card__action-menu')).to.be.true;
      expect(menu.element.querySelectorAll('sp-menu-item')).to.have.lengthOf(2);
      expect(menu.element.querySelector('.ax-lib-card__action').getAttribute('aria-haspopup')).to.equal('menu');
    });

    it('calls onSelect when a menu item is chosen', () => {
      const onSelect = sinon.spy();
      menu = createLibraryCardActionMenu({
        triggerIcon: 'sp-icon-download',
        triggerLabel: 'Download',
        items,
        onSelect,
      });
      document.body.appendChild(menu.element);

      menu.element.querySelector('sp-menu-item[value="two"]').click();
      expect(onSelect.calledOnce).to.be.true;
      expect(onSelect.firstCall.args[0]).to.equal('two');
      expect(onSelect.firstCall.args[1]).to.have.property('closePopover');
    });

    it('toggles popover open state from trigger click', () => {
      menu = createLibraryCardActionMenu({
        triggerIcon: 'sp-icon-download',
        triggerLabel: 'Download',
        items,
      });
      document.body.appendChild(menu.element);

      const trigger = menu.element.querySelector('.ax-lib-card__action');
      const popover = menu.element.querySelector('.ax-lib-card__action-menu-popover');

      trigger.click();
      expect(popover.hasAttribute('hidden')).to.be.false;
      expect(trigger.getAttribute('aria-expanded')).to.equal('true');

      trigger.click();
      expect(popover.hasAttribute('hidden')).to.be.true;
      expect(trigger.getAttribute('aria-expanded')).to.equal('false');
    });
  });
});
