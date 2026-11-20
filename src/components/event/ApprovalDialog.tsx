import React from 'react'
import type { Plan } from '../../lib/types'
import { formatMw, formatMoney } from '../../lib/format'

interface ApprovalDialogProps {
  plan: Plan
  onApprove: () => void
  onReject: () => void
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  plan,
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-panel border border-line rounded-card p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div>
        <h4 className="text-[17px] font-semibold text-ink">Approve dispatch plan</h4>
        <p className="text-[13px] text-ink2 mt-0.5">
          Commit {formatMw(plan.target_mw)} for {plan.duration_h} h · cost {formatMoney(plan.cost_usd)} · inference protected
        </p>
      </div>

      <div className="p-3.5 bg-white rounded-[10px] border border-line space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-ink2">Target reduction</span>
          <span className="font-medium text-ink">{formatMw(plan.target_mw)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink2">Operational cost</span>
          <span className="text-ink">{formatMoney(plan.cost_usd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink2">Avoided peak demand charge</span>
          <span className="font-semibold text-ok">{formatMoney(plan.value_usd.demand_charge_avoided_per_month)} / month</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink2">Inference workloads</span>
          <span className="font-medium text-ink">0 MW touched (Protected)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition"
        >
          Approve plan
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-white border border-line hover:bg-panel text-ink rounded-[8px] text-[13px] font-medium transition"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
export default ApprovalDialog
