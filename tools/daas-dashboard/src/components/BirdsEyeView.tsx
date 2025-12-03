import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { ROOT } from '../utils'

export default function BirdsEyeView() {
  const { state, dispatch, filteredPages } = useDashboard()

  // Get the template we're viewing (use filter or first page's template)
  const selectedTemplate = state.templateFilter || filteredPages[0]?.template

  const handleBackToTable = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'table' })
    dispatch({ type: 'SET_TEMPLATE_FILTER', payload: null })
  }

  const pagesForTemplate = filteredPages.filter(p => p.template === selectedTemplate)

  // Derive unique field keys from all pages of this template
  const fieldKeys = useMemo(() => {
    const keys = new Set<string>()
    pagesForTemplate.forEach(page => {
      if (page.fields) {
        Object.keys(page.fields).forEach(key => keys.add(key))
      }
    })
    return Array.from(keys).sort()
  }, [pagesForTemplate])

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

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
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
            <h2 className="text-lg font-bold text-gray-900">Bird's Eye View</h2>
            <p className="text-sm text-gray-500">
              {selectedTemplate} • {pagesForTemplate.length} {pagesForTemplate.length === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>View-only mode</span>
        </div>
      </div>

      {/* Spreadsheet View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-10 bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 w-12">
                  Edit
                </th>
                <th className="sticky left-12 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[250px]">
                  URL
                </th>
                {hasRealFields ? (
                  // Real DAAS field columns
                  fieldKeys.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[200px]"
                    >
                      <div className="flex flex-col">
                        <span>{key.split('.').pop()}</span>
                        <span className="text-[10px] font-mono text-gray-400 normal-case">
                          {key}
                        </span>
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
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagesForTemplate.map((page) => {
                const handleEdit = () => {
                  // For real DAAS pages, id is the full path
                  // For mock pages, id is just a number so we construct the path
                  const fullPath = page.id.startsWith('/') ? page.id : `${ROOT}${page.url}`
                  window.open(`https://da.live/edit#${fullPath}`, '_blank')
                }

                return (
                  <tr key={page.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-2 py-3 text-center border-r border-gray-200">
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
                    <td className="sticky left-12 z-10 bg-white group-hover:bg-gray-50 px-4 py-3 text-sm font-mono text-gray-900 border-r border-gray-200">
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
        {pagesForTemplate.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No pages found for this template.</p>
          </div>
        )}
      </div>
    </div>
  )
}
