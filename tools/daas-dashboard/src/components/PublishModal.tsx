import { createPortal } from 'react-dom'
import type { PublishResult } from '../api/daApi'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  results: PublishResult[]
  isPublishing: boolean
  mode?: 'publish' | 'unpublish'
}

export default function PublishModal({ isOpen, onClose, results, isPublishing, mode = 'publish' }: PublishModalProps) {
  if (!isOpen) return null

  const succeeded = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  const isUnpublish = mode === 'unpublish'
  const actionLabel = isUnpublish ? 'Unpublish' : 'Publish'
  const actionLabelLower = isUnpublish ? 'unpublished' : 'published'
  const actioningLabel = isUnpublish ? 'Unpublishing...' : 'Publishing...'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isPublishing ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isPublishing ? actioningLabel : `${actionLabel} Results`}
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
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {isPublishing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className={`w-12 h-12 border-4 ${isUnpublish ? 'border-red-200 border-t-red-600' : 'border-blue-200 border-t-blue-600'} rounded-full animate-spin mb-4`}></div>
              <p className="text-gray-600">{actioningLabel.replace('...', '')} pages...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {succeeded.length > 0 && (
                    <span className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {succeeded.length} {actionLabelLower}
                    </span>
                  )}
                  {failed.length > 0 && (
                    <span className="flex items-center gap-2 text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {failed.length} failed
                    </span>
                  )}
                </div>
              </div>

              {/* Success List */}
              {succeeded.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {isUnpublish ? 'Unpublished Pages' : 'Published URLs'}
                  </h3>
                  <div className="space-y-2">
                    {succeeded.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                        {isUnpublish ? (
                          <span className="text-sm font-mono text-gray-700 flex-1 truncate">
                            {result.url}
                          </span>
                        ) : (
                          <>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline flex-1 truncate"
                            >
                              {result.url}
                            </a>
                            <button
                              onClick={() => navigator.clipboard.writeText(result.url)}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                              title="Copy URL"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                              title="Open in new tab"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed List */}
              {failed.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Failed to {actionLabel}
                  </h3>
                  <div className="space-y-2">
                    {failed.map((result, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-mono text-gray-700 truncate">{result.path}</p>
                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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

