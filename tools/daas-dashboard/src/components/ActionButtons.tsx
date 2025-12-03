import { useState, useRef, useEffect } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { bulkPublish, bulkUnpublish } from '../api/daApi'
import PublishModal from './PublishModal'

export default function ActionButtons() {
  const { state, dispatch, allTemplates, allPages, refreshPagesData } = useDashboard()
  const hasSelection = state.selectedPages.size > 0
  const hasActiveFilters = state.urlFilter || state.templateFilter || state.statusFilter
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modalMode, setModalMode] = useState<'publish' | 'unpublish'>('publish')

  const handlePreview = () => console.log('Preview clicked', Array.from(state.selectedPages))
  
  const getSelectedRealPaths = () => {
    const selectedIds = Array.from(state.selectedPages)
    const selectedPages = allPages.filter(p => selectedIds.includes(p.id))
    return selectedPages.filter(p => p.id.startsWith('/')).map(p => p.id)
  }
  
  const handlePublish = async () => {
    const pathsToPublish = getSelectedRealPaths()
    
    if (pathsToPublish.length === 0) {
      alert('No real pages selected to publish. Mock pages cannot be published.')
      return
    }
    
    setModalMode('publish')
    setShowModal(true)
    setIsProcessing(true)
    
    try {
      await bulkPublish(pathsToPublish)
      await refreshPagesData()
      dispatch({ type: 'CLEAR_SELECTIONS' })
    } catch (error) {
      console.error('Publish failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleUnpublish = async () => {
    const pathsToUnpublish = getSelectedRealPaths()
    
    if (pathsToUnpublish.length === 0) {
      alert('No real pages selected to unpublish. Mock pages cannot be unpublished.')
      return
    }
    
    setModalMode('unpublish')
    setShowModal(true)
    setIsProcessing(true)
    
    try {
      await bulkUnpublish(pathsToUnpublish)
      await refreshPagesData()
      dispatch({ type: 'CLEAR_SELECTIONS' })
    } catch (error) {
      console.error('Unpublish failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleDelete = () => console.log('Delete clicked', Array.from(state.selectedPages))
  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' })
  }

  const handleSelectTemplate = (template: string) => {
    // Set the template filter and enter Bird's Eye View
    dispatch({ type: 'SET_TEMPLATE_FILTER', payload: template })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'birds-eye' })
    setShowTemplateDropdown(false)
    setTemplateSearch('')
  }

  const handleToggleDropdown = () => {
    setShowTemplateDropdown(!showTemplateDropdown)
    if (!showTemplateDropdown) {
      // Clear search when opening
      setTemplateSearch('')
      // Focus search input after dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }

  // Filter templates based on search
  const filteredTemplatesForDropdown = allTemplates.filter(template =>
    template.toLowerCase().includes(templateSearch.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false)
        setTemplateSearch('')
      }
    }

    if (showTemplateDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTemplateDropdown])

  return (
    <>
      <div className="flex gap-2 items-center justify-between flex-wrap">
      <div className="flex gap-2 items-center">
        {/* Bird's Eye View with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleDropdown}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Bird's Eye View/Edit
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showTemplateDropdown && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <svg 
                    className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredTemplatesForDropdown.length > 0 ? (
                  filteredTemplatesForDropdown.map((template) => (
                    <button
                      key={template}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors cursor-pointer"
                    >
                      {template}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-gray-500">
                    No templates found matching "{templateSearch}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-300"></div>
        <button 
          onClick={handlePreview}
          disabled={!hasSelection}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Preview
        </button>
        <button 
          onClick={handlePublish}
          disabled={!hasSelection}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Publish
        </button>
        <button 
          onClick={handleUnpublish}
          disabled={!hasSelection}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Unpublish
        </button>
        <button 
          onClick={handleDelete}
          disabled={!hasSelection}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Delete
        </button>
      </div>

      {/* Clear Filters - Right Side */}
      <button
        onClick={handleClearFilters}
        disabled={!hasActiveFilters}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear Filters
      </button>
    </div>
    
    {/* Publish/Unpublish Modal */}
    <PublishModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      isPublishing={isProcessing}
      mode={modalMode}
    />
    </>
  )
}

