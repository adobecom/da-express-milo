module.exports = {
  name: 'Express transparent-image-marquee block',
  features: [
    {
      tcid: '0',
      name: '@transparent-image-marquee default',
      path: '/drafts/echen/transparent-image-marquee',
      selector: '.transparent-image-marquee',
      data: {},
      tags: '@transparent-image-marquee @express @smoke @regression @t1',
    },
    {
      tcid: '1',
      name: '@transparent-image-marquee light variant',
      path: '/drafts/echen/transparent-image-marquee-light',
      selector: '.transparent-image-marquee.light',
      data: {},
      tags: '@transparent-image-marquee @express @regression @t2',
    },
    {
      tcid: '2',
      name: '@transparent-image-marquee cta variations',
      path: '/drafts/echen/transparent-image-marquee-cta-variations',
      selector: '.transparent-image-marquee',
      data: {},
      tags: '@transparent-image-marquee @express @regression @t3',
    },
  ],
};
