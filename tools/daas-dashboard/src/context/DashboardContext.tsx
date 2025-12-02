import { createContext, useReducer, useMemo, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { DashboardState, DashboardAction, PageData, PageStatus } from '../types'
import { dashboardReducer, initialState } from '../reducers/dashboardReducer'
import { templates } from '../data/mockData'
import { loadPagesData } from '../utils'

interface DashboardContextValue {
  state: DashboardState
  dispatch: React.Dispatch<DashboardAction>
  filteredPages: PageData[]
  allPages: PageData[]
  allTemplates: string[]
  allStatuses: PageStatus[]
  isLoading: boolean
  setPagesData: React.Dispatch<React.SetStateAction<PageData[]>>
  refreshPagesData: () => Promise<void>
}

export const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const [pagesData, setPagesData] = useState<PageData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Function to refresh pages data from CMS
  const refreshPagesData = useCallback(async () => {
    try {
      const data = await loadPagesData()
      setPagesData(data.pages as PageData[])
    } catch (error) {
      console.error('Error loading pages data:', error)
    }
  }, [])

  // Load pages data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadPagesData()
        setPagesData(data.pages as PageData[])
      } catch (error) {
        console.error('Error loading pages data:', error)
        setPagesData([])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Get unique statuses
  const allStatuses = useMemo(() => {
    return Array.from(new Set(pagesData.map(page => page.status))) as PageStatus[]
  }, [pagesData])

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    let filtered = pagesData.filter(page => {
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
  }, [pagesData, state.urlFilter, state.templateFilter, state.statusFilter, state.sortField, state.sortDirection])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      filteredPages,
      allPages: pagesData,
      allTemplates: templates,
      allStatuses,
      isLoading,
      setPagesData,
      refreshPagesData
    }),
    [state, filteredPages, allStatuses, pagesData, isLoading, refreshPagesData]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

