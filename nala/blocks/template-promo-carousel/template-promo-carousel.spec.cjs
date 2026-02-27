module.exports = {
  name: 'Express template-promo-carousel block',
  features: [
    {
      tcid: '0',
      name: '@template-promo-carousel basic carousel navigation',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-basic'],
      tags: '@express @smoke @regression @template-promo-carousel',
    },
    {
      tcid: '1',
      name: '@template-promo-carousel swipe gestures',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-basic'],
      tags: '@express @regression @template-promo-carousel @mobile',
    },
    {
      tcid: '2',
      name: '@template-promo-carousel autoplay functionality',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-api'],
      tags: '@express @regression @template-promo-carousel @autoplay',
    },
    {
      tcid: '3',
      name: '@template-promo-carousel keyboard navigation',
      path: ['/drafts/nala/blocks/template-x-promo/template-x-promo-recipe'],
      tags: '@express @regression @template-promo-carousel @keyboard @a11y',
    },
  ],
};
