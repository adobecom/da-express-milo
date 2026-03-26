export type SearchIntent = 'create' | 'edit' | 'transform' | '';

export interface FormState {
  featurePageUrl: string;
  brief: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SearchIntent;
  targetFeature: string;
  destinationFolder: string;
}

export interface ImageItem {
  id: string;
  caption: string;
  prompt: string;
  url: string;
}

export interface UseCaseSection {
  title: string;
  description: string;
  image: ImageItem;
}

export interface DerivedOutput {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  introText: string;
  heroImage: ImageItem;
  howItWorksSteps: string[];
  useCaseSections: UseCaseSection[];
  faqItems: { q: string; a: string }[];
}

export const FIREFLY_FEATURES = [
  'Text to Character',
  'Text to Image',
  'Generative Fill',
  'Image Fill',
  'Background Remover',
  'Text Effects',
  'Generative Expand',
  'Recolor',
  'Sketch to Image',
] as const;

export const INTENT_LABELS: Record<Exclude<SearchIntent, ''>, string> = {
  create: 'Create',
  edit: 'Edit',
  transform: 'Transform',
};

export const SAMPLE_BRIEF = `Use Case: AI Image Upscaler supporting page
Keyword focus: free image upscaler, upscale image online, enlarge image without quality loss

Targeting creators, marketers, and everyday users who need to increase image resolution without losing quality. Core use: upload a photo, choose 2x or 4x upscale, download the enhanced result. Built on Adobe Firefly Generative Upscale.

Supporting angle: "free image upscaler online" — users who want a no-cost, browser-based tool to enlarge images before printing, posting, or publishing.`;

// Real content derived from https://www.adobe.com/products/firefly/features/image-upscaler.html
export const SAMPLE_DERIVED: DerivedOutput = {
  seoTitle: 'Free Image Upscaler — Enlarge Photos Online | Adobe',
  metaDescription:
    'Upscale any image 2x or 4x without quality loss using Adobe Firefly. Sharpen details, refine textures, and get print-ready results in one click. Free to try.',
  h1: 'Free AI Image Upscaler — Enlarge Images Without Quality Loss',
  introText:
    'Enlarge any image up to 4x its original size using Adobe Firefly\'s AI-powered upscaler — without the blur or pixelation you\'d get from traditional resizing. Whether you\'re preparing photos for print, scaling up legacy assets, or polishing user-generated content for a campaign, Generative Upscale sharpens fine details and refines textures automatically.',
  heroImage: {
    id: 'hero',
    caption: 'Hero / Banner',
    prompt: 'Before-and-after comparison of an AI-upscaled photo: left side blurry low-res, right side crisp and detailed after 4x upscale. Clean studio lighting, neutral background, professional photography.',
    url: 'https://picsum.photos/seed/upscaler-hero/800/450',
  },
  howItWorksSteps: [
    'Open the Firefly image editor — log in with your Adobe ID or create a free account.',
    'Upload your image — drag and drop or browse your device or Adobe cloud storage.',
    'Open the Quick Actions menu on the left side of the Edit screen and choose Generative Upscale.',
    'Select your AI model and resolution — upscale by 2x or 4x.',
    'Click Upscale — a new high-res document is generated automatically.',
  ],
  useCaseSections: [
    {
      title: 'Upscale customer photos for marketing campaigns',
      description:
        'User-generated content can be crucial for a successful campaign. With Generative Upscale, ensure those visuals maintain the polished, professional look of your own content — even when the source images are low resolution.',
      image: {
        id: 'usecase-marketing',
        caption: 'Marketing Use Case',
        prompt: 'Marketing professional reviewing large-format product images on a wide monitor, high-res images displayed on screen, professional workspace, warm lighting.',
        url: 'https://picsum.photos/seed/upscaler-marketing/800/450',
      },
    },
    {
      title: 'Improve low-res logos or product photos',
      description:
        'Use low-res email attachments or legacy assets instead of doing a costly redesign or reshoot. Whether working with a partner org\'s logo or hunting down a missing high-res file, get clean edges and fine details that meet your design standards.',
      image: {
        id: 'usecase-legacy',
        caption: 'Legacy Assets',
        prompt: 'Close-up of a crisp, clean logo with sharp edges after AI enhancement, displayed on both a business card and a large banner, professional brand design context.',
        url: 'https://picsum.photos/seed/upscaler-logo/800/450',
      },
    },
    {
      title: 'Enhance old photos or scanned images',
      description:
        'Breathe new life into old or scanned photos by increasing resolution and recovering details lost over time. The result is clearer, more usable imagery ready for contemporary creative projects and large-format output.',
      image: {
        id: 'usecase-vintage',
        caption: 'Old / Scanned Photos',
        prompt: 'Vintage family photograph restored to high resolution with AI, warm nostalgic tones, fine grain detail, displayed in a modern frame.',
        url: 'https://picsum.photos/seed/upscaler-vintage/800/450',
      },
    },
  ],
  faqItems: [
    {
      q: 'What is an AI image upscaler?',
      a: 'An AI image upscaler uses machine learning to intelligently increase image resolution — adding detail and sharpness rather than just stretching pixels. Adobe Firefly\'s Generative Upscale produces natural-looking results at 2x or 4x the original size.',
    },
    {
      q: 'Is Adobe\'s image upscaler free to use?',
      a: 'Yes. Adobe Firefly offers free generative credits to get started — no subscription required. Upscale images online directly in your browser at firefly.adobe.com.',
    },
    {
      q: 'What file types does the Firefly image upscaler support?',
      a: 'The upscaler accepts JPEG (JPG), PNG, and WEBP files up to 100MB. Images must be at least 512 × 512 pixels to process.',
    },
    {
      q: 'How much can I upscale an image without losing quality?',
      a: 'Firefly\'s Generative Upscale supports 2x and 4x enlargement. The AI fills in realistic detail rather than simply interpolating, so results stay sharp even at 4x.',
    },
    {
      q: 'Can I use upscaled images commercially?',
      a: 'Adobe Firefly is trained on licensed content and designed for commercial use. Upscaled images are covered by Adobe\'s IP indemnification policy.',
    },
  ],
};
