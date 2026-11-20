import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const stackData = [
  { t: '00:00', inference: 20.4, training: 12.75, batch: 3.83, cooling: 7.4, battery: 0 },
  { t: '04:00', inference: 20.4, training: 12.75, batch: 3.83, cooling: 7.1, battery: 0 },
  { t: '08:00', inference: 20.4, training: 12.75, batch: 3.83, cooling: 7.3, battery: 0 },
  { t: '12:00', inference: 20.4, training: 12.75, batch: 3.83, cooling: 7.8, battery: 0 },
  { t: '16:00', inference: 20.4, training: 9.75, batch: 0.83, cooling: 5.4, battery: -4.0 }, // During event
  { t: '20:00', inference: 20.4, training: 12.75, batch: 3.83, cooling: 7.4, battery: 0 },
]

export const PowerStackChart: React.FC = () => {
  return (
    <div className="bg-white border border-line rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Power stack · next 24 h</h2>
          <p className="text-[13px] text-ink2 mt-0.5">
            Granular facility allocation. Inference is strictly protected from curtailment.
          </p>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stackData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="#F0F0F2" vertical={false} />
            <XAxis
              dataKey="t"
              stroke="#A1A1A6"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6E6E73' }}
            />
            <YAxis
              stroke="#A1A1A6"
              tickLine={false}
              axisLine={false}
              domain={[-5, 50]}
              tick={{ fontSize: 12, fill: '#6E6E73' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-line rounded-[8px] p-2.5 text-[13px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-1">
                      <div className="text-ink2 font-medium">{label}</div>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex justify-between gap-4 text-[12px]">
                          <span style={{ color: entry.color }}>{entry.name}:</span>
                          <span className="font-medium text-ink">{entry.value} MW</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area type="monotone" dataKey="inference" stackId="1" stroke="#A1A1A6" fill="#E5E5EA" name="Inference (Protected)" />
            <Area type="monotone" dataKey="training" stackId="1" stroke="#0A84FF" fill="#0A84FF" fillOpacity={0.25} name="Training" />
            <Area type="monotone" dataKey="batch" stackId="1" stroke="#0A84FF" fill="#0A84FF" fillOpacity={0.12} name="Batch (Slurm)" />
            <Area type="monotone" dataKey="cooling" stackId="1" stroke="#E5E5EA" fill="#F7F7F8" name="Cooling" />
            <Area type="monotone" dataKey="battery" stroke="#34C759" fill="#34C759" fillOpacity={0.2} name="Battery discharge" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below, plain text */}
      <div className="mt-3 flex flex-wrap items-center gap-5 text-[13px] text-ink2 pt-3 border-t border-line">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#A1A1A6] rounded-xs inline-block"></span> Inference (Protected)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#0A84FF] rounded-xs inline-block"></span> Training</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#0A84FF]/40 rounded-xs inline-block"></span> Batch (Slurm)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#E5E5EA] rounded-xs inline-block"></span> Cooling</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#34C759] rounded-xs inline-block"></span> Battery discharge</span>
      </div>
    </div>
  )
}
export default PowerStackChart
