import React from 'react'

interface ExtensionBannerProps {
  onApprove: () => void
  onReject: () => void
}

export const ExtensionBanner: React.FC<ExtensionBannerProps> = ({
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-white border-2 border-watch rounded-card p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div>
        <div className="text-[11px] uppercase font-bold text-watch tracking-wider">
          Grid extension notice
        </div>
        <h4 className="text-[17px] font-semibold text-ink mt-0.5">
          MLGW extended the event by 30 minutes
        </h4>
        <p className="text-[13px] text-ink2 mt-1">
          Storage and battery now cover 14.8 MW — short 0.2 MW.
        </p>
      </div>

      <div className="p-3 bg-panel rounded-[10px] border border-line text-[13px] space-y-1">
        <div className="font-medium text-ink">Proposal: Deepen training cap 450 → 300 W</div>
        <p className="text-ink2 text-[12px]">
          Adds 1.8 MW at meter · cost $2,071 · training slows ~40% for the final 30 min; no jobs stopped.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition"
        >
          Approve deeper cap
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-white border border-line hover:bg-panel text-ink rounded-[8px] text-[13px] font-medium transition"
        >
          Reject proposal
        </button>
      </div>
    </div>
  )
}
export default ExtensionBanner
