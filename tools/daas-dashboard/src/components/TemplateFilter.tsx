import { useDashboard } from '../hooks/useDashboard'

export default function TemplateFilter() {
  const { state, dispatch, filteredTemplates } = useDashboard()

  const handleTemplateClick = (template: string) => {
    const newValue = state.selectedTemplate === template ? null : template
    dispatch({ type: 'SET_SELECTED_TEMPLATE', payload: newValue })
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        No templates match your search
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filteredTemplates.map((template) => (
        <button
          key={template}
          onClick={() => handleTemplateClick(template)}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            state.selectedTemplate === template
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:text-blue-600'
          }`}
        >
          {template}
        </button>
      ))}
    </div>
  )
}

