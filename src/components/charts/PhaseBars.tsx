import React from 'react'

interface PhaseBarsProps {
  phases: { a_mw: number; b_mw: number; c_mw: number }
}

export const PhaseBars: React.FC<PhaseBarsProps> = ({ phases }) => {
  const avg = (phases.a_mw + phases.b_mw + phases.c_mw) / 3
  const maxDiff = Math.max(
    Math.abs(phases.a_mw - avg),
    Math.abs(phases.b_mw - avg),
    Math.abs(phases.c_mw - avg)
  )
  const imbalancePct = avg > 0 ? (maxDiff / avg) * 100 : 0
  const isHighImbalance = imbalancePct > 5.0

  const items = [
    { name: 'Phase A', mw: phases.a_mw },
    { name: 'Phase B', mw: phases.b_mw },
    { name: 'Phase C', mw: phases.c_mw },
  ]

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">3-phase balance</h3>
        <span
          className={`text-[12px] font-medium px-2 py-0.5 rounded-[6px] ${
            isHighImbalance ? 'bg-watch/10 text-watch' : 'bg-panel text-ink2'
          }`}
        >
          {imbalancePct.toFixed(1)}% imbalance {isHighImbalance ? '(Warning > 5%)' : ''}
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {items.map((it) => {
          // Normalize to a max bar range of 20 MW
          const pct = Math.min(100, (it.mw / 20) * 100)
          return (
            <div key={it.name} className="space-y-1">
              <div className="flex justify-between text-[13px]">
                <span className="text-ink2">{it.name}</span>
                <span className="font-medium text-ink">{it.mw.toFixed(1)} MW</span>
              </div>
              <div className="w-full bg-panel h-2 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full ${isHighImbalance ? 'bg-watch' : 'bg-accent'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default PhaseBars
