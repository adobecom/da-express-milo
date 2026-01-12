module.exports = {
  name: 'Express tabs-ax block',
  features: [
    {
      tcid: '0',
      name: '@tabs-ax basic tab switching',
      path: ['/drafts/nala/blocks/tabs-ax/tabs-ax-default'],
      tags: '@express @smoke @regression @tabs-ax',
    },
    {
      tcid: '1',
      name: '@tabs-ax keyboard navigation with arrow keys',
      path: ['/drafts/nala/blocks/tabs-ax/tabs-ax-keyboard'],
      tags: '@express @regression @tabs-ax @keyboard @a11y',
    },
    {
      tcid: '2',
      name: '@tabs-ax URL parameter tab activation',
      path: ['/drafts/nala/blocks/tabs-ax/tabs-ax-url-params'],
      tags: '@express @regression @tabs-ax @url',
    },
    {
      tcid: '3',
      name: '@tabs-ax accessibility attributes',
      path: ['/drafts/nala/blocks/tabs-ax/tabs-ax-a11y'],
      tags: '@express @regression @tabs-ax @a11y',
    },
  ],
};
