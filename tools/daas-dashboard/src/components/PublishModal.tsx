import { createPortal } from 'react-dom'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  isPublishing: boolean
  mode?: 'publish' | 'unpublish'
}

export default function PublishModal({ isOpen, onClose, isPublishing, mode = 'publish' }: PublishModalProps) {
  if (!isOpen) return null

  const isUnpublish = mode === 'unpublish'
  const actioningLabel = isUnpublish ? 'Unpublishing...' : 'Publishing...'
  const doneLabel = isUnpublish ? 'Unpublish Complete' : 'Publish Complete'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isPublishing ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isPublishing ? actioningLabel : doneLabel}
          </h2>
          {!isPublishing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {isPublishing ? (
            <div className="flex flex-col items-center justify-center">
              <div className={`w-12 h-12 border-4 ${isUnpublish ? 'border-red-200 border-t-red-600' : 'border-blue-200 border-t-blue-600'} rounded-full animate-spin mb-4`}></div>
              <p className="text-gray-600">Please wait...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className={`w-12 h-12 ${isUnpublish ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center mb-4`}>
                <svg className={`w-6 h-6 ${isUnpublish ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">Operation completed successfully.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isPublishing && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
