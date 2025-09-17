module.exports = {
  name: 'Express template-x-promo block',
  features: [
    {
      tcid: '0',
      name: '@template-x-promo basic functionality',
      path: ['/dev/testing/test-template-x-promo'],
      tags: '@express @smoke @regression @template-x-promo',
    },
    {
      tcid: '1',
      name: '@template-x-promo with recipe parameters',
      path: ['/dev/testing/test-template-x-promo-with-recipe'],
      tags: '@express @smoke @regression @template-x-promo',
    },
    {
      tcid: '2',
      name: '@template-x-promo real API integration',
      path: ['/dev/testing/test-real-template-x-promo'],
      tags: '@express @smoke @regression @template-x-promo',
    },
  ],
};
