module.exports = {
  name: 'PDP-X Accordion Comprehensive Tests',
  features: [
    {
      tcid: '0',
      name: '@accordion-1 only one accordion section can be open at a time',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @smoke',
    },
    {
      tcid: '1',
      name: '@accordion-2 accordions expand and collapse with smooth transitions',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
    {
      tcid: '2',
      name: '@accordion-3 visual states show correct plus minus icons',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
    {
      tcid: '3',
      name: '@accordion-4 keyboard navigation works correctly',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @accessibility',
    },
    {
      tcid: '4',
      name: '@accordion-5 aria attributes are properly set',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @accessibility',
    },
    {
      tcid: '5',
      name: '@accordion-6 accordion content displays correctly when expanded',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
    {
      tcid: '6',
      name: '@accordion-7 accordions auto collapse when scrolling back to top',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
    {
      tcid: '7',
      name: '@accordion-8 accordion state persists when product variant changes',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
    {
      tcid: '8',
      name: '@accordion-9 accordion content does not cause horizontal overflow',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
    {
      tcid: '9',
      name: '@accordion-10 multiple accordion instances work independently',
      path: '/drafts/nala/blocks/pdp-x/pdp-x',
      tags: '@express @print-product-detail @accordion @regression',
    },
  ],
};
