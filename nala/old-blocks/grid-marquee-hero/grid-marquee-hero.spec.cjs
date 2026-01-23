const pathList = process.env.NALA_HERO_PATH
  ? process.env.NALA_HERO_PATH.split(',').map((p) => p.trim()).filter(Boolean)
  : ['/express/'];

module.exports = {
  name: 'Express grid-marquee-hero block',
  features: [
    {
      tcid: '0',
      name: '@grid-marquee-hero headline',
      path: pathList,
      tags: '@express @smoke @regression @grid-marquee-hero @headline',
    },
  ],
};
