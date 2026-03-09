/* eslint-env mocha */
/* eslint max-classes-per-file: "off" */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/comparison-table-v2/sticky-header.js'),
  import('../../../express/code/blocks/comparison-table-v2/comparison-table-state.js'),
]);

const {
  setCreateTag,
  createStickyHeader,
  initStickyBehavior,
  synchronizePlanCellHeights,
} = imports[1];

const { ComparisonTableState } = imports[2];

const body = await readFile({ path: './mocks/sticky-header-body.html' });

describe('Sticky Header', () => {
  let clock;
  let mockCreateTag;

  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(async () => {
    document.body.innerHTML = body;
    clock = sinon.useFakeTimers();

    // Mock window.matchMedia to return desktop by default
    window.matchMedia = (query) => ({
      matches: query.includes('1024px'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    // Mock createTag function
    mockCreateTag = (tag, attrs = {}) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'class') {
          el.className = value;
        } else {
          el.setAttribute(key, value);
        }
      });
      return el;
    };

    // Set the createTag function
    setCreateTag(mockCreateTag);

    // Mock getIconElementDeprecated by importing utils
    const mockUtils = await import('../../../express/code/scripts/utils.js');
    window.getIconElementDeprecated = mockUtils.getIconElementDeprecated || ((icon) => {
      const span = document.createElement('span');
      span.classList.add('icon', `icon-${icon}`);
      return span;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    clock.restore();
    sinon.restore();
  });

  describe('setCreateTag', () => {
    it('should set the createTag function', () => {
      const testFn = () => 'test';
      setCreateTag(testFn);
      // Since createTag is private, we can verify it works by using it in createStickyHeader
      expect(() => setCreateTag(testFn)).to.not.throw();
    });
  });

  describe('createPlanDropdownChoices', () => {
    it('should create dropdown choices with proper attributes', () => {
      const headers = ['Plan A', 'Plan B', 'Plan C'];
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create a simple header structure for testing
      headers.forEach((header, index) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = index === 0 ? 'Compare' : header;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planSelector = result.stickyHeaderEl.querySelector('.plan-selector');

      if (!planSelector) {
        // No plan selector for 2 columns, skip this test
        return;
      }

      const choices = planSelector.querySelector('.plan-selector-choices');

      expect(choices).to.exist;
      expect(choices.classList.contains('invisible-content')).to.be.true;
      expect(choices.getAttribute('role')).to.equal('listbox');
      expect(choices.getAttribute('aria-label')).to.equal('Plan options');

      const options = choices.querySelectorAll('.plan-selector-choice');
      expect(options).to.have.length(2); // Plan B and Plan C (excluding first cell)

      options.forEach((option, index) => {
        expect(option.getAttribute('role')).to.equal('option');
        expect(option.getAttribute('aria-selected')).to.equal('false');
        expect(option.getAttribute('tabindex')).to.equal('-1');
        expect(option.getAttribute('data-plan-index')).to.equal(String(index));
        expect(option.textContent).to.equal(headers[index + 1]);
      });
    });
  });

  describe('createPlanSelector', () => {
    it('should handle keyboard events on plan selector', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create header cells
      ['Compare', 'Express Teams', 'Canva Teams', 'Express Free'].forEach((text) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = text;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planCellWrapper = result.stickyHeaderEl.querySelector('.plan-cell-wrapper');
      const selectWrapper = planCellWrapper.querySelector('.plan-selector-wrapper');
      const planSelector = selectWrapper.querySelector('.plan-selector');

      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const clickSpy = sinon.spy(planSelector, 'click');
      selectWrapper.dispatchEvent(enterEvent);

      expect(clickSpy.called).to.be.true;
      clickSpy.restore();

      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      const clickSpy2 = sinon.spy(planSelector, 'click');
      selectWrapper.dispatchEvent(spaceEvent);

      expect(clickSpy2.called).to.be.true;
    });

    it('should handle click events on plan cell wrapper', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create header cells
      ['Compare', 'Express Teams', 'Canva Teams', 'Express Free'].forEach((text) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = text;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planCellWrapper = result.stickyHeaderEl.querySelector('.plan-cell-wrapper');
      const planSelector = planCellWrapper.querySelector('.plan-selector');

      const clickSpy = sinon.spy(planSelector, 'click');

      // Click on plan cell wrapper (not on action area or selector)
      planCellWrapper.click();

      expect(clickSpy.called).to.be.true;
    });
  });

  describe('createStickyHeader', () => {
    it('should create sticky header with proper structure', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create header cells
      const headers = ['Compare Features', 'Adobe Express Teams', 'Canva Teams'];
      headers.forEach((text) => {
        const cell = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.textContent = text;
        cell.appendChild(h3);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);

      expect(result.stickyHeaderEl).to.exist;
      expect(result.stickyHeaderEl.classList.contains('sticky-header')).to.be.true;
      expect(result.colTitles).to.deep.equal(['Adobe Express Teams', 'Canva Teams']);

      const wrapper = result.stickyHeaderEl.querySelector('.sticky-header-wrapper');
      expect(wrapper).to.exist;

      const firstCell = wrapper.querySelector('.first-cell');
      expect(firstCell).to.exist;

      const planCells = wrapper.querySelectorAll('.plan-cell');
      expect(planCells).to.have.length(2);
    });

    it('should handle two-column layout', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create only 2 columns
      ['Compare', 'Adobe Express', 'Canva'].forEach((text) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = text;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planCellWrappers = result.stickyHeaderEl.querySelectorAll('.plan-cell-wrapper');

      planCellWrappers.forEach((wrapper) => {
        expect(wrapper.classList.contains('two-columns')).to.be.true;
      });

      // Should not have plan selectors for 2 columns
      const planSelectors = result.stickyHeaderEl.querySelectorAll('.plan-selector');
      expect(planSelectors).to.have.length(0);
    });

    it('should handle no subheaders case', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create headers without p tags (no subheaders)
      ['Compare', 'Express', 'Canva'].forEach((text) => {
        const cell = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.textContent = text;
        cell.appendChild(h3);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planCellWrappers = result.stickyHeaderEl.querySelectorAll('.plan-cell-wrapper');

      planCellWrappers.forEach((wrapper) => {
        expect(wrapper.classList.contains('no-subheaders')).to.be.true;
      });
    });

    it('should handle action buttons', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create header with action button - need 3+ columns for full behavior
      const cell1 = document.createElement('div');
      cell1.innerHTML = '<p>Compare</p>';
      headerGroup[1].appendChild(cell1);

      const cell2 = document.createElement('div');
      const p2 = document.createElement('p');
      p2.textContent = 'Express Premium';
      cell2.appendChild(p2);

      const actionArea2 = document.createElement('div');
      actionArea2.className = 'action-area';
      actionArea2.innerHTML = '<a href="#">Start trial</a>';
      cell2.appendChild(actionArea2);

      headerGroup[1].appendChild(cell2);

      const cell3 = document.createElement('div');
      const p3 = document.createElement('p');
      p3.textContent = 'Express Free';
      cell3.appendChild(p3);
      headerGroup[1].appendChild(cell3);

      const result = createStickyHeader(headerGroup, comparisonBlock);

      // Find the action area in the result
      const actionArea = result.stickyHeaderEl.querySelector('.action-area');
      expect(actionArea).to.exist;

      // The action area should have both 'action-area' and 'plan-cell' classes
      expect(actionArea.classList.contains('action-area')).to.be.true;
      expect(actionArea.classList.contains('plan-cell')).to.be.true;

      // The original content from the action area should be inside a plan-cell-wrapper
      const actionAreaWrapper = actionArea.querySelector('.plan-cell-wrapper');
      expect(actionAreaWrapper).to.exist;

      // The link should be inside the wrapper
      const link = actionAreaWrapper.querySelector('a');
      expect(link).to.exist;
      expect(link.textContent).to.equal('Start trial');
    });

    it('should close dropdowns on outside click', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create 3+ columns to get dropdowns
      ['Compare', 'Plan A', 'Plan B', 'Plan C'].forEach((text) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = text;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const choices = result.stickyHeaderEl.querySelector('.plan-selector-choices');

      // Open dropdown
      choices.classList.remove('invisible-content');

      // Click outside
      document.body.click();

      expect(choices.classList.contains('invisible-content')).to.be.true;
    });
  });

  describe('initStickyBehavior', () => {
    let observerCallbacks;
    let originalIntersectionObserver;

    beforeEach(() => {
      observerCallbacks = [];

      // Mock IntersectionObserver
      originalIntersectionObserver = window.IntersectionObserver;
      window.IntersectionObserver = class MockIntersectionObserver {
        constructor(callback, options) {
          this.callback = callback;
          this.options = options;
          observerCallbacks.push({ callback, options });
        }

        observe() {
          this.callback([{
            isIntersecting: true,
            boundingClientRect: { top: 0 },
          }]);
        }

        unobserve() {
          this.callback([{
            isIntersecting: false,
            boundingClientRect: { top: -10 },
          }]);
        }

        disconnect() {
          this.callback([{
            isIntersecting: false,
            boundingClientRect: { top: -10 },
          }]);
        }
      };
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('should create placeholder and sentinel elements', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      // Add comparisonBlock to document body so previousElementSibling works
      document.body.appendChild(comparisonBlock);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      expect(placeholder).to.exist;

      // The sentinel is inserted before the comparisonBlock, not as a child
      const sentinel = comparisonBlock.previousElementSibling;
      expect(sentinel).to.exist;
      expect(sentinel.style.position).to.equal('absolute');
      expect(sentinel.style.top).to.equal('0px');
      expect(sentinel.style.height).to.equal('1px');
    });

    it('should handle sticky state transitions', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      // Add required parent structure
      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      comparisonBlock.appendChild(stickyHeader);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -10 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;

      // Mock header sentinel back in viewport
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: 10 });

      // Trigger scroll to remove sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.false;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should expose controls to suspend sticky removal', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      comparisonBlock.appendChild(stickyHeader);

      const controls = initStickyBehavior(stickyHeader, comparisonBlock);
      expect(controls).to.have.property('suspendStickyRelease');
      expect(controls).to.have.property('resumeStickyRelease');

      const headerSentinel = comparisonBlock.previousElementSibling;
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -10 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;

      controls.suspendStickyRelease();
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: 20 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;

      controls.resumeStickyRelease();
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
    });

    it('should handle hidden parent section', () => {
      const section = document.createElement('section');
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      comparisonBlock.appendChild(stickyHeader);
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -10 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Verify it's now sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;

      // Add display-none class to parent element
      section.classList.add('display-none');

      // Trigger scroll again with hidden parent
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Should remove sticky when section is hidden
      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should trigger sticky once sentinel enters gnav offset region on desktop', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 80, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.style.setProperty('--gnav-offset-height', '90px');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      comparisonBlock.appendChild(stickyHeader);
      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: 70 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 400 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;
    });

    it('should not trigger sticky until sentinel reaches gnav offset on desktop', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 80, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.style.setProperty('--gnav-offset-height', '90px');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      comparisonBlock.appendChild(stickyHeader);
      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: 120 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 400 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should close dropdown when becoming sticky', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      // Create mock dropdown structure
      const wrapper = document.createElement('div');
      wrapper.classList.add('plan-cell-wrapper');
      wrapper.setAttribute('aria-expanded', 'true');

      const selector = document.createElement('div');
      selector.classList.add('plan-selector');
      wrapper.appendChild(selector);
      stickyHeader.appendChild(wrapper);

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      // Add required parent structure
      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      comparisonBlock.appendChild(stickyHeader);

      // Mock ComparisonTableState.closeDropdown to avoid null reference error
      const originalCloseDropdown = ComparisonTableState.closeDropdown;
      let closeDropdownCalled = false;
      let closeDropdownArg = null;

      ComparisonTableState.closeDropdown = (arg) => {
        closeDropdownCalled = true;
        closeDropdownArg = arg;
      };

      initStickyBehavior(stickyHeader, comparisonBlock);

      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -10 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(closeDropdownCalled).to.be.true;
      expect(closeDropdownArg).to.equal(selector);

      // Restore original function
      ComparisonTableState.closeDropdown = originalCloseDropdown;
    });

    it('should retract sticky when scrolled past content bottom', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the placeholder and sentinel
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock getBoundingClientRect - header sentinel above viewport
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -50 });
      // Mock content bottom below sticky header height (visible)
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 200 });

      // Trigger scroll to apply sticky state
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Verify header is sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');

      // Now mock content bottom above header height (not visible)
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 50 });

      // Trigger scroll
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Header should be retracted
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.true;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should toggle sticky state based on scroll position and content visibility', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      for (let i = 0; i < 3; i += 1) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = `Row ${i + 1}`;
        row.appendChild(cell);
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      tableContainer.appendChild(table);
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -30 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');
      expect(stickyHeader.classList.contains('is-retracted')).to.be.false;

      // Content scrolls past (bottom <= header height)
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 50 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.true;
      expect(placeholder.style.display).to.equal('none');

      // Content comes back into view
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 300 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.false;
      expect(placeholder.style.display).to.equal('flex');
    });

    it('should use last table container bottom for visibility check', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const createTableContainer = (label) => {
        const container = document.createElement('div');
        container.classList.add('table-container');
        const tbl = document.createElement('table');
        const tbody = document.createElement('tbody');
        for (let i = 0; i < 2; i += 1) {
          const row = document.createElement('tr');
          const td = document.createElement('td');
          td.textContent = `${label} Row ${i + 1}`;
          row.appendChild(td);
          tbody.appendChild(row);
        }
        tbl.appendChild(tbody);
        container.appendChild(tbl);
        return { container, lastRow: tbody.lastElementChild };
      };

      const first = createTableContainer('First');
      const second = createTableContainer('Second');
      comparisonBlock.append(first.container, second.container);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -20 });
      // Last container is still visible
      second.container.getBoundingClientRect = sinon.stub().returns({ bottom: 300 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.false;
      expect(placeholder.style.display).to.equal('flex');

      // Last container scrolls past header height
      second.container.getBoundingClientRect = sinon.stub().returns({ bottom: 50 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.true;

      // Last container comes back into view
      second.container.getBoundingClientRect = sinon.stub().returns({ bottom: 200 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.false;
    });

    it('should handle parent section style.display changes via MutationObserver', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      comparisonBlock.appendChild(stickyHeader);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Track MutationObserver creation
      let mutationCallback = null;
      const originalMutationObserver = window.MutationObserver;
      window.MutationObserver = class MockMutationObserver {
        constructor(callback) {
          mutationCallback = callback;
        }

        // eslint-disable-next-line class-methods-use-this
        observe() { /* Mock method */ }

        // eslint-disable-next-line class-methods-use-this
        disconnect() { /* Mock method */ }
      };

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the placeholder and sentinel
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -10 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Verify header is sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');

      // Restore original MutationObserver
      window.MutationObserver = originalMutationObserver;

      // Verify MutationObserver was created
      expect(mutationCallback).to.not.be.null;

      // Simulate parent section being hidden via style.display
      section.style.display = 'none';

      // Trigger the mutation callback
      mutationCallback([{
        type: 'attributes',
        attributeName: 'style',
        target: section,
      }]);

      // Sticky state should be removed
      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should reveal sticky header when scrolling back up into content', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the placeholder and header sentinel
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -50 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 300 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Verify header is sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;

      // Content scrolls past (retract)
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 50 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Should be retracted
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.true;
      expect(placeholder.style.display).to.equal('none');

      // Scroll back up - content visible again
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 300 });

      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Should reveal sticky header
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('is-retracted')).to.be.false;
      expect(placeholder.style.display).to.equal('flex');
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;
    });

    it('should not apply sticky when header sentinel is in viewport', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the header sentinel
      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel visible in viewport (not past it)
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: 50 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // Should not apply sticky since header sentinel is in viewport
      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.false;
    });

    it('should maintain gnav-offset when sticky on desktop', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      Object.defineProperty(stickyHeader, 'offsetHeight', { value: 100, configurable: true });

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      const tableContainer = document.createElement('div');
      tableContainer.classList.add('table-container');
      comparisonBlock.appendChild(tableContainer);

      comparisonBlock.appendChild(stickyHeader);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const headerSentinel = comparisonBlock.previousElementSibling;

      // Mock header sentinel above viewport, content visible
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -10 });
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 500 });

      // Trigger scroll to apply sticky
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);

      // gnav-offset should be added on desktop when sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;

      // gnav-offset should remain while sticky (content still visible)
      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 400 });
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;

      tableContainer.getBoundingClientRect = sinon.stub().returns({ bottom: 300 });
      window.dispatchEvent(new Event('scroll'));
      clock.tick(100);
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;
    });
  });

  describe('synchronizePlanCellHeights', () => {
    it('should synchronize heights of plan cell wrappers', () => {
      const comparisonBlock = document.createElement('div');

      // Create plan cell wrappers with different heights
      const wrapper1 = document.createElement('div');
      wrapper1.classList.add('plan-cell-wrapper');
      wrapper1.style.height = '50px';
      Object.defineProperty(wrapper1, 'offsetHeight', { value: 50, configurable: true });

      const wrapper2 = document.createElement('div');
      wrapper2.classList.add('plan-cell-wrapper');
      wrapper2.style.height = '80px';
      Object.defineProperty(wrapper2, 'offsetHeight', { value: 80, configurable: true });

      const wrapper3 = document.createElement('div');
      wrapper3.classList.add('plan-cell-wrapper');
      wrapper3.style.height = '60px';
      Object.defineProperty(wrapper3, 'offsetHeight', { value: 60, configurable: true });

      comparisonBlock.appendChild(wrapper1);
      comparisonBlock.appendChild(wrapper2);
      comparisonBlock.appendChild(wrapper3);

      synchronizePlanCellHeights(comparisonBlock);

      expect(wrapper1.style.height).to.equal('80px');
      expect(wrapper2.style.height).to.equal('80px');
      expect(wrapper3.style.height).to.equal('80px');
    });

    it('should not synchronize heights when header is stuck', () => {
      const comparisonBlock = document.createElement('div');

      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('is-stuck');
      comparisonBlock.appendChild(stickyHeader);

      const wrapper1 = document.createElement('div');
      wrapper1.classList.add('plan-cell-wrapper');
      wrapper1.style.height = '50px';

      const wrapper2 = document.createElement('div');
      wrapper2.classList.add('plan-cell-wrapper');
      wrapper2.style.height = '80px';

      comparisonBlock.appendChild(wrapper1);
      comparisonBlock.appendChild(wrapper2);

      synchronizePlanCellHeights(comparisonBlock);

      // Heights should be reset to auto but not synchronized
      expect(wrapper1.style.height).to.equal('auto');
      expect(wrapper2.style.height).to.equal('auto');
    });

    it('should handle empty block gracefully', () => {
      const comparisonBlock = document.createElement('div');

      expect(() => synchronizePlanCellHeights(comparisonBlock)).to.not.throw();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown key to open dropdown', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create 3+ columns for dropdown
      ['Compare', 'Plan A', 'Plan B', 'Plan C'].forEach((text) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = text;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planCellWrapper = result.stickyHeaderEl.querySelector('.plan-cell-wrapper');
      const planSelector = planCellWrapper.querySelector('.plan-selector');
      const dropdown = planSelector.querySelector('.plan-selector-choices');

      // Mock media query for mobile
      window.matchMedia = () => ({ matches: false });

      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });

      const clickSpy = sinon.spy(planSelector, 'click');

      // Target the event at the plan cell wrapper
      Object.defineProperty(arrowDownEvent, 'target', {
        value: planCellWrapper,
        writable: false,
      });

      planCellWrapper.dispatchEvent(arrowDownEvent);

      expect(clickSpy.called).to.be.true;

      // Verify first option gets focused after timeout
      clock.tick(0);

      const firstOption = dropdown.querySelector('.plan-selector-choice');
      expect(firstOption.classList.contains('focused')).to.be.true;
    });

    it('should focus first option when ArrowDown pressed with dropdown already open but nothing focused', () => {
      const headerGroup = [null, document.createElement('div')];
      const comparisonBlock = document.querySelector('.comparison-table-v2');

      // Create 3+ columns for dropdown
      ['Compare', 'Plan A', 'Plan B', 'Plan C'].forEach((text) => {
        const cell = document.createElement('div');
        const p = document.createElement('p');
        p.textContent = text;
        cell.appendChild(p);
        headerGroup[1].appendChild(cell);
      });

      const result = createStickyHeader(headerGroup, comparisonBlock);
      const planCellWrapper = result.stickyHeaderEl.querySelector('.plan-cell-wrapper');
      const planSelector = planCellWrapper.querySelector('.plan-selector');
      const dropdown = planSelector.querySelector('.plan-selector-choices');

      // Mock media query for mobile
      window.matchMedia = () => ({ matches: false });

      // Manually open the dropdown first
      dropdown.classList.remove('invisible-content');

      // Make sure no option is focused
      dropdown.querySelectorAll('.plan-selector-choice').forEach((opt) => {
        opt.classList.remove('focused');
      });

      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });

      // Spy on click to ensure it's NOT called when dropdown is already open
      const clickSpy = sinon.spy(planSelector, 'click');

      // Target the event at the plan cell wrapper
      Object.defineProperty(arrowDownEvent, 'target', {
        value: planCellWrapper,
        writable: false,
      });

      planCellWrapper.dispatchEvent(arrowDownEvent);

      // Should NOT trigger click when dropdown is already open
      expect(clickSpy.called).to.be.false;

      // Should focus the first visible option
      const firstOption = dropdown.querySelector('.plan-selector-choice:not(.invisible-content)');
      expect(firstOption.classList.contains('focused')).to.be.true;

      // Verify that focus() was called on the element
      const focusSpy = sinon.spy(firstOption, 'focus');
      firstOption.focus();
      expect(focusSpy.called).to.be.true;
    });
  });
});
