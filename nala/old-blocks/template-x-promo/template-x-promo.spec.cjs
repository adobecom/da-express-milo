module.exports = {
  name: 'Express template-x-promo block',
  features: [
    {
      tcid: '0',
      name: '@template-x-promo real API integration',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-api'],
      tags: '@express @smoke @regression @template-x-promo',
    },
    {
      tcid: '1',
      name: '@template-x-promo carousel navigation',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-carousel'],
      tags: '@express @regression @template-x-promo @carousel',
    },
    {
      tcid: '2',
      name: '@template-x-promo desktop grid layout',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-desktop'],
      tags: '@express @regression @template-x-promo @desktop',
    },
    {
      tcid: '3',
      name: '@template-x-promo template hover and share',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-hover'],
      tags: '@express @regression @template-x-promo @hover @share',
    },
    {
      tcid: '4',
      name: '@template-x-promo keyboard navigation',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-keyboard'],
      tags: '@express @regression @template-x-promo @keyboard @a11y',
    },
  ],
};
