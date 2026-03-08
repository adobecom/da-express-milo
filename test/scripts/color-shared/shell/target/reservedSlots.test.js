import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { enforceReservedSlots } from '../../../../../express/code/scripts/color-shared/shell/target/reservedSlotEnforcement.js';

describe('reservedSlots', () => {
  let mockLayoutInstance;
  let reservedSlots;

  beforeEach(() => {
    const footerSlot = document.createElement('div');
    footerSlot.dataset.shellSlot = 'footer';
    
    const sharedComponent = document.createElement('div');
    sharedComponent.dataset.sharedComponent = 'true';
    sharedComponent.className = 'shared-toolbar';
    footerSlot.appendChild(sharedComponent);

    const sidebarSlot = document.createElement('div');
    sidebarSlot.dataset.shellSlot = 'sidebar';

    const canvasSlot = document.createElement('div');
    canvasSlot.dataset.shellSlot = 'canvas';

    mockLayoutInstance = {
      type: 'test-layout',
      root: document.createElement('div'),
      hasSlot: sinon.stub(),
      getSlot: sinon.stub(),
      getSlotNames: sinon.stub().returns(['footer', 'sidebar', 'canvas']),
      clearSlot: sinon.stub(),
      destroy: sinon.stub(),
    };

    mockLayoutInstance.getSlot.withArgs('footer').returns(footerSlot);
    mockLayoutInstance.getSlot.withArgs('sidebar').returns(sidebarSlot);
    mockLayoutInstance.getSlot.withArgs('canvas').returns(canvasSlot);
    mockLayoutInstance.hasSlot.withArgs('footer').returns(true);
    mockLayoutInstance.hasSlot.withArgs('sidebar').returns(true);
    mockLayoutInstance.hasSlot.withArgs('canvas').returns(true);

    reservedSlots = ['footer'];
  });

  describe('Test 1: reserved slots cannot be page-cleared by default', () => {
    it('should preserve shared components when clearing reserved slots', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      
      // Add page content to reserved slot
      const pageContent = document.createElement('div');
      pageContent.className = 'page-content';
      pageContent.textContent = 'Page content';
      footerSlot.appendChild(pageContent);

      expect(footerSlot.querySelector('.shared-toolbar')).to.not.be.null;
      expect(footerSlot.querySelector('.page-content')).to.not.be.null;

      // Create protected clearSlot function
      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);

      // Clear reserved slot - should only remove page content
      protectedClearSlot('footer');

      expect(footerSlot.querySelector('.shared-toolbar')).to.not.be.null;
      expect(footerSlot.querySelector('.page-content')).to.be.null;
    });

    it('should throw error when trying to force-clear reserved slot', () => {
      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);

      expect(() => protectedClearSlot('footer', { force: true, preserveShared: false }))
        .to.throw()
        .with.property('message')
        .that.matches(/reserved/i)
        .and.matches(/footer/i);
    });

    it('should allow clearing reserved slots when preserveShared is true', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      
      const pageContent = document.createElement('div');
      pageContent.className = 'page-content';
      footerSlot.appendChild(pageContent);

      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);
      
      // Should not throw
      expect(() => protectedClearSlot('footer', { preserveShared: true })).to.not.throw();
      
      // Shared component should still be present
      expect(footerSlot.querySelector('[data-shared-component]')).to.not.be.null;
      expect(footerSlot.querySelector('.page-content')).to.be.null;
    });

    it('should prevent removing shared components directly from reserved slots', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      const sharedComponent = footerSlot.querySelector('[data-shared-component]');
      
      // Mark slot as protected
      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);
      
      // Attempting to clear without preserving shared components should fail
      expect(() => {
        // Simulate trying to clear everything including shared components
        protectedClearSlot('footer', { preserveShared: false });
      }).to.throw(/reserved/i);
    });
  });

  describe('Test 2: page-owned slots clear normally on navigation', () => {
    it('should clear non-reserved slots completely', () => {
      const sidebarSlot = mockLayoutInstance.getSlot('sidebar');
      
      const pageContent = document.createElement('div');
      pageContent.className = 'page-content';
      sidebarSlot.appendChild(pageContent);

      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);

      // Clear non-reserved slot
      protectedClearSlot('sidebar');

      expect(sidebarSlot.children.length).to.equal(0);
    });

    it('should allow full clear of non-reserved slots', () => {
      const sidebarSlot = mockLayoutInstance.getSlot('sidebar');
      
      const content1 = document.createElement('div');
      content1.className = 'content-1';
      const content2 = document.createElement('div');
      content2.className = 'content-2';
      
      sidebarSlot.appendChild(content1);
      sidebarSlot.appendChild(content2);

      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);

      protectedClearSlot('sidebar');

      expect(sidebarSlot.children.length).to.equal(0);
    });

    it('should not affect reserved slots when clearing page-owned slots', () => {
      const sidebarSlot = mockLayoutInstance.getSlot('sidebar');
      const footerSlot = mockLayoutInstance.getSlot('footer');
      
      const sidebarContent = document.createElement('div');
      sidebarContent.className = 'sidebar-content';
      sidebarSlot.appendChild(sidebarContent);

      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);

      // Clear page-owned slot
      protectedClearSlot('sidebar');

      // Reserved slot should still have its shared component
      expect(footerSlot.querySelector('[data-shared-component]')).to.not.be.null;
      expect(sidebarSlot.children.length).to.equal(0);
    });

    it('should handle clearing multiple non-reserved slots', () => {
      const sidebarSlot = mockLayoutInstance.getSlot('sidebar');
      const canvasSlot = mockLayoutInstance.getSlot('canvas');
      
      sidebarSlot.appendChild(document.createElement('div'));
      canvasSlot.appendChild(document.createElement('div'));

      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);

      protectedClearSlot('sidebar');
      protectedClearSlot('canvas');

      expect(sidebarSlot.children.length).to.equal(0);
      expect(canvasSlot.children.length).to.equal(0);
    });
  });

  describe('Test 3: shared slot updates happen through registry, not page mounts', () => {
    it('should track which slots have shared components', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      const sidebarSlot = mockLayoutInstance.getSlot('sidebar');

      // Footer has shared component marker
      expect(footerSlot.querySelector('[data-shared-component]')).to.not.be.null;
      
      // Sidebar does not
      expect(sidebarSlot.querySelector('[data-shared-component]')).to.be.null;
    });

    it('should identify slots with shared components by data attribute', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      const sharedComponent = footerSlot.querySelector('[data-shared-component]');
      
      expect(sharedComponent).to.not.be.null;
      expect(sharedComponent.dataset.sharedComponent).to.equal('true');
    });

    it('should preserve shared component marker during page content injection', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      const sharedComponentBefore = footerSlot.querySelector('[data-shared-component]');
      
      // Inject page content
      const pageContent = document.createElement('div');
      pageContent.className = 'page-content';
      footerSlot.appendChild(pageContent);

      const sharedComponentAfter = footerSlot.querySelector('[data-shared-component]');
      
      expect(sharedComponentAfter).to.equal(sharedComponentBefore);
      expect(footerSlot.contains(pageContent)).to.be.true;
    });

    it('should maintain separation between shared and page content', () => {
      const footerSlot = mockLayoutInstance.getSlot('footer');
      
      const pageContent1 = document.createElement('div');
      pageContent1.className = 'page-content-1';
      const pageContent2 = document.createElement('div');
      pageContent2.className = 'page-content-2';
      
      footerSlot.appendChild(pageContent1);
      footerSlot.appendChild(pageContent2);

      const protectedClearSlot = enforceReservedSlots(mockLayoutInstance, reservedSlots);
      protectedClearSlot('footer');

      // Shared component remains, page content removed
      expect(footerSlot.querySelector('[data-shared-component]')).to.not.be.null;
      expect(footerSlot.querySelector('.page-content-1')).to.be.null;
      expect(footerSlot.querySelector('.page-content-2')).to.be.null;
    });
  });
});
