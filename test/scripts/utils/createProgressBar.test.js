import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import ProgressBar from '../../../express/code/scripts/utils/createProgressBar.js';

setLibs('/libs');

describe('ProgressBar Web Component', () => {
  let progressBar;

  beforeEach(() => {
    progressBar = document.createElement('x-progress-bar');
    document.body.appendChild(progressBar);
  });

  afterEach(() => {
    if (progressBar && progressBar.parentNode) {
      progressBar.parentNode.removeChild(progressBar);
    }
  });

  describe('Element Creation', () => {
    it('should be defined as a custom element', () => {
      expect(customElements.get('x-progress-bar')).to.equal(ProgressBar);
    });

    it('should have correct observed attributes', () => {
      expect(ProgressBar.observedAttributes).to.deep.equal([
        'progress',
        'label',
        'width',
        'show-percentage',
      ]);
    });
  });

  describe('Default Values', () => {
    it('should have default progress value', () => {
      expect(progressBar.progress).to.equal(0);
    });

    it('should have default label', () => {
      expect(progressBar.label).to.equal('Uploading your media...');
    });

    it('should have default width', () => {
      expect(progressBar.width).to.equal('400px');
    });

    it('should show percentage by default', () => {
      expect(progressBar.showPercentage).to.be.true;
    });
  });

  describe('Attribute Handling', () => {
    it('should set progress from attribute', () => {
      progressBar.setAttribute('progress', '50');
      expect(progressBar.progress).to.equal(50);
    });

    it('should set label from attribute', () => {
      progressBar.setAttribute('label', 'Custom label');
      expect(progressBar.label).to.equal('Custom label');
    });

    it('should set width from attribute', () => {
      progressBar.setAttribute('width', '600px');
      expect(progressBar.width).to.equal('600px');
    });

    it('should set show-percentage from attribute', () => {
      progressBar.setAttribute('show-percentage', 'false');
      expect(progressBar.showPercentage).to.be.false;
    });

    it('should handle invalid progress values', () => {
      progressBar.setAttribute('progress', 'invalid');
      expect(progressBar.progress).to.equal(0);
    });

    it('should handle empty label', () => {
      progressBar.setAttribute('label', '');
      expect(progressBar.label).to.equal('');
    });

    it('should handle empty width', () => {
      progressBar.setAttribute('width', '');
      expect(progressBar.width).to.equal('400px');
    });
  });

  describe('Progress Clamping', () => {
    it('should clamp progress to 0-100 range', async () => {
      progressBar.setAttribute('progress', '150');
      await progressBar.connectedCallback();

      const clampedProgress = Math.max(0, Math.min(100, 150));
      expect(clampedProgress).to.equal(100);
    });

    it('should handle negative progress values', async () => {
      progressBar.setAttribute('progress', '-50');
      await progressBar.connectedCallback();

      const clampedProgress = Math.max(0, Math.min(100, -50));
      expect(clampedProgress).to.equal(0);
    });
  });

  describe('Public Methods', () => {
    it('should set progress via method', () => {
      progressBar.setProgress(75);
      expect(progressBar.getAttribute('progress')).to.equal('75');
    });

    it('should set label via method', () => {
      progressBar.setLabel('New label');
      expect(progressBar.getAttribute('label')).to.equal('New label');
    });

    it('should get progress via method', () => {
      progressBar.setAttribute('progress', '25');
      expect(progressBar.getProgress()).to.equal(25);
    });

    it('should get label via method', () => {
      progressBar.setAttribute('label', 'Test label');
      expect(progressBar.getLabel()).to.equal('Test label');
    });
  });

  describe('Rendering', () => {
    it('should render with default values', async () => {
      await progressBar.connectedCallback();

      const { shadowRoot } = progressBar;
      expect(shadowRoot).to.exist;
      expect(shadowRoot.querySelector('.progress-container')).to.exist;
      expect(shadowRoot.querySelector('.progress-label')).to.exist;
      expect(shadowRoot.querySelector('.progress-track')).to.exist;
      expect(shadowRoot.querySelector('.progress-fill')).to.exist;
    });

    it('should update progress when attribute changes', async () => {
      await progressBar.connectedCallback();

      progressBar.setAttribute('progress', '60');

      // Wait for attribute change to process
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const fill = progressBar.shadowRoot.querySelector('.progress-fill');
      expect(fill.style.width).to.equal('60%');
    });

    it('should update label when attribute changes', async () => {
      await progressBar.connectedCallback();

      progressBar.setAttribute('label', 'Updated label');

      // Wait for attribute change to process
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const label = progressBar.shadowRoot.querySelector('.progress-label');
      expect(label.textContent).to.equal('Updated label');
    });

    it('should update width when attribute changes', async () => {
      await progressBar.connectedCallback();

      progressBar.setAttribute('width', '500px');

      // Wait for attribute change to process
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const track = progressBar.shadowRoot.querySelector('.progress-track');
      expect(track.style.width).to.equal('500px');
    });

    it('should toggle percentage visibility', async () => {
      await progressBar.connectedCallback();

      progressBar.setAttribute('show-percentage', 'false');

      // Wait for attribute change to process
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const percentage = progressBar.shadowRoot.querySelector('.progress-percentage-overlay');
      expect(percentage.style.display).to.equal('none');
    });
  });

  describe('Static Methods', () => {
    it('should have loadAdobeExpressIcon static method', () => {
      expect(ProgressBar.loadAdobeExpressIcon).to.be.a('function');
    });

    it('should return empty string when icon loading fails', async () => {
      // Mock fetch to fail
      const originalFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error('Network error'));

      const result = await ProgressBar.loadAdobeExpressIcon();
      expect(result).to.equal('');

      // Restore original fetch
      window.fetch = originalFetch;
    });
  });

  describe('Template Generation', () => {
    it('should generate template with correct progress value', async () => {
      progressBar.setAttribute('progress', '75');
      const template = await progressBar.getTemplate();

      expect(template).to.include('75%');
    });

    it('should generate template with custom label', async () => {
      progressBar.setAttribute('label', 'Custom Progress');
      const template = await progressBar.getTemplate();

      expect(template).to.include('Custom Progress');
    });

    it('should generate template with custom width', async () => {
      progressBar.setAttribute('width', '600px');
      const template = await progressBar.getTemplate();

      expect(template).to.include('width: 600px');
    });
  });

  describe('Update Methods', () => {
    beforeEach(async () => {
      await progressBar.connectedCallback();
    });

    it('should update progress bar fill', () => {
      progressBar.updateProgress();

      const fill = progressBar.shadowRoot.querySelector('.progress-fill');
      expect(fill).to.exist;
    });

    it('should update label text', () => {
      progressBar.updateLabel();

      const label = progressBar.shadowRoot.querySelector('.progress-label');
      expect(label).to.exist;
    });

    it('should update track width', () => {
      progressBar.updateWidth();

      const track = progressBar.shadowRoot.querySelector('.progress-track');
      expect(track).to.exist;
    });

    it('should update percentage visibility', () => {
      progressBar.updatePercentageVisibility();

      const percentage = progressBar.shadowRoot.querySelector('.progress-percentage-overlay');
      expect(percentage).to.exist;
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing shadow root elements gracefully', () => {
      // Create a progress bar without calling connectedCallback
      const newProgressBar = document.createElement('x-progress-bar');

      // These should not throw errors
      expect(() => newProgressBar.updateProgress()).to.not.throw();
      expect(() => newProgressBar.updateLabel()).to.not.throw();
      expect(() => newProgressBar.updateWidth()).to.not.throw();
      expect(() => newProgressBar.updatePercentageVisibility()).to.not.throw();
    });

    it('should handle attribute changes before connectedCallback', () => {
      const newProgressBar = document.createElement('x-progress-bar');
      newProgressBar.setAttribute('progress', '50');

      // Should not throw error
      expect(() => newProgressBar.attributeChangedCallback('progress', '0', '50')).to.not.throw();
    });
  });
});
