import type { TemplateField, PageFieldValues } from '../types'

// Define fields for each template
export const templateFieldsMap: Record<string, TemplateField[]> = {
  'quick-actions-image-v1': [
    { key: 'hero-marquee-headline', label: 'Hero Headline', type: 'text' },
    { key: 'hero-marquee-text', label: 'Hero Text', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'hero-description', label: 'Description', type: 'longtext' },
    { key: 'products', label: 'Products', type: 'text' }
  ],
  'quick-actions-image-v2': [
    { key: 'hero-marquee-headline', label: 'Hero Headline', type: 'text' },
    { key: 'hero-marquee-text', label: 'Hero Text', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'hero-description', label: 'Description', type: 'longtext' }
  ],
  'quick-actions-image-v3': [
    { key: 'hero-marquee-headline', label: 'Hero Headline', type: 'text' },
    { key: 'hero-marquee-text', label: 'Hero Text', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'hero-description', label: 'Description', type: 'longtext' },
    { key: 'cta-text', label: 'CTA Text', type: 'text' }
  ],
  'quick-actions-video-v1': [
    { key: 'hero-marquee-headline', label: 'Hero Headline', type: 'text' },
    { key: 'hero-marquee-text', label: 'Hero Text', type: 'text' },
    { key: 'hero-video', label: 'Hero Video', type: 'image' },
    { key: 'hero-description', label: 'Description', type: 'longtext' }
  ],
  'quick-actions-video-v2': [
    { key: 'hero-marquee-headline', label: 'Hero Headline', type: 'text' },
    { key: 'hero-marquee-text', label: 'Hero Text', type: 'text' },
    { key: 'hero-video', label: 'Hero Video', type: 'image' },
    { key: 'hero-description', label: 'Description', type: 'longtext' },
    { key: 'features-list', label: 'Features', type: 'text' }
  ],
  'templates-page-v1': [
    { key: 'hero-title', label: 'Hero Title', type: 'text' },
    { key: 'hero-subtitle', label: 'Hero Subtitle', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'category-name', label: 'Category', type: 'text' }
  ],
  'templates-page-v2': [
    { key: 'hero-title', label: 'Hero Title', type: 'text' },
    { key: 'hero-subtitle', label: 'Hero Subtitle', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'category-name', label: 'Category', type: 'text' },
    { key: 'template-count', label: 'Template Count', type: 'text' }
  ],
  'templates-page-v3': [
    { key: 'hero-title', label: 'Hero Title', type: 'text' },
    { key: 'hero-subtitle', label: 'Hero Subtitle', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'category-name', label: 'Category', type: 'text' },
    { key: 'template-count', label: 'Template Count', type: 'text' }
  ],
  'colors-page-v1': [
    { key: 'primary-color', label: 'Primary Color', type: 'text' },
    { key: 'secondary-color', label: 'Secondary Color', type: 'text' },
    { key: 'marquee-heading', label: 'Marquee Heading', type: 'text' },
    { key: 'marquee-copy', label: 'Marquee Copy', type: 'longtext' },
    { key: 'marquee-cta-text', label: 'CTA Text', type: 'text' },
    { key: 'marquee-cta-link', label: 'CTA Link', type: 'text' },
    { key: 'marquee-svg', label: 'Marquee SVG', type: 'text' }
  ],
  'colors-page-v2': [
    { key: 'color-name', label: 'Color Name', type: 'text' },
    { key: 'color-hex', label: 'Hex Code', type: 'text' },
    { key: 'color-description', label: 'Description', type: 'longtext' },
    { key: 'preview-image', label: 'Preview', type: 'image' },
    { key: 'complementary-colors', label: 'Complementary', type: 'text' }
  ],
  'create-page-v1': [
    { key: 'page-title', label: 'Page Title', type: 'text' },
    { key: 'page-subtitle', label: 'Subtitle', type: 'text' },
    { key: 'banner-image', label: 'Banner', type: 'image' },
    { key: 'description', label: 'Description', type: 'longtext' }
  ],
  'create-page-v2': [
    { key: 'page-title', label: 'Page Title', type: 'text' },
    { key: 'page-subtitle', label: 'Subtitle', type: 'text' },
    { key: 'banner-image', label: 'Banner', type: 'image' },
    { key: 'description', label: 'Description', type: 'longtext' },
    { key: 'cta-button', label: 'CTA Button', type: 'text' }
  ],
  'discover-page-v1': [
    { key: 'page-title', label: 'Page Title', type: 'text' },
    { key: 'featured-content', label: 'Featured Content', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'intro-text', label: 'Intro', type: 'longtext' }
  ],
  'discover-page-v2': [
    { key: 'page-title', label: 'Page Title', type: 'text' },
    { key: 'featured-content', label: 'Featured Content', type: 'text' },
    { key: 'hero-image', label: 'Hero Image', type: 'image' },
    { key: 'intro-text', label: 'Intro', type: 'longtext' },
    { key: 'categories', label: 'Categories', type: 'text' }
  ],
  'print-product-details-v1': [
    { key: 'product-name', label: 'Product Name', type: 'text' },
    { key: 'product-description', label: 'Description', type: 'longtext' },
    { key: 'product-image', label: 'Product Image', type: 'image' },
    { key: 'pricing', label: 'Pricing', type: 'text' }
  ],
  'print-product-details-v2': [
    { key: 'product-name', label: 'Product Name', type: 'text' },
    { key: 'product-description', label: 'Description', type: 'longtext' },
    { key: 'product-image', label: 'Product Image', type: 'image' },
    { key: 'pricing', label: 'Pricing', type: 'text' },
    { key: 'specifications', label: 'Specifications', type: 'text' }
  ]
}

