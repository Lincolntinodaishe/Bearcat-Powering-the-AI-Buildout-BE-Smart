import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { LayoutDashboard, Users, Zap, Database } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import CrewOrchestrator from './pages/CrewOrchestrator'
import GridSimulator from './pages/GridSimulator'
import DataSources from './pages/DataSources'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        {/* Navigation Bar */}
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black tracking-wider text-white shadow-inner">
                  GS
                </div>
                <div>
                  <div className="font-bold text-base tracking-tight flex items-center gap-2">
                    GridSync Ops
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Bearcat AI Buildout
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Powering the AI Infrastructure Wave</div>
                </div>
              </div>

              <nav className="flex space-x-1 sm:space-x-2">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Executive Dashboard</span>
                </NavLink>

                <NavLink
                  to="/crew"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Crew Orchestrator</span>
                </NavLink>

                <NavLink
                  to="/grid"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid Simulator</span>
                </NavLink>

                <NavLink
                  to="/data"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">Data Sources</span>
                </NavLink>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crew" element={<CrewOrchestrator />} />
            <Route path="/grid" element={<GridSimulator />} />
            <Route path="/data" element={<DataSources />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          Bearcat — Powering the AI Buildout (BE Smart) • Hackathon Foundation
        </footer>
      </div>
    </BrowserRouter>
  )
}
export default App
