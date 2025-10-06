module.exports = {
  name: 'Express holiday-blade block',
  features: [
    {
      tcid: '0',
      name: '@holiday-blade basic display and templates',
      path: ['/drafts/nala/blocks/holiday-blade/holiday-blade-default'],
      tags: '@express @smoke @regression @holiday-blade',
    },
    {
      tcid: '1',
      name: '@holiday-blade expand/collapse functionality',
      path: ['/drafts/nala/blocks/holiday-blade/holiday-blade-expand'],
      tags: '@express @regression @holiday-blade @expand',
    },
    {
      tcid: '2',
      name: '@holiday-blade holiday icon and theming',
      path: ['/drafts/nala/blocks/holiday-blade/holiday-blade-themed'],
      tags: '@express @regression @holiday-blade @theming',
    },
  ],
};
