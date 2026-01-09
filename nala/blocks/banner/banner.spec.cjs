const schema = require('./banner.block.json');

const additionalTests = [
  {
    tcid: '4',
    name: '@banner default heading3',
    path: '/drafts/nala/blocks/banner/banner-default-heading3',
    data: {
      headingText: 'Ready to create standout content?',
      buttonText: 'Start for free',
    },
    tags: '@banner @banner-default-heading3 @express @smoke @regression @t6',
  },
  {
    tcid: '5',
    name: '@banner light multiple buttons',
    path: '/drafts/nala/blocks/banner/banner-light-multiple-buttons',
    data: {
      headingText: 'Feeding the soul.',
      buttonText: 'Start for free',
    },
    tags: '@banner @banner-light-multiple-buttons @express @smoke @regression @t7',
  },
];

module.exports = { 
  features: [...schema.variants, ...additionalTests] 
};
