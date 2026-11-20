import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts'
import { api } from '../../lib/api'
import type { Forecast } from '../../lib/types'
import { formatTime } from '../../lib/format'

export const ForecastChart: React.FC = () => {
  const [forecast, setForecast] = useState<Forecast | null>(null)

  useEffect(() => {
    api.forecast().then((data) => setForecast(data))
  }, [])

  if (!forecast) {
    return <div className="h-[320px] bg-panel rounded-card animate-pulse" />
  }

  // Calculate dynamic 2h peak window around peak.t (default 16:15 -> 15:15 to 17:15)
  const peakTime = forecast.peak.t // e.g. "2026-11-20T16:15:00"
  const peakDate = new Date(peakTime)
  const windowStart = new Date(peakDate.getTime() - 60 * 60 * 1000)
  const windowEnd = new Date(peakDate.getTime() + 60 * 60 * 1000)

  const formatShortTime = (iso: string) => {
    const d = new Date(iso)
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const startStr = formatShortTime(windowStart.toISOString())
  const endStr = formatShortTime(windowEnd.toISOString())

  const chartData = forecast.points.map((p) => ({
    ...p,
    timeLabel: formatShortTime(p.t),
  }))

  return (
    <div className="bg-white border border-line rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Demand forecast · next 24 h</h2>
          <p className="text-[13px] text-ink2 mt-0.5">
            Model: {forecast.model.name} · MAE {forecast.model.mae_mw} MW (vs {forecast.model.benchmark_mae_mw} MW {forecast.model.benchmark})
          </p>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            {/* Faint grey horizontal grid only, no vertical grid */}
            <CartesianGrid stroke="#F0F0F2" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#A1A1A6"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6E6E73' }}
              interval={7}
            />
            <YAxis
              stroke="#A1A1A6"
              tickLine={false}
              axisLine={false}
              domain={[32, 48]}
              tick={{ fontSize: 12, fill: '#6E6E73' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload
                  return (
                    <div className="bg-white border border-line rounded-[8px] p-2.5 text-[13px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-1">
                      <div className="text-ink2 font-medium">{d.timeLabel}</div>
                      <div className="text-accent font-semibold">P50 Baseline: {d.p50} MW</div>
                      <div className="text-ink3 text-[12px]">P05–P95 Band: {d.p05} – {d.p95} MW</div>
                      <div className="text-ink3 text-[12px]">Ambient: {d.temp_f}°F</div>
                    </div>
                  )
                }
                return null
              }}
            />

            {/* Peak Window Computed from peak.t */}
            <ReferenceArea
              x1={startStr}
              x2={endStr}
              fill="#FF9F0A"
              fillOpacity={0.08}
              label={{ value: 'Peak window', position: 'insideTopLeft', fill: '#6E6E73', fontSize: 11 }}
            />

            {/* Forecast Band between p05 and p95 */}
            <Area
              type="monotone"
              dataKey="p95"
              stroke="none"
              fill="#0A84FF"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="p05"
              stroke="none"
              fill="#FFFFFF"
              fillOpacity={1}
              isAnimationActive={false}
            />

            {/* P50 Baseline */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#0A84FF"
              strokeWidth={1.5}
              dot={false}
              name="P50 Baseline"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-[13px] text-ink2 pt-3 border-t border-line flex items-center justify-between">
        <span>Band = P05–P95 · Line = P50, also used as the verification baseline</span>
        <span className="text-ink3">Peak {forecast.peak.p50} MW @ {formatTime(forecast.peak.t)}</span>
      </div>
    </div>
  )
}
export default ForecastChart
