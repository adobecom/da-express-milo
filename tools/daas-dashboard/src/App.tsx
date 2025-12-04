import { DashboardProvider } from './context/DashboardContext'
import { useDashboard } from './hooks/useDashboard'
import {
  ActionButtons,
  BirdsEyeView,
  PageTable,
  ResultsSummary
} from './components'
import './App.css'

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
      </div>
      <p className="mt-4 text-sm text-gray-500">Loading pages...</p>
    </div>
  )
}

function DashboardContent() {
  const { state, isLoading } = useDashboard()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Document Authoring @ Scale
        </h1>

        {isLoading ? (
          <LoadingSpinner />
        ) : state.viewMode === 'table' ? (
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
