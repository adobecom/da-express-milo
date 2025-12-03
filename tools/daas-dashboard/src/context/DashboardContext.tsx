import { createContext, useReducer, useMemo, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { DashboardState, DashboardAction, PageData, PageStatus } from '../types'
import { dashboardReducer, initialState } from '../reducers/dashboardReducer'
import { loadDAASPages, type DAASPage } from '../api/daApi'
import { getToken } from '../utils'
import { mockPages } from '../data/mockData'

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

  // Convert DAASPage to PageData
  const convertToPageData = (daasPages: DAASPage[]): PageData[] => {
    return daasPages.map(page => ({
      id: page.id,
      url: page.url,
      template: page.template,
      lastUpdate: page.lastUpdate,
      generated: page.generated,
      status: page.status,
      fields: page.fields
    }))
  }

  // Merge real DAAS pages with mock data (real pages first)
  const mergeWithMockData = (realPages: PageData[]): PageData[] => {
    // Real pages come first, then mock pages
    // Filter out any mock pages that might have same IDs as real pages
    const realIds = new Set(realPages.map(p => p.id))
    const filteredMock = mockPages.filter(p => !realIds.has(p.id))
    return [...realPages, ...filteredMock]
  }

  // Function to refresh pages data from CMS
  const refreshPagesData = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      if (token) {
        console.log('🔄 Refreshing DAAS pages from API...')
        const daasPages = await loadDAASPages()
        const realPages = convertToPageData(daasPages)
        console.log(`✅ Found ${realPages.length} real DAAS pages, merging with ${mockPages.length} mock pages`)
        setPagesData(mergeWithMockData(realPages))
      } else {
        console.warn('⚠️ No token - using mock data only')
        setPagesData(mockPages)
      }
    } catch (error) {
      console.error('Error loading pages data:', error)
      console.warn('⚠️ Falling back to mock data only')
      setPagesData(mockPages)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load pages data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getToken()
        if (token) {
          console.log('🔄 Loading DAAS pages from API...')
          const daasPages = await loadDAASPages()
          const realPages = convertToPageData(daasPages)
          console.log(`✅ Found ${realPages.length} real DAAS pages, merging with ${mockPages.length} mock pages`)
          setPagesData(mergeWithMockData(realPages))
        } else {
          console.warn('⚠️ No token available - using mock data only')
          setPagesData(mockPages)
        }
      } catch (error) {
        console.error('Error loading pages data:', error)
        console.warn('⚠️ Falling back to mock data only')
        setPagesData(mockPages)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Get unique templates from loaded pages
  const allTemplates = useMemo(() => {
    return Array.from(new Set(pagesData.map(page => page.template))).sort()
  }, [pagesData])

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
      allTemplates,
      allStatuses,
      isLoading,
      setPagesData,
      refreshPagesData
    }),
    [state, filteredPages, allTemplates, allStatuses, pagesData, isLoading, refreshPagesData]
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

