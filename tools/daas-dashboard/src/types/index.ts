export interface PageData {
  id: string
  url: string
  template: string
  lastUpdate: string
  generated: string
  status: 'Published' | 'Previewed' | 'Draft'
}

export type ViewMode = 'templates' | 'urls'

