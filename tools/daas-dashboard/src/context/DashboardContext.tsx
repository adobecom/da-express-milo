import { createContext, useReducer, useMemo, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { DashboardState, DashboardAction, PageData, PageStatus } from '../types'
import { dashboardReducer, initialState } from '../reducers/dashboardReducer'
import { loadDAASPages, batchCheckStatus, type DAASPage } from '../api/daApi'
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
      templatePath: page.templatePath,
      lastUpdate: page.lastUpdate,
      generated: page.generated,
      status: page.status,
      fields: page.fields
    }))
  }


  // Function to refresh pages data from CMS
  const refreshPagesData = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      if (!token) {
        console.warn('⚠️ No token available - showing mock data only')
        setPagesData(mockPages)
        setIsLoading(false)
        return
      }
      
      console.log('🔄 Refreshing DAAS pages from API...')
      const daasPages = await loadDAASPages()
      const realPages = convertToPageData(daasPages)
      console.log(`✅ Found ${realPages.length} real DAAS pages`)
      
      // Check status for ONLY real pages (not mock data)
      console.log('🔄 Checking publish status for real pages...')
      const realPaths = realPages.map(page => page.id)
      const statusMap = await batchCheckStatus(realPaths)
      
      // Update real pages with actual status from API
      const realPagesWithStatus = realPages.map(page => ({
        ...page,
        status: statusMap.get(page.id) || 'Draft'
      }))
      
      // Merge real pages with mock data (mock pages keep their mock status)
      const allPages = [...realPagesWithStatus, ...mockPages]
      console.log(`✅ Dashboard refreshed: ${realPagesWithStatus.length} real pages + ${mockPages.length} mock pages`)
      
      setPagesData(allPages)
    } catch (error) {
      console.error('Error refreshing pages data:', error)
      // Fall back to mock data on error
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
        if (!token) {
          console.warn('⚠️ No token available - showing mock data only')
          setPagesData(mockPages)
          setIsLoading(false)
          return
        }
        
        console.log('🔄 Loading DAAS pages from API...')
        const daasPages = await loadDAASPages()
        const realPages = convertToPageData(daasPages)
        console.log(`✅ Found ${realPages.length} real DAAS pages`)
        
        // Check status for ONLY real pages (not mock data)
        console.log('🔄 Checking publish status for real pages...')
        const realPaths = realPages.map(page => page.id)
        const statusMap = await batchCheckStatus(realPaths)
        
        // Update real pages with actual status from API
        const realPagesWithStatus = realPages.map(page => ({
          ...page,
          status: statusMap.get(page.id) || 'Draft'
        }))
        
        // Merge real pages with mock data (mock pages keep their mock status)
        const allPages = [...realPagesWithStatus, ...mockPages]
        console.log(`✅ Dashboard loaded: ${realPagesWithStatus.length} real pages + ${mockPages.length} mock pages`)
        
        setPagesData(allPages)
      } catch (error) {
        console.error('Error loading pages data:', error)
        // Fall back to mock data on error
        setPagesData(mockPages)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Clear selections when filters change
  useEffect(() => {
    // Clear selections to avoid confusion when filtered results change
    if (state.urlFilter || state.templateFilter || state.statusFilter) {
      dispatch({ type: 'CLEAR_SELECTIONS' })
    }
  }, [state.urlFilter, state.templateFilter, state.statusFilter, dispatch])

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

