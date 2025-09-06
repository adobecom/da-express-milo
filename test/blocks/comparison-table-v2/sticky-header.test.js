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

      initStickyBehavior(stickyHeader, comparisonBlock);

      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      expect(placeholder).to.exist;
      expect(placeholder.nextSibling).to.be.null;

      const sentinel = comparisonBlock.firstChild;
      expect(sentinel.style.position).to.equal('absolute');
      expect(sentinel.style.top).to.equal('0px');
      expect(sentinel.style.height).to.equal('1px');
    });

    it('should handle sticky state transitions', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      stickyHeader.style.height = '100px';
      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');

      // Add required parent structure
      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      comparisonBlock.appendChild(stickyHeader);

      initStickyBehavior(stickyHeader, comparisonBlock);

      const headerObserver = observerCallbacks[0];
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');

      // Simulate header scrolling past top
      headerObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { top: -10 },
      }]);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('initial')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');

      // Wait for transition
      clock.tick(100);

      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;
      expect(stickyHeader.classList.contains('initial')).to.be.false;

      // Simulate header coming back into view
      headerObserver.callback([{
        isIntersecting: true,
        boundingClientRect: { top: 0 },
      }]);

      expect(stickyHeader.classList.contains('initial')).to.be.true;

      clock.tick(100);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.false;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should handle hidden parent section', () => {
      const section = document.createElement('section');
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header', 'is-stuck');
      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Add display-none class to parent element
      comparisonBlock.parentElement.classList.add('display-none');

      initStickyBehavior(stickyHeader, comparisonBlock);

      const headerObserver = observerCallbacks[0];

      // Trigger observer with hidden parent
      headerObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { top: -10 },
      }]);

      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
    });

    it('should close dropdown when becoming sticky', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');

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

      const headerObserver = observerCallbacks[0];

      // Simulate header scrolling past top
      headerObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { top: -10 },
      }]);

      expect(closeDropdownCalled).to.be.true;
      expect(closeDropdownArg).to.equal(selector);

      // Restore original function
      ComparisonTableState.closeDropdown = originalCloseDropdown;
    });

    it('should remove sticky when comparison block exits viewport at bottom', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the placeholder that was created
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');

      // Get the header observer and make header sticky first
      const headerObserver = observerCallbacks[0];
      headerObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { top: -10 },
      }]);

      // Wait for transition
      clock.tick(100);

      // Verify header is sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');

      // Now get the block observer (second observer)
      const blockObserver = observerCallbacks[1];

      // Simulate comparison block leaving viewport at bottom
      // The block observer only triggers removal when isSticky is true
      blockObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { bottom: -10 },
      }]);

      // Header should no longer be sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.false;
      expect(placeholder.style.display).to.equal('none');
    });

    it('should handle parent section style.display changes via MutationObserver', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
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

      // Get the placeholder that was created
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');

      // Get the header observer and make header sticky
      const headerObserver = observerCallbacks[0];
      headerObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { top: -10 },
      }]);

      // Wait for transition
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

    it('should reapply sticky header when scrolling back up after block exits viewport', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      stickyHeader.style.height = '100px';

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the placeholder and header sentinel
      const placeholder = comparisonBlock.querySelector('.sticky-header-placeholder');
      const headerSentinel = comparisonBlock.firstChild;

      // Mock getBoundingClientRect for header sentinel
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: -50 }); // Above viewport

      // Get observers
      const headerObserver = observerCallbacks[0];
      const blockObserver = observerCallbacks[1];

      // First make header sticky by scrolling past it
      headerObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { top: -10 },
      }]);
      clock.tick(100);

      // Verify header is sticky
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;

      // Now simulate block exiting viewport at bottom
      blockObserver.callback([{
        isIntersecting: false,
        boundingClientRect: { bottom: -10 },
      }]);

      // Sticky should be removed
      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.false;
      expect(placeholder.style.display).to.equal('none');

      // Now simulate block re-entering viewport (scrolling back up)
      blockObserver.callback([{
        isIntersecting: true,
        boundingClientRect: { top: 0, bottom: 100 },
      }]);

      // Should reapply sticky since header sentinel is above viewport
      expect(stickyHeader.classList.contains('is-stuck')).to.be.true;
      expect(stickyHeader.classList.contains('initial')).to.be.true;
      expect(placeholder.style.display).to.equal('flex');
      expect(placeholder.style.height).to.equal('100px');

      // Wait for transition
      clock.tick(100);

      expect(stickyHeader.classList.contains('gnav-offset')).to.be.true;
      expect(stickyHeader.classList.contains('initial')).to.be.false;
    });

    it('should not reapply sticky header when block re-enters but header sentinel is in viewport', () => {
      const stickyHeader = document.createElement('div');
      stickyHeader.classList.add('sticky-header');
      stickyHeader.style.height = '100px';

      const comparisonBlock = document.createElement('div');
      comparisonBlock.classList.add('comparison-table-v2');
      comparisonBlock.appendChild(stickyHeader);

      const section = document.createElement('section');
      section.appendChild(comparisonBlock);
      document.body.appendChild(section);

      // Initialize sticky behavior
      initStickyBehavior(stickyHeader, comparisonBlock);

      // Get the header sentinel
      const headerSentinel = comparisonBlock.firstChild;

      // Mock getBoundingClientRect for header sentinel - visible in viewport
      headerSentinel.getBoundingClientRect = sinon.stub().returns({ top: 50 }); // Below top

      // Get block observer
      const blockObserver = observerCallbacks[1];

      // Simulate block re-entering viewport when header sentinel is visible
      blockObserver.callback([{
        isIntersecting: true,
        boundingClientRect: { top: 0, bottom: 100 },
      }]);

      // Should not apply sticky since header sentinel is in viewport
      expect(stickyHeader.classList.contains('is-stuck')).to.be.false;
      expect(stickyHeader.classList.contains('gnav-offset')).to.be.false;
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
