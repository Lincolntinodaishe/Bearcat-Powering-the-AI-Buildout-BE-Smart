import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatMw, formatTime } from '../lib/format'
import type { Forecast, Plan } from '../lib/types'
import { useEvent } from '../context/EventContext'
import PageHeader from '../components/layout/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import ForecastChart from '../components/charts/ForecastChart'
import DispatchCard from '../components/utility/DispatchCard'
import LedgerTable from '../components/utility/LedgerTable'

export const UtilityView: React.FC = () => {
  const { site } = useEvent()
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [capacity, setCapacity] = useState<Plan | null>(null)

  useEffect(() => {
    api.forecast().then(setForecast)
    // Max safe shed for 2 h: ask for more than the levers can give, read back what they give
    api.dispatch({ target_mw: 30, duration_h: 2, warning_min: 20, max_tdp_w: 450, allow_batch_drain: true, lockout_feeders: [] })
      .then(setCapacity)
  }, [])

  const dash = '—'
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
          value={site ? formatMw(site.substation.headroom_mw) : dash}
          context={site ? `of ${site.substation.capacity_mw} MW capacity` : ''}
        />
        <MetricCard
          label="Forecast peak today"
          value={forecast ? formatMw(forecast.peak.p50) : dash}
          context={forecast ? `at ${formatTime(forecast.peak.t)}` : ''}
        />
        <MetricCard
          label="Safe shed capacity"
          value={capacity ? formatMw(capacity.total_mw) : dash}
          context="for 2 h at 450 W cap · inference protected"
        />
        <MetricCard
          label="Forecast error"
          value={forecast ? `${forecast.model.mae_mw.toFixed(2)} MW` : dash}
          context={forecast ? `vs ${forecast.model.benchmark_mae_mw.toFixed(2)} MW last-week benchmark` : ''}
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
