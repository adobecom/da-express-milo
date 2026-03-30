export default class FrictionlessQAImage {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;

    // section and frictionless-quick-action wrapper (same block as video, different data-frictionlesstype)
    this.section = page.locator('.section').nth(nth);
    this.frictionlessQAImage = page.locator('.frictionless-quick-action').nth(nth);

    // Frictionless image type locators
    this.type = {
      remove_background: page.locator('.frictionless-quick-action[data-frictionlesstype=remove-background]').nth(nth),
      resize_image: page.locator('.frictionless-quick-action[data-frictionlesstype=resize-image]').nth(nth),
      crop_image: page.locator('.frictionless-quick-action[data-frictionlesstype=crop-image]').nth(nth),
      convert_to_jpg: page.locator('.frictionless-quick-action[data-frictionlesstype=convert-to-jpg]').nth(nth),
      convert_to_png: page.locator('.frictionless-quick-action[data-frictionlesstype=convert-to-png]').nth(nth),
      convert_to_svg: page.locator('.frictionless-quick-action[data-frictionlesstype=convert-to-svg]').nth(nth),
      change_background: page.locator('.frictionless-quick-action[data-frictionlesstype=remove-background]').nth(nth),
    };

    this.uploadPhotoButton = page.getByRole('link', { name: 'Upload your photo' });

    // Remove background type details
    this.removeBackgroundHeading = this.type.remove_background.locator('h1');
    this.removeBackgroundContent = this.type.remove_background.locator('p').nth(0);
    this.removeBackgroundDropzone = this.type.remove_background.locator('.dropzone').nth(0);
    this.removeBackgroundDropzoneText = this.removeBackgroundDropzone.locator('p').nth(0);
    this.removeBackgroundTermsAndPolicy = this.removeBackgroundDropzone.locator('p').nth(2);
    this.removeBackgroundiFrame = this.type.remove_background.locator('iframe').nth(0);

    // Resize image type details
    this.resizeImageHeading = this.type.resize_image.locator('h1');
    this.resizeImageContent = this.type.resize_image.locator('p').nth(0);
    this.resizeImageDropzone = this.type.resize_image.locator('.dropzone').nth(0);
    this.resizeImageDropzoneText = this.resizeImageDropzone.locator('p').nth(0);
    this.resizeImageTermsAndPolicy = this.resizeImageDropzone.locator('p').nth(2);
    this.resizeImageiFrame = this.type.resize_image.locator('iframe').nth(0);

    // Crop image type details
    this.cropImageHeading = this.type.crop_image.locator('h1');
    this.cropImageContent = this.type.crop_image.locator('p').nth(0);
    this.cropImageDropzone = this.type.crop_image.locator('.dropzone').nth(0);
    this.cropImageDropzoneText = this.cropImageDropzone.locator('p').nth(0);
    this.cropImageTermsAndPolicy = this.cropImageDropzone.locator('p').nth(2);
    this.cropImageiFrame = this.type.crop_image.locator('iframe').nth(0);

    // Convert to JPG type details
    this.convertToJpgHeading = this.type.convert_to_jpg.locator('h1');
    this.convertToJpgContent = this.type.convert_to_jpg.locator('p').nth(0);
    this.convertToJpgDropzone = this.type.convert_to_jpg.locator('.dropzone').nth(0);
    this.convertToJpgDropzoneText = this.convertToJpgDropzone.locator('p').nth(0);
    this.convertToJpgTermsAndPolicy = this.convertToJpgDropzone.locator('p').nth(2);
    this.convertToJpgiFrame = this.type.convert_to_jpg.locator('iframe').nth(0);

    // Convert to PNG type details
    this.convertToPngHeading = this.type.convert_to_png.locator('h1');
    this.convertToPngContent = this.type.convert_to_png.locator('p').nth(0);
    this.convertToPngDropzone = this.type.convert_to_png.locator('.dropzone').nth(0);
    this.convertToPngDropzoneText = this.convertToPngDropzone.locator('p').nth(0);
    this.convertToPngTermsAndPolicy = this.convertToPngDropzone.locator('p').nth(2);
    this.convertToPngiFrame = this.type.convert_to_png.locator('iframe').nth(0);

    // Convert to SVG type details
    this.convertToSvgHeading = this.type.convert_to_svg.locator('h1');
    this.convertToSvgContent = this.type.convert_to_svg.locator('p').nth(0);
    this.convertToSvgDropzone = this.type.convert_to_svg.locator('.dropzone').nth(0);
    this.convertToSvgDropzoneText = this.convertToSvgDropzone.locator('p').nth(0);
    this.convertToSvgTermsAndPolicy = this.convertToSvgDropzone.locator('p').nth(2);
    this.convertToSvgiFrame = this.type.convert_to_svg.locator('iframe').nth(0);

    // Change background type details
    this.changeBackgroundHeading = this.type.change_background.locator('h1');
    this.changeBackgroundContent = this.type.change_background.locator('p').nth(0);
    this.changeBackgroundDropzone = this.type.change_background.locator('.dropzone').nth(0);
    this.changeBackgroundDropzoneText = this.changeBackgroundDropzone.locator('p').nth(0);
    this.changeBackgroundTermsAndPolicy = this.changeBackgroundDropzone.locator('p').nth(2);
    this.changeBackgroundiFrame = this.type.change_background.locator('iframe').nth(0);
  }

  async uploadImage(filePath) {
    try {
      // Wait for upload control to be ready so the app accepts the file reliably
      await this.uploadPhotoButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.page.waitForTimeout(500);

      const fileChooserPromise = this.page.waitForEvent('filechooser', { timeout: 15000 });
      await this.uploadPhotoButton.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(filePath);

      // Give the app time to validate and process the file (reduces "No valid files found" flakiness)
      await this.page.waitForTimeout(8000);
    } catch (error) {
      console.error('Error during image upload:', error);
      throw error;
    }
    await this.page.waitForLoadState('domcontentloaded');
  }
}
