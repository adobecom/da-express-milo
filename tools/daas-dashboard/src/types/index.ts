export interface PageData {
  id: string
  url: string
  template: string
  lastUpdate: string
  generated: string
  status: 'Published' | 'Previewed' | 'Draft'
}

export type ViewMode = 'templates' | 'urls'

export interface DashboardState {
  viewMode: ViewMode
  searchQuery: string
  selectedTemplate: string | null
  selectedPages: Set<string>
}

export type DashboardAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_TEMPLATE'; payload: string | null }
  | { type: 'TOGGLE_PAGE_SELECTION'; payload: string }
  | { type: 'SET_SELECTED_PAGES'; payload: Set<string> }
  | { type: 'CLEAR_SELECTIONS' }
