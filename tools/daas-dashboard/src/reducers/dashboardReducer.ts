import type { DashboardState, DashboardAction } from '../types'

export const initialState: DashboardState = {
  viewMode: 'urls',
  searchQuery: '',
  selectedTemplate: null,
  selectedPages: new Set<string>()
}

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
        searchQuery: '' // Clear search when switching modes
      }
    
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload
      }
    
    case 'SET_SELECTED_TEMPLATE':
      return {
        ...state,
        selectedTemplate: action.payload
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
    
    default:
      return state
  }
}

