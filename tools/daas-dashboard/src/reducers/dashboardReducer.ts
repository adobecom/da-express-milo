import type { DashboardState, DashboardAction } from '../types'

export const initialState: DashboardState = {
  urlFilter: '',
  templateFilter: null,
  statusFilter: null,
  sortField: null,
  sortDirection: 'asc',
  selectedPages: new Set<string>(),
  viewMode: 'table',
  editingPage: null
}

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'SET_URL_FILTER':
      return {
        ...state,
        urlFilter: action.payload
      }
    
    case 'SET_TEMPLATE_FILTER':
      return {
        ...state,
        templateFilter: action.payload
      }
    
    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: action.payload
      }
    
    case 'SET_SORT':
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: action.payload.direction
      }
    
    case 'TOGGLE_SORT': {
      const field = action.payload
      // If clicking the same field, toggle direction
      if (state.sortField === field) {
        return {
          ...state,
          sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc'
        }
      }
      // Otherwise, sort by new field in ascending order
      return {
        ...state,
        sortField: field,
        sortDirection: 'asc'
      }
    }
    
    case 'TOGGLE_PAGE_SELECTION': {
      const newSelected = new Set(state.selectedPages)
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload)
      } else {
        newSelected.add(action.payload)
      }
      return {
        ...state,
        selectedPages: newSelected
      }
    }
    
    case 'SET_SELECTED_PAGES':
      return {
        ...state,
        selectedPages: action.payload
      }
    
    case 'CLEAR_SELECTIONS':
      return {
        ...state,
        selectedPages: new Set<string>()
      }
    
    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        urlFilter: '',
        templateFilter: null,
        statusFilter: null
      }
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload
      }
    
    case 'SET_EDITING_PAGE':
      return {
        ...state,
        editingPage: action.payload
      }
    
    default:
      return state
  }
}

