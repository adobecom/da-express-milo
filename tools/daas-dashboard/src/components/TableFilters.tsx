import { useDashboard } from '../hooks/useDashboard'

export default function TableFilters() {
  const { state, dispatch, allTemplates, allStatuses } = useDashboard()

  return (
    <tr className="bg-gray-50">
      {/* Checkbox column - no filter */}
      <th className="px-4 py-2"></th>
      
      {/* Empty column - no filter */}
      <th className="px-4 py-2"></th>
      
      {/* URL Filter */}
      <th className="px-4 py-2">
        <input
          type="text"
          placeholder="Filter URLs..."
          value={state.urlFilter}
          onChange={(e) => dispatch({ type: 'SET_URL_FILTER', payload: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </th>
      
      {/* Template Filter */}
      <th className="px-4 py-2">
        <select
          value={state.templateFilter || ''}
          onChange={(e) => dispatch({ 
            type: 'SET_TEMPLATE_FILTER', 
            payload: e.target.value || null 
          })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">All</option>
          {allTemplates.map((template) => (
            <option key={template} value={template}>
              {template}
            </option>
          ))}
        </select>
      </th>
      
      {/* Last Update - no filter */}
      <th className="px-4 py-2"></th>
      
      {/* Generated - no filter */}
      <th className="px-4 py-2"></th>
      
      {/* Status Filter */}
      <th className="px-4 py-2">
        <select
          value={state.statusFilter || ''}
          onChange={(e) => dispatch({ 
            type: 'SET_STATUS_FILTER', 
            payload: (e.target.value || null) as any
          })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">All</option>
          {allStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </th>
      
      {/* Actions column - no filter */}
      <th className="px-4 py-2"></th>
    </tr>
  )
}

