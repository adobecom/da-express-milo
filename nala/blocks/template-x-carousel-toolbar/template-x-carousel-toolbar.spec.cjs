module.exports = {
  name: 'Express template-x-carousel-toolbar block',
  features: [
    {
      tcid: '0',
      name: '@template-x-carousel-toolbar basic display',
      path: ['/drafts/nala/blocks/template-x-carousel-toolbar/toolbar-default'],
      tags: '@express @smoke @regression @template-x-carousel-toolbar',
    },
    {
      tcid: '1',
      name: '@template-x-carousel-toolbar category filtering',
      path: ['/drafts/nala/blocks/template-x-carousel-toolbar/toolbar-categories'],
      tags: '@express @regression @template-x-carousel-toolbar @filter',
    },
    {
      tcid: '2',
      name: '@template-x-carousel-toolbar carousel navigation',
      path: ['/drafts/nala/blocks/template-x-carousel-toolbar/toolbar-carousel'],
      tags: '@express @regression @template-x-carousel-toolbar @carousel',
    },
    {
      tcid: '3',
      name: '@template-x-carousel-toolbar sticky toolbar',
      path: ['/drafts/nala/blocks/template-x-carousel-toolbar/toolbar-sticky'],
      tags: '@express @regression @template-x-carousel-toolbar @sticky',
    },
  ],
};
