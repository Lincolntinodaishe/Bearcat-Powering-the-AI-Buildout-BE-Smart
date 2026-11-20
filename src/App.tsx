import React from 'react'
import { EventProvider, useEvent } from './context/EventContext'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import AuditLogSheet from './components/AuditLogSheet'
import UtilityView from './pages/UtilityView'
import FacilityView from './pages/FacilityView'
import TechnicianView from './pages/TechnicianView'
import EventView from './pages/EventView'
import CertificatesPage from './pages/CertificatesPage'
import AssumptionsPage from './pages/AssumptionsPage'
import ForecastChart from './components/charts/ForecastChart'
import PageHeader from './components/layout/PageHeader'

const MainContent: React.FC = () => {
  const { persona, activeNav, lockout } = useEvent()

  const getPageTitle = () => {
    if (activeNav === 'forecast') return 'Demand forecast'
    if (activeNav === 'event') return 'Load-shed event'
    if (activeNav === 'certificates') return 'Certificates'
    if (activeNav === 'assumptions') return 'Assumptions'
    if (persona === 'utility') return 'Grid & interconnection'
    if (persona === 'facility') return 'Facility & AI platform'
    return 'Field technician'
  }

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar 220px */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar 64px */}
        <TopBar title={getPageTitle()} />

        {/* Lockout Banner under top bar if lockout.active */}
        {lockout.active && (
          <div className="bg-watch/15 border-b border-watch/30 px-8 py-2 text-[13px] text-ink flex items-center justify-between">
            <div>
              <strong>Crew on Feeder 2B switchgear</strong> — automated switching on this feeder is blocked.
              {lockout.by && (
                <span className="text-ink2 ml-1">
                  (Engaged by {lockout.by} at {lockout.timestamp})
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-watch/20 text-ink">
              Lockout active
            </span>
          </div>
        )}

        {/* Page Content: max 1100px centered, 32px padding */}
        <main className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-8">
          {activeNav === 'overview' && (
            <>
              {persona === 'utility' && <UtilityView />}
              {persona === 'facility' && <FacilityView />}
              {persona === 'technician' && <TechnicianView />}
            </>
          )}

          {activeNav === 'forecast' && (
            <div className="space-y-6">
              <PageHeader
                title="Demand forecast · 24-hour horizon"
                description="LightGBM quantile regression with P05/P50/P95 uncertainty bands."
              />
              <ForecastChart />
            </div>
          )}

          {activeNav === 'event' && <EventView />}
          {activeNav === 'certificates' && <CertificatesPage />}
          {activeNav === 'assumptions' && <AssumptionsPage />}
        </main>

        {/* Audit Log Sheet */}
        <AuditLogSheet />
      </div>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <EventProvider>
      <MainContent />
    </EventProvider>
  )
}
export default App