// Mock field values for pages
export const pageFieldValues: PageFieldValues[] = [
  // quick-actions-image-v1
  { pageId: '1', values: { 'hero-marquee-headline': 'Remove Background', 'hero-marquee-text': 'Instantly remove backgrounds from any image', 'hero-image': 'placeholder', 'hero-description': 'Remove backgrounds from images quickly and easily with our AI-powered tool. Perfect for product photos, portraits, and more.', 'products': 'Photoshop Express' }},
  { pageId: '3', values: { 'hero-marquee-headline': 'Crop Images', 'hero-marquee-text': 'Crop and resize your images instantly', 'hero-image': 'placeholder', 'hero-description': 'Crop images to any size or aspect ratio. Perfect for social media posts, print materials, and web content.', 'products': 'Adobe Express' }},
  
  // quick-actions-image-v2
  { pageId: '2', values: { 'hero-marquee-headline': 'Resize Your Image', 'hero-marquee-text': 'Change image dimensions in seconds', 'hero-image': 'placeholder', 'hero-description': 'Resize images for web, print, or social media without losing quality. Supports batch processing.' }},
  { pageId: '5', values: { 'hero-marquee-headline': 'Convert Images', 'hero-marquee-text': 'Convert between image formats easily', 'hero-image': 'placeholder', 'hero-description': 'Convert images between JPG, PNG, WebP, and more. Maintain quality while optimizing file size.' }},
  
  // quick-actions-image-v3
  { pageId: '4', values: { 'hero-marquee-headline': 'Compress Images', 'hero-marquee-text': 'Reduce file size without quality loss', 'hero-image': 'placeholder', 'hero-description': 'Compress images to reduce file size while maintaining visual quality. Perfect for web optimization.', 'cta-text': 'Try It Free' }},
  
  // quick-actions-video-v1
  { pageId: '6', values: { 'hero-marquee-headline': 'Trim Videos', 'hero-marquee-text': 'Cut and trim your videos precisely', 'hero-video': 'placeholder', 'hero-description': 'Trim videos to the perfect length. Remove unwanted sections with frame-accurate precision.' }},
  { pageId: '7', values: { 'hero-marquee-headline': 'Merge Videos', 'hero-marquee-text': 'Combine multiple videos into one', 'hero-video': 'placeholder', 'hero-description': 'Merge multiple video clips into a single seamless video. Perfect for creating compilations.' }},
  
  // quick-actions-video-v2
  { pageId: '8', values: { 'hero-marquee-headline': 'Compress Videos', 'hero-marquee-text': 'Reduce video file size', 'hero-video': 'placeholder', 'hero-description': 'Compress videos to reduce file size for faster uploads and sharing while maintaining quality.', 'features-list': 'HD Quality, Fast Processing, Multiple Formats' }},
  { pageId: '9', values: { 'hero-marquee-headline': 'Split Videos', 'hero-marquee-text': 'Split videos into multiple clips', 'hero-video': 'placeholder', 'hero-description': 'Divide long videos into shorter clips. Perfect for creating social media content from longer videos.', 'features-list': 'Precise Cuts, Preview Mode, Export Options' }},
  
  // templates-page-v2
  { pageId: '10', values: { 'hero-title': 'Flyer Templates', 'hero-subtitle': 'Create stunning flyers in minutes', 'hero-image': 'placeholder', 'category-name': 'Marketing', 'template-count': '2,400+' }},
  
  // templates-page-v3
  { pageId: '11', values: { 'hero-title': 'Poster Templates', 'hero-subtitle': 'Design stunning posters in minutes', 'hero-image': 'placeholder', 'category-name': 'Marketing', 'template-count': '1,500+' }},
  { pageId: '13', values: { 'hero-title': 'Social Media Templates', 'hero-subtitle': 'Create eye-catching social posts', 'hero-image': 'placeholder', 'category-name': 'Social Media', 'template-count': '3,200+' }},
  { pageId: '27', values: { 'hero-title': 'Brochure Templates', 'hero-subtitle': 'Professional brochures made easy', 'hero-image': 'placeholder', 'category-name': 'Business', 'template-count': '800+' }},
  { pageId: '28', values: { 'hero-title': 'Business Card Templates', 'hero-subtitle': 'Make memorable first impressions', 'hero-image': 'placeholder', 'category-name': 'Business', 'template-count': '1,200+' }},
  { pageId: '29', values: { 'hero-title': 'Presentation Templates', 'hero-subtitle': 'Impress your audience', 'hero-image': 'placeholder', 'category-name': 'Business', 'template-count': '950+' }},
  { pageId: '30', values: { 'hero-title': 'Resume Templates', 'hero-subtitle': 'Land your dream job', 'hero-image': 'placeholder', 'category-name': 'Career', 'template-count': '600+' }},
  { pageId: '31', values: { 'hero-title': 'Invitation Templates', 'hero-subtitle': 'Perfect for any occasion', 'hero-image': 'placeholder', 'category-name': 'Events', 'template-count': '1,100+' }},
  { pageId: '32', values: { 'hero-title': 'Card Templates', 'hero-subtitle': 'Send wishes with style', 'hero-image': 'placeholder', 'category-name': 'Personal', 'template-count': '2,000+' }},
  { pageId: '33', values: { 'hero-title': 'Menu Templates', 'hero-subtitle': 'Showcase your dishes beautifully', 'hero-image': 'placeholder', 'category-name': 'Restaurant', 'template-count': '500+' }},
  { pageId: '34', values: { 'hero-title': 'Newsletter Templates', 'hero-subtitle': 'Engage your subscribers', 'hero-image': 'placeholder', 'category-name': 'Marketing', 'template-count': '750+' }},
  { pageId: '35', values: { 'hero-title': 'Banner Templates', 'hero-subtitle': 'Eye-catching web banners', 'hero-image': 'placeholder', 'category-name': 'Web', 'template-count': '1,300+' }},
  { pageId: '36', values: { 'hero-title': 'Infographic Templates', 'hero-subtitle': 'Visualize your data', 'hero-image': 'placeholder', 'category-name': 'Marketing', 'template-count': '650+' }},
  
  // templates-page-v1
  { pageId: '12', values: { 'hero-title': 'Logo Templates', 'hero-subtitle': 'Design your brand identity', 'hero-image': 'placeholder', 'category-name': 'Branding' }},
  
  // colors-page-v1
  { pageId: '14', values: { 'color-name': 'Red', 'color-hex': '#FF0000', 'color-description': 'Red is a warm, vibrant color associated with energy, passion, and excitement. Perfect for creating bold designs.', 'preview-image': 'placeholder' }},
  { pageId: '16', values: { 'color-name': 'Gradient', 'color-hex': 'Linear', 'color-description': 'Beautiful gradient combinations for modern, eye-catching designs. Blend multiple colors seamlessly.', 'preview-image': 'placeholder' }},
  { pageId: '37', values: { 'color-name': 'Green', 'color-hex': '#00FF00', 'color-description': 'Green represents nature, growth, and harmony. Ideal for eco-friendly and wellness brands.', 'preview-image': 'placeholder' }},
  { pageId: '38', values: { 'color-name': 'Yellow', 'color-hex': '#FFFF00', 'color-description': 'Yellow evokes happiness, optimism, and warmth. Great for cheerful, energetic designs.', 'preview-image': 'placeholder' }},
  { pageId: '39', values: { 'color-name': 'Purple', 'color-hex': '#800080', 'color-description': 'Purple combines calm and energy, representing creativity, luxury, and wisdom.', 'preview-image': 'placeholder' }},
  { pageId: '40', values: { 'color-name': 'Orange', 'color-hex': '#FFA500', 'color-description': 'Orange is vibrant and inviting, perfect for friendly, approachable brand designs.', 'preview-image': 'placeholder' }},
  { pageId: '41', values: { 'color-name': 'Pink', 'color-hex': '#FFC0CB', 'color-description': 'Pink represents playfulness, romance, and compassion. Ideal for gentle, caring brands.', 'preview-image': 'placeholder' }},
  { pageId: '42', values: { 'color-name': 'Brown', 'color-hex': '#A52A2A', 'color-description': 'Brown conveys reliability, stability, and comfort. Perfect for earthy, natural aesthetics.', 'preview-image': 'placeholder' }},
  { pageId: '43', values: { 'color-name': 'Cyan', 'color-hex': '#00FFFF', 'color-description': 'Cyan is fresh and calming, representing innovation and clarity in digital designs.', 'preview-image': 'placeholder' }},
  { pageId: '44', values: { 'color-name': 'Magenta', 'color-hex': '#FF00FF', 'color-description': 'Magenta is bold and creative, perfect for artistic and experimental designs.', 'preview-image': 'placeholder' }},
  { pageId: '45', values: { 'color-name': 'Teal', 'color-hex': '#008080', 'color-description': 'Teal combines blue and green, offering sophistication and tranquility for modern brands.', 'preview-image': 'placeholder' }},
  { pageId: '46', values: { 'color-name': 'Navy', 'color-hex': '#000080', 'color-description': 'Navy represents professionalism, trust, and authority. Classic choice for corporate designs.', 'preview-image': 'placeholder' }},
  { pageId: '47', values: { 'color-name': 'Sky Blue', 'color-hex': '#87CEEB', 'color-description': 'Sky blue evokes feelings of peace, tranquility, and openness. Perfect for calming, serene designs.', 'preview-image': 'placeholder' }},
  
  // colors-page-v2
  { pageId: '15', values: { 'color-name': 'Blue', 'color-hex': '#0000FF', 'color-description': 'Blue is calming and trustworthy, widely used in professional and tech designs.', 'preview-image': 'placeholder', 'complementary-colors': 'Orange, Yellow' }},
  { pageId: '17', values: { 'color-name': 'Pastel', 'color-hex': 'Mixed', 'color-description': 'Soft pastel colors create gentle, soothing designs perfect for elegant aesthetics.', 'preview-image': 'placeholder', 'complementary-colors': 'White, Cream' }},
  
  // create-page-v1
  { pageId: '18', values: { 'page-title': 'Create a Flyer', 'page-subtitle': 'Design eye-catching flyers', 'banner-image': 'placeholder', 'description': 'Create professional flyers for events, promotions, and announcements using our easy-to-use design tools.' }},
  { pageId: '20', values: { 'page-title': 'Create a Card', 'page-subtitle': 'Design personalized cards', 'banner-image': 'placeholder', 'description': 'Design beautiful cards for birthdays, holidays, thank you notes, and more with customizable templates.' }},
  
  // create-page-v2
  { pageId: '19', values: { 'page-title': 'Create a Poster', 'page-subtitle': 'Design stunning posters', 'banner-image': 'placeholder', 'description': 'Make impactful posters for events, marketing, or decoration with professional design tools.', 'cta-button': 'Start Creating' }},
  
  // discover-page-v1
  { pageId: '21', values: { 'page-title': 'Trending Designs', 'featured-content': 'Latest Templates', 'hero-image': 'placeholder', 'intro-text': 'Explore the hottest design trends and popular templates created by our community. Get inspired!' }},
  { pageId: '23', values: { 'page-title': 'Design Collections', 'featured-content': 'Curated Sets', 'hero-image': 'placeholder', 'intro-text': 'Browse hand-picked collections of templates organized by theme, style, and purpose.' }},
  
  // discover-page-v2
  { pageId: '22', values: { 'page-title': 'Popular Templates', 'featured-content': 'Most Used', 'hero-image': 'placeholder', 'intro-text': 'Discover the most popular templates loved by our users. Find inspiration from successful designs.', 'categories': 'Social Media, Business, Personal' }},
  
  // print-product-details-v1
  { pageId: '24', values: { 'product-name': 'Business Cards', 'product-description': 'Premium business cards printed on high-quality card stock. Make a lasting impression with professional designs.', 'product-image': 'placeholder', 'pricing': 'Starting at $19.99' }},
  { pageId: '26', values: { 'product-name': 'Print Flyers', 'product-description': 'High-quality flyer printing for events, promotions, and marketing campaigns. Multiple paper options available.', 'product-image': 'placeholder', 'pricing': 'Starting at $29.99' }},
  
  // print-product-details-v2
  { pageId: '25', values: { 'product-name': 'Brochures', 'product-description': 'Professional brochure printing with folding options. Perfect for showcasing your business or products.', 'product-image': 'placeholder', 'pricing': 'Starting at $39.99', 'specifications': 'Tri-fold, Bi-fold, Z-fold options' }}
]

export function getTemplateFields(template: string): TemplateField[] {
  return templateFieldsMap[template] || []
}

export function getPageFieldValues(pageId: string): Record<string, string> {
  const pageFields = pageFieldValues.find(p => p.pageId === pageId)
  return pageFields?.values || {}
}

// New function to get field values from loaded data
export async function getPageFieldValuesFromData(pageId: string): Promise<Record<string, string>> {
  try {
    const { loadPagesData } = await import('../utils')
    const data = await loadPagesData()
    return data.fieldValues[pageId] || {}
  } catch (error) {
    console.error('Error loading field values:', error)
    return {}
  }
}

