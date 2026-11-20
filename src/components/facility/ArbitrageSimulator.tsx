import React, { useState } from 'react'
import SegmentedControl from '../ui/SegmentedControl'
import { formatMoney } from '../../lib/format'

export const ArbitrageSimulator: React.FC = () => {
  const [lmp, setLmp] = useState(182)
  const [duration, setDuration] = useState(2.0)
  const [cap, setCap] = useState<'700' | '450' | '300'>('450')

  // Saved MW: 0 / 3.0 / 4.8
  const savedMw = cap === '700' ? 0 : cap === '450' ? 3.0 : 4.8
  const delayPerHour = cap === '700' ? 0 : cap === '450' ? 5822 : 9963

  // Formulas from section 6.2:
  // avoided = MW * h * LMP
  // delay = from TdpControl
  // DR payment = MW * hours * $150/MWh
  const avoided = Math.round(savedMw * duration * lmp)
  const delay = Math.round(delayPerHour * duration)
  const drPayment = Math.round(savedMw * duration * 150)
  const netValue = avoided + drPayment - delay

  // Break-even price ($/MWh): price where avoided + drPayment = delay
  // MW * h * LMP = delay - (MW * h * 150) -> LMP = (delay / (MW * h)) - 150
  const breakEvenLmp =
    savedMw > 0 && duration > 0
      ? Math.round(Math.max(0, delay / (savedMw * duration) - 150))
      : 0

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">Financial arbitrage simulator</h3>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Real-time price slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-ink2">Real-time price (LMP)</span>
            <span className="font-medium text-ink">${lmp}/MWh</span>
          </div>
          <input
            type="range"
            min="40"
            max="1000"
            step="10"
            value={lmp}
            onChange={(e) => setLmp(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[11px] text-ink3">
            <span>$40</span>
            <span>$182 default</span>
            <span>$1,000</span>
          </div>
        </div>

        {/* Shed duration slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-ink2">Shed duration</span>
            <span className="font-medium text-ink">{duration} h</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[11px] text-ink3">
            <span>0.5 h</span>
            <span>2.0 h</span>
            <span>4.0 h</span>
          </div>
        </div>
      </div>

      {/* Output Rows */}
      <div className="space-y-1.5 pt-2 border-t border-line text-[13px]">
        <div className="flex justify-between text-ink2">
          <span>Electricity cost avoided</span>
          <span className="font-medium text-ink">{formatMoney(avoided)}</span>
        </div>
        <div className="flex justify-between text-ink2">
          <span>DR capacity payment ($150/MWh)</span>
          <span className="font-medium text-ink">{formatMoney(drPayment)}</span>
        </div>
        <div className="flex justify-between text-ink2">
          <span>Training delay cost</span>
          <span className="font-medium text-ink">-{formatMoney(delay)}</span>
        </div>
      </div>

      {/* Net Value Big Callout */}
      <div className="p-3 bg-panel rounded-[10px] flex items-center justify-between border border-line">
        <div>
          <div className="text-[12px] text-ink2 font-medium">Net value</div>
          <div
            className={`text-[22px] font-semibold tracking-tight ${
              netValue >= 0 ? 'text-ok' : 'text-danger'
            }`}
          >
            {formatMoney(netValue)}
          </div>
        </div>
        <div className="text-right text-[12px] text-ink2">
          Break-even price: <span className="font-semibold text-ink">${breakEvenLmp}/MWh</span>
        </div>
      </div>
    </div>
  )
}
export default ArbitrageSimulator
