/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { serviceManager } from '../../../express/code/libs/services/index.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

// Suppress benign ResizeObserver loop notifications that the test runner
// would otherwise report as unhandled errors.
window.addEventListener('error', (event) => {
  if (event?.message?.includes('ResizeObserver loop')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

sinon.stub(serviceManager, 'init').resolves(serviceManager);
sinon.stub(serviceManager, 'getProvider').resolves(null);

const { default: decorate } = await import(
  '../../../express/code/blocks/color-blindness/color-blindness.js'
);

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('color-blindness block', () => {
  describe('decoration with full content', () => {
    let block;

    before(async () => {
      block = document.querySelector('#cb-default');
      await decorate(block);
    });

    it('sets data-block-status to loaded', () => {
      expect(block.dataset.blockStatus).to.equal('loaded');
    });

    it('adds ax-shell-host class', () => {
      expect(block.classList.contains('ax-shell-host')).to.be.true;
    });

    it('clears original authored table rows', () => {
      const rows = block.querySelectorAll(':scope > div > div');
      const hasPageheading = Array.from(rows).some(
        (el) => el.textContent.trim().toLowerCase() === 'pageheading',
      );
      expect(hasPageheading).to.be.false;
    });

    it('creates the color tool layout root', () => {
      const layout = block.querySelector('.ax-color-tool-layout');
      expect(layout).to.exist;
    });

    it('creates all four layout slots', () => {
      ['topbar', 'sidebar', 'canvas', 'footer'].forEach((name) => {
        const slot = block.querySelector(`[data-shell-slot="${name}"]`);
        expect(slot, `slot ${name} should exist`).to.exist;
      });
    });

    it('adopts headline into sidebar', () => {
      const sidebar = block.querySelector('[data-shell-slot="sidebar"]');
      const headline = sidebar.querySelector('.color-headline.tools');
      expect(headline).to.exist;
      expect(headline.dataset.adopted).to.equal('true');
    });

    it('renders heading text in adopted headline', () => {
      const heading = block.querySelector('.color-headline.tools h2');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Color Blindness Simulator');
    });

    it('renders paragraph text in adopted headline', () => {
      const paragraph = block.querySelector('.color-headline.tools p');
      expect(paragraph).to.exist;
      expect(paragraph.textContent).to.equal('Check your palette for color blind conflicts');
    });

    it('mounts color-conflicts element in sidebar', () => {
      const sidebar = block.querySelector('[data-shell-slot="sidebar"]');
      const conflicts = sidebar.querySelector('color-conflicts');
      expect(conflicts).to.exist;
    });

    it('mounts color-wheel-express in sidebar', () => {
      const sidebar = block.querySelector('[data-shell-slot="sidebar"]');
      const wheel = sidebar.querySelector('color-wheel-express');
      expect(wheel).to.exist;
      expect(wheel.getAttribute('aria-label')).to.equal('Color wheel');
    });

    it('enables showLines on color-wheel-express', () => {
      const sidebar = block.querySelector('[data-shell-slot="sidebar"]');
      const wheel = sidebar.querySelector('color-wheel-express');
      expect(wheel.showLines).to.be.true;
    });

    it('creates strip wrapper in canvas', () => {
      const canvas = block.querySelector('[data-shell-slot="canvas"]');
      const stripWrapper = canvas.querySelector('.cb-strip-wrapper');
      expect(stripWrapper).to.exist;
    });

    it('renders strip container with color blindness class', () => {
      const stripContainer = block.querySelector('.color-explorer-strip-container--color-blindness');
      expect(stripContainer).to.exist;
    });

    it('renders four-rows color blindness layout', () => {
      const fourRows = block.querySelector('.strip-with-color-blindness--four-rows');
      expect(fourRows).to.exist;
    });

    it('renders action menu in topbar', () => {
      const topbar = block.querySelector('[data-shell-slot="topbar"]');
      const actionMenu = topbar.querySelector('.action-menu-full');
      expect(actionMenu).to.exist;
    });

    it('renders controls-only action menu in canvas', () => {
      const canvas = block.querySelector('[data-shell-slot="canvas"]');
      const controlsMenu = canvas.querySelector('.action-menu-controls-only');
      expect(controlsMenu).to.exist;
    });

    it('renders nav links with correct labels', () => {
      const links = block.querySelectorAll('.action-menu-link');
      const labels = Array.from(links).map(
        (l) => l.getAttribute('aria-label') || l.closest('li')?.querySelector('.active-label')?.textContent || '',
      );
      expect(labels).to.include('Create palette');
      expect(labels).to.include('Contrast Checker');
      expect(labels).to.include('Color Blindness Simulator');
    });

    it('marks Color Blindness Simulator as active nav link', () => {
      const activeLink = block.querySelector('.action-menu-link[aria-current="page"]');
      expect(activeLink).to.exist;
      const activeLabel = activeLink.closest('li')?.querySelector('.active-label');
      expect(activeLabel).to.exist;
      expect(activeLabel.textContent.trim()).to.equal('Color Blindness Simulator');
    });
  });

  describe('decoration without headline sibling', () => {
    let block;

    before(async () => {
      block = document.querySelector('#cb-no-headline');
      await decorate(block);
    });

    it('sets data-block-status to loaded even without headline', () => {
      expect(block.dataset.blockStatus).to.equal('loaded');
    });

    it('still creates layout slots', () => {
      expect(block.querySelector('[data-shell-slot="sidebar"]')).to.exist;
      expect(block.querySelector('[data-shell-slot="canvas"]')).to.exist;
    });

    it('does not adopt a headline when none exists', () => {
      const headline = block.querySelector('.color-headline');
      expect(headline).to.be.null;
    });
  });

  describe('decoration with heading-only headline', () => {
    let block;

    before(async () => {
      block = document.querySelector('#cb-heading-only');
      await decorate(block);
    });

    it('adopts headline with heading but no paragraph', () => {
      const heading = block.querySelector('.color-headline.tools h2');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Only a heading');

      const paragraph = block.querySelector('.color-headline.tools p');
      expect(paragraph).to.be.null;
    });
  });

  describe('idempotent re-decoration', () => {
    it('cleans up and re-decorates without errors', async () => {
      const block = document.createElement('div');
      block.className = 'color-blindness';
      document.body.appendChild(block);

      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('loaded');

      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('loaded');

      const layouts = block.querySelectorAll('.ax-color-tool-layout');
      expect(layouts.length).to.equal(1);

      block.remove();
    });
  });

  describe('decoration with malformed rows', () => {
    it('skips rows with fewer than two columns', async () => {
      const block = document.createElement('div');
      block.className = 'color-blindness';
      block.innerHTML = '<div><div>single-column-only</div></div>';
      document.body.appendChild(block);

      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('loaded');

      const headline = block.querySelector('.color-headline');
      expect(headline).to.be.null;

      block.remove();
    });
  });

  describe('error handling', () => {
    it('sets data-block-status to error when decoration fails', async () => {
      const block = document.createElement('div');
      block.className = 'color-blindness';
      document.body.appendChild(block);

      // Force a failure inside the try block by breaking appendChild
      // after the initial status is set
      const origAppendChild = block.appendChild.bind(block);
      let callCount = 0;
      block.appendChild = (child) => {
        callCount += 1;
        if (callCount > 0) throw new Error('simulated DOM failure');
        return origAppendChild(child);
      };

      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('error');

      block.remove();
    });
  });
});
