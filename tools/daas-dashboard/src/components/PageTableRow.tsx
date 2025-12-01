import type { PageData } from '../types'
import StatusBadge from './StatusBadge'

interface PageTableRowProps {
  page: PageData
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (id: string) => void
}

export default function PageTableRow({ 
  page, 
  isSelected, 
  onToggleSelect,
  onEdit 
}: PageTableRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(page.id)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
        {page.url}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {page.template}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {page.lastUpdate}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {page.generated}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={page.status} />
      </td>
      <td className="px-4 py-3">
        <button 
          onClick={() => onEdit(page.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
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
    </tr>
  )
}

