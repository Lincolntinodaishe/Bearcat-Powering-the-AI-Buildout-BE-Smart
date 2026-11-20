import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface EventChartProps {
  data: { minute: string; requested: number; plan: number; delivered: number }[]
}

export const EventChart: React.FC<EventChartProps> = ({ data }) => {
  return (
    <div className="bg-white border border-line rounded-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-ink">Delivered telemetry vs commitment</h3>
        <div className="flex items-center gap-4 text-[12px] text-ink2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-watch inline-block"></span> Requested (15 MW)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-accent inline-block"></span> Plan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-ok inline-block"></span> Delivered
          </span>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="#F0F0F2" vertical={false} />
            <XAxis
              dataKey="minute"
              stroke="#A1A1A6"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6E6E73' }}
            />
            <YAxis
              stroke="#A1A1A6"
              tickLine={false}
              axisLine={false}
              domain={[0, 18]}
              tick={{ fontSize: 12, fill: '#6E6E73' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-line rounded-[8px] p-2 text-[12px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-0.5">
                      <div className="text-ink2 font-medium">{label}</div>
                      {payload.map((p, i) => (
                        <div key={i} className="flex justify-between gap-3">
                          <span style={{ color: p.color }}>{p.name}:</span>
                          <span className="font-semibold text-ink">{p.value} MW</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            {/* Requested Target: orange dashed */}
            <Line
              type="monotone"
              dataKey="requested"
              stroke="#FF9F0A"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              dot={false}
              name="Requested"
              isAnimationActive={false}
            />
            {/* Plan Baseline: blue 1.5px */}
            <Line
              type="stepAfter"
              dataKey="plan"
              stroke="#0A84FF"
              strokeWidth={1.5}
              dot={false}
              name="Plan"
              isAnimationActive={false}
            />
            {/* Delivered: green 2px line */}
            <Line
              type="monotone"
              dataKey="delivered"
              stroke="#34C759"
              strokeWidth={2}
              dot={false}
              name="Delivered"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
export default EventChart
