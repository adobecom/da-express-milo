module.exports = {
  name: 'FAQv2 Block',
  features: [
    {
      tcid: '0',
      name: '@FAQv2 Default',
      path: '/drafts/templates/faq',
      data: {
        h2Text: 'Questions? We have answers.',
        question1: 'What is Adobe Express?',
        answer1: 'Adobe Express is a quick and easy create-anything app',
        question2: 'Is Adobe Express free?',
        answer2: 'Yes, Adobe Express offers a free plan',
        question3: 'Can I use Adobe Express on mobile?',
        answer3: 'Yes, Adobe Express is available on web, iOS, and Android',
      },
      tags: '@faqv2 @smoke @regression',
    },
    {
      tcid: '1',
      name: '@FAQv2 Expandable',
      path: '/drafts/templates/faq',
      data: {
        h2Text: 'Questions? We have answers.',
        question1: 'What is Adobe Express?',
        answer1: 'Adobe Express is a quick and easy create-anything app',
      },
      tags: '@faqv2 @expandable @regression',
    },
    {
      tcid: '2',
      name: '@FAQv2 Longform',
      path: '/drafts/nala/blocks/faqv2/faqv2-long-form',
      data: {
        h2Text: 'Questions? We have answers',
        question1: 'What is Adobe Express?',
        answer1: 'Adobe Express is a cloud-based design platform developed by Adobe that empowers everyone to design content quickly and easily.',
        question2: 'Is Adobe Express free in the UK?',
        answer2: 'Yes, the free plan includes core features like photo editing tools, effects, and thousands of free templates',
        question3: 'How can I access the Adobe Express mobile app?',
        answer3: 'The app is available in web browsers and on iOS and Android devices.',
      },
      tags: '@faqv2 @longform @regression',
    },
    {
      tcid: '3',
      name: '@FAQv2 Empty',
      path: '/drafts/templates/faq-empty',
      data: {
        h2Text: 'Questions? We have answers.',
        question1: '',
        answer1: '',
      },
      tags: '@faqv2 @empty @regression',
    },
  ],
};
