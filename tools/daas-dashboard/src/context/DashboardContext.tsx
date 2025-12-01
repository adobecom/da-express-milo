import { createContext, useReducer, useMemo, type ReactNode } from 'react'
import type { DashboardState, DashboardAction, PageData } from '../types'
import { dashboardReducer, initialState } from '../reducers/dashboardReducer'
import { mockPages, templates } from '../data/mockData'

interface DashboardContextValue {
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  filteredTemplates: string[]
  filteredPages: PageData[]
  allPages: PageData[]
  allTemplates: string[]
}

export const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  // Filter templates based on search when in templates mode
  const filteredTemplates = useMemo(() => {
    if (state.viewMode === 'templates' && state.searchQuery) {
      return templates.filter(template =>
        template.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    }
    return templates
  }, [state.viewMode, state.searchQuery])

  // Filter pages based on search mode and selected template
  const filteredPages = useMemo(() => {
    return mockPages.filter(page => {
      // Search based on current view mode
      const matchesSearch = state.viewMode === 'urls'
        ? page.url.toLowerCase().includes(state.searchQuery.toLowerCase())
        : page.template.toLowerCase().includes(state.searchQuery.toLowerCase())
      
      const matchesTemplate = !state.selectedTemplate || page.template === state.selectedTemplate
      return matchesSearch && matchesTemplate
    })
  }, [state.searchQuery, state.selectedTemplate, state.viewMode])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      filteredTemplates,
      filteredPages,
      allPages: mockPages,
      allTemplates: templates
    }),
    [state, filteredTemplates, filteredPages]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

