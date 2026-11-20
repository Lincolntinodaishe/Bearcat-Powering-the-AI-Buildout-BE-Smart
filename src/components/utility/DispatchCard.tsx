import React from 'react'
import { useEvent } from '../../context/EventContext'
import StatusPill from '../ui/StatusPill'

export const DispatchCard: React.FC = () => {
  const { event, startEvent, setActiveNav } = useEvent()

  const status = event.active ? 'watch' : 'idle'
  const label = event.active ? 'Active dispatch' : 'Idle'

  return (
    <div className="bg-white border border-line rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink">OpenADR dispatch trigger</h3>
        <StatusPill status={status} label={label} />
      </div>

      <p className="text-[13px] text-ink2 leading-relaxed">
        Interconnection telemetry connected to MLGW demand response automated node.
      </p>

      <div className="space-y-2 py-2 text-[13px] border-y border-line">
        <div className="flex justify-between">
          <span className="text-ink2">Dispatch ID</span>
          <span className="font-mono text-ink text-[12px]">DR-1120-01</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink2">Source</span>
          <span className="text-ink">MLGW (simulated)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink2">Committed target</span>
          <span className="font-medium text-ink">15.0 MW for 2 h</span>
        </div>
      </div>

      <div>
        {event.active ? (
          <button
            onClick={() => setActiveNav('event')}
            className="w-full py-2 bg-accent hover:bg-accent/90 text-white rounded-[8px] text-[13px] font-medium transition"
          >
            Open active event
          </button>
        ) : (
          <button
            onClick={startEvent}
            className="w-full py-2 border border-line hover:bg-panel text-ink rounded-[8px] text-[13px] font-medium transition"
          >
            Simulate incoming dispatch
          </button>
        )}
      </div>
    </div>
  )
}
export default DispatchCard
