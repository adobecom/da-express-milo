import type { PageData } from '../types'

export const mockPages: PageData[] = [
  {
    id: '1',
    url: '/express/image/remove-background',
    template: 'quick-actions-image-v1',
    lastUpdate: '2025/12/1',
    generated: '2024/12/1',
    status: 'Published'
  },
  {
    id: '2',
    url: '/express/image/resize',
    template: 'quick-actions-image-v2',
    lastUpdate: '2025/12/1',
    generated: '2024/12/1',
    status: 'Previewed'
  },
  {
    id: '3',
    url: '/express/image/crop',
    template: 'quick-actions-image-v1',
    lastUpdate: '2025/12/1',
    generated: '2025/10/1',
    status: 'Draft'
  },
  {
    id: '4',
    url: '/express/image/compress',
    template: 'quick-actions-image-v3',
    lastUpdate: '2025/11/28',
    generated: '2024/11/15',
    status: 'Published'
  },
  {
    id: '5',
    url: '/express/image/convert',
    template: 'quick-actions-image-v2',
    lastUpdate: '2025/11/22',
    generated: '2024/10/20',
    status: 'Previewed'
  },
  {
    id: '6',
    url: '/express/video/trim',
    template: 'quick-actions-video-v1',
    lastUpdate: '2025/11/1',
    generated: '2025/10/1',
    status: 'Published'
  },
  {
    id: '7',
    url: '/express/video/merge',
    template: 'quick-actions-video-v1',
    lastUpdate: '2025/11/1',
    generated: '2025/09/1',
    status: 'Published'
  },
  {
    id: '8',
    url: '/express/video/compress',
    template: 'quick-actions-video-v2',
    lastUpdate: '2025/12/1',
    generated: '2024/11/1',
    status: 'Previewed'
  },
  {
    id: '9',
    url: '/express/video/split',
    template: 'quick-actions-video-v2',
    lastUpdate: '2025/10/18',
    generated: '2024/09/12',
    status: 'Draft'
  },
  {
    id: '10',
    url: '/express/templates/flyers',
    template: 'templates-page-v2',
    lastUpdate: '2025/11/15',
    generated: '2024/10/1',
    status: 'Published'
  },
  {
    id: '11',
    url: '/express/templates/posters',
    template: 'templates-page-v3',
    lastUpdate: '2025/10/1',
    generated: '2024/09/1',
    status: 'Published'
  },
  {
    id: '12',
    url: '/express/templates/logos',
    template: 'templates-page-v1',
    lastUpdate: '2025/09/20',
    generated: '2024/08/1',
    status: 'Draft'
  },
  {
    id: '13',
    url: '/express/templates/social-media',
    template: 'templates-page-v3',
    lastUpdate: '2025/11/25',
    generated: '2024/07/15',
    status: 'Published'
  },
  {
    id: '14',
    url: '/express/colors/red',
    template: 'colors-page-v1',
    lastUpdate: '2025/11/10',
    generated: '2024/07/1',
    status: 'Published'
  },
  {
    id: '15',
    url: '/express/colors/blue',
    template: 'colors-page-v2',
    lastUpdate: '2025/10/25',
    generated: '2024/06/1',
    status: 'Previewed'
  },
  {
    id: '16',
    url: '/express/colors/gradient',
    template: 'colors-page-v1',
    lastUpdate: '2025/09/15',
    generated: '2024/05/1',
    status: 'Draft'
  },
  {
    id: '17',
    url: '/express/colors/pastel',
    template: 'colors-page-v2',
    lastUpdate: '2025/10/08',
    generated: '2024/04/22',
    status: 'Published'
  },
  {
    id: '18',
    url: '/express/create/flyer',
    template: 'create-page-v1',
    lastUpdate: '2025/11/20',
    generated: '2024/04/1',
    status: 'Published'
  },
  {
    id: '19',
    url: '/express/create/poster',
    template: 'create-page-v2',
    lastUpdate: '2025/10/30',
    generated: '2024/03/1',
    status: 'Published'
  },
  {
    id: '20',
    url: '/express/create/card',
    template: 'create-page-v1',
    lastUpdate: '2025/09/14',
    generated: '2024/02/18',
    status: 'Draft'
  },
  {
    id: '21',
    url: '/express/discover/trending',
    template: 'discover-page-v1',
    lastUpdate: '2025/12/1',
    generated: '2024/02/1',
    status: 'Published'
  },
  {
    id: '22',
    url: '/express/discover/popular',
    template: 'discover-page-v2',
    lastUpdate: '2025/11/5',
    generated: '2024/01/1',
    status: 'Previewed'
  },
  {
    id: '23',
    url: '/express/discover/collections',
    template: 'discover-page-v1',
    lastUpdate: '2025/10/12',
    generated: '2023/12/15',
    status: 'Published'
  },
  {
    id: '24',
    url: '/express/print/business-cards',
    template: 'print-product-details-v1',
    lastUpdate: '2025/10/15',
    generated: '2023/12/1',
    status: 'Published'
  },
  {
    id: '25',
    url: '/express/print/brochures',
    template: 'print-product-details-v2',
    lastUpdate: '2025/09/28',
    generated: '2023/11/1',
    status: 'Draft'
  },
  {
    id: '26',
    url: '/express/print/flyers',
    template: 'print-product-details-v1',
    lastUpdate: '2025/08/20',
    generated: '2023/10/08',
    status: 'Published'
  }
]

// Extract unique templates from mockPages
export const templates = Array.from(
  new Set(mockPages.map(page => page.template))
).sort()

