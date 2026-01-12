module.exports = {
  name: 'Express frictionless-quick-action block',
  features: [
    {
      tcid: '0',
      name: '@frictionless-quick-action basic display',
      path: '/drafts/nala/blocks/frictionless-quick-action/basic',
      data: {
        blockExists: true,
        hasUploadButton: true,
      },
      tags: '@frictionless-quick-action @express @smoke @regression @t1',
    },
    {
      tcid: '1',
      name: '@frictionless-quick-action file upload flow',
      path: '/drafts/nala/blocks/frictionless-quick-action/upload',
      data: {
        testFile: 'test-assets/sample-image.jpg',
        expectedFileType: 'image/jpeg',
        maxUploadTime: 30000,
      },
      tags: '@frictionless-quick-action @frictionless-upload @express @regression @t2',
    },
    {
      tcid: '2',
      name: '@frictionless-quick-action progress tracking',
      path: '/drafts/nala/blocks/frictionless-quick-action/upload',
      data: {
        testFile: 'test-assets/sample-image.jpg',
        expectProgressBar: true,
        expectProgressUpdates: true,
      },
      tags: '@frictionless-quick-action @frictionless-progress @express @regression @t3',
    },
    {
      tcid: '3',
      name: '@frictionless-quick-action editor redirect',
      path: '/drafts/nala/blocks/frictionless-quick-action/upload',
      data: {
        testFile: 'test-assets/sample-image.jpg',
        expectRedirect: true,
        expectedParams: ['assetId', 'action'],
      },
      tags: '@frictionless-quick-action @frictionless-redirect @express @regression @t4',
    },
    {
      tcid: '4',
      name: '@frictionless-quick-action error handling - invalid file',
      path: '/drafts/nala/blocks/frictionless-quick-action/upload',
      data: {
        testFile: 'test-assets/invalid-file.txt',
        expectError: true,
        errorType: 'invalid-type',
      },
      tags: '@frictionless-quick-action @frictionless-error @express @regression @t5',
    },
    {
      tcid: '5',
      name: '@frictionless-quick-action error handling - large file',
      path: '/drafts/nala/blocks/frictionless-quick-action/upload',
      data: {
        testFile: 'test-assets/large-file.jpg',
        expectError: true,
        errorType: 'file-too-large',
      },
      tags: '@frictionless-quick-action @frictionless-error @express @regression @t6',
    },
  ],
};
