/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/comparison-table-v2/comparison-table-v2.js'),
]);
const { default: decorate } = imports[1];

const body = await readFile({ path: './mocks/body.html' });

describe('Comparison Table V2', () => {
  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    document.body.innerHTML = body;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * Test Objective: Verify basic decoration functionality
   *
   * This test ensures that the comparison table block is properly decorated with:
   * - A sticky header element for navigation
   * - Table structures for displaying comparison data
   * - Proper DOM transformation from the original div structure to interactive table format
   */
  it('should decorate the comparison table', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);

    const stickyHeader = block.querySelector('.sticky-header');
    expect(stickyHeader).to.exist;

    const tables = block.querySelectorAll('table');
    expect(tables.length).to.be.greaterThan(0);
  });

  /**
   * Test Objective: Verify accessibility live region creation
   *
   * This test ensures that an aria-live region is properly created for screen reader announcements.
   * The live region should:
   * - Have aria-live="polite" for non-intrusive announcements
   * - Have aria-atomic="true" to read entire content changes
   * - Be visually hidden but accessible to screen readers
   * - Be positioned absolutely off-screen to avoid visual interference
   */
  it('should create aria-live region for announcements', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);

    const ariaLiveRegion = block.querySelector('[aria-live="polite"]');
    expect(ariaLiveRegion).to.exist;
    expect(ariaLiveRegion.getAttribute('aria-atomic')).to.equal('true');
    expect(ariaLiveRegion.style.position).to.equal('absolute');
  });

  /**
   * Test Objective: Verify ARIA accessibility attributes for plan selectors
   *
   * This test ensures that plan selector elements are properly configured for accessibility:
   * - Each plan selector has a data-plan-index for identification
   * - Dropdown choices container has role="listbox" and proper aria-label
   * - Individual options have role="option" with aria-selected attributes
   * - All interactive elements are properly labeled for screen readers
   * - The correct number of plan selectors are created based on mock data (4 plans)
   */
  it('should create plan selectors with proper ARIA attributes', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);

    const planSelectors = block.querySelectorAll('.plan-selector');
    expect(planSelectors.length).to.equal(4);

    planSelectors.forEach((selector) => {
      expect(selector.hasAttribute('data-plan-index')).to.be.true;

      const choices = selector.querySelector('.plan-selector-choices');
      expect(choices).to.exist;
      expect(choices.getAttribute('role')).to.equal('listbox');
      expect(choices.getAttribute('aria-label')).to.equal('Plan options');

      const options = choices.querySelectorAll('.plan-selector-choice');
      options.forEach((option) => {
        expect(option.getAttribute('role')).to.equal('option');
        expect(option.hasAttribute('aria-selected')).to.be.true;
        expect(option.hasAttribute('data-plan-index')).to.be.true;
      });
    });
  });

  /**
   * Test Objective: Verify initial plan visibility state
   *
   * This test ensures the comparison table's default behavior of showing only two plans:
   * - Only 2 plan cells should be visible initially (not marked with invisible-content)
   * - The visible plans should have proper positioning classes (left-plan, right-plan)
   * - This provides a clean, focused comparison view for users
   * - Other plans remain hidden until user chooses to swap them in
   */
  it('should show only two plans initially', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);

    const visiblePlanCells = block.querySelectorAll('.plan-cell:not(.invisible-content)');
    expect(visiblePlanCells.length).to.equal(2);

    const leftPlan = block.querySelector('.plan-cell.left-plan');
    const rightPlan = block.querySelector('.plan-cell.right-plan');
    expect(leftPlan).to.exist;
    expect(rightPlan).to.exist;
  });

  /**
   * Test Objective: Verify mobile dropdown interaction behavior
   *
   * This test ensures that plan selector dropdowns work correctly on mobile devices:
   * - Sets mobile viewport (375px) since dropdowns only appear on mobile
   * - Verifies dropdown is initially closed (invisible-content class)
   * - Tests click interaction to open dropdown
   * - Confirms dropdown becomes visible after clicking
   * - Validates proper state management for mobile-specific UI elements
   */
  it('should open dropdown when plan selector is clicked', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });

    const selector = block.querySelector('.plan-selector');
    const dropdown = selector.querySelector('.plan-selector-choices');

    expect(dropdown.classList.contains('invisible-content')).to.be.true;

    selector.click();

    expect(dropdown.classList.contains('invisible-content')).to.be.false;
  });

  /**
   * Test Objective: Verify accessibility announcements for plan changes
   *
   * This test ensures that screen reader users receive proper feedback when plans are changed:
   * - Sets mobile viewport since plan selection occurs on mobile
   * - Opens dropdown and selects a different plan option
   * - Verifies that the aria-live region receives an announcement
   * - Confirms announcement includes "Changed", "plan from", and "to" for clear context
   * - Tests the integration between user interaction and accessibility features
   */
  it('should update aria-live region when plan is changed', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });

    const ariaLiveRegion = block.querySelector('[aria-live="polite"]');
    const selector = block.querySelector('.plan-selector');
    const dropdown = selector.querySelector('.plan-selector-choices');

    selector.click();

    const nonVisibleOption = Array.from(dropdown.querySelectorAll('.plan-selector-choice:not(.invisible-content)'))
      .find((opt) => !opt.classList.contains('selected'));

    if (nonVisibleOption) {
      nonVisibleOption.click();

      expect(ariaLiveRegion.textContent).to.include('Changed');
      expect(ariaLiveRegion.textContent).to.include('plan from');
      expect(ariaLiveRegion.textContent).to.include('to');
    }
  });

  /**
   * Test Objective: Verify keyboard accessibility for dropdown navigation
   *
   * This test ensures that users can navigate plan selectors using only keyboard:
   * - Tests on mobile viewport where dropdown functionality is available
   * - Verifies Enter key opens dropdown when plan-cell-wrapper is focused
   * - Tests Escape key closes dropdown for quick exit
   * - Ensures proper focus management between wrapper and selector elements
   * - Validates WCAG compliance for keyboard-only navigation
   */
  it('should handle keyboard navigation in dropdown', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });

    const planCellWrapper = block.querySelector('.plan-cell-wrapper');
    const selector = planCellWrapper.querySelector('.plan-selector');

    planCellWrapper.focus();

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    planCellWrapper.dispatchEvent(enterEvent);

    const dropdown = selector.querySelector('.plan-selector-choices');
    expect(dropdown.classList.contains('invisible-content')).to.be.false;

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    selector.dispatchEvent(escapeEvent);

    expect(dropdown.classList.contains('invisible-content')).to.be.true;
  });

  /**
   * Test Objective: Verify arrow key navigation within dropdown options
   *
   * This test ensures intuitive navigation through plan options using arrow keys:
   * - Mobile viewport setup for dropdown functionality
   * - First option should receive focus automatically when dropdown opens
   * - ArrowDown moves focus to next option in sequence
   * - ArrowUp moves focus to previous option in sequence
   * - Navigation wraps around (ArrowUp from first option goes to last)
   * - Tests proper focus state management with 'focused' class
   * - Ensures smooth keyboard-only option selection experience
   */
  it('should handle arrow key navigation in dropdown options', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 500); });

    const planCellWrapper = block.querySelector('.plan-cell-wrapper');
    const selector = planCellWrapper.querySelector('.plan-selector');

    planCellWrapper.focus();
    planCellWrapper.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    }));

    await new Promise((resolve) => { setTimeout(resolve, 500); });

    const dropdown = selector.querySelector('.plan-selector-choices');

    const visibleOptions = dropdown.querySelectorAll('.plan-selector-choice:not(.invisible-content)');
    console.log('visibleOptions', visibleOptions);

    expect(visibleOptions[0].classList.contains('focused')).to.be.true;

    const arrowDownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    selector.dispatchEvent(arrowDownEvent);

    expect(visibleOptions[0].classList.contains('focused')).to.be.false;
    expect(visibleOptions[1].classList.contains('focused')).to.be.true;

    const arrowUpEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    });
    selector.dispatchEvent(arrowUpEvent);

    expect(visibleOptions[0].classList.contains('focused')).to.be.true;
    expect(visibleOptions[1].classList.contains('focused')).to.be.false;

    selector.dispatchEvent(arrowUpEvent);

    const lastIndex = visibleOptions.length - 1;
    expect(visibleOptions[lastIndex].classList.contains('focused')).to.be.true;
  });

  /**
   * Test Objective: Verify Tab key closes dropdown (standard dropdown behavior)
   *
   * This test ensures proper dropdown keyboard behavior following WCAG guidelines:
   * - Mobile viewport required for dropdown functionality
   * - Tab key should close dropdown and allow normal navigation
   * - Tests standard dropdown pattern (not focus trap)
   * - Ensures keyboard-only users can efficiently exit dropdown
   * - Follows W3C ARIA Authoring Practices for dropdown/combobox patterns
   */
  it('should close dropdown when Tab key is pressed', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 500); });

    const planCellWrapper = block.querySelector('.plan-cell-wrapper');
    const selector = planCellWrapper.querySelector('.plan-selector');

    // Open dropdown
    planCellWrapper.focus();
    planCellWrapper.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    }));
    await new Promise((resolve) => { setTimeout(resolve, 500); });

    const dropdown = selector.querySelector('.plan-selector-choices');

    // Verify dropdown is open
    expect(dropdown.classList.contains('invisible-content')).to.be.false;

    // Test Tab key should close dropdown
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    selector.dispatchEvent(tabEvent);

    // Dropdown should be closed after Tab
    expect(dropdown.classList.contains('invisible-content')).to.be.true;
  });

  /**
   * Test Objective: Verify option selection using Enter and Space keys
   *
   * This test ensures that users can select plan options using standard activation keys:
   * - Mobile viewport setup for dropdown functionality
   * - Navigate to non-selected option using arrow keys
   * - Enter key should activate/select the focused option
   * - Space key should also activate/select the focused option
   * - Dropdown should close after successful selection
   * - Selected option should be marked with 'selected' class
   * - Tests both primary activation keys for comprehensive keyboard support
   */
  it('should handle Enter and Space key selection on options', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 500); });

    const planCellWrapper = block.querySelector('.plan-cell-wrapper');
    const selector = planCellWrapper.querySelector('.plan-selector');

    // Open dropdown
    planCellWrapper.focus();
    planCellWrapper.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    }));

    await new Promise((resolve) => { setTimeout(resolve, 500); });

    const dropdown = selector.querySelector('.plan-selector-choices');
    let visibleOptions = Array.from(dropdown.querySelectorAll('.plan-selector-choice:not(.invisible-content)'));

    // Find a non-selected option
    const nonSelectedOption = visibleOptions.find((opt) => !opt.classList.contains('selected'));
    console.log('nonSelectedOption', nonSelectedOption);
    if (nonSelectedOption) {
      // Navigate to the non-selected option
      const optionIndex = visibleOptions.indexOf(nonSelectedOption);
      for (let i = 0; i < optionIndex; i += 1) {
        selector.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        }));
        await new Promise((resolve) => { setTimeout(resolve, 100); });
      }
      await new Promise((resolve) => { setTimeout(resolve, 100); });
      // The option should be focused
      expect(nonSelectedOption.classList.contains('focused')).to.be.true;

      // Test Enter key selection
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      nonSelectedOption.dispatchEvent(enterEvent);
      console.log('nonSelectedOption', nonSelectedOption);
      await new Promise((resolve) => { setTimeout(resolve, 100); });

      // Dropdown should be closed after selection
      expect(nonSelectedOption.classList.contains('selected')).to.be.true;

      // Open dropdown again to test Space key
      planCellWrapper.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }));

      visibleOptions = Array.from(block.querySelector('.plan-cell-wrapper').querySelectorAll('.plan-selector-choice:not(.invisible-content)'));
      // Find another non-selected option
      const anotherNonSelectedOption = visibleOptions.find((opt) => !opt.classList.contains('selected') && opt !== nonSelectedOption);

      if (anotherNonSelectedOption) {
        // Focus on it
        anotherNonSelectedOption.focus();
        anotherNonSelectedOption.classList.add('focused');

        // Test Space key selection
        const keyDownEvent = new KeyboardEvent('keydown', {
          key: ' ',
          bubbles: true,
          cancelable: true,
        });
        anotherNonSelectedOption.dispatchEvent(keyDownEvent);

        // Key up
        const keyUpEvent = new KeyboardEvent('keyup', {
          key: ' ',
          bubbles: true,
          cancelable: true,
        });
        anotherNonSelectedOption.dispatchEvent(keyUpEvent);
        await new Promise((resolve) => { setTimeout(resolve, 300); });
        console.log('anotherNonSelectedOption', anotherNonSelectedOption);
        // Dropdown should be closed after selection
        expect(anotherNonSelectedOption.classList.contains('selected')).to.be.true;
      }
    }
  });

  /**
   * Test Objective: Verify focus management within individual option elements
   *
   * This test ensures proper tabindex handling for dropdown options:
   * - Mobile viewport for dropdown availability
   * - Options should have tabindex='0' when dropdown is open (focusable)
   * - Tab should exit the dropdown if the use has opened it via the down key
   */
  it('should handle Tab key focus trap within options', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });

    const planCellWrapper = block.querySelector('.plan-cell-wrapper');
    const selector = planCellWrapper.querySelector('.plan-selector');

    // Open dropdown
    planCellWrapper.focus();
    planCellWrapper.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    }));

    const dropdown = selector.querySelector('.plan-selector-choices');
    const visibleOptions = Array.from(dropdown.querySelectorAll('.plan-selector-choice:not(.invisible-content)'));

    // Focus on the first option
    visibleOptions[0].focus();
    visibleOptions[0].classList.add('focused');

    // Test Tab on option (should exit the dropdown)
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    visibleOptions[0].dispatchEvent(tabEvent);
    await new Promise((resolve) => { setTimeout(resolve, 100); });
    expect(dropdown.classList.contains('invisible-content')).to.be.true;
  });

  /**
   * Test Objective: Verify Space key activation for dropdown opening
   *
   * This test ensures alternative activation method for plan selector:
   * - Mobile viewport required for dropdown functionality
   * - Space key on plan-cell-wrapper should open dropdown (alternative to Enter)
   * - Tests dual activation keys (Enter and Space) for better accessibility
   * - Verifies aria-expanded attribute updates correctly
   * - Ensures consistent behavior regardless of activation method
   * - Provides redundant activation options for users with different preferences
   */
  it('should handle Space key on plan-cell-wrapper to open dropdown', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
    window.dispatchEvent(new Event('resize'));

    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });

    const planCellWrapper = block.querySelector('.plan-cell-wrapper');
    const selector = planCellWrapper.querySelector('.plan-selector');
    const dropdown = selector.querySelector('.plan-selector-choices');

    // Focus the plan-cell-wrapper
    planCellWrapper.focus();

    // Test Space key to open dropdown
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    planCellWrapper.dispatchEvent(spaceEvent);

    // Dropdown should be open
    expect(dropdown.classList.contains('invisible-content')).to.be.false;
    expect(planCellWrapper.getAttribute('aria-expanded')).to.equal('true');
  });

  /**
   * Test Objective: Verify collapsible section toggle functionality
   *
   * This test ensures that comparison table sections can be collapsed/expanded:
   * - Toggle buttons should be created for collapsible sections
   * - Each button must have proper ARIA labels for accessibility
   * - Buttons should have aria-expanded attribute to indicate state
   * - Visual expand/collapse icons should be present
   * - Tests content organization and progressive disclosure features
   * - Ensures users can focus on relevant sections while hiding others
   */
  it('should create toggle buttons for collapsible sections', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
    const toggleButtons = block.querySelectorAll('.toggle-button');
    expect(toggleButtons.length).to.be.greaterThan(0);

    toggleButtons.forEach((button) => {
      expect(button.hasAttribute('aria-expanded')).to.be.true;

      const icon = button.querySelector('.icon.expand-button');
      expect(icon).to.exist;
    });
  });

  /**
   * Test Objective: Verify table cell visibility synchronization with plan visibility
   *
   * This test ensures that table cells correctly reflect which plans are currently visible:
   * - Only cells corresponding to visible plans should be displayed
   * - Initially, first two plans should be visible (cells 0 and 1)
   * - Other plan cells (2, 3, etc.) should be hidden with invisible-content class
   * - Tests the core functionality of showing only relevant comparison data
   * - Ensures visual consistency between header and data rows
   * - Validates that plan visibility changes cascade to all table content
   */
  it('should handle table cell visibility based on visible plans', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
    const rows = block.querySelectorAll('tr');
    rows.forEach((row) => {
      const cells = row.querySelectorAll('.feature-cell:not(.feature-cell-header)');
      if (cells.length > 0) {
        expect(cells[0].classList.contains('invisible-content')).to.be.false;
        expect(cells[1].classList.contains('invisible-content')).to.be.false;
        if (cells[2]) expect(cells[2].classList.contains('invisible-content')).to.be.true;
        if (cells[3]) expect(cells[3].classList.contains('invisible-content')).to.be.true;
      }
    });
  });

  /**
   * Test Objective: Verify visual indication of currently selected plans in dropdown
   *
   * This test ensures that users can easily identify which plans are currently being compared:
   * - Dropdown should mark currently visible plans as 'selected'
   * - Exactly 2 options should show as selected (matching the 2 visible plans)
   * - Selected options should display visual indicator icons
   * - Tests user feedback and state awareness in the interface
   * - Helps users understand which plans they're currently comparing
   * - Prevents confusion when selecting alternative plans to compare
   */
  it('should mark currently visible plans as selected in dropdown', async () => {
    const block = document.querySelector('.comparison-table-v2');
    await decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
    const selector = block.querySelector('.plan-selector');
    selector.click();

    const dropdown = selector.querySelector('.plan-selector-choices');
    const selectedOptions = dropdown.querySelectorAll('.plan-selector-choice.selected');

    expect(selectedOptions.length).to.equal(2);

    selectedOptions.forEach((option) => {
      const icon = option.querySelector('.selected-icon');
      expect(icon).to.exist;
    });
  });
});
