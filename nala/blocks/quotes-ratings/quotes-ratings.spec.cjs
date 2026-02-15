module.exports = {
  name: 'Express quotes ratings block',
  features: [
    {
      tcid: '0',
      name: '@quotes-ratings basic rating submission',
      path: '/drafts/nala/blocks/quotes/quotes-ratings',
      data: {
        rating: 5,
        comment: 'Great quote!',
        expectSuccess: true,
      },
      tags: '@quotes-ratings @quotes @express @smoke @regression @t1',
    },
    {
      tcid: '1',
      name: '@quotes-ratings already rated state',
      path: '/drafts/nala/blocks/quotes/quotes-ratings-submitted',
      data: {
        expectAlreadyRated: true,
        alreadyRatedTitle: 'Thank you',
        submitButtonDisabled: true,
      },
      tags: '@quotes-ratings @quotes @express @regression @t2',
    },
    {
      tcid: '2',
      name: '@quotes-ratings carousel with ratings',
      path: '/drafts/nala/blocks/quotes/quotes-carousel-ratings',
      data: {
        quoteCount: 5,
        rating: 4,
        expectCarousel: true,
        expectNavigation: true,
      },
      tags: '@quotes-ratings @quotes-carousel @express @regression @t3',
    },
    {
      tcid: '3',
      name: '@quotes-ratings timer and auto-submit',
      path: '/drafts/nala/blocks/quotes/quotes-ratings-timer',
      data: {
        rating: 5,
        expectTimer: true,
        timerDuration: 10000,
        expectAutoSubmit: true,
      },
      tags: '@quotes-ratings @quotes-timer @express @regression @t4',
    },
    {
      tcid: '4',
      name: '@quotes-ratings lottie animation',
      path: '/drafts/nala/blocks/quotes/quotes-ratings-timer',
      data: {
        rating: 4,
        expectLottie: true,
        lottieType: 'countdown',
      },
      tags: '@quotes-ratings @quotes-animation @express @regression @t5',
    },
    {
      tcid: '5',
      name: '@quotes-ratings without comment',
      path: '/drafts/nala/blocks/quotes/quotes-ratings',
      data: {
        rating: 3,
        comment: '',
        expectSuccess: true,
      },
      tags: '@quotes-ratings @quotes @express @regression @t6',
    },
    {
      tcid: '6',
      name: '@quotes-ratings API integration',
      path: '/drafts/nala/blocks/quotes/quotes-ratings',
      data: {
        rating: 5,
        comment: 'Testing API submission',
        expectAPICall: true,
        expectSuccess: true,
      },
      tags: '@quotes-ratings @quotes-api @express @regression @t7',
    },
  ],
};
