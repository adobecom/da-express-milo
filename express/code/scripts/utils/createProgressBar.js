/**
 * Progress Bar Web Component
 * Usage: <progress-bar progress="25" label="Uploading..."></progress-bar>
 */
class ProgressBar extends HTMLElement {
  static observedAttributes = ['progress', 'label', 'width', 'show-percentage'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.progress = 0;
    this.label = 'Uploading your media...';
    this.width = '400px';
    this.showPercentage = true;
  }

  async connectedCallback() {
    this.progress = parseInt(this.getAttribute('progress'), 10) || 0;
    this.label = this.getAttribute('label') || 'Uploading your media...';
    this.width = this.getAttribute('width') || '400px';
    this.showPercentage = this.getAttribute('show-percentage') !== 'false';

    await this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'progress':
        this.progress = parseInt(newValue, 10) || 0;
        this.updateProgress();
        break;
      case 'label':
        this.label = newValue || '';
        this.updateLabel();
        break;
      case 'width':
        this.width = newValue || '400px';
        this.updateWidth();
        break;
      case 'show-percentage':
        this.showPercentage = newValue !== 'false';
        this.updatePercentageVisibility();
        break;
      default:
        break;
    }
  }

  static async loadAdobeExpressIcon() {
    try {
      const iconPath = new URL('../../icons/adobe-express.svg', import.meta.url).href;
      const response = await fetch(iconPath);
      if (!response.ok) {
        throw new Error(`Failed to load icon: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      return '';
    }
  }

  getStyles() {
    return `
      .progress-container {
          gap: 16px;
          margin: 0 auto;
          position: relative;
          min-height: 450px;
          display: grid;
          place-items: center;
          place-content: center;
      }

      .progress-icon-container {
        display: flex;
        justify-content: center;
      }

      .adobe-express-icon {
        width: 72px;
        height: 72px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .adobe-express-icon svg {
        width: 100%;
        height: 100%;
      }

      .progress-label {
          font-size: 16px;
          color: rgba(0, 0, 0, 1);
          text-align: center;
          line-height: 1.4;
      }

      .progress-track {
        position: relative;
        height: 10px;
        background: rgba(213, 213, 213, 1);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .progress-fill {
        height: 100%;
        background: rgba(82, 88, 228, 1);
        border-radius: 16px;
        transition: width 0.3s ease-out;
        position: relative;
        box-shadow: 0 1px 3px rgba(82, 88, 228, 0.3);
        width: ${Math.max(0, Math.min(100, this.progress))}%;
      }

      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        min-width: 70px;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%);
        animation: shimmer 2s infinite;
      }

      .progress-percentage-overlay {
        position: absolute;
        top: -24px;
        right: 0;
        font-size: 12px;
        font-weight: 500;
        color: rgba(82, 88, 228, 1);
        background: rgba(255, 255, 255, 0.95);
        padding: 2px 6px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
        display: ${this.showPercentage ? 'block' : 'none'};
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(200%);
        }
      }
    `;
  }

  async getTemplate() {
    const clampedProgress = Math.max(0, Math.min(100, this.progress));
    const svgContent = await ProgressBar.loadAdobeExpressIcon();

    return `
      <div class="progress-container">
        <div class="progress-icon-container">
          <div class="adobe-express-icon">${svgContent}</div>
        </div>
        
        <div class="progress-label">${this.label}</div>
        
        <div class="progress-track" style="width: ${this.width}">
          <div class="progress-fill"></div>
        </div>
        
        <div class="progress-percentage-overlay">${clampedProgress}%</div>
      </div>
    `;
  }

  async render() {
    const styles = this.getStyles();
    const template = await this.getTemplate();

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${template}
    `;
  }

  updateProgress() {
    const clampedProgress = Math.max(0, Math.min(100, this.progress));
    const fill = this.shadowRoot.querySelector('.progress-fill');
    const percentage = this.shadowRoot.querySelector('.progress-percentage-overlay');

    if (fill) {
      fill.style.width = `${clampedProgress}%`;
    }
    if (percentage) {
      percentage.textContent = `${clampedProgress}%`;
    }
  }

  updateLabel() {
    const labelEl = this.shadowRoot.querySelector('.progress-label');
    if (labelEl) {
      labelEl.textContent = this.label;
    }
  }

  updateWidth() {
    const track = this.shadowRoot.querySelector('.progress-track');
    if (track) {
      track.style.width = this.width;
    }
  }

  updatePercentageVisibility() {
    const percentage = this.shadowRoot.querySelector('.progress-percentage-overlay');
    if (percentage) {
      percentage.style.display = this.showPercentage ? 'block' : 'none';
    }
  }

  setProgress(value) {
    this.setAttribute('progress', value.toString());
  }

  setLabel(text) {
    this.setAttribute('label', text);
  }

  getProgress() {
    return this.progress;
  }

  getLabel() {
    return this.label;
  }
}

customElements.define('x-progress-bar', ProgressBar);

export default ProgressBar;
