/* eslint-env mocha */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { serviceManager } from '../../../express/code/libs/services/index.js';

setLibs('/libs');

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

    it('renders heading text content in sidebar', () => {
      const heading = block.querySelector('.ax-text-content__heading');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Color Blindness Simulator');
    });

    it('renders paragraph text content in sidebar', () => {
      const paragraph = block.querySelector('.ax-text-content__paragraph');
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

  describe('decoration with empty content', () => {
    let block;

    before(async () => {
      block = document.querySelector('#cb-no-content');
      await decorate(block);
    });

    it('sets data-block-status to loaded even without content', () => {
      expect(block.dataset.blockStatus).to.equal('loaded');
    });

    it('still creates layout slots', () => {
      expect(block.querySelector('[data-shell-slot="sidebar"]')).to.exist;
      expect(block.querySelector('[data-shell-slot="canvas"]')).to.exist;
    });

    it('does not render text content when block has no rows', () => {
      const heading = block.querySelector('.ax-text-content__heading');
      const paragraph = block.querySelector('.ax-text-content__paragraph');
      expect(heading).to.be.null;
      expect(paragraph).to.be.null;
    });
  });

  describe('decoration with heading only', () => {
    let block;

    before(async () => {
      block = document.querySelector('#cb-heading-only');
      await decorate(block);
    });

    it('renders heading without paragraph', () => {
      const heading = block.querySelector('.ax-text-content__heading');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Only a heading');

      const paragraph = block.querySelector('.ax-text-content__paragraph');
      expect(paragraph).to.be.null;
    });
  });

  describe('idempotent re-decoration', () => {
    it('cleans up and re-decorates without errors', async () => {
      const block = document.createElement('div');
      block.className = 'color-blindness';
      block.innerHTML = '<div><div>pageheading</div><div><h2>Test</h2></div></div>';
      document.body.appendChild(block);

      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('loaded');

      block.innerHTML = '<div><div>pageheading</div><div><h2>Re-test</h2></div></div>';
      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('loaded');

      const layouts = block.querySelectorAll('.ax-color-tool-layout');
      expect(layouts.length).to.equal(1);

      const heading = block.querySelector('.ax-text-content__heading');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('Re-test');

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

      const heading = block.querySelector('.ax-text-content__heading');
      const paragraph = block.querySelector('.ax-text-content__paragraph');
      expect(heading).to.be.null;
      expect(paragraph).to.be.null;

      block.remove();
    });
  });

  describe('error handling', () => {
    // serviceManager.init is called internally by createColorToolLayout
    it('sets data-block-status to error when decoration fails', async () => {
      serviceManager.init.rejects(new Error('service unavailable'));

      const block = document.createElement('div');
      block.className = 'color-blindness';
      document.body.appendChild(block);

      await decorate(block);
      expect(block.dataset.blockStatus).to.equal('error');

      serviceManager.init.resolves(serviceManager);
      block.remove();
    });
  });
});
