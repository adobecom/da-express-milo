import { DashboardProvider } from './context/DashboardContext'
import { useDashboard } from './hooks/useDashboard'
import {
  ActionButtons,
  BirdsEyeView,
  PageTable,
  ResultsSummary
} from './components'
import './App.css'

function DashboardContent() {
  const { state, dispatch } = useDashboard()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Authoring @ Scale
          </h1>
          
          {/* View Toggle */}
          <div className="flex bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'table' })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                state.viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'birds-eye' })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                state.viewMode === 'birds-eye'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bird's Eye View
            </button>
          </div>
        </div>

        {state.viewMode === 'table' ? (
          <>
            <div className="mb-4">
              <ActionButtons />
            </div>

            <PageTable />

            <div className="mt-4">
              <ResultsSummary />
            </div>
          </>
        ) : (
          <BirdsEyeView />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}

export default App
