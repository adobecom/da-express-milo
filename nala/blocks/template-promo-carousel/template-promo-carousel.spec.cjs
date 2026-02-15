module.exports = {
  name: 'Express template-promo-carousel block',
  features: [
    {
      tcid: '0',
      name: '@template-promo-carousel basic carousel navigation',
      path: ['/drafts/nala/blocks/template-promo-carousel/carousel-default'],
      tags: '@express @smoke @regression @template-promo-carousel',
    },
    {
      tcid: '1',
      name: '@template-promo-carousel swipe gestures',
      path: ['/drafts/nala/blocks/template-promo-carousel/carousel-swipe'],
      tags: '@express @regression @template-promo-carousel @mobile',
    },
    {
      tcid: '2',
      name: '@template-promo-carousel autoplay functionality',
      path: ['/drafts/nala/blocks/template-promo-carousel/carousel-autoplay'],
      tags: '@express @regression @template-promo-carousel @autoplay',
    },
    {
      tcid: '3',
      name: '@template-promo-carousel keyboard navigation',
      path: ['/drafts/nala/blocks/template-promo-carousel/carousel-keyboard'],
      tags: '@express @regression @template-promo-carousel @keyboard @a11y',
    },
  ],
};
