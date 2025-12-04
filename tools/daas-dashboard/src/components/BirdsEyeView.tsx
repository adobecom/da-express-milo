import { useMemo, useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { ROOT, bulkPublish, bulkUnpublish, bulkUpdateField, buildEditUrl } from '../api/daApi'
import PublishModal from './PublishModal'
import BulkEditModal from './BulkEditModal'

export default function BirdsEyeView() {
  const { state, dispatch, filteredPages, allPages, refreshPagesData } = useDashboard()

  // Local filter state for Bird's Eye View columns
  const [urlFilter, setUrlFilter] = useState('')
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({})
  
  // Publish/Unpublish modal state
  const [showModal, setShowModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modalMode, setModalMode] = useState<'publish' | 'unpublish'>('publish')
  
  // Bulk edit modal state
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null)
  const [editingFieldType, setEditingFieldType] = useState<string>('text')
  
  // Iframe edit state
  const [iframeEditUrl, setIframeEditUrl] = useState<string | null>(null)
  const [editingPageUrl, setEditingPageUrl] = useState<string | null>(null)

  // Get the template we're viewing (use filter or first page's template)
  const selectedTemplate = state.templateFilter || filteredPages[0]?.template

  const handleBackToTable = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'table' })
    dispatch({ type: 'SET_TEMPLATE_FILTER', payload: null })
  }

  const pagesForTemplate = filteredPages.filter(p => p.template === selectedTemplate)

  // Derive unique field keys and their types from all pages of this template
  const { fieldKeys, fieldTypes } = useMemo(() => {
    const keys = new Set<string>()
    const types: Record<string, string> = {}
    pagesForTemplate.forEach(page => {
      if (page.fields) {
        Object.entries(page.fields).forEach(([key, field]) => {
          keys.add(key)
          // Store the type (first occurrence wins)
          if (!types[key] && field.type) {
            types[key] = field.type
          }
        })
      }
    })
    return { fieldKeys: Array.from(keys).sort(), fieldTypes: types }
  }, [pagesForTemplate])

  // Apply local filters
  const filteredPagesForTemplate = useMemo(() => {
    return pagesForTemplate.filter(page => {
      // URL filter
      if (urlFilter && !page.url.toLowerCase().includes(urlFilter.toLowerCase())) {
        return false
      }
      
      // Field filters
      for (const [key, filterValue] of Object.entries(fieldFilters)) {
        if (filterValue) {
          const fieldValue = page.fields?.[key]?.value || ''
          if (!fieldValue.toLowerCase().includes(filterValue.toLowerCase())) {
            return false
          }
        }
      }
      
      return true
    })
  }, [pagesForTemplate, urlFilter, fieldFilters])

  // Selection helpers - use filtered pages
  const selectedPagesInView = filteredPagesForTemplate.filter(p => state.selectedPages.has(p.id))
  const allSelected = filteredPagesForTemplate.length > 0 && selectedPagesInView.length === filteredPagesForTemplate.length
  const someSelected = selectedPagesInView.length > 0 && selectedPagesInView.length < filteredPagesForTemplate.length
  const hasSelection = state.selectedPages.size > 0

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all pages in this view
      const newSelected = new Set(state.selectedPages)
      filteredPagesForTemplate.forEach(p => newSelected.delete(p.id))
      dispatch({ type: 'SET_SELECTED_PAGES', payload: newSelected })
    } else {
      // Select all pages in this view
      const newSelected = new Set(state.selectedPages)
      filteredPagesForTemplate.forEach(p => newSelected.add(p.id))
      dispatch({ type: 'SET_SELECTED_PAGES', payload: newSelected })
    }
  }

  const handleToggleSelect = (pageId: string) => {
    dispatch({ type: 'TOGGLE_PAGE_SELECTION', payload: pageId })
  }

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

  const handleDelete = () => {
    console.log('Delete clicked', Array.from(state.selectedPages))
  }

  const handleOpenBulkEdit = (fieldKey: string, fieldType: string) => {
    setEditingFieldKey(fieldKey)
    setEditingFieldType(fieldType)
    setShowBulkEditModal(true)
  }

  const handleBulkEditSave = async (newValue: string) => {
    if (!editingFieldKey) return
    
    const pathsToUpdate = getSelectedRealPaths()
    if (pathsToUpdate.length === 0) {
      alert('No real pages selected to update. Mock pages cannot be edited.')
      return
    }
    
    await bulkUpdateField(pathsToUpdate, editingFieldKey, newValue)
    await refreshPagesData()
    dispatch({ type: 'CLEAR_SELECTIONS' })
  }

  const handleFieldFilterChange = (key: string, value: string) => {
    setFieldFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setUrlFilter('')
    setFieldFilters({})
  }

  const hasActiveFilters = urlFilter || Object.values(fieldFilters).some(v => v)

  if (!selectedTemplate) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please select a template from the filter to view Bird's Eye View
        </p>
        <button
          onClick={handleBackToTable}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Back to Table View
        </button>
      </div>
    )
  }

  // Check if we have real DAAS pages with fields
  const hasRealFields = fieldKeys.length > 0

  const handleCloseIframe = () => {
    setIframeEditUrl(null)
    setEditingPageUrl(null)
    // Refresh data after editing
    refreshPagesData()
  }

  // If iframe is open, show the iframe panel
  if (iframeEditUrl) {
    return (
      <div className="space-y-4">
        {/* Iframe Header */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseIframe}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Table
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Editing Page</h2>
              <p className="text-sm text-gray-500 font-mono">{editingPageUrl}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(iframeEditUrl, '_blank')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </button>
            <button
              onClick={handleCloseIframe}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Done Editing
            </button>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <iframe
            src={iframeEditUrl}
            className="w-full h-full border-0"
            title="Edit Page"
            allow="clipboard-write"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Back Button and Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToTable}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bird's Eye View/Edit</h2>
            <p className="text-sm text-gray-500">
              {selectedTemplate} • {filteredPagesForTemplate.length} of {pagesForTemplate.length} {pagesForTemplate.length === 1 ? 'page' : 'pages'}
              {hasSelection && ` • ${state.selectedPages.size} selected`}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
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
      </div>

      {/* Spreadsheet View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Header row */}
              <tr className="bg-gray-50 border-b border-gray-200">
                {/* Checkbox column */}
                <th className="sticky left-0 z-10 bg-gray-50 px-2 py-3 text-center border-r border-gray-200 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                {/* Edit column */}
                <th className="sticky left-10 z-10 bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-12">
                  Edit
                </th>
                {/* URL column */}
                <th className="sticky left-22 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[250px]">
                  URL
                </th>
                {hasRealFields ? (
                  // Real DAAS field columns
                  fieldKeys.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[200px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span>{key.split('.').pop()}</span>
                          <span className="text-[10px] font-mono text-gray-400 normal-case">
                            {key}
                          </span>
                        </div>
                        {hasSelection && (
                          <button
                            onClick={() => handleOpenBulkEdit(key, fieldTypes[key] || 'text')}
                            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                            title={`Edit ${key.split('.').pop()} for selected pages`}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </th>
                  ))
                ) : (
                  // Fallback message for mock pages
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 italic">
                    No DAAS fields available (mock data)
                  </th>
                )}
              </tr>
              
              {/* Filter row */}
              <tr className="bg-gray-100 border-b border-gray-200">
                {/* Checkbox column - empty */}
                <th className="sticky left-0 z-10 bg-gray-100 px-2 py-2 border-r border-gray-200"></th>
                {/* Edit column - empty */}
                <th className="sticky left-10 z-10 bg-gray-100 px-2 py-2 border-r border-gray-200"></th>
                {/* URL filter */}
                <th className="sticky left-22 z-10 bg-gray-100 px-2 py-2 border-r border-gray-200">
                  <input
                    type="text"
                    placeholder="Filter URL..."
                    value={urlFilter}
                    onChange={(e) => setUrlFilter(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </th>
                {hasRealFields ? (
                  // Field filters (skip image fields)
                  fieldKeys.map((key) => (
                    <th key={`filter-${key}`} className="px-2 py-2 border-r border-gray-200">
                      {fieldTypes[key] !== 'image' ? (
                        <input
                          type="text"
                          placeholder={`Filter ${key.split('.').pop()}...`}
                          value={fieldFilters[key] || ''}
                          onChange={(e) => handleFieldFilterChange(key, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      ) : null}
                    </th>
                  ))
                ) : (
                  <th className="px-2 py-2 border-r border-gray-200"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPagesForTemplate.map((page) => {
                const isSelected = state.selectedPages.has(page.id)
                
                const handleEdit = () => {
                  // Use the template-based edit URL if available
                  const editUrl = buildEditUrl(page.templatePath, page.url)
                  
                  if (editUrl) {
                    // Load in iframe instead of new tab
                    setIframeEditUrl(editUrl)
                    setEditingPageUrl(page.url)
                  } else {
                    // Fallback to DA editor for mock pages (open in new tab)
                    const fullPath = page.id.startsWith('/') ? page.id : `${ROOT}${page.url}`
                    window.open(`https://da.live/edit#${fullPath}`, '_blank')
                  }
                }

                return (
                  <tr key={page.id} className={`hover:bg-gray-50 transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}>
                    {/* Checkbox cell */}
                    <td className={`sticky left-0 z-10 px-2 py-3 text-center border-r border-gray-200 ${isSelected ? 'bg-blue-50' : 'bg-white group-hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(page.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {/* Edit cell */}
                    <td className={`sticky left-10 z-10 px-2 py-3 text-center border-r border-gray-200 ${isSelected ? 'bg-blue-50' : 'bg-white group-hover:bg-gray-50'}`}>
                      <button
                        onClick={handleEdit}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        title="Edit in DA"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </td>
                    {/* URL cell */}
                    <td className={`sticky left-22 z-10 px-4 py-3 text-sm font-mono text-gray-900 border-r border-gray-200 ${isSelected ? 'bg-blue-50' : 'bg-white group-hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <span>{page.url}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          page.status === 'Published' ? 'bg-green-100 text-green-700' :
                          page.status === 'Previewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {page.status}
                        </span>
                      </div>
                    </td>
                    {hasRealFields ? (
                      // Real DAAS field values
                      fieldKeys.map((key) => {
                        const field = page.fields?.[key]
                        const value = field?.value || '-'
                        const type = field?.type || 'text'
                        
                        return (
                          <td
                            key={key}
                            className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200"
                          >
                            {type === 'image' ? (
                              <div className="flex items-center justify-center">
                                {value && value !== '-' ? (
                                  <img 
                                    src={value} 
                                    alt={key}
                                    className="w-16 h-16 object-cover rounded border border-gray-200"
                                    onError={(e) => {
                                      // Fallback to placeholder on error
                                      (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="line-clamp-2">{value}</span>
                            )}
                          </td>
                        )
                      })
                    ) : (
                      // Fallback for mock pages
                      <td className="px-4 py-3 text-sm text-gray-400 italic">
                        Mock page - no field data
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredPagesForTemplate.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {hasActiveFilters 
                ? 'No pages match the current filters.' 
                : 'No pages found for this template.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Publish Modal */}
      <PublishModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isPublishing={isProcessing}
        mode={modalMode}
      />
      
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => {
          setShowBulkEditModal(false)
          setEditingFieldKey(null)
        }}
        fieldKey={editingFieldKey || ''}
        fieldType={editingFieldType}
        selectedCount={state.selectedPages.size}
        onSave={handleBulkEditSave}
      />
    </div>
  )
}
