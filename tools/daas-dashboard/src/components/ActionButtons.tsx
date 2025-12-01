import { useDashboard } from '../hooks/useDashboard'

export default function ActionButtons() {
  const { state } = useDashboard()
  const hasSelection = state.selectedPages.size > 0

  const handleBirdsEyeView = () => console.log('Bird\'s Eye View clicked')
  const handleEdit = () => console.log('Edit clicked', Array.from(state.selectedPages))
  const handlePreview = () => console.log('Preview clicked', Array.from(state.selectedPages))
  const handlePublish = () => console.log('Publish clicked', Array.from(state.selectedPages))
  const handleDelete = () => console.log('Delete clicked', Array.from(state.selectedPages))

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleBirdsEyeView}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Bird's Eye View
      </button>
      <button 
        onClick={handleEdit}
        disabled={!hasSelection}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Edit
      </button>
      <button 
        onClick={handlePreview}
        disabled={!hasSelection}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Preview
      </button>
      <button 
        onClick={handlePublish}
        disabled={!hasSelection}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Publish
      </button>
      <button 
        onClick={handleDelete}
        disabled={!hasSelection}
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Delete
      </button>
    </div>
  )
}

