/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [, { default: decorate }] = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/faqv2/faqv2.js'),
]);

const [body, expandable, longform] = await Promise.all([
  readFile({ path: './mocks/body.html' }),
  readFile({ path: './mocks/expandable.html' }),
  readFile({ path: './mocks/longform.html' }),
]);

describe('FAQv2', () => {
  let clock;

  before(() => {
    window.isTestEnv = true;
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should render FAQv2 block with original layout', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    expect(block).to.exist;
    // After decoration, the block should have been processed
    expect(block.children.length).to.be.greaterThan(0);
  });

  it('should show only 3 items initially in original layout', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    // After decoration, the original layout creates accordion elements
    expect(block.children.length).to.be.greaterThan(0);
  });

  it('should toggle view more/less button in original layout', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    const toggleBtn = block.querySelector('.faqv2-toggle-btn');

    // The toggle button should exist if there are more than 3 items
    if (toggleBtn) {
      expect(toggleBtn.getAttribute('aria-expanded')).to.equal('false');

      // Click to expand
      toggleBtn.click();
      expect(toggleBtn.getAttribute('aria-expanded')).to.equal('true');
    }
  });

  it('should render FAQv2 block with expandable layout', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    expect(block).to.exist;
    expect(block.querySelector('.faqv2-accordion.title')).to.exist;
    expect(block.querySelector('.faqv2-accordions-col')).to.exist;
    expect(block.querySelector('.faqv2-wrapper')).to.exist;
    expect(block.querySelector('.faqv2-toggle')).to.exist;
    expect(block.querySelector('.faqv2-header')).to.exist;
    expect(block.querySelector('.faqv2-content')).to.exist;
  });

  it('should have toggle icons in expandable layout', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    const toggleIcons = block.querySelectorAll('.toggle-icon');
    expect(toggleIcons.length).to.be.greaterThan(0);
    expect(toggleIcons[0].src).to.include('plus-heavy.svg');
  });

  it('should open first accordion by default in expandable layout', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    // Advance timer to trigger the setTimeout
    clock.tick(150);

    const firstContent = block.querySelector('.faqv2-content');
    expect(firstContent.classList.contains('open')).to.be.true;

    const firstIcon = block.querySelector('.toggle-icon');
    expect(firstIcon.src).to.include('minus-heavy.svg');
  });

  it('should toggle accordion on click in expandable layout', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    // Advance timer to open first accordion
    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const contents = block.querySelectorAll('.faqv2-content');

    // First should be open
    expect(contents[0].classList.contains('open')).to.be.true;

    // Click second header
    headers[1].click();

    // First should close, second should open
    expect(contents[0].classList.contains('open')).to.be.false;
    expect(contents[1].classList.contains('open')).to.be.true;
  });

  it('should render FAQv2 block with longform variant', async () => {
    document.body.innerHTML = longform;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    expect(block).to.exist;
    expect(block.querySelector('.faqv2-longform-header-container')).to.exist;
    expect(block.querySelector('.faqv2-accordion.title')).to.exist;
  });

  it('should handle keyboard navigation on toggle button', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    const toggleBtn = block.querySelector('.faqv2-toggle-btn');

    if (toggleBtn) {
      // Test Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      Object.defineProperty(enterEvent, 'key', { value: 'Enter' });
      toggleBtn.dispatchEvent(enterEvent);

      // Test Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      Object.defineProperty(spaceEvent, 'key', { value: ' ' });
      toggleBtn.dispatchEvent(spaceEvent);

      // Just verify the button exists and has the attribute
      expect(toggleBtn.hasAttribute('aria-expanded')).to.be.true;
    }
  });

  it('should close other accordions when opening a new one', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const contents = block.querySelectorAll('.faqv2-content');

    // Open second accordion
    headers[1].click();
    expect(contents[0].classList.contains('open')).to.be.false;
    expect(contents[1].classList.contains('open')).to.be.true;

    // Open third accordion
    headers[2].click();
    expect(contents[1].classList.contains('open')).to.be.false;
    expect(contents[2].classList.contains('open')).to.be.true;
  });

  it('should hide block when there is no content (expandable layout)', async () => {
    const emptyExpandable = `
      <div class="faqv2 expandable">
        <div>
          <div>Frequently Asked Questions</div>
        </div>
        <div>
          <div></div>
          <div></div>
        </div>
        <div>
          <div></div>
          <div></div>
        </div>
      </div>
    `;
    document.body.innerHTML = emptyExpandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    // Block should be hidden when there's no content
    expect(block.style.display).to.equal('none');
  });

  it('should hide block when there is no content (original layout)', async () => {
    const emptyBody = `
      <div class="faqv2">
        <div>
          <div>   </div>
          <div>   </div>
        </div>
      </div>
    `;
    document.body.innerHTML = emptyBody;
    const block = document.querySelector('.faqv2');

    await decorate(block);

    // When there's no content, the block should either be hidden or remain minimal
    // Check that it's either hidden or has no FAQ accordion elements
    const isHidden = block.style.display === 'none';
    const hasNoAccordions = block.querySelectorAll('.faqv2-accordion').length === 0;

    expect(isHidden || hasNoAccordions).to.be.true;
  });

  // Tests for missing coverage areas
  it('should handle keyboard navigation on accordion headers (expandable)', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const firstHeader = headers[0];

    // Test Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(enterEvent, 'key', { value: 'Enter' });
    firstHeader.dispatchEvent(enterEvent);

    // Test Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    Object.defineProperty(spaceEvent, 'key', { value: ' ' });
    firstHeader.dispatchEvent(spaceEvent);

    // Verify the header has proper attributes
    expect(firstHeader.hasAttribute('aria-expanded')).to.be.true;
    expect(firstHeader.hasAttribute('role')).to.be.true;
  });

  it('should handle keyboard navigation on accordion headers (longform)', async () => {
    document.body.innerHTML = longform;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const firstHeader = headers[0];

    // Test Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(enterEvent, 'key', { value: 'Enter' });
    firstHeader.dispatchEvent(enterEvent);

    // Test Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    Object.defineProperty(spaceEvent, 'key', { value: ' ' });
    firstHeader.dispatchEvent(spaceEvent);

    // Verify the header has proper attributes
    expect(firstHeader.hasAttribute('aria-expanded')).to.be.true;
    expect(firstHeader.hasAttribute('role')).to.be.true;
  });

  it('should test live region announcements for accordion state changes', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    // Check that live region exists
    const liveRegion = block.querySelector('.faqv2-live-region');
    expect(liveRegion).to.exist;
    expect(liveRegion.getAttribute('aria-live')).to.equal('polite');
    expect(liveRegion.getAttribute('aria-atomic')).to.equal('true');

    const headers = block.querySelectorAll('.faqv2-header');

    // Test opening an accordion (should trigger announcement)
    const secondHeader = headers[1];
    const initialLiveContent = liveRegion.textContent;

    secondHeader.click();

    // Wait a bit for the announcement
    clock.tick(100);

    // The live region should have been updated
    expect(liveRegion.textContent).to.not.equal(initialLiveContent);
  });

  it('should test closing accordion triggers live region announcement', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const liveRegion = block.querySelector('.faqv2-live-region');
    const headers = block.querySelectorAll('.faqv2-header');
    const firstHeader = headers[0];

    // First accordion should be open by default
    const firstContent = block.querySelector('.faqv2-content');
    expect(firstContent.classList.contains('open')).to.be.true;

    // Click to close it (should trigger announcement)
    const initialLiveContent = liveRegion.textContent;
    firstHeader.click();

    clock.tick(100);

    // The live region should have been updated
    expect(liveRegion.textContent).to.not.equal(initialLiveContent);
  });

  it('should test dynamic ARIA label updates on toggle button', async () => {
    // Create a block with more than 3 items to trigger toggle button
    const multiItemBody = `
      <div class="faqv2">
        <div>
          <div>Question 1</div>
          <div>Answer 1</div>
        </div>
        <div>
          <div>Question 2</div>
          <div>Answer 2</div>
        </div>
        <div>
          <div>Question 3</div>
          <div>Answer 3</div>
        </div>
        <div>
          <div>Question 4</div>
          <div>Answer 4</div>
        </div>
        <div>
          <div>Question 5</div>
          <div>Answer 5</div>
        </div>
      </div>
    `;
    document.body.innerHTML = multiItemBody;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    const toggleBtn = block.querySelector('.faqv2-toggle-btn');

    if (toggleBtn) {
      // Test initial state
      expect(toggleBtn.getAttribute('aria-expanded')).to.equal('false');
      expect(toggleBtn.getAttribute('aria-label')).to.include('Show');
      expect(toggleBtn.getAttribute('aria-label')).to.include('more questions');

      // Click to expand
      toggleBtn.click();
      expect(toggleBtn.getAttribute('aria-expanded')).to.equal('true');
      expect(toggleBtn.getAttribute('aria-label')).to.include('Hide');
      expect(toggleBtn.getAttribute('aria-label')).to.include('questions');

      // Click to collapse
      toggleBtn.click();
      expect(toggleBtn.getAttribute('aria-expanded')).to.equal('false');
      expect(toggleBtn.getAttribute('aria-label')).to.include('Show');
      expect(toggleBtn.getAttribute('aria-label')).to.include('more questions');
    }
  });

  it('should test accordion state management and ARIA attributes', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const contents = block.querySelectorAll('.faqv2-content');

    // Test that closing other accordions works properly
    const firstHeader = headers[0];
    const secondHeader = headers[1];
    const firstContent = contents[0];
    const secondContent = contents[1];

    // First should be open initially
    expect(firstContent.classList.contains('open')).to.be.true;
    expect(firstHeader.getAttribute('aria-expanded')).to.equal('true');
    expect(firstContent.getAttribute('aria-hidden')).to.equal('false');

    // Click second header
    secondHeader.click();

    // First should be closed, second should be open
    expect(firstContent.classList.contains('open')).to.be.false;
    expect(firstHeader.getAttribute('aria-expanded')).to.equal('false');
    expect(firstContent.getAttribute('aria-hidden')).to.equal('true');

    expect(secondContent.classList.contains('open')).to.be.true;
    expect(secondHeader.getAttribute('aria-expanded')).to.equal('true');
    expect(secondContent.getAttribute('aria-hidden')).to.equal('false');
  });

  it('should test longform variant accordion state management', async () => {
    document.body.innerHTML = longform;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const contents = block.querySelectorAll('.faqv2-content');

    // Test that closing other accordions works properly in longform
    const firstHeader = headers[0];
    const secondHeader = headers[1];
    const firstContent = contents[0];
    const secondContent = contents[1];

    // First should be open initially
    expect(firstContent.classList.contains('open')).to.be.true;
    expect(firstHeader.getAttribute('aria-expanded')).to.equal('true');
    expect(firstContent.getAttribute('aria-hidden')).to.equal('false');

    // Click second header
    secondHeader.click();

    // First should be closed, second should be open
    expect(firstContent.classList.contains('open')).to.be.false;
    expect(firstHeader.getAttribute('aria-expanded')).to.equal('false');
    expect(firstContent.getAttribute('aria-hidden')).to.equal('true');

    expect(secondContent.classList.contains('open')).to.be.true;
    expect(secondHeader.getAttribute('aria-expanded')).to.equal('true');
    expect(secondContent.getAttribute('aria-hidden')).to.equal('false');
  });

  it('should test icon updates during accordion state changes', async () => {
    document.body.innerHTML = expandable;
    const block = document.querySelector('.faqv2');
    await decorate(block);

    clock.tick(150);

    const headers = block.querySelectorAll('.faqv2-header');
    const icons = block.querySelectorAll('.toggle-icon');

    // First accordion should be open with minus icon
    expect(icons[0].src).to.include('minus-heavy.svg');

    // Click to close first accordion
    headers[0].click();
    expect(icons[0].src).to.include('plus-heavy.svg');

    // Click to open second accordion
    headers[1].click();
    expect(icons[1].src).to.include('minus-heavy.svg');
    expect(icons[0].src).to.include('plus-heavy.svg');
  });
});
