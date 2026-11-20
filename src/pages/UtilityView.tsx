import React from 'react'
import PageHeader from '../components/layout/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import ForecastChart from '../components/charts/ForecastChart'
import DispatchCard from '../components/utility/DispatchCard'
import LedgerTable from '../components/utility/LedgerTable'

export const UtilityView: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Grid and interconnection"
        description="Substation capacity, OpenADR 2.0b dispatch triggers, and counterfactual settlement."
      />

      {/* Row 1 — 4 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Substation headroom"
          value="11.6 MW"
          context="of 56 MW capacity"
        />
        <MetricCard
          label="Forecast peak today"
          value="44.2 MW"
          context="at 4:15 PM"
        />
        <MetricCard
          label="Safe shed at P95"
          value="15.4 MW"
          context="for 2 h · inference protected"
        />
        <MetricCard
          label="Forecast error"
          value="0.42 MW"
          context="vs 1.31 MW last-week benchmark"
        />
      </div>

      {/* Row 2 — ForecastChart */}
      <ForecastChart />

      {/* Row 3 — Two cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DispatchCard />
        <LedgerTable />
      </div>
    </div>
  )
}
export default UtilityView
