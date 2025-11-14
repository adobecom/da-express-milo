export default class FrictionlessQaVideo {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;

    // section and frictionless-qa-video wrapper
    this.section = page.locator('.section').nth(nth);
    this.frictionlessQaVideo = page.locator('.frictionless-quick-action').nth(nth);

    // Frictionless type locators
    this.type = {
      video_to_gif: page.locator('.frictionless-quick-action[data-frictionlesstype=convert-to-gif]').nth(nth),
      video_crop: page.locator('.frictionless-quick-action[data-frictionlesstype=crop-video]').nth(nth),
      video_trim: page.locator('.frictionless-quick-action[data-frictionlesstype=trim-video]').nth(nth),
      video_resize: page.locator('.frictionless-quick-action[data-frictionlesstype=resize-video]').nth(nth),
      video_merge: page.locator('.frictionless-quick-action[data-frictionlesstype=merge-videos]').nth(nth),
      video_convert_to_mp4: page.locator('.frictionless-quick-action[data-frictionlesstype=convert-to-mp4]').nth(nth),
    };

    this.uploadButton = page.getByRole('link', { name: 'Upload your video' });

    // Convert to gif type details
    this.convertToGifHeading = this.type.video_to_gif.locator('h1');
    this.convertToGifContent = this.type.video_to_gif.locator('p').nth(0);
    this.convertToGifImage = this.type.video_to_gif.locator('picture > img').nth(0);
    this.convertToGifDropzone = this.type.video_to_gif.locator('.dropzone').nth(0);
    this.convertToGifDropzoneText = this.convertToGifDropzone.locator('p').nth(0);
    this.convertToGifTermsAndPolicy = this.convertToGifDropzone.locator('p').nth(2);
    this.convertToGifiFrame = this.type.video_to_gif.locator('iframe').nth(0);

    // Crop video type details
    this.cropVideoHeading = this.type.video_crop.locator('h1');
    this.cropVideoContent = this.type.video_crop.locator('p').nth(0);
    this.cropVideoImage = this.type.video_crop.locator('picture > img').nth(0);
    this.cropVideoDropzone = this.type.video_crop.locator('.dropzone').nth(0);
    this.cropVideoTermsAndPolicy = this.cropVideoDropzone.locator('p').nth(2);
    this.cropVideoiFrame = this.type.video_crop.locator('iframe').nth(0);

    // Trim video type details
    this.trimVideoHeading = this.type.video_trim.locator('h1');
    this.trimVideoContent = this.type.video_trim.locator('p').nth(0);
    this.trimVideoImage = this.type.video_trim.locator('picture > img').nth(0);
    this.trimVideoDropzone = this.type.video_trim.locator('.dropzone').nth(0);
    this.trimVideoTermsAndPolicy = this.trimVideoDropzone.locator('p').nth(2);
    this.trimVideoiFrame = this.type.video_trim.locator('iframe').nth(0);

    // Resize video type details
    this.resizeVideoHeading = this.type.video_resize.locator('h1');
    this.resizeVideoContent = this.type.video_resize.locator('p').nth(0);
    this.resizeVideoImage = this.type.video_resize.locator('picture > img').nth(0);
    this.resizeVideoDropzone = this.type.video_resize.locator('.dropzone').nth(0);
    this.resizeVideoTermsAndPolicy = this.resizeVideoDropzone.locator('p').nth(2);
    this.resizeVideoiFrame = this.type.video_resize.locator('iframe').nth(0);

    // Merge video type details
    this.mergeVideoHeading = this.type.video_merge.locator('h1');
    this.mergeVideoContent = this.type.video_merge.locator('p').nth(0);
    this.mergeVideoImage = this.type.video_merge.locator('picture > img').nth(0);
    this.mergeVideoDropzone = this.type.video_merge.locator('.dropzone').nth(0);
    this.mergeVideoTermsAndPolicy = this.mergeVideoDropzone.locator('p').nth(2);
    this.mergeVideoiFrame = this.type.video_merge.locator('iframe').nth(0);

    // Convert to MP4 video type details
    this.convertToMp4Heading = this.type.video_convert_to_mp4.locator('h1');
    this.convertToMp4Content = this.type.video_convert_to_mp4.locator('p').nth(0);
    this.convertToMp4Image = this.type.video_convert_to_mp4.locator('picture > img').nth(0);
    this.convertToMp4Dropzone = this.type.video_convert_to_mp4.locator('.dropzone').nth(0);
    this.convertToMp4TermsAndPolicy = this.convertToMp4Dropzone.locator('p').nth(2);
    this.convertToMp4iFrame = this.type.video_convert_to_mp4.locator('iframe').nth(0);
  }

  async uploadVideo(path) {
    try {
      const fileChooserPromise = this.page.waitForEvent('filechooser', { timeout: 10000 });
      await this.uploadButton.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(path);
      await this.page.waitForTimeout(5000);
    } catch (error) {
      console.error('Error during file upload:', error);
      throw error;
    }
    await this.page.waitForLoadState('domcontentloaded');
  }
}
