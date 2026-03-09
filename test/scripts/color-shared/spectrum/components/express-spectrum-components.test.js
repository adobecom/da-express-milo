import { expect } from '@esm-bundle/chai';
import createExpressActionButton from '../../../../../express/code/scripts/color-shared/spectrum/components/express-action-button.js';
import { createExpressTag } from '../../../../../express/code/scripts/color-shared/spectrum/components/express-tag.js';
import { createExpressTextfield } from '../../../../../express/code/scripts/color-shared/spectrum/components/express-textfield.js';

describe('Express Spectrum component wrappers', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds an icon slot to express tags', async () => {
    const icon = document.createElement('span');
    icon.className = 'test-icon';

    const tag = await createExpressTag({
      label: 'Pass',
      icon,
    });

    document.body.appendChild(tag.element);

    const tagElement = tag.element.querySelector('sp-tag');
    const iconSlot = tagElement.querySelector('[slot="icon"]');

    expect(tagElement).to.exist;
    expect(iconSlot).to.exist;
    expect(iconSlot.classList.contains('test-icon')).to.be.true;
    expect(iconSlot).to.not.equal(icon);
  });

  it('renders a leading adornment wrapper for express textfields', async () => {
    const leadingSlot = document.createElement('span');
    leadingSlot.className = 'test-swatch';

    const field = await createExpressTextfield({
      label: 'Foreground color',
      value: '#FFFFFF',
      size: 'l',
      leadingSlot,
    });

    document.body.appendChild(field.element);

    const wrapper = field.element.querySelector('.ax-spectrum-textfield');
    const textfield = wrapper.querySelector('sp-textfield');
    const adornment = wrapper.querySelector('.ax-spectrum-textfield__leading');

    expect(wrapper).to.exist;
    expect(wrapper.classList.contains('ax-spectrum-textfield--with-leading')).to.be.true;
    expect(textfield).to.exist;
    expect(adornment).to.exist;
    expect(adornment.querySelector('.test-swatch')).to.exist;
  });

  it('creates an express action button with icon support', async () => {
    const icon = document.createElement('span');
    icon.className = 'test-action-icon';

    const button = await createExpressActionButton({
      label: 'Swap colors',
      quiet: true,
      iconOnly: true,
      icon,
    });

    document.body.appendChild(button.element);

    const actionButton = button.element.querySelector('sp-action-button');
    const iconSlot = actionButton.querySelector('[slot="icon"]');

    expect(actionButton).to.exist;
    expect(actionButton.hasAttribute('quiet')).to.be.true;
    expect(actionButton.getAttribute('label')).to.equal('Swap colors');
    expect(iconSlot).to.exist;
    expect(iconSlot.classList.contains('test-action-icon')).to.be.true;
  });
});
