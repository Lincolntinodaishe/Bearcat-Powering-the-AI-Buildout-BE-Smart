import React, { useState } from 'react'
import SegmentedControl from '../ui/SegmentedControl'
import { formatMw, formatMoney } from '../../lib/format'

export const TdpControl: React.FC = () => {
  const [cap, setCap] = useState<'700' | '450' | '300'>('700')

  // Exact math from section 6.2
  // Saved at meter: 0 / 3.0 / 4.8 MW
  // Slowdown: 0% / 23% / 40% (= 1 - (cap/700)^0.6)
  // Cost per hour: $0 / $5,822 / $9,963 (slowdown * 10,000 * $2.50)
  const savedMw = cap === '700' ? 0.0 : cap === '450' ? 3.0 : 4.8
  const slowdownPct = cap === '700' ? 0 : cap === '450' ? 23 : 40
  const costPerHour = cap === '700' ? 0 : cap === '450' ? 5822 : 9963

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">GPU TDP capping control</h3>
        <SegmentedControl
          size="sm"
          options={[
            { value: '700', label: '700 W' },
            { value: '450', label: '450 W' },
            { value: '300', label: '300 W' },
          ]}
          value={cap}
          onChange={setCap}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Saved at the meter</div>
          <div className="text-[20px] font-semibold text-ink mt-0.5">{formatMw(savedMw)}</div>
          <div className="text-[11px] text-ink3">IT saving × 1.2</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Training slowdown</div>
          <div className="text-[20px] font-semibold text-ink mt-0.5">{slowdownPct}%</div>
          <div className="text-[11px] text-ink3">throughput ∝ power^0.6</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Cost per hour</div>
          <div className="text-[20px] font-semibold text-ink mt-0.5">{formatMoney(costPerHour)}</div>
          <div className="text-[11px] text-ink3">10k GPUs × $2.50/h</div>
        </div>
      </div>

      <div className="pt-2 text-[12px] text-ink2 border-t border-line">
        Inference GPUs are never capped.
      </div>
    </div>
  )
}
export default TdpControl
