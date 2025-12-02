import { useDashboard } from '../hooks/useDashboard'
import { getTemplateFields, getPageFieldValues } from '../data/templateFields'

export default function BirdsEyeView() {
  const { state, dispatch, filteredPages } = useDashboard()

  // Get the template we're viewing (use filter or first page's template)
  const selectedTemplate = state.templateFilter || filteredPages[0]?.template

  const handleBackToTable = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'table' })
  }

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

  const fields = getTemplateFields(selectedTemplate)
  const pagesForTemplate = filteredPages.filter(p => p.template === selectedTemplate)

  if (fields.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500 mb-4">No field definitions for template: {selectedTemplate}</p>
        <button
          onClick={handleBackToTable}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Back to Table View
        </button>
      </div>
    )
  }

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
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[250px]">
                  URL
                </th>
                {fields.map((field) => (
                  <th
                    key={field.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200 min-w-[200px]"
                  >
                    <div className="flex flex-col">
                      <span>{field.label}</span>
                      <span className="text-[10px] font-mono text-gray-400 normal-case">
                        [[{field.key}]]
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagesForTemplate.map((page) => {
                const fieldValues = getPageFieldValues(page.id)
                
                return (
                  <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-mono text-gray-900 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <a 
                          href={page.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {page.url}
                        </a>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          page.status === 'Published' ? 'bg-green-100 text-green-700' :
                          page.status === 'Previewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {page.status}
                        </span>
                      </div>
                    </td>
                    {fields.map((field) => {
                      const value = fieldValues[field.key] || '-'
                      
                      return (
                        <td
                          key={field.key}
                          className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200"
                        >
                          {field.type === 'image' ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs text-gray-500">Image placeholder</span>
                            </div>
                          ) : field.type === 'longtext' ? (
                            <div className="max-w-md">
                              <p className="line-clamp-3 text-sm">{value}</p>
                            </div>
                          ) : (
                            <span>{value}</span>
                          )}
                        </td>
                      )
                    })}
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

