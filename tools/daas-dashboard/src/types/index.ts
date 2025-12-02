export interface PageData {
  id: string
  url: string
  template: string
  lastUpdate: string
  generated: string
  status: 'Published' | 'Previewed' | 'Draft'
}

export type PageStatus = 'Published' | 'Previewed' | 'Draft'

export type SortField = 'url' | 'template' | 'lastUpdate' | 'generated' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface DashboardState {
  // Filters
  urlFilter: string
  templateFilter: string | null
  statusFilter: PageStatus | null
  
  // Sorting
  sortField: SortField | null
  sortDirection: SortDirection
  
  // Selection
  selectedPages: Set<string>
  
  // View mode
  viewMode: 'table' | 'birds-eye'
  
  // Edit modal
  editingPageId: string | null
}

export type DashboardAction =
  | { type: 'SET_URL_FILTER'; payload: string }
  | { type: 'SET_TEMPLATE_FILTER'; payload: string | null }
  | { type: 'SET_STATUS_FILTER'; payload: PageStatus | null }
  | { type: 'SET_SORT'; payload: { field: SortField; direction: SortDirection } }
  | { type: 'TOGGLE_SORT'; payload: SortField }
  | { type: 'TOGGLE_PAGE_SELECTION'; payload: string }
  | { type: 'SET_SELECTED_PAGES'; payload: Set<string> }
  | { type: 'CLEAR_SELECTIONS' }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_VIEW_MODE'; payload: 'table' | 'birds-eye' }
  | { type: 'SET_EDITING_PAGE'; payload: string | null }

// Template field definitions
export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'image' | 'longtext'
}

export interface PageFieldValues {
  pageId: string
  values: Record<string, string>
}
