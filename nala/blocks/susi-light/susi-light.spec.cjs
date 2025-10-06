module.exports = {
  name: 'Express susi-light block',
  features: [
    {
      tcid: '0',
      name: '@susi-light basic display and form elements',
      path: ['/drafts/nala/blocks/susi-light/susi-light-default'],
      tags: '@express @smoke @regression @susi-light',
    },
    {
      tcid: '1',
      name: '@susi-light sign in flow',
      path: ['/drafts/nala/blocks/susi-light/susi-light-signin'],
      tags: '@express @regression @susi-light @auth',
    },
    {
      tcid: '2',
      name: '@susi-light sign up flow',
      path: ['/drafts/nala/blocks/susi-light/susi-light-signup'],
      tags: '@express @regression @susi-light @auth',
    },
    {
      tcid: '3',
      name: '@susi-light social authentication',
      path: ['/drafts/nala/blocks/susi-light/susi-light-social'],
      tags: '@express @regression @susi-light @social @auth',
    },
    {
      tcid: '4',
      name: '@susi-light error handling',
      path: ['/drafts/nala/blocks/susi-light/susi-light-errors'],
      tags: '@express @regression @susi-light @errors',
    },
  ],
};
