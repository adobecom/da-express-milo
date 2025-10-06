export default class FrictionlessQuickAction {
  constructor(page) {
    this.page = page;
    
    // Main block
    this.block = page.locator('.frictionless-quick-action');
    this.section = page.locator('.section').filter({ has: this.block });
    
    // Upload elements
    this.uploadButton = this.block.locator('button, input[type="file"], .upload-button, [class*="upload"]').first();
    this.fileInput = page.locator('input[type="file"]');
    
    // Progress elements
    this.progressBar = this.block.locator('.progress-bar, [class*="progress"]');
    this.progressText = this.block.locator('.progress-text, [class*="progress-text"]');
    this.statusMessage = this.block.locator('.status-message, [class*="status"]');
    
    // Success/Error states
    this.successMessage = this.block.locator('.success-message, [class*="success"]');
    this.errorMessage = this.block.locator('.error-message, [class*="error"]');
    this.retryButton = this.block.locator('.retry-button, button:has-text("Retry")');
    
    // CTA buttons
    this.primaryCTA = this.block.locator('a.button, a.cta').first();
  }

  /**
   * Upload a file by path
   * @param {string} filePath - Path to the file to upload
   */
  async uploadFile(filePath) {
    // If there's a visible upload button, click it first
    const uploadBtn = this.uploadButton;
    if (await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await uploadBtn.click();
    }
    
    // Set the file on the input
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Wait for upload to complete
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForUploadComplete(timeout = 30000) {
    await this.page.waitForFunction(
      () => {
        const progressBar = document.querySelector('.progress-bar, [class*="progress"]');
        const successMsg = document.querySelector('.success-message, [class*="success"]');
        return successMsg || (progressBar && progressBar.getAttribute('aria-valuenow') === '100');
      },
      { timeout }
    );
  }

  /**
   * Get current progress percentage
   * @returns {Promise<number>} Progress percentage (0-100)
   */
  async getProgress() {
    const ariaValue = await this.progressBar.getAttribute('aria-valuenow');
    if (ariaValue) {
      return parseInt(ariaValue, 10);
    }
    
    // Fallback: try to parse from text
    const text = await this.progressText.textContent().catch(() => '0');
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if redirected to editor
   * @returns {Promise<boolean>} True if on editor URL
   */
  async isOnEditorPage() {
    const url = this.page.url();
    return url.includes('express.adobe.com') || url.includes('/editor') || url.includes('/new');
  }

  /**
   * Get editor URL parameters
   * @returns {Promise<Object>} URL parameters object
   */
  async getEditorParams() {
    const url = new URL(this.page.url());
    const params = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }
}
