import { useDashboard } from '../hooks/useDashboard'
import ViewModeToggle from './ViewModeToggle'
import SearchBar from './SearchBar'

export default function FilterBar() {
  const { state } = useDashboard()
  
  const placeholder = state.viewMode === 'urls' 
    ? 'Search by page path...' 
    : 'Search by template name...'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <ViewModeToggle />
        <SearchBar placeholder={placeholder} />
      </div>
    </div>
  )
}

