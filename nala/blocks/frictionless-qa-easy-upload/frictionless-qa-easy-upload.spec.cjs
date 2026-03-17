module.exports = {
  name: 'Express frictionless-qa-easy-upload block',
  features: [
    {
      tcid: '0',
      name: '@frictionless-qa-easy-upload remove background variant',
      path: '/drafts/nala/blocks/frictionless-qa/easy-upload/photos',
      data: {
        heading: 'Remove background from PNG for free.',
        description: 'Instantly remove the background from your PNG. Swap in a new background, add graphics, and more in Adobe Express, the quick and easy create-anything app.',
        dropPrompt: 'Drag and drop an image.',
        infoText: 'File must be JPEG, JPG, PNG or WebP and up to 40MB',
        ctas: ['Upload now', 'Upload from phone'],
        qrHeading: 'Upload from your phone',
        qrSteps: [
          '1. Use your phone to scan the QR code on the right.',
          '2. Select a photo and tap upload on your phone.',
          '3. Click the button below once your upload is complete.',
        ],
        confirmLabel: 'Confirm Input',
        confirmTooltip: 'Please wait until the upload is complete on your mobile device before confirming import.',
        qrError: 'The QR code did not load. This feature is only available to logged in users.',
        errorToastMessage: 'Failed to generate QR code.',
      },
      tags: '@frictionless-qa-easy-upload @express @smoke @regression @t1',
    },
  ],
};
