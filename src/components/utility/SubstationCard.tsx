import React from 'react'
import type { Site } from '../../lib/types'
import { formatMw } from '../../lib/format'

interface SubstationCardProps {
  site: Site
}

export const SubstationCard: React.FC<SubstationCardProps> = ({ site }) => {
  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">Substation interconnection</h3>
        <span className="text-[12px] text-ink2 bg-panel px-2 py-0.5 rounded-[6px] border border-line">
          56 MW Cap
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Headroom</div>
          <div className="text-[20px] font-semibold text-ink mt-0.5">
            {formatMw(site.substation.headroom_mw)}
          </div>
          <div className="text-[11px] text-ink3">Available capacity</div>
        </div>

        <div className="p-3 bg-panel rounded-[10px]">
          <div className="text-[12px] text-ink2">Transformer core</div>
          <div className="text-[20px] font-semibold text-ink mt-0.5">
            {site.substation.transformer_temp_c}°C
          </div>
          <div className="text-[11px] text-ink3">Alarm @ {site.substation.transformer_alarm_c}°C</div>
        </div>
      </div>

      <div className="pt-2 text-[13px] text-ink2 flex items-center justify-between border-t border-line">
        <span>Current facility draw</span>
        <span className="font-medium text-ink">{formatMw(site.site_mw)}</span>
      </div>
    </div>
  )
}
export default SubstationCard
