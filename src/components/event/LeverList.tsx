import React from 'react'
import type { Plan } from '../../lib/types'
import { formatMw, formatMoney } from '../../lib/format'

interface LeverListProps {
  plan: Plan
  currentStep: number
}

export const LeverList: React.FC<LeverListProps> = ({ plan, currentStep }) => {
  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[17px] font-semibold text-ink">Dispatched levers</h3>
          <p className="text-[12px] text-ink2 mt-0.5">All MW values measured at the substation meter</p>
        </div>
        <span className="text-[13px] font-medium text-ink bg-panel px-2.5 py-1 rounded-[6px] border border-line">
          Total {formatMw(plan.total_mw)}
        </span>
      </div>

      <div className="divide-y divide-line">
        {plan.levers.map((lever) => {
          let statusText = 'Scheduled'
          let statusColor = 'text-ink2 bg-panel'

          if (lever.blocked) {
            statusText = 'Blocked — crew lockout'
            statusColor = 'text-danger bg-danger/10'
          } else if (currentStep >= 6) {
            statusText = 'Delivering'
            statusColor = 'text-ok bg-ok/10'
          } else if (lever.id === 'tdp' && currentStep >= 4) {
            statusText = 'Active'
            statusColor = 'text-accent bg-accent/10'
          } else if (lever.id === 'batch' && currentStep >= 5) {
            statusText = 'Active'
            statusColor = 'text-accent bg-accent/10'
          } else if (currentStep >= 3) {
            statusText = 'Staging'
            statusColor = 'text-watch bg-watch/10'
          }

          return (
            <div key={lever.id} className="py-3 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-ink">{lever.name}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
                <p className="text-[12px] text-ink2">{lever.note}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-[14px] font-semibold text-ink">{formatMw(lever.mw)}</div>
                <div className="text-[11px] text-ink3">{formatMoney(lever.cost_usd)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Protected tier line */}
      <div className="pt-3 border-t border-line text-[12px] text-ink2 flex items-center justify-between">
        <span>Protected workloads</span>
        <span className="font-medium text-ink">Inference (16,000 GPUs) · 20.4 MW untouched</span>
      </div>
    </div>
  )
}
export default LeverList
