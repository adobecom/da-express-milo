import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../express/code/scripts/utils.js';
import {
  LOCALES,
  createLocaleDropdown,
  createLocaleDropdownWrapper,
} from '../../express/code/scripts/widgets/frictionless-locale-dropdown.js';

setLibs('/libs');

describe('Locale Combobox Widget', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  });

  describe('LOCALES constant', () => {
    it('should contain expected locale structure', () => {
      expect(LOCALES).to.be.an('array');
      expect(LOCALES.length).to.be.greaterThan(0);
      LOCALES.forEach((locale) => {
        expect(locale).to.have.property('code');
        expect(locale).to.have.property('label');
        expect(locale.code).to.be.a('string');
        expect(locale.label).to.be.a('string');
      });
    });
    it('should include expected locales', () => {
      const localeCodes = LOCALES.map((locale) => locale.code);
      expect(localeCodes).to.include('en-us');
      expect(localeCodes).to.include('en-gb');
      expect(localeCodes).to.include('fr-fr');
      expect(localeCodes).to.include('de-de');
      expect(localeCodes).to.include('ja-jp');
    });
    it('should have unique locale codes', () => {
      const codes = LOCALES.map((locale) => locale.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).to.equal(uniqueCodes.length);
    });
  });

  describe('createLocaleDropdown', () => {
    it('should create combobox with default options', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      expect(dropdown).to.be.instanceOf(HTMLElement);
      expect(dropdown.classList.contains('locale-combobox')).to.be.true;
      const combobox = dropdown.querySelector('[role="combobox"]');
      expect(combobox).to.exist;
      expect(combobox.textContent).to.equal('English (US)');
      expect(combobox.getAttribute('aria-expanded')).to.equal('false');
      expect(combobox.getAttribute('aria-haspopup')).to.equal('listbox');
      expect(combobox.getAttribute('aria-controls')).to.exist;
      expect(combobox.getAttribute('tabindex')).to.equal('0');
      const listbox = dropdown.querySelector('[role="listbox"]');
      expect(listbox).to.exist;
      const options = dropdown.querySelectorAll('[role="option"]');
      expect(options.length).to.equal(LOCALES.length);
    });

    it('should create combobox with custom options', () => {
      const options = {
        defaultValue: 'fr-fr',
        className: 'custom-class',
      };
      const dropdown = createLocaleDropdown(options);
      container.appendChild(dropdown);
      expect(dropdown.classList.contains('custom-class')).to.be.true;
      const combobox = dropdown.querySelector('[role="combobox"]');
      expect(combobox.textContent).to.equal('French');
    });

    it('should call onChange callback when option is selected', () => {
      const onChangeStub = sinon.stub();
      const dropdown = createLocaleDropdown({ onChange: onChangeStub });
      container.appendChild(dropdown);
      const options = dropdown.querySelectorAll('[role="option"]');
      const frIndex = Array.from(options).findIndex(
        (opt) => opt.textContent === 'French',
      );
      options[frIndex].click();
      expect(onChangeStub.calledOnce).to.be.true;
      expect(onChangeStub.calledWith('fr-fr', 'French')).to.be.true;
    });

    it('should update display when option is selected', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      const options = dropdown.querySelectorAll('[role="option"]');
      const deIndex = Array.from(options).findIndex(
        (opt) => opt.textContent === 'German',
      );
      options[deIndex].click();
      expect(combobox.textContent).to.equal('German');
    });

    it('should open and close listbox on combobox click', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      // Initially closed
      expect(dropdown.classList.contains('open')).to.be.false;
      // Click to open
      combobox.click();
      expect(dropdown.classList.contains('open')).to.be.true;
      expect(combobox.getAttribute('aria-expanded')).to.equal('true');
      // Click to close
      combobox.click();
      expect(dropdown.classList.contains('open')).to.be.false;
      expect(combobox.getAttribute('aria-expanded')).to.equal('false');
    });

    it('should close listbox when clicking outside', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      // Open dropdown
      combobox.click();
      expect(dropdown.classList.contains('open')).to.be.true;
      // Click outside
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();
      expect(dropdown.classList.contains('open')).to.be.false;
      document.body.removeChild(outsideElement);
    });

    it('should close listbox when option is clicked', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      // Open dropdown
      combobox.click();
      expect(dropdown.classList.contains('open')).to.be.true;
      const options = dropdown.querySelectorAll('[role="option"]');
      const jaIndex = Array.from(options).findIndex(
        (opt) => opt.textContent === 'Japanese',
      );
      options[jaIndex].click();
      expect(dropdown.classList.contains('open')).to.be.false;
    });

    it('should support keyboard navigation with Enter key', () => {
      const onChangeStub = sinon.stub();
      const dropdown = createLocaleDropdown({ onChange: onChangeStub });
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      combobox.click();
      // Simulate ArrowDown to move to next option
      combobox.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
      );
      // Simulate Enter to select
      combobox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(onChangeStub.called).to.be.true;
    });

    it('should support keyboard navigation with Space key', () => {
      const onChangeStub = sinon.stub();
      const dropdown = createLocaleDropdown({ onChange: onChangeStub });
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      combobox.click();
      // Simulate ArrowDown to move to next option
      combobox.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown' }),
      );
      // Simulate Space to select
      combobox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(onChangeStub.called).to.be.true;
    });

    it('should have proper accessibility attributes', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      expect(combobox.getAttribute('role')).to.equal('combobox');
      expect(combobox.getAttribute('aria-expanded')).to.exist;
      expect(combobox.getAttribute('aria-haspopup')).to.equal('listbox');
      expect(combobox.getAttribute('aria-controls')).to.exist;
      const listbox = dropdown.querySelector('[role="listbox"]');
      expect(listbox).to.exist;
      const options = dropdown.querySelectorAll('[role="option"]');
      options.forEach((option) => {
        expect(option.getAttribute('role')).to.equal('option');
      });
    });

    it('should handle invalid default value gracefully', () => {
      const dropdown = createLocaleDropdown({ defaultValue: 'invalid-locale' });
      container.appendChild(dropdown);
      const combobox = dropdown.querySelector('[role="combobox"]');
      expect(combobox.textContent).to.equal('English (US)');
    });

    it('should create all locale options', () => {
      const dropdown = createLocaleDropdown();
      container.appendChild(dropdown);
      const options = dropdown.querySelectorAll('[role="option"]');
      expect(options.length).to.equal(LOCALES.length);
      LOCALES.forEach((locale, index) => {
        expect(options[index].textContent).to.equal(locale.label);
      });
    });
  });

  describe('createLocaleDropdownWrapper', () => {
    it('should create wrapper with default options', () => {
      const { wrapper, dropdown } = createLocaleDropdownWrapper();
      container.appendChild(wrapper);
      expect(wrapper).to.be.instanceOf(HTMLElement);
      expect(wrapper.classList.contains('locale-dropdown-wrapper')).to.be.true;
      expect(dropdown).to.be.instanceOf(HTMLElement);
      const label = wrapper.querySelector('.locale-dropdown-label');
      expect(label).to.exist;
      expect(label.textContent).to.equal('Choose the language spoken in video');
      const combobox = wrapper.querySelector('[role="combobox"]');
      expect(combobox).to.exist;
    });

    it('should create wrapper with custom options', () => {
      const options = {
        label: 'Custom Label',
        labelId: 'custom-id',
        defaultValue: 'ja-jp',
        className: 'custom-dropdown-class',
      };
      const { wrapper, dropdown } = createLocaleDropdownWrapper(options);
      container.appendChild(wrapper);
      const label = wrapper.querySelector('.locale-dropdown-label');
      expect(label.textContent).to.equal('Custom Label');
      expect(dropdown.classList.contains('custom-dropdown-class')).to.be.true;
      const combobox = wrapper.querySelector('[role="combobox"]');
      expect(combobox).to.exist;
      expect(combobox.textContent).to.equal('Japanese');
    });

    it('should pass through dropdown options correctly', () => {
      const onChangeStub = sinon.stub();
      const { wrapper, dropdown } = createLocaleDropdownWrapper({
        onChange: onChangeStub,
        defaultValue: 'ko-kr',
      });
      container.appendChild(wrapper);
      const options = dropdown.querySelectorAll('[role="option"]');
      const cmnIndex = Array.from(options).findIndex(
        (opt) => opt.textContent === 'Chinese (Simplified)',
      );
      options[cmnIndex].click();
      expect(onChangeStub.calledOnce).to.be.true;
      expect(onChangeStub.calledWith('cmn-hans', 'Chinese (Simplified)')).to.be
        .true;
    });

    it('should contain both label and dropdown elements', () => {
      const { wrapper } = createLocaleDropdownWrapper();
      container.appendChild(wrapper);
      const label = wrapper.querySelector('.locale-dropdown-label');
      const dropdownElement = wrapper.querySelector('.locale-combobox');
      expect(label).to.exist;
      expect(dropdownElement).to.exist;
      expect(wrapper.children.length).to.equal(2);
    });
  });
});
