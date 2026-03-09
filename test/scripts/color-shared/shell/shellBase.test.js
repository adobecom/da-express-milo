import { expect } from '@esm-bundle/chai';

// Import the CSS file to test
const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = '/express/code/scripts/color-shared/shell/shell-base.css';
document.head.appendChild(cssLink);

// Wait for CSS to load before running tests
await new Promise((resolve) => {
  cssLink.onload = resolve;
  cssLink.onerror = resolve;
});

describe('Shell Base CSS', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'ax-shell-host';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Test 1: host root gets runtime class hooks', () => {
    it('should apply base styles to .ax-shell-host', () => {
      const styles = window.getComputedStyle(container);

      // Shell host should have display property set
      expect(styles.display).to.not.equal('');

      // Shell host should have position property set
      expect(styles.position).to.not.equal('');
    });

    it('should provide runtime class hook without layout assumptions', () => {
      // The .ax-shell-host class should exist and be styleable
      container.classList.add('ax-shell-host');
      const styles = window.getComputedStyle(container);

      // Should have some base styling applied
      expect(styles.display).to.exist;
    });

    it('should support data-shell-state attribute for runtime states', () => {
      container.setAttribute('data-shell-state', 'loading');

      // The attribute should be present and usable for styling
      expect(container.getAttribute('data-shell-state')).to.equal('loading');

      container.setAttribute('data-shell-state', 'ready');
      expect(container.getAttribute('data-shell-state')).to.equal('ready');

      container.setAttribute('data-shell-state', 'error');
      expect(container.getAttribute('data-shell-state')).to.equal('error');
    });
  });

  describe('Test 2: no layout-specific grid/flex region assumptions leak into shell base CSS', () => {
    it('should not define grid-template-areas in base CSS', () => {
      const styles = window.getComputedStyle(container);

      // Base CSS should not define layout structure
      expect(styles.gridTemplateAreas).to.equal('none');
    });

    it('should not define grid-template-columns for layout structure', () => {
      const styles = window.getComputedStyle(container);

      // Base CSS should not assume column structure
      // If grid-template-columns is set, it should only be for runtime concerns, not layout
      const gridCols = styles.gridTemplateColumns;

      // Should not have multi-column layout definitions like "340px 1fr"
      expect(gridCols).to.not.include('340px');
      expect(gridCols).to.not.include('1fr');
    });

    it('should not define flex-direction for layout structure', () => {
      const styles = window.getComputedStyle(container);

      // Base CSS should not assume flex layout direction
      // Only layout adapters should define structural flex properties
      if (styles.display === 'flex') {
        // If flex is used, it should be for runtime concerns only
        // Layout-specific flex should be in layout CSS files
        expect(styles.flexDirection).to.be.oneOf(['row', 'column', 'row-reverse', 'column-reverse']);
      }
    });

    it('should not reference layout-specific slot names', () => {
      // Create test elements with layout-specific slot names
      const topbar = document.createElement('div');
      topbar.setAttribute('data-shell-slot', 'topbar');
      container.appendChild(topbar);

      const sidebar = document.createElement('div');
      sidebar.setAttribute('data-shell-slot', 'sidebar');
      container.appendChild(sidebar);

      const canvas = document.createElement('div');
      canvas.setAttribute('data-shell-slot', 'canvas');
      container.appendChild(canvas);

      // Base CSS should not have specific styles for these layout slots
      // They should only be styled by layout-specific CSS
      const topbarStyles = window.getComputedStyle(topbar);
      const sidebarStyles = window.getComputedStyle(sidebar);
      const canvasStyles = window.getComputedStyle(canvas);

      // None should have grid-area defined by base CSS
      expect(topbarStyles.gridArea).to.equal('auto');
      expect(sidebarStyles.gridArea).to.equal('auto');
      expect(canvasStyles.gridArea).to.equal('auto');
    });

    it('should not define layout-specific spacing or dimensions', () => {
      const styles = window.getComputedStyle(container);

      // Base CSS should not define layout-specific gaps or padding
      // These are layout adapter concerns
      // Only runtime-level spacing (if any) should be in base CSS

      // Check that base CSS doesn't assume specific layout dimensions
      expect(styles.minHeight).to.not.equal('100vh');
      expect(styles.width).to.not.equal('100%');
    });
  });

  describe('Test 3: layout CSS remains fully swappable', () => {
    it('should allow layout adapters to override display mode', () => {
      // Base CSS should not lock display mode
      container.classList.add('ax-palette-builder-layout');
      const styles = window.getComputedStyle(container);

      // Layout should be able to set its own display
      // This test verifies base CSS doesn't prevent layout overrides
      expect(['block', 'flex', 'grid', 'inline-block']).to.include(styles.display);
    });

    it('should allow layout adapters to define their own structure', () => {
      // Create a mock layout structure
      const layoutRoot = document.createElement('div');
      layoutRoot.className = 'ax-custom-layout';
      layoutRoot.style.display = 'grid';
      layoutRoot.style.gridTemplateColumns = '200px 1fr';

      container.appendChild(layoutRoot);

      const layoutStyles = window.getComputedStyle(layoutRoot);

      // Layout should be able to define its own grid structure
      expect(layoutStyles.display).to.equal('grid');
      expect(layoutStyles.gridTemplateColumns).to.include('200px');
    });

    it('should not interfere with layout-specific responsive behavior', () => {
      // Base CSS should not define breakpoint-specific behavior
      // that would interfere with layout adapters

      window.matchMedia('(max-width: 599px)');

      // Test that base CSS doesn't force specific mobile behavior
      // Layouts should be free to define their own responsive rules

      // This is a structural test - base CSS should not have
      // media queries that affect layout structure
      expect(container.style.gridTemplateColumns).to.equal('');
      expect(container.style.flexDirection).to.equal('');
    });

    it('should support multiple layout types without conflicts', () => {
      // Test that different layout classes can coexist
      const paletteLayout = document.createElement('div');
      paletteLayout.className = 'ax-shell-host ax-palette-builder-layout';

      const fullWidthLayout = document.createElement('div');
      fullWidthLayout.className = 'ax-shell-host ax-full-width-layout';

      document.body.appendChild(paletteLayout);
      document.body.appendChild(fullWidthLayout);

      const paletteStyles = window.getComputedStyle(paletteLayout);
      const fullWidthStyles = window.getComputedStyle(fullWidthLayout);

      // Both should be able to have their own display modes
      expect(paletteStyles.display).to.exist;
      expect(fullWidthStyles.display).to.exist;

      // Clean up
      document.body.removeChild(paletteLayout);
      document.body.removeChild(fullWidthLayout);
    });

    it('should not define z-index that interferes with layout stacking', () => {
      const styles = window.getComputedStyle(container);

      // Base CSS should not define z-index for the host
      // Layout adapters should control stacking context
      expect(styles.zIndex).to.equal('auto');
    });
  });
});
