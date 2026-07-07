module.exports = {
  name: 'Express how-to-v2 block',
  features: [
    {
      tcid: '0',
      name: '@how-to-v2 comprehensive test',
      path: '/drafts/nala/blocks/how-to-v2/how-to-v2',
      data: {
        // Step content data
        stepCount: 3,
        firstStepTitle: 'Upload media',
        firstStepDetail: 'Begin a new project by selecting the video type you want to create or upload your own media and start from scratch',
        lastStepTitle: 'Continue editing',
        lastStepDetail: 'Crop, trim, or split your video. Add a free Adobe Stock soundtrack to your project, upload your own, or keep editing. Download your newly edited video as an MP4 file to save and share anywhere',
        // Structure data
        hasStepsContent: true,
        hasMediaContainer: true,
        hasStepIndicators: true,
        hasDetailContainers: true,
        // Functionality data
        hasAccordionBehavior: true,
        hasKeyboardNavigation: true,
        hasAriaAttributes: true,
        hasBackgroundImage: true,
        // General data
        hasAnalytics: true,
        hasAccessibility: true,
        hasResponsiveDesign: true,
      },
      tags: '@how-to-v2 @accordion @steps @express @smoke @regression @t1',
    },
  ],
};
