const templatePromoCarouselBaseModel = {
  assetType: 'Template', // Special handling for webpage templates (sets empty pages array)
  licensingCategory: '', // Values: "free" | "premium" - determines plan icon display
  'dc:title': {
    'i-default': '', // Primary title source
  },
  title: {
    'i-default': '', // Primary title source
  },
  pages: [
    {
      rendition: {
        image: {
          thumbnail: {
            componentId: '',
            hzRevision: '0',
            width: 500,
            height: 500,
            mediaType: 'image/webp',
          },
          preview: {
            componentId: '',
            hzRevision: '0',
            width: 1200,
            height: 1200,
            mediaType: 'image/webp',
          },
        },
      },
    },
  ],
  customLinks: {
    branchUrl: '', // Used for edit buttons and sharing functionality
  },
  _links: {
    'http://ns.adobe.com/adobecloud/rel/rendition': {
      href: '',
      templated: true,
    },
    'http://ns.adobe.com/adobecloud/rel/component': { // image of the template
      href: '',
      templated: true,
    },
  },
};

export default templatePromoCarouselBaseModel;
