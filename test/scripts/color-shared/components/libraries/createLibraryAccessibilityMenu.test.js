/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { createLibraryAccessibilityMenu } from '../../../../../express/code/scripts/color-shared/components/libraries/createLibraryAccessibilityMenu.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

const strings = createColorLibrariesPlaceholders();
const toolHrefs = {
  contrast: '/create/color-contrast-analyzer',
  colorBlindness: '/create/color-accessibility',
};

describe('createLibraryAccessibilityMenu', () => {
  let menu;

  afterEach(() => {
    menu?.destroy?.();
    menu = null;
    document.body.innerHTML = '';
  });

  it('renders contrast and color blindness menu items when hrefs are provided', () => {
    menu = createLibraryAccessibilityMenu({
      item: {
        id: 'theme-1',
        type: 'theme',
        name: 'Ocean',
        colors: ['#001122'],
      },
      strings,
      toolHrefs,
    });
    document.body.appendChild(menu.element);

    const items = menu.element.querySelectorAll('sp-menu-item');
    expect(items).to.have.lengthOf(2);
    expect([...items].map((item) => item.textContent)).to.deep.equal([
      strings.librariesCheckColorContrast,
      strings.librariesCheckColorBlindness,
    ]);
  });

  it('omits items when tool hrefs are missing', () => {
    menu = createLibraryAccessibilityMenu({
      item: {
        id: 'theme-1',
        type: 'theme',
        name: 'Ocean',
        colors: ['#001122'],
      },
      strings,
      toolHrefs: {},
    });

    expect(menu.element.querySelectorAll('sp-menu-item')).to.have.lengthOf(0);
  });

  it('uses accessibility tools label on trigger', () => {
    menu = createLibraryAccessibilityMenu({
      item: { colors: ['#001122'] },
      strings,
      toolHrefs,
    });

    const trigger = menu.element.querySelector('.ax-lib-card__action');
    expect(trigger.getAttribute('aria-label')).to.equal(strings.librariesAccessibilityTools);
  });
});
