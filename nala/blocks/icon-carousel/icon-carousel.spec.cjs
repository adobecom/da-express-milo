module.exports = {
  name: 'Express icon-carousel block',
  features: [
    {
      tcid: '0',
      name: '@icon-carousel default',
      path: '/drafts/echen/icon-carousel',
      selector: '.icon-carousel',
      data: {},
      tags: '@icon-carousel @express @smoke @regression @t1',
    },
    {
      tcid: '1',
      name: '@icon-carousel dark variant',
      path: '/drafts/echen/icon-carousel',
      selector: '.icon-carousel.dark',
      data: {},
      tags: '@icon-carousel @express @regression @t2',
    },
    {
      tcid: '2',
      name: '@icon-carousel desktop/widescreen left buffer',
      path: '/drafts/echen/icon-carousel',
      selector: '.icon-carousel',
      data: { leftBuffer: '40px' },
      tags: '@icon-carousel @express @regression @t3',
    },
    {
      tcid: '3',
      name: '@icon-carousel inset scales on ultrawide',
      path: '/drafts/echen/icon-carousel',
      selector: '.icon-carousel',
      // 1920px is one sample point on the scaling inset (see icon-carousel.css).
      data: { viewportWidth: 1920, expectedInset: '160px' },
      tags: '@icon-carousel @express @regression @t4',
    },
  ],
};
