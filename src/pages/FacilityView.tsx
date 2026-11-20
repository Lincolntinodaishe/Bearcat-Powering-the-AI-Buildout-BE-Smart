import React from 'react'
import PageHeader from '../components/layout/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import PowerStackChart from '../components/charts/PowerStackChart'
import TdpControl from '../components/facility/TdpControl'
import ArbitrageSimulator from '../components/facility/ArbitrageSimulator'
import CheckpointPanel from '../components/facility/CheckpointPanel'

export const FacilityView: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility and AI platform"
        description="Telemetry across 29,000 GPUs, burst-buffer micro-checkpointing, and arbitrage economics."
      />

      {/* Row 1 — 4 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Site load"
          value="44.4 MW"
          context="IT 37.0 · cooling 7.4"
        />
        <MetricCard
          label="GPUs active"
          value="29,000"
          context="16k inference · 10k training · 3k batch"
        />
        <MetricCard
          label="Training throughput"
          value="100%"
          context="at 700 W base TDP"
        />
        <MetricCard
          label="Battery storage"
          value="90%"
          context="18 MWh (40% reserved)"
        />
      </div>

      {/* Row 2 — PowerStackChart */}
      <PowerStackChart />

      {/* Row 3 — TdpControl + ArbitrageSimulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TdpControl />
        <ArbitrageSimulator />
      </div>

      {/* Row 4 — CheckpointPanel */}
      <CheckpointPanel />
    </div>
  )
}
export default FacilityView
