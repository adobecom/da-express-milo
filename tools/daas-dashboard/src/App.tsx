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
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
        {/* Inner ring */}
        <div className="absolute top-2 left-2 w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 pulse-glow"></div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm font-medium gradient-text text-lg">Loading pages...</p>
        <p className="text-xs text-gray-400 mt-1">Fetching data from DA.live</p>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { state, isLoading } = useDashboard()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Hero Header with Gradient */}
        <div className="mb-8 animate-slide-in-down">
          <div className="glass rounded-2xl p-8 hover-lift shadow-lg border-2 border-white/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">
                  Document Authoring @ Scale
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Powered by DA.live • Real-time Collaboration
                </p>
              </div>
              
              {/* Stats badges */}
              <div className="flex gap-4">
                <div className="glass rounded-xl px-4 py-3 text-center hover-scale">
                  <div className="text-2xl font-bold gradient-text">
                    {state.viewMode === 'table' ? '📊' : '🎯'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {state.viewMode === 'table' ? 'Table' : 'Edit'} Mode
                  </div>
                </div>
                
                {state.selectedPages.size > 0 && (
                  <div className="glass rounded-xl px-4 py-3 text-center hover-scale animate-fade-in-scale">
                    <div className="text-2xl font-bold text-blue-600">
                      {state.selectedPages.size}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Selected
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : state.viewMode === 'table' ? (
          <div className="animate-fade-in">
            <div className="mb-4">
              <ActionButtons />
            </div>

            <PageTable />

            <div className="mt-4">
              <ResultsSummary />
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <BirdsEyeView />
          </div>
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
