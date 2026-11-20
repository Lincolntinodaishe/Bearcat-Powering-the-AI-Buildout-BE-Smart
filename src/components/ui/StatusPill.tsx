import React from 'react'

interface StatusPillProps {
  status: 'ok' | 'watch' | 'danger' | 'idle'
  label: string
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label }) => {
  const dotColor =
    status === 'ok'
      ? 'bg-ok'
      : status === 'watch'
      ? 'bg-watch'
      : status === 'danger'
      ? 'bg-danger'
      : 'bg-ink3'

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-panel border border-line text-ink">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{label}</span>
    </span>
  )
}
export default StatusPill
