import { createContext, useReducer, useMemo, type ReactNode } from 'react'
import type { DashboardState, DashboardAction, PageData, PageStatus } from '../types'
import { dashboardReducer, initialState } from '../reducers/dashboardReducer'
import { mockPages, templates } from '../data/mockData'

interface DashboardContextValue {
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  filteredPages: PageData[]
  allPages: PageData[]
  allTemplates: string[]
  allStatuses: PageStatus[]
}

export const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  // Get unique statuses
  const allStatuses = useMemo(() => {
    return Array.from(new Set(mockPages.map(page => page.status))) as PageStatus[]
  }, [])

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    let filtered = mockPages.filter(page => {
      // URL filter
      const matchesUrl = page.url.toLowerCase().includes(state.urlFilter.toLowerCase())
      
      // Template filter
      const matchesTemplate = !state.templateFilter || page.template === state.templateFilter
      
      // Status filter
      const matchesStatus = !state.statusFilter || page.status === state.statusFilter
      
      return matchesUrl && matchesTemplate && matchesStatus
    })

    // Apply sorting
    if (state.sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[state.sortField!]
        const bValue = b[state.sortField!]
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return state.sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [state.urlFilter, state.templateFilter, state.statusFilter, state.sortField, state.sortDirection])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      filteredPages,
      allPages: mockPages,
      allTemplates: templates,
      allStatuses
    }),
    [state, filteredPages, allStatuses]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

